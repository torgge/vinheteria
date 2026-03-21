// k6/scripts/helpers/auth.js
// Helper para autenticação nos testes K6
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function loginAsUser(email = 'user@vinheria.test', password = 'Test1234!') {
  const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email,
    password,
  }), { headers: { 'Content-Type': 'application/json' } });

  if (res.status !== 200) {
    console.error(`Login failed for ${email}: ${res.status}`);
    return null;
  }

  const body = JSON.parse(res.body);
  return {
    accessToken: body.accessToken,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${body.accessToken}`,
    },
  };
}

export function loginAsAdmin() {
  return loginAsUser('admin@vinheria.test', 'Admin1234!');
}
