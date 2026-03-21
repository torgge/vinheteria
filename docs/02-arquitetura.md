# 2. Arquitetura — Hexagonal + Vertical Slices

### 2.1 Princípio Fundamental

Cada **microserviço** segue **Hexagonal Architecture (Ports & Adapters)**, e dentro de cada serviço, o código é organizado por **Vertical Slices** — cada feature/use-case é uma fatia autossuficiente que atravessa todas as camadas.

```
microservice/
├── build.gradle.kts
├── src/main/kotlin/com/vinheria/<service>/
│   ├── _config/                    # Configurações Quarkus, beans, profiles
│   ├── _shared/                    # Value objects, exceptions, extensions compartilhados
│   │   ├── domain/
│   │   │   ├── Money.kt
│   │   │   ├── Sku.kt
│   │   │   └── DomainEvent.kt
│   │   ├── ports/
│   │   │   └── EventPublisher.kt
│   │   └── adapters/
│   │       ├── KafkaEventPublisher.kt
│   │       └── ConductorWorkflowAdapter.kt
│   │
│   └── {slice}/                    # Feature slice
│       ├── domain/
│       │   ├── {Aggregate}.kt      # Aggregate Root
│       │   ├── {ValueObject}.kt    # Value Objects
│       │   └── {Repository}.kt     # Port (interface)
│       ├── application/
│       │   ├── Create{Entity}.kt   # Use Case (Command)
│       │   ├── List{Entity}.kt     # Use Case (Query)
│       │   └── Approve{Entity}.kt  # Use Case (Command)
│       ├── adapters/
│       │   ├── inbound/
│       │   │   ├── {Entity}Resource.kt      # REST (JAX-RS reativo)
│       │   │   ├── {Entity}GrpcService.kt   # gRPC adapter
│       │   │   └── {Entity}ConductorWorker.kt # Conductor worker
│       │   └── outbound/
│       │       ├── {Entity}PostgresRepository.kt
│       │       └── {Entity}ValkeyCache.kt
│       └── {Slice}Test.kt
│
├── src/test/kotlin/
│   ├── unit/                       # Testes de domínio (Kotest puro)
│   ├── integration/                # Testes com Testcontainers
│   └── architecture/               # ArchUnit — validação de dependências
│
└── src/main/resources/
    ├── application.yaml
    └── db/migration/               # Flyway migrations
```

### 2.2 Regras de Dependência (Invioláveis)

```
REGRA DE OURO: Dependências apontam SEMPRE para dentro (→ domain)

  [Adapters Inbound] → [Application/Use Cases] → [Domain]
                                                     ↑
  [Adapters Outbound] ─────────────────────────────────┘
       (implementa ports definidos no domain)
```

- **Domain** NÃO depende de NADA externo (zero imports de framework)
- **Application** depende APENAS de Domain
- **Adapters** dependem de Application e Domain, NUNCA o inverso
- **Slices NÃO se comunicam diretamente** — usam eventos Kafka (simples) ou Conductor (sagas)
- Validar com **ArchUnit** em cada build

### 2.3 Mapa de Microserviços B2B

```
                        ┌─────────────────────────────┐
                        │     Orkes Conductor CE      │
                        │    (Saga Orchestration)     │
                        │  ┌───────────────────────┐  │
                        │  │ sales_order_saga_wf    │  │
                        │  │ purchase_order_saga_wf │  │
                        │  │ fulfillment_saga_wf    │  │
                        │  └───────────────────────┘  │
                        └──────────┬──────────────────┘
                  polls tasks      │      polls tasks
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   catalog    │     │   supplier   │     │   customer   │
│  (vinhos,    │     │ (fornecedor, │     │ (cliente B2B,│
│   busca)     │     │  condições)  │     │  condições)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  warehouse   │     │   purchase   │     │    sales     │
│ (depósitos,  │◄───▶│  (pedidos    │◄───▶│  (pedidos    │
│   estoque)   │kafka│   compra)    │kafka│   venda)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐                         ┌──────────────┐
│   pricing    │                         │  approval    │
│ (tabelas de  │                         │  (workflow   │
│  preço)      │                         │   aprovação) │
└──────────────┘                         └──────────────┘
                            │
                     ┌──────────────┐
                     │  identity    │
                     │  (auth,      │
                     │   RBAC)      │
                     └──────────────┘

Legenda:
  ◄──kafka──▶  = Domain events via Debezium CDC (Outbox → Kafka)
  ───conductor── = Sagas complexas orquestradas pelo Conductor
```

### 2.4 Microserviços — Detalhamento

