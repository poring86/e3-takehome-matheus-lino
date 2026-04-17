// Fitness function: fail if main API endpoints are too slow
const http = require('http');

const ENDPOINTS = [
  { path: '/api/notes', method: 'GET' },
  { path: '/api/notes', method: 'POST' },
];
const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3001;
const MAX_MS = 350;

function testEndpoint({ path, method }) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path,
      method,
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const ms = Date.now() - start;
        resolve({ path, method, ms });
      });
    });
    req.on('error', () => resolve({ path, method, ms: -1 }));
    if (method === 'POST') req.write(JSON.stringify({ title: 'test', content: 'ok', visibility: 'private' }));
    req.end();
  });
}

(async () => {
  let failed = false;
  for (const ep of ENDPOINTS) {
    const { path, method, ms } = await testEndpoint(ep);
    if (ms === -1) {
      console.error(`FAIL: ${method} ${path} unreachable`);
      failed = true;
    } else if (ms > MAX_MS) {
      console.error(`FAIL: ${method} ${path} took ${ms}ms (limit: ${MAX_MS}ms)`);
      failed = true;
    } else {
      console.log(`PASS: ${method} ${path} took ${ms}ms (limit: ${MAX_MS}ms)`);
    }
  }
  process.exit(failed ? 1 : 0);
})();
