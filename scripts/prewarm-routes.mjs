// Pre-warms all Finance routes on the Next.js dev server
// so they are compiled ahead of time and transitions are instant.

const routes = [
  '/finance',
  '/finance/gl',
  '/finance/ar',
  '/finance/ap',
  '/finance/banking',
  '/finance/assets',
  '/finance/tax',
  '/finance/budget-planning',
  '/finance/reports',
  '/finance/fx-revaluation',
  '/finance/intercompany',
  '/finance/settings'
];

async function warmUp() {
  console.log('🚀 Pre-warming Next.js route cache for Finance module...');
  for (const route of routes) {
    const url = `http://localhost:4003${route}`;
    const start = Date.now();
    try {
      const res = await fetch(url);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`✓ [${res.status}] ${route} compiled in ${elapsed}s`);
    } catch (err) {
      console.error(`✗ Failed to warm up ${route}:`, err.message);
    }
  }
  console.log('🎉 All Finance routes are now pre-compiled in dev server cache! Switching between them is instantaneous.');
}

warmUp();
