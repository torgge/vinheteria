// k6/scripts/smoke/catalog-smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/q/health`);
  check(health, {
    'health returns 200': (r) => r.status === 200,
    'health status UP': (r) => JSON.parse(r.body).status === 'UP',
  });

  // Catalog listing
  const catalog = http.get(`${BASE_URL}/api/v1/wines?page=0&size=10`);
  check(catalog, {
    'catalog returns 200': (r) => r.status === 200,
    'catalog response < 500ms': (r) => r.timings.duration < 500,
  });

  // Search by region
  const search = http.get(`${BASE_URL}/api/v1/wines?region=Mendoza&page=0&size=5`);
  check(search, {
    'search returns 200': (r) => r.status === 200,
  });

  sleep(1);
}
