# 15. Agent Instructions — Regras para AI Assistants


### 11.1 Ao Gerar Código Backend

1. **SEMPRE** seguir Hexagonal Architecture — domain puro, ports como interface, adapters implementando
2. **SEMPRE** usar Mutiny (`Uni<T>`, `Multi<T>`) para operações I/O — nunca bloquear a thread
3. **SEMPRE** criar um use case por operação — naming: verbo infinitivo em inglês
4. **NUNCA** colocar lógica de negócio em adapters, resources ou conductor workers
5. **NUNCA** importar classes de framework dentro do package `domain`
6. **SEMPRE** gerar testes TDD-first: **Kotest** (`BehaviorSpec`/`FunSpec`) para domain e use case, **JUnit5 + Kotest assertions** para `@QuarkusTest` integration
7. **SEMPRE** adicionar spans OpenTelemetry + logs com MDC em use cases
8. **SEMPRE** usar `data class` para Value Objects e `sealed class` para erros de domínio
9. **NUNCA** usar `var` em domain ou application layers
10. **SEMPRE** incluir ArchUnit test ao criar novo slice
11. **SEMPRE** usar `quarkus-redis-client` apontando para Valkey — sem mudança de API
12. **SEMPRE** criar Conductor workers como adapters inbound — stateless e idempotentes
13. **SEMPRE** definir compensation workflow ao criar nova saga no Conductor
14. **SEMPRE** usar Kotest `shouldBe`, `shouldThrow`, `shouldContain` ao invés de JUnit `assertEquals`
15. **SEMPRE** considerar property-based testing (`checkAll`) para invariantes de Value Objects
16. **SEMPRE** rodar `ktlintFormat` antes de `ktlintCheck` — auto-fix primeiro, validar depois
17. **NUNCA** desabilitar regras do Ktlint inline (`// ktlint-disable`) sem justificativa documentada
18. **SEMPRE** usar `Money` value object para preços — nunca `BigDecimal` + `String` avulsos
19. **SEMPRE** retornar preços nas 3 moedas (BRL, PYG, USD) em endpoints de catálogo/pedido
20. **SEMPRE** usar `Currency.fromCode()` para deserializar moedas — nunca `String` direto

### 11.2 Ao Gerar Código Frontend

1. **SEMPRE** usar PrimeNG components como base — customizar via CSS variables (`--p-*`), nunca override bruto
2. **SEMPRE** usar Angular Signals e Signal Store para state management
3. **SEMPRE** implementar SSE para dados que mudam em tempo real (estoque, preços)
4. **SEMPRE** usar lazy loading para feature modules
5. **NUNCA** usar `any` como tipo — tipar tudo com interfaces em `*.model.ts`
6. **SEMPRE** seguir estrutura de Vertical Slices dentro de `features/`
7. **SEMPRE** usar `inject()` function ao invés de constructor injection
8. **SEMPRE** implementar `OnPush` change detection strategy
9. **SEMPRE** usar `p-table` com `virtualScroll` para listagens com 5K+ itens
10. **NUNCA** reinventar componente que já existe no PrimeNG
11. **SEMPRE** criar `*.spec.ts` com **Jest** para cada component, service e store
12. **SEMPRE** usar `jest.fn()` para mocks e `jest-preset-angular` como preset
13. **NUNCA** usar Karma/Jasmine — o projeto usa Jest exclusivamente
14. **NUNCA** hardcodar texto visível ao usuário — SEMPRE usar `*transloco` directive ou `translate` pipe
15. **SEMPRE** criar traduções nos 3 idiomas (pt-BR, es-PY, en-US) ao adicionar novo texto
16. **SEMPRE** usar `translocoCurrency` pipe para formatação de preços — nunca `Intl.NumberFormat` manual
17. **SEMPRE** usar chaves hierárquicas nas traduções: `{scope}.{feature}.{element}` (ex: `catalog.wine.vintage`)
18. **SEMPRE** manter idioma e moeda como seleções independentes — um não força o outro

### 11.3 Ao Gerar Observability Code