| Serviço | Porta | Bounded Context | Responsabilidade |
|---------|-------|-----------------|------------------|
| `vinheria-catalog` | 8081 | Catalog | Catálogo de vinhos, variedades, regiões |
| `vinheria-supplier` | 8082 | Supplier | Fornecedores, condições de compra |
| `vinheria-customer` | 8083 | Customer | Clientes B2B, condições comerciais, crédito |
| `vinheria-warehouse` | 8084 | Warehouse | Depósitos, posições de estoque |
| `vinheria-purchase` | 8085 | Purchase | Pedidos de compra (fornecedor → depósito) |
| `vinheria-sales` | 8086 | Sales | Pedidos de venda, fulfillments |
| `vinheria-pricing` | 8087 | Pricing | Tabelas de preço, margem |
| `vinheria-identity` | 8088 | Identity | Autenticação, RBAC |

### 2.5 Modelo Híbrido: Quando usar Kafka vs Conductor

| Cenário | Mecanismo | Justificativa |
|---------|-----------|---------------|
| `WineRegistered`, `PriceUpdated` | **Debezium CDC** (Outbox) | Atomicidade DB+Kafka via WAL |
| `StockUpdated`, `StockReserved` | **Debezium CDC** (Outbox) | Consistência garantida |
| `SupplierCreated`, `CustomerCreated` | **Debezium CDC** (Outbox) | Propagação de cadastros |
| Sales Order (validate→approve→reserve→fulfill) | **Conductor** (saga) | Multi-step, aprovação, multi-fulfillment |
| Purchase Order (validate→approve→receive) | **Conductor** (saga) | Multi-step com aprovação |
| Fulfillment (pick→pack→ship→deliver) | **Conductor** (saga) | Sequência ordenada |

### 2.6 Fluxo de Pedido de Venda com Multi-Depósito

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SALES ORDER FLOW                                     │
│                                                                              │
│  1. SELLER cria pedido                                                       │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │ SalesOrder #001 (Customer: Restaurante XYZ)                    │      │
│     │ ├── Item 1: Malbec      │ Qty: 10 │ Warehouse: SP-01          │      │
│     │ ├── Item 2: Cabernet    │ Qty: 5  │ Warehouse: SP-01          │      │
│     │ ├── Item 3: Tannat      │ Qty: 3  │ Warehouse: PY-01          │      │
│     │ └── Item 4: Carménère   │ Qty: 6  │ Warehouse: RJ-01          │      │
│     │                                                                │      │
│     │ Total: R$ 2.204,00 │ Margem: R$ 892,00 (40,5%)                │      │
│     │ Status: PENDING_APPROVAL                                       │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                              │                                               │
│  2. MANAGER/ADMIN aprova     ▼                                               │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │ Approval: APPROVED                                             │      │
│     │ (se ADMIN criou → auto-approved)                               │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                              │                                               │
│  3. Sistema gera fulfillments (um por depósito)                             │
│                              ▼                                               │
│     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│     │ Fulfillment #1  │  │ Fulfillment #2  │  │ Fulfillment #3  │          │
│     │ Warehouse: SP-01│  │ Warehouse: PY-01│  │ Warehouse: RJ-01│          │
│     │                 │  │                 │  │                 │          │
│     │ - Malbec (10)   │  │ - Tannat (3)    │  │ - Carménère (6) │          │
│     │ - Cabernet (5)  │  │                 │  │                 │          │
│     │                 │  │                 │  │                 │          │
│     │ Status: PENDING │  │ Status: PENDING │  │ Status: PENDING │          │
│     └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│              │                    │                    │                    │
│  4. Cada depósito processa seu fulfillment                                  │
│              │                    │                    │                    │
│              ▼                    ▼                    ▼                    │
│           PICKING              PICKING              PICKING                 │
│              │                    │                    │                    │
│              ▼                    ▼                    ▼                    │
│           PACKED               PACKED               PACKED                  │
│              │                    │                    │                    │
│              ▼                    ▼                    ▼                    │
│           SHIPPED              SHIPPED              SHIPPED                 │
│              │                    │                    │                    │
│              ▼                    ▼                    ▼                    │
│          DELIVERED            DELIVERED            DELIVERED                │
│              │                    │                    │                    │
│  5. Quando todos fulfillments DELIVERED → SalesOrder = DELIVERED            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.7 Fluxo de Aprovação

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                             │
│                                                                  │
│  User cria pedido (Purchase ou Sales)                           │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Criador é    │───── SIM ────▶ Pedido APPROVED automaticamente│
│  │ ADMIN?       │                                               │
│  └──────┬───────┘                                               │
│         │ NÃO                                                    │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Status =     │                                               │
│  │ PENDING_     │                                               │
│  │ APPROVAL     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ MANAGER ou   │                                               │
│  │ ADMIN revisa │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│ APPROVED  REJECTED                                              │
│    │         │                                                  │
│    ▼         ▼                                                  │
│ Continua   Notifica                                             │
│ fluxo      criador                                              │
└─────────────────────────────────────────────────────────────────┘
```

---
