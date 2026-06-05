Roda E2E tests K6 cobrindo sagas completas (checkout, fulfillment, return).

Passos:
1. Verificar se todos os serviços + Conductor estão rodando: `docker compose up -d`
2. Executar: `k6 run k6/scripts/e2e/purchase-wine-e2e.js --env BASE_URL=http://localhost:8080`
3. Validar que `checkout_saga_duration p(95) < 2000ms` e `checkout_failures rate < 5%`
4. Se falhar, verificar logs do Conductor e traces no Grafana/Tempo
