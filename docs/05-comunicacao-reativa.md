# 5. Comunicação Reativa — Estratégia de Performance


### 5.1 Padrão de Comunicação por Caso de Uso

```
┌──────────────────────────────────────────────────────────────────┐
│              Estratégia de Comunicação                            │
├──────────────────────┬──────────────────────┬────────────────────┤
│  Caso de Uso         │  Protocolo           │  Justificativa     │
├──────────────────────┼──────────────────────┼────────────────────┤
│  Busca de catálogo   │  REST + Cache Valkey │  Read-heavy,       │
│                      │  (TTL 60s)           │  cacheable          │
├──────────────────────┼──────────────────────┼────────────────────┤
│  Atualização estoque │  SSE (Server-Sent    │  Push unidirec,    │
│  em tempo real       │  Events)             │  alta frequência    │
├──────────────────────┼──────────────────────┼────────────────────┤
│  Checkout completo   │  Conductor Saga      │  Multi-step com    │
│  (pedido→estoque→    │  (orchestrated)      │  compensação auto   │
│   pgto→envio)        │                      │  em caso de falha   │
├──────────────────────┼──────────────────────┼────────────────────┤
│  Eventos simples     │  Kafka (async)       │  Desacoplamento    │
│  entre serviços      │                      │  + resiliência      │
├──────────────────────┼──────────────────────┼────────────────────┤
│  Bulk operations     │  gRPC Streaming      │  Alta throughput   │
│  (importação SKUs)   │                      │  binário            │
└──────────────────────┴──────────────────────┴────────────────────┘
```

### 5.2 Performance Targets

| Métrica                        | Target       | Monitoramento              |
|-------------------------------|-------------|---------------------------|
| Latência P95 (REST)           | < 100ms     | OTel Histogram             |
| Latência P99 (REST)           | < 250ms     | OTel Histogram             |
| Throughput catálogo            | > 500 req/s | Prometheus Counter         |
| SSE delivery lag               | < 500ms     | Custom OTel metric         |
| Kafka consumer lag             | < 1000 msgs | Kafka metrics              |
| Conductor saga P95             | < 2s        | Conductor metrics + OTel   |
| Frontend First Contentful Paint| < 1.2s      | Web Vitals                 |
| Frontend Time to Interactive   | < 2.5s      | Web Vitals                 |
| Cache hit ratio (catálogo)     | > 85%       | Valkey metrics             |

---
