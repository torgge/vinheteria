Roda load tests K6 simulando throughput de produção.

Passos:
1. Verificar se os serviços estão rodando com perfil de load test: `docker compose --profile loadtest up -d`
2. Executar: `k6 run k6/scripts/load/catalog-search-load.js --env BASE_URL=http://localhost:8080 --out json=k6/results/catalog-load-$(date +%Y%m%d-%H%M%S).json`
3. Analisar os resultados comparando com os SLOs definidos na seção 5.2
4. Se thresholds foram violados, identificar o bottleneck e sugerir otimização
