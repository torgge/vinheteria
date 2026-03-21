# 8. CDC — Change Data Capture (Debezium + Outbox Pattern)


### 8.1 Arquitetura CDC

> **Debezium captura mudanças no PostgreSQL WAL (Write-Ahead Log) e publica como eventos no Kafka via Kafka Connect.** Combinado com o Outbox Pattern, garante atomicidade entre persistência de dados e publicação de eventos — zero risco de inconsistência entre DB e Kafka.

```
┌──────────────────────────────────────────────────────────────────┐
│                      CDC Pipeline                                 │
│                                                                   │
│  [Microservice]                                                   │
│       │                                                           │
│       │ Transaction ACID (commit atômico)                         │
│       ▼                                                           │
│  ┌─────────────┐                                                  │
│  │ PostgreSQL  │                                                  │
│  │ ┌─────────┐ │    WAL Stream     ┌──────────────┐              │
│  │ │ orders  │ │ ──────────────── │ Kafka Connect │              │
│  │ ├─────────┤ │    (Debezium     │  + Debezium   │              │
│  │ │ outbox_ │ │     CDC)         │  PostgreSQL   │              │
│  │ │ events  │ │ ────────────────▶│  Connector    │              │
│  │ └─────────┘ │                  └──────┬───────┘              │
│  └─────────────┘                         │                       │
│                                          │ Outbox EventRouter    │
│                                          ▼                       │
│                                   ┌─────────────┐               │
│                                   │    Kafka     │               │
│                                   │  (KRaft)     │               │
│                                   │ ┌──────────┐ │               │
│                                   │ │ vinheria.│ │               │
│                                   │ │ catalog. │ │               │
│                                   │ │ wine-    │ │               │
│                                   │ │ registered│ │              │
│                                   │ └──────────┘ │               │
│                                   └──────┬──────┘               │
│                                          │                       │
│                              ┌───────────┼───────────┐          │
│                              ▼           ▼           ▼          │
│                         [Pricing]   [Inventory]  [OpenSearch]   │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 ADR — Kafka KRaft (sem Zookeeper)

O Kafka opera exclusivamente em **KRaft mode** (Kafka Raft Metadata). Nenhuma dependência de Zookeeper no projeto.

| Decisão | Justificativa |
|---------|---------------|
| KRaft-only | Zookeeper deprecated no Kafka 3.5+, removido no 4.0. KRaft simplifica operação e reduz footprint |
| Bitnami Kafka | Imagem com suporte nativo a KRaft, configuração via env vars |
| `KAFKA_CFG_PROCESS_ROLES: broker,controller` | Nó único em dev local; múltiplos nós em produção |
| Partições default: 3 | Permite paralelismo de consumers para throughput de 5K+ SKUs/dia |

### 8.3 Outbox Pattern — Implementação Quarkus + Kotlin

#### Dependência Gradle

```kotlin
// build.gradle.kts — adicionar à seção de dependências
// CDC: Debezium Outbox Extension para Quarkus
implementation("io.debezium:debezium-quarkus-outbox:3.4.+")
implementation("io.debezium:debezium-quarkus-outbox-reactive:3.4.+")  // Para Hibernate Reactive
```

#### Outbox Event — Domain Event que persiste na tabela outbox

```kotlin
// _shared/adapters/outbox/WineRegisteredOutboxEvent.kt
// REGRA: OutboxEvent é um ADAPTER — implementa ExportedEvent do Debezium
//        A lógica de QUANDO publicar fica no Use Case (Application layer)
class WineRegisteredOutboxEvent(
    private val wine: Wine
) : ExportedEvent<String, JsonNode> {

    private val objectMapper = ObjectMapper()

    override fun getAggregateId(): String = wine.id.value.toString()

    override fun getAggregateType(): String = "Wine"

    override fun getType(): String = "WineRegistered"

    override fun getTimestamp(): Instant = Instant.now()

    override fun getPayload(): JsonNode = objectMapper.valueToTree(
        mapOf(
            "wineId" to wine.id.value,
            "sku" to wine.sku.value,
            "name" to wine.name,
            "region" to wine.region.value,
            "vintage" to wine.vintage.value,
            "price" to mapOf(
                "amount" to wine.price.amount,
                "currency" to wine.price.currency
            ),
            "status" to wine.status.name
        )
    )

    override fun getAdditionalFieldValues(): Map<String, Any> = mapOf(
        "sku" to wine.sku.value
    )
}
```

#### Use Case com Outbox — Persistência + Evento na mesma transação

```kotlin
// catalog/application/RegisterWine.kt
// REGRA: Event.fire() persiste na tabela outbox DENTRO da mesma TX
//        Debezium CDC captura via WAL e publica no Kafka automaticamente
@ApplicationScoped
class RegisterWine(
    private val repository: WineRepository,
    private val event: Event<ExportedEvent<*, *>>  // CDI Event para Outbox
) {
    private val logger = Logger.getLogger(RegisterWine::class.java)

    fun execute(command: Command): Uni<Wine> {
        val wine = command.toDomain()
        return repository.save(wine)
            .invoke { saved ->
                // Persiste na tabela outbox_events na mesma TX
                event.fire(WineRegisteredOutboxEvent(saved))
                logger.info("Wine registered with outbox event: sku=${saved.sku.value}")
            }
    }
}
```

#### Flyway Migration — Outbox Table

```sql
-- db/migration/V001__create_outbox_table.sql
-- Tabela do Outbox Pattern — Debezium captura via CDC
-- NOTA: Se usar debezium-quarkus-outbox, a extensão cria automaticamente.
--       Este script é para referência e customização.
CREATE TABLE IF NOT EXISTS outbox_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(255) NOT NULL,
    aggregate_id   VARCHAR(255) NOT NULL,
    type           VARCHAR(255) NOT NULL,
    timestamp      TIMESTAMP    NOT NULL DEFAULT NOW(),
    payload        JSONB        NOT NULL,
    sku            VARCHAR(100),  -- Campo adicional para routing
    tracingspancontext TEXT       -- Propagação de trace OTel
);

