// k6/scripts/e2e/purchase-wine-e2e.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const checkoutDuration = new Trend('checkout_saga_duration');
const failureRate = new Rate('checkout_failures');

export const options = {
  scenarios: {
    purchase_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Ramp-up
        { duration: '3m', target: 50 },   // Sustained load
        { duration: '1m', target: 100 },  // Peak
        { duration: '1m', target: 0 },    // Ramp-down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checkout_saga_duration: ['p(95)<2000'],
    checkout_failures: ['rate<0.05'],      // < 5% failure rate
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  group('01 — Browse Catalog', () => {
    const catalog = http.get(`${BASE_URL}/api/v1/wines?page=0&size=20`);
    check(catalog, {
      'catalog returns 200': (r) => r.status === 200,
      'catalog has wines': (r) => JSON.parse(r.body).items.length > 0,
    });
    sleep(1);
  });

  group('02 — Search Wine by Region', () => {
    const search = http.get(`${BASE_URL}/api/v1/wines?region=Mendoza&page=0&size=10`);
    check(search, {
      'search returns 200': (r) => r.status === 200,
    });
    sleep(0.5);
  });

  group('03 — Get Wine Detail', () => {
    const detail = http.get(`${BASE_URL}/api/v1/wines/sku/VNH-MAL-2020-001`);
    check(detail, {
      'detail returns 200': (r) => r.status === 200,
      'detail has price': (r) => JSON.parse(r.body).price !== undefined,
    });
    sleep(0.5);
  });

  group('04 — Checkout Saga (Full Flow)', () => {
    const startTime = Date.now();

    const order = http.post(`${BASE_URL}/api/v1/orders/checkout`, JSON.stringify({
      items: [
        { sku: 'VNH-MAL-2020-001', quantity: 2 },
        { sku: 'VNH-CAB-2019-003', quantity: 1 },
      ],
      paymentMethod: 'CREDIT_CARD',
      shippingAddress: {
        street: 'Rua Augusta, 1200',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01304-001',
      },
      customerEmail: `k6-test-${__VU}@vinheria.test`,
    }), { headers });

    const duration = Date.now() - startTime;
    checkoutDuration.add(duration);

    const success = check(order, {
      'checkout returns 201': (r) => r.status === 201,
      'checkout has orderId': (r) => JSON.parse(r.body).orderId !== undefined,
      'checkout saga < 2s': () => duration < 2000,
    });

    if (!success) failureRate.add(1);
    else failureRate.add(0);

    sleep(2);
  });
}