1. **SEMPRE** habilitar os 3 sinais OTel: traces, metrics, logs
2. **SEMPRE** usar `quarkus-logging-json` para structured logging
3. **SEMPRE** propagar `requestId` via MDC entre chamadas de serviço
4. **SEMPRE** incluir atributos de negócio nos spans (sku, orderId, region)
5. **NUNCA** logar dados sensíveis (cartão, senha, CPF) — nem em MDC
6. **SEMPRE** usar `logger.info/warn/error` — traceId/spanId injetados automaticamente pelo OTel MDC

### 11.4 Ao Criar Novos Slices

```bash
# Checklist para novo slice (ex: "review" no serviço catalog)
# 1. Criar estrutura de diretórios
mkdir -p src/main/kotlin/com/vinheria/catalog/review/{domain,application,adapters/{inbound,outbound}}

# 2. TDD: Escrever TESTE do Aggregate Root PRIMEIRO (test/unit/)
# 3. Definir Aggregate Root (domain/) — hook PostToolUse roda o teste → RED
# 4. Implementar até teste passar → GREEN
# 5. Definir Ports/Interfaces (domain/)
# 6. TDD: Escrever TESTE do Use Case PRIMEIRO
# 7. Implementar Use Cases (application/) — com spans OTel + logs MDC → GREEN
# 8. TDD: Escrever TESTE de integração do Adapter PRIMEIRO
# 9. Implementar Adapters (adapters/) → GREEN
# 10. Se saga: criar Conductor Worker (adapters/inbound/) + workflow JSON + compensation
# 11. Criar migration Flyway (resources/db/migration/)
# 12. Adicionar ArchUnit rules (test/architecture/)
# 13. Registrar domain events (seção 13.2) ou saga (seção 13.3)
# 14. Criar Signal Store no frontend (features/{slice}/)
# 15. Criar K6 smoke test se endpoint de alta carga (k6/scripts/smoke/)
```

### 11.5 Docker Compose — Local Development Environment

> **Princípio**: `docker compose up` deve ser suficiente para subir todo o ambiente. Healthchecks garantem ordem de inicialização correta. Profiles permitem subir apenas o necessário por contexto.

#### Comandos Rápidos

```bash
# Subir infraestrutura core (para Quarkus dev mode)
docker compose up -d

# Subir tudo + observability (Grafana, Tempo, Loki)
docker compose --profile observability up -d

# Subir tudo + K6 load testing
docker compose --profile loadtest up -d

# Subir TUDO (infra + observability + loadtest)
docker compose --profile observability --profile loadtest up -d

# Parar tudo
docker compose --profile '*' down

# Reset completo (remove volumes)
docker compose --profile '*' down -v
```

#### `docker-compose.yaml`

