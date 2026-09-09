/* Source evidence only: references are candidates, not runtime integration proof. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const classificationsPath = path.join(__dirname, 'finance-endpoint-classifications.json');
const classifications = fs.existsSync(classificationsPath)
  ? JSON.parse(fs.readFileSync(classificationsPath, 'utf8')) : {};
const relative = p => path.relative(root, p).split(path.sep).join('/');
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e =>
  ['node_modules', '.next', '.git'].includes(e.name) ? [] :
    e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]);
const parse = p => ts.createSourceFile(p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true);
const decorators = n => (ts.getDecorators(n) || []).map(d => d.expression).filter(ts.isCallExpression);
const modules = walk(path.join(root, 'api/src/modules/finance')).filter(p => p.endsWith('.module.ts'));
const registrations = new Set();
for (const file of modules) {
  const source = parse(file);
  for (const cls of source.statements.filter(ts.isClassDeclaration)) {
    const module = decorators(cls).find(d => d.expression.getText(source) === 'Module');
    const metadata = module?.arguments[0];
    if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;
    const property = metadata.properties.find(p => p.name?.getText(source) === 'controllers');
    if (!property || !ts.isPropertyAssignment(property) || !ts.isArrayLiteralExpression(property.initializer)) continue;
    for (const controller of property.initializer.elements) registrations.add(controller.getText(source));
  }
}
const controllers = walk(path.join(root, 'api/src/modules/finance/controllers')).filter(p => p.endsWith('.ts'));
const endpoints = [];
for (const file of controllers) {
  const source = parse(file);
  for (const cls of source.statements.filter(ts.isClassDeclaration)) {
    const controller = decorators(cls).find(d => d.expression.getText(source) === 'Controller');
    if (!controller) continue;
    const prefix = controller.arguments.length ? controller.arguments[0]?.text : '';
    if (typeof prefix !== 'string') throw new Error(`Unsupported controller path: ${file}`);
    for (const member of cls.members) {
      for (const decorator of decorators(member)) {
        const verb = decorator.expression.getText(source).toUpperCase();
        if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'].includes(verb)) continue;
        const suffix = decorator.arguments[0]?.text ?? '';
        const permission = decorators(member).find(d => d.expression.getText(source) === 'Permissions');
        endpoints.push({ verb, path: '/' + [prefix, suffix].filter(Boolean).join('/'),
          controller: cls.name.text, method: member.name.getText(source), source: relative(file),
          line: source.getLineAndCharacterOfPosition(member.getStart(source)).line + 1,
          registeredInFinanceModule: registrations.has(cls.name.text),
          permissions: permission?.arguments.map(a => a.text ?? a.getText(source)) ?? [], uiCandidates: [] });
      }
    }
  }
}
const clients = [...walk(path.join(root, 'tenant-apps/app')), ...walk(path.join(root, 'tenant-apps/src'))]
  .filter(p => /\.tsx?$/.test(p) && !/(__tests__|\.test\.|\.spec\.)/.test(p));
const patterns = [];
const calls = [];
const imports = new Map();
const literal = node => {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map(s => ':param' + s.literal.text).join('');
  return undefined;
};
const normalize = value => value.split('?')[0].replace(/:[^/]+/g, ':param');
const financePath = value => value && /^\/(advanced-finance|finance)(\/|$)/.test(value);
for (const file of clients) {
  const source = parse(file);
  const dependencies = [];
  for (const statement of source.statements) {
    if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !statement.moduleSpecifier) continue;
    const specifier = literal(statement.moduleSpecifier);
    const base = specifier?.startsWith('@/') ? path.join(root, 'tenant-apps/src', specifier.slice(2)) :
      specifier?.startsWith('.') ? path.resolve(path.dirname(file), specifier) : undefined;
    if (!base) continue;
    const resolved = [base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(p => fs.existsSync(p));
    if (resolved) dependencies.push(relative(resolved));
  }
  imports.set(relative(file), dependencies);
  function visit(node) {
    const value = literal(node);
    if (financePath(value)) patterns.push({ value: normalize(value), source: relative(file) });
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const verb = node.expression.name.text.toUpperCase();
      const url = literal(node.arguments[0]);
      if (['GET', 'LIST', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(verb) && financePath(url)) {
        calls.push({ verb: verb === 'LIST' ? 'GET' : verb, path: normalize(url), source: relative(file),
          line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, kind: 'explicit-client-call' });
      }
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'defineResource' && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
      const properties = node.arguments[0].properties;
      const endpoint = properties.find(p => p.name?.getText(source) === 'endpoint');
      const url = endpoint && ts.isPropertyAssignment(endpoint) ? literal(endpoint.initializer) : undefined;
      const permissions = properties.find(p => p.name?.getText(source) === 'permissions');
      if (financePath(url) && permissions && ts.isPropertyAssignment(permissions) && ts.isObjectLiteralExpression(permissions.initializer)) {
        const actions = new Set(permissions.initializer.properties.map(p => p.name?.getText(source)));
        for (const [action, verb, suffix] of [['read', 'GET', ''], ['read', 'GET', '/:param'], ['create', 'POST', ''], ['update', 'PATCH', '/:param'], ['delete', 'DELETE', '/:param']]) {
          if (actions.has(action)) calls.push({ verb, path: normalize(url) + suffix, source: relative(file),
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, kind: 'resource-capability-candidate' });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const endpoint of endpoints) {
  const normalized = endpoint.path.replace(/:[^/]+/g, ':param');
  endpoint.uiCandidates = [...new Set(patterns.filter(p => p.value === normalized).map(p => p.source))];
  endpoint.consumerCandidates = calls.filter(call => call.verb === endpoint.verb && call.path === normalized);
  endpoint.integrationClassification = classifications[`${endpoint.verb} ${endpoint.path}`] ?? null;
}
const grouped = {};
for (const endpoint of endpoints) (grouped[endpoint.verb + ' ' + endpoint.path] ??= []).push(endpoint);
const duplicates = Object.entries(grouped).filter(([, entries]) => entries.length > 1).map(([route, entries]) => ({ route, handlers: entries.map(e => `${e.source}:${e.line} ${e.method}`) }));
const pageRoot = path.join(root, 'tenant-apps/app/(dashboard)/finance');
const pages = walk(pageRoot).filter(p => path.basename(p) === 'page.tsx').map(p => ({
  route: '/finance' + p.slice(pageRoot.length).split(path.sep).join('/').replace('/page.tsx', ''), source: relative(p) }));
function dependenciesOf(file, visited = new Set()) {
  if (visited.has(file)) return visited;
  visited.add(file);
  for (const dependency of imports.get(file) ?? []) dependenciesOf(dependency, visited);
  return visited;
}
const pageDependencies = pages.map(page => ({ ...page, files: dependenciesOf(page.source) }));
for (const endpoint of endpoints) {
  endpoint.pageCandidates = pageDependencies.filter(page => endpoint.consumerCandidates.some(call => page.files.has(call.source))).map(page => page.route);
}
if (!endpoints.length || !pages.length) throw new Error('Finance discovery returned zero targets');
const routeKeys = new Set(endpoints.map(endpoint => `${endpoint.verb} ${endpoint.path}`));
const staleClassifications = Object.keys(classifications).filter(key => !routeKeys.has(key));
if (staleClassifications.length) throw new Error(`Stale Finance endpoint classifications: ${staleClassifications.join(', ')}`);
const unresolved = endpoints.filter(endpoint => !endpoint.consumerCandidates.length && !endpoint.integrationClassification);
const invalidAliases = endpoints.filter(endpoint => {
  const item = endpoint.integrationClassification;
  if (!item || item.classification !== 'COMPATIBILITY_ALIAS') return false;
  const canonical = endpoints.find(candidate => `${candidate.verb} ${candidate.path}` === item.canonicalRoute);
  return !canonical || !canonical.consumerCandidates.length || !item.uiRoute || !item.reason;
});
const report = {
  generatedAt: new Date().toISOString(), command: 'node scripts/audit-finance-integration.cjs',
  sourceDigest: crypto.createHash('sha256').update(
    [...modules, ...controllers, ...clients, classificationsPath].sort()
      .map(p => relative(p) + '\n' + fs.readFileSync(p, 'utf8')).join('\n'),
  ).digest('hex'),
  limitations: 'Source evidence only. uiCandidates includes navigation strings and is not integration coverage. consumerCandidates matches HTTP verbs plus literal/template URLs or defineResource permission capabilities (framework/src/data.ts). pageCandidates follows local import/export files, not symbol usage or rendered actions; shared barrels may overapproximate reachability. Dynamic expressions, SDK calls and runtime behavior require review. Finance module registration is not application boot proof.',
  summary: { declarations: endpoints.length, uniqueMethodPaths: Object.keys(grouped).length, duplicateMethodPaths: duplicates.length,
    endpointsWithReferenceCandidates: endpoints.filter(e => e.uiCandidates.length).length,
    endpointsWithMethodMatchedConsumers: endpoints.filter(e => e.consumerCandidates.length).length,
    endpointsWithPageCandidates: endpoints.filter(e => e.pageCandidates.length).length,
    classifiedCompatibilityAliases: endpoints.filter(e => e.integrationClassification?.classification === 'COMPATIBILITY_ALIAS').length,
    unresolvedIntegrationClassifications: unresolved.length,
    invalidCompatibilityAliases: invalidAliases.length,
    unregisteredDeclarations: endpoints.filter(e => !e.registeredInFinanceModule).length, pages: pages.length },
  duplicates, pages, endpoints,
  unmatchedConsumerCandidates: calls.filter(call => !endpoints.some(endpoint => endpoint.verb === call.verb && normalize(endpoint.path) === call.path)),
};
const out = path.join(root, 'unierp-platform/docs/platforms/tenant-apps/evidence/finance-integration-inventory.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Evidence: ${relative(out)}`);
if (process.argv.includes('--check') && (duplicates.length || endpoints.some(e => !e.registeredInFinanceModule) || unresolved.length || invalidAliases.length)) {
  console.error(`Finance integration gate failed: ${duplicates.length} duplicates, ${endpoints.filter(e => !e.registeredInFinanceModule).length} unregistered, ${unresolved.length} unclassified without consumers, ${invalidAliases.length} invalid aliases.`);
  process.exitCode = 1;
}
