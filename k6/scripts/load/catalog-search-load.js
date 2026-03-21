// k6/scripts/load/catalog-search-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    catalog_sustained: {
      executor: 'constant-arrival-rate',
      rate: 500,                    // 500 req/s target
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<250'],  // Alinhado com SLOs
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:search}': ['p(95)<150'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const REGIONS = ['Mendoza', 'Bordeaux', 'Toscana', 'Douro', 'Napa Valley', 'Barossa'];
const GRAPES = ['Malbec', 'Cabernet Sauvignon', 'Sangiovese', 'Touriga Nacional', 'Pinot Noir'];

export default function () {
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const grape = GRAPES[Math.floor(Math.random() * GRAPES.length)];
  const page = Math.floor(Math.random() * 50);

  const res = http.get(
    `${BASE_URL}/api/v1/wines?region=${region}&grape=${grape}&page=${page}&size=20`,
    { tags: { name: 'search' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'has pagination': (r) => JSON.parse(r.body).pagination !== undefined,
  });

  sleep(0.1);
}
