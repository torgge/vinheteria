Roda smoke tests K6 para validação rápida dos endpoints.

Passos:
1. Verificar se os serviços estão rodando: `docker compose ps`
2. Executar: `k6 run k6/scripts/smoke/catalog-smoke.js --env BASE_URL=http://localhost:8080`
3. Analisar os resultados e reportar se algum threshold foi violado