```yaml
# docker-compose.yaml — Vinheria Digital Local Development
# Uso: docker compose up -d (core) | --profile observability | --profile loadtest

# ─── Networks ──────────────────────────────────────────────────
networks:
  vinheria-net:
    driver: bridge              # Rede principal para todos os serviços
  observability-net:
    driver: bridge              # Rede isolada para stack de observability

# ─── Volumes (persistent) ─────────────────────────────────────
volumes:
  pg-data:                      # PostgreSQL data
  valkey-data:                  # Valkey data
  opensearch-data:              # OpenSearch indices
  conductor-pg:                 # Conductor internal Postgres
  conductor-valkey:             # Conductor internal Valkey
  grafana-data:                 # Grafana dashboards/config
  kafka-data:                   # Kafka logs

services:

  # ═══════════════════════════════════════════════════════════════
  # CORE INFRASTRUCTURE (default profile — always starts)
  # ═══════════════════════════════════════════════════════════════

  postgres:
    image: postgres:16-alpine
    container_name: vinheria-postgres
    environment:
      POSTGRES_DB: vinheria
      POSTGRES_USER: vinheria
      POSTGRES_PASSWORD: vinheria_dev
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --locale=C"
    ports:
      - "5432:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./infra/docker/init-scripts:/docker-entrypoint-initdb.d  # SQL init scripts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vinheria -d vinheria"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - vinheria-net
    restart: unless-stopped

  valkey:
    image: valkey/valkey:8-alpine
    container_name: vinheria-valkey
    command: >
      valkey-server
        --io-threads 4
        --io-threads-do-reads yes
        --maxmemory 512mb
        --maxmemory-policy allkeys-lru
        --appendonly yes
        --appendfsync everysec
    ports:
      - "6379:6379"
    volumes:
      - valkey-data:/data
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - vinheria-net
    restart: unless-stopped

  kafka:
    image: bitnami/kafka:3.7
    container_name: vinheria-kafka
    environment:
      # KRaft mode (sem Zookeeper)
      KAFKA_CFG_NODE_ID: 1
      KAFKA_CFG_PROCESS_ROLES: broker,controller
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,EXTERNAL://localhost:9094
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CFG_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_CFG_NUM_PARTITIONS: 3
    ports:
      - "9094:9094"           # External listener para apps locais
    volumes:
      - kafka-data:/bitnami/kafka
    healthcheck:
      test: ["CMD-SHELL", "kafka-broker-api-versions.sh --bootstrap-server localhost:9092"]
      interval: 10s
      timeout: 10s
      retries: 10
      start_period: 30s
    networks:
      - vinheria-net
    restart: unless-stopped

  opensearch:
    image: opensearchproject/opensearch:2.12.0
    container_name: vinheria-opensearch
    environment:
      discovery.type: single-node
      DISABLE_SECURITY_PLUGIN: "true"
      OPENSEARCH_JAVA_OPTS: "-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - opensearch-data:/usr/share/opensearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health | grep -q '\"status\":\"green\"\\|\"status\":\"yellow\"'"]
      interval: 10s
      timeout: 10s
      retries: 10
      start_period: 45s
    networks:
      - vinheria-net
    restart: unless-stopped

  conductor:
    image: orkesio/orkes-conductor-community-standalone:latest
    container_name: vinheria-conductor
    ports:
      - "8080:8080"           # Conductor API
      - "1234:5000"           # Conductor UI
    volumes:
      - conductor-pg:/pgdata
      - conductor-valkey:/redis
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:8080/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 60s       # Conductor demora a inicializar
    networks:
      - vinheria-net
    restart: unless-stopped

  # ─── Init Container: Cria tópicos Kafka automaticamente ───────
  kafka-init:
    image: bitnami/kafka:3.7
    container_name: vinheria-kafka-init
    depends_on:
      kafka:
        condition: service_healthy
    entrypoint: ["/bin/bash", "-c"]
    command:
      - |
        echo "Creating Kafka topics..."
        kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists --topic vinheria.catalog.wine-registered --partitions 3 --replication-factor 1
        kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists --topic vinheria.pricing.price-updated --partitions 3 --replication-factor 1
        kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists --topic vinheria.inventory.stock-depleted --partitions 3 --replication-factor 1
        kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists --topic vinheria.inventory.stock-reserved --partitions 3 --replication-factor 1
        kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists --topic vinheria.order.order-placed --partitions 3 --replication-factor 1
        kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists --topic vinheria.payment.payment-confirmed --partitions 3 --replication-factor 1
        echo "All topics created."
    networks:
      - vinheria-net

  # ═══════════════════════════════════════════════════════════════
  # OBSERVABILITY (profile: observability)
  # ═══════════════════════════════════════════════════════════════

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: vinheria-otel-collector
    profiles: ["observability"]
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./infra/otel/otel-collector-config.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "4317:4317"           # gRPC OTLP receiver
      - "4318:4318"           # HTTP OTLP receiver
    depends_on:
      tempo:
        condition: service_started
      loki:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:13133/"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vinheria-net
      - observability-net
    restart: unless-stopped

  tempo:
    image: grafana/tempo:latest
    container_name: vinheria-tempo
    profiles: ["observability"]
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./infra/tempo/tempo-config.yaml:/etc/tempo.yaml:ro
    ports:
      - "3200:3200"           # Tempo API
    networks:
      - observability-net
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    container_name: vinheria-loki
    profiles: ["observability"]
    command: ["-config.file=/etc/loki/local-config.yaml"]
    ports:
      - "3100:3100"
    networks:
      - observability-net
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: vinheria-prometheus
    profiles: ["observability"]
    volumes:
      - ./infra/prometheus/prometheus.yaml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9090:9090"
    networks:
      - observability-net
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: vinheria-grafana
    profiles: ["observability"]
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: vinheria
      GF_AUTH_ANONYMOUS_ENABLED: "true"
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./infra/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./infra/grafana/dashboards:/var/lib/grafana/dashboards:ro
    depends_on:
      - tempo
      - loki
      - prometheus
    networks:
      - observability-net
    restart: unless-stopped

  # ═══════════════════════════════════════════════════════════════
  # LOAD TESTING (profile: loadtest)
  # ═══════════════════════════════════════════════════════════════

  k6:
    image: grafana/k6:latest
    container_name: vinheria-k6
    profiles: ["loadtest"]
    volumes:
      - ./k6:/scripts:ro
    environment:
      BASE_URL: http://host.gateway:8081    # Quarkus app rodando no host
    networks:
      - vinheria-net
    extra_hosts:
      - "host.gateway:host-gateway"         # Permite k6 acessar o host

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: vinheria-kafka-ui
    profiles: ["loadtest"]
    environment:
      KAFKA_CLUSTERS_0_NAME: vinheria-local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    ports:
      - "9080:8080"
    depends_on:
      kafka:
        condition: service_healthy
    networks:
      - vinheria-net
    restart: unless-stopped
```

