const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');
execFileSync(process.execPath, [path.join(__dirname, 'audit-finance-integration.cjs')], { cwd: repo, stdio: 'pipe' });
const report = JSON.parse(fs.readFileSync(path.resolve(repo, '../unierp-platform/docs/platforms/tenant-apps/evidence/finance-integration-inventory.json'), 'utf8'));
const endpoint = (verb, route) => report.endpoints.find((item) => item.verb === verb && item.path === route);

for (const [verb, route] of [
  ['GET', '/advanced-finance/tax/nexus/dashboard'],
  ['GET', '/advanced-finance/tax/nexus/monitor'],
  ['POST', '/advanced-finance/tax/nexus/monitor/refresh'],
  ['PATCH', '/advanced-finance/tax/nexus/registrations/:id'],
  ['POST', '/advanced-finance/tax/jurisdictions'],
  ['GET', '/advanced-finance/tax/dashboard'],
]) {
  const item = endpoint(verb, route);
  assert.ok(item, `missing endpoint ${verb} ${route}`);
  assert.ok(item.consumerCandidates.length, `consumer was not recognized for ${verb} ${route}`);
}
assert.ok(endpoint('GET', '/advanced-finance/tax/nexus/dashboard').consumerCandidates
  .some((candidate) => candidate.kind === 'function-client-call'), 'standard function helper was not recognized');

console.log('Finance integration audit helper regression checks passed.');