-- Index para CDC performance (Debezium lê os eventos recentes)
CREATE INDEX idx_outbox_events_timestamp ON outbox_events(timestamp);

-- NOTA: Debezium deleta registros processados automaticamente via
--       "outbox.event.router.delete.processed.records=true"
```

### 8.4 Configuração Quarkus — Outbox

```yaml
# application.yaml — configuração do Debezium Outbox
quarkus:
  debezium-outbox:
    table-name: outbox_events
    id:
      name: id
      column-definition: "UUID NOT NULL"
    aggregate-id:
      name: aggregate_id
      column-definition: "VARCHAR(255) NOT NULL"
    aggregate-type:
      name: aggregate_type
      column-definition: "VARCHAR(255) NOT NULL"
    type:
      name: type
      column-definition: "VARCHAR(255) NOT NULL"
    timestamp:
      name: timestamp
      column-definition: "TIMESTAMP NOT NULL"
    payload:
      name: payload
      column-definition: "JSONB NOT NULL"
    additional-fields: "sku:string:VARCHAR(100)"
    tracing:
      enabled: true   # Propaga traceId/spanId OTel para o evento
```

### 8.5 Kafka Connect + Debezium Connector

#### Connector Registration (JSON)

```json
{
  "name": "vinheria-catalog-outbox-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "vinheria",
    "database.password": "${file:/secrets/db-password.txt:password}",
    "database.dbname": "vinheria_catalog",
    "topic.prefix": "vinheria",
    "schema.include.list": "public",
    "table.include.list": "public.outbox_events",
    "tombstones.on.delete": "false",

    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.table.fields.additional.placement": "sku:header:sku",
    "transforms.outbox.table.field.event.timestamp": "timestamp",
    "transforms.outbox.route.topic.replacement": "vinheria.${routedByValue}.events",
    "transforms.outbox.table.expand.json.payload": "true",

    "key.converter": "org.apache.kafka.common.serialization.StringSerializer",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false",

    "plugin.name": "pgoutput",
    "slot.name": "vinheria_catalog_slot",
    "publication.name": "vinheria_catalog_pub",

    "heartbeat.interval.ms": "10000",
    "snapshot.mode": "initial"
  }
}
```

#### Topic Routing via Outbox EventRouter

```
aggregate_type = "Wine"  → topic: vinheria.wine.events
aggregate_type = "Order" → topic: vinheria.order.events
aggregate_type = "Stock" → topic: vinheria.stock.events
```

### 8.6 Docker Compose — Kafka Connect + Debezium

Adicionar ao `docker-compose.yaml` (seção CORE):

```yaml
  # ─── Kafka Connect + Debezium (CDC) ──────────────────────
  kafka-connect:
    image: debezium/connect:2.7
    container_name: vinheria-kafka-connect
    environment:
      GROUP_ID: vinheria-connect
      BOOTSTRAP_SERVERS: kafka:9092
      CONFIG_STORAGE_TOPIC: _connect_configs
      OFFSET_STORAGE_TOPIC: _connect_offsets
      STATUS_STORAGE_TOPIC: _connect_statuses
      CONFIG_STORAGE_REPLICATION_FACTOR: 1
      OFFSET_STORAGE_REPLICATION_FACTOR: 1
      STATUS_STORAGE_REPLICATION_FACTOR: 1
      CONNECT_KEY_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_KEY_CONVERTER_SCHEMAS_ENABLE: "false"
      CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: "false"
    ports:
      - "8083:8083"           # Kafka Connect REST API
    depends_on:
      kafka:
        condition: service_healthy
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:8083/connectors || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 60s
    networks:
      - vinheria-net
    restart: unless-stopped

  # ─── Auto-registra connectors Debezium após startup ──────
  debezium-init:
    image: curlimages/curl:latest
    container_name: vinheria-debezium-init
    depends_on:
      kafka-connect:
        condition: service_healthy
    volumes:
      - ./infra/debezium/connectors:/connectors:ro
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        echo "Registering Debezium connectors..."
        for connector in /connectors/*.json; do
          name=$$(basename $$connector .json)
          echo "  → Registering: $$name"
          curl -sf -X POST http://kafka-connect:8083/connectors \
            -H "Content-Type: application/json" \
            -d @$$connector || echo "  ⚠️ Failed: $$name"
        done
        echo "All connectors registered."
    networks:
      - vinheria-net
```

#### PostgreSQL — WAL Config para Debezium

Atualizar o serviço `postgres` no Docker Compose:

```yaml
  postgres:
    image: postgres:16-alpine
    container_name: vinheria-postgres
    command:
      - "postgres"
      - "-c" 
      - "wal_level=logical"           # Requerido pelo Debezium
      - "-c"
      - "max_replication_slots=4"     # Um slot por microserviço
      - "-c"
      - "max_wal_senders=4"
    environment:
      POSTGRES_DB: vinheria
      POSTGRES_USER: vinheria
      POSTGRES_PASSWORD: vinheria_dev
```

#### Estrutura de Connectors

```
infra/debezium/
└── connectors/
    ├── catalog-outbox-connector.json
    ├── order-outbox-connector.json
    ├── inventory-outbox-connector.json
    └── pricing-outbox-connector.json
```

### 8.7 Modelo Híbrido Atualizado: Kafka Events vs CDC vs Conductor

| Cenário | Mecanismo | Justificativa |
|---------|-----------|---------------|
| Domain events (WineRegistered, PriceUpdated) | **Debezium CDC** (Outbox Pattern) | Atomicidade DB+Kafka, zero dual-write risk |
| Notificações simples (StockDepleted) | **Debezium CDC** (Outbox Pattern) | Consistência garantida via WAL |
| Sync para OpenSearch (busca) | **Debezium CDC** (table capture direto) | Full table CDC sem outbox, replica automática |
| Checkout saga (order→inventory→payment→shipping) | **Conductor** (saga orquestrado) | Multi-step com compensação |
| Fulfillment / Devolução | **Conductor** (saga orquestrado) | Sequência com rollback |
| Bulk import de SKUs | **gRPC Streaming** | Alta throughput binário |
| Atualizações real-time para frontend | **SSE** | Push unidirecional ao browser |

### 8.8 Regras CDC para Agentes

1. **SEMPRE** usar Outbox Pattern para domain events — nunca publicar direto no Kafka
2. **NUNCA** usar dual-write (salvar DB + publicar Kafka separadamente) — risco de inconsistência
3. **SEMPRE** implementar `ExportedEvent<String, JsonNode>` como adapter (não no domain)
4. **SEMPRE** incluir `aggregateType`, `aggregateId`, `type` e `payload` no outbox event
5. **SEMPRE** habilitar tracing no outbox (`tracing.enabled: true`) para correlação OTel
6. **SEMPRE** usar `pgoutput` como plugin do Debezium (padrão PostgreSQL 10+)
7. **SEMPRE** configurar `wal_level=logical` no PostgreSQL
8. **SEMPRE** um connector Debezium por microserviço (um slot de replicação por DB)
9. **NUNCA** usar Zookeeper — Kafka opera exclusivamente em KRaft mode
10. **SEMPRE** registrar connectors via init container (infra/debezium/connectors/)

---