#### Estrutura de Infra Config

```
infra/
├── docker/
│   └── init-scripts/
│       └── 01-create-databases.sql       # Cria DBs por microserviço
├── otel/
│   └── otel-collector-config.yaml        # Receivers, processors, exporters
├── tempo/
│   └── tempo-config.yaml                 # Trace storage config
├── prometheus/
│   └── prometheus.yaml                   # Scrape targets
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yaml          # Tempo, Loki, Prometheus auto-provisioned
    │   └── dashboards/
    │       └── dashboards.yaml           # Dashboard auto-discovery
    └── dashboards/
        ├── vinheria-overview.json         # Dashboard principal
        ├── vinheria-catalog-slos.json     # SLOs do catálogo
        └── vinheria-saga-monitoring.json  # Monitoramento de sagas
```

#### `infra/docker/init-scripts/01-create-databases.sql`

```sql
-- Cria databases isolados por microserviço (Database per Service pattern)
CREATE DATABASE vinheria_catalog;
CREATE DATABASE vinheria_order;
CREATE DATABASE vinheria_inventory;
CREATE DATABASE vinheria_pricing;
CREATE DATABASE vinheria_payment;
CREATE DATABASE vinheria_shipping;
CREATE DATABASE vinheria_identity;

-- Concede permissões
GRANT ALL PRIVILEGES ON DATABASE vinheria_catalog TO vinheria;
GRANT ALL PRIVILEGES ON DATABASE vinheria_order TO vinheria;
GRANT ALL PRIVILEGES ON DATABASE vinheria_inventory TO vinheria;
GRANT ALL PRIVILEGES ON DATABASE vinheria_pricing TO vinheria;
GRANT ALL PRIVILEGES ON DATABASE vinheria_payment TO vinheria;
GRANT ALL PRIVILEGES ON DATABASE vinheria_shipping TO vinheria;
GRANT ALL PRIVILEGES ON DATABASE vinheria_identity TO vinheria;
```

#### Quarkus Dev Mode com Docker Compose

```yaml
# application.yaml — profile dev (conecta ao Docker Compose)
"%dev":
  quarkus:
    datasource:
      db-kind: reactive-pg
      reactive:
        url: postgresql://localhost:5432/vinheria_catalog
        max-size: 20
      username: vinheria
      password: vinheria_dev
    redis:
      hosts: redis://localhost:6379
    kafka:
      bootstrap-servers: localhost:9094
    otel:
      exporter:
        otlp:
          endpoint: http://localhost:4317
```

---
