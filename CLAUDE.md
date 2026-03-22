# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vinheria Digital** is a B2B wine distribution platform for internal use by the sales team. The system manages purchases from suppliers, inventory across multiple warehouses, and sales to registered B2B customers (restaurants, wine shops, hotels, distributors).

**Key Characteristics:**
- **Closed system**: Only authenticated internal users (no public access)
- **Multi-warehouse**: Stock managed per warehouse, selectable per order item
- **Multi-currency**: BRL, PYG, USD (accounting currency: BRL)
- **Multi-language**: pt-BR, es-PY, en-US
- **Approval workflow**: Orders require approval (except for ADMIN)
- **Margin tracking**: Display company profit margin on sales

## Business Model

```
SUPPLIERS ──(Purchase Order)──▶ WAREHOUSES ──(Sales Order)──▶ B2B CUSTOMERS
                                    │
                               Multi-depot:
                               SP-01, RJ-01, PY-01...
```

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **SELLER** | Sales rep | Create sales orders, view catalog/customers/stock |
| **PURCHASER** | Buyer | Create purchase orders, manage suppliers |
| **MANAGER** | Approver | All above + approve/reject pending orders |
| **ADMIN** | Full access | All above + settings, users, warehouses, conditions (orders auto-approved) |

### Key Flows

**Purchase Flow**: Supplier → Purchase Order → (Approval if not ADMIN) → Receive at Warehouse → Update Stock

**Sales Flow**: Customer → Sales Order (items with warehouse per item) → (Approval if not ADMIN) → Generate Fulfillments (one per warehouse) → Pick/Pack/Ship → Deliver

## Development Commands

### Infrastructure
```bash
docker compose up -d                                    # Core infra
docker compose --profile observability up -d            # + Grafana stack
docker compose --profile loadtest up -d                 # + K6
docker compose --profile '*' down -v                    # Reset all
```

### Backend (Quarkus + Kotlin)
```bash
cd services/vinheria-{service}
./gradlew quarkusDev                    # Dev mode

./gradlew test                          # All tests
./gradlew test -Punit                   # Unit tests (Kotest)
./gradlew test -Pintegration            # Integration tests
./gradlew test -Parchitecture           # Architecture tests (ArchUnit)
./gradlew test --tests "*SalesOrderTest" # Single test

./gradlew ktlintFormat                  # Auto-fix formatting
./gradlew ktlintCheck                   # Validate formatting
./gradlew detekt                        # Static analysis
./gradlew koverVerify                   # Coverage ≥80%
```

### Frontend (Angular + PrimeNG)
```bash
cd frontend
pnpm install && pnpm start              # Dev server
pnpm test                               # Jest tests
pnpm test -- --testPathPattern="Wine"   # Single test file
pnpm build                              # Production build
```

### Load Testing (K6)
```bash
k6 run k6/scripts/smoke/catalog-smoke.js --env BASE_URL=http://localhost:8081
k6 run k6/scripts/load/catalog-search-load.js --env BASE_URL=http://localhost:8081
```

## Architecture

### Hexagonal + Vertical Slices
```
services/vinheria-{service}/src/main/kotlin/com/vinheria/{service}/
├── _config/                    # Quarkus config
├── _shared/                    # Shared domain (Money, Sku, etc.)
└── {slice}/                    # Feature slice
    ├── domain/                 # Aggregates, VOs, Ports (pure Kotlin, NO framework imports)
    ├── application/            # Use cases (one per file, verb infinitive)
    └── adapters/
        ├── inbound/            # REST, gRPC, Kafka, Conductor workers
        └── outbound/           # Repository impls, external services
```

### Bounded Contexts

| Context | Aggregates | Responsibility |
|---------|------------|----------------|
| **Catalog** | `Wine`, `GrapeVariety`, `WineRegion` | Wine catalog (no pricing) |
| **Supplier** | `Supplier`, `PurchaseCondition` | Supplier registry, purchase terms |
| **Customer** | `Customer`, `SalesCondition`, `CreditLimit` | B2B customers, commercial terms |
| **Warehouse** | `Warehouse`, `StockPosition` | Warehouses, stock per warehouse/SKU |
| **Purchase** | `PurchaseOrder`, `PurchaseOrderItem` | Purchase orders (supplier → warehouse) |
| **Sales** | `SalesOrder`, `SalesOrderItem`, `Fulfillment` | Sales orders, fulfillments per warehouse |
| **Pricing** | `PriceTable`, `Margin` | Price tables, cost, profit margin |
| **Approval** | `ApprovalWorkflow`, `ApprovalRule` | Approval rules and workflow |
| **Identity** | `User`, `Role` | Auth (Cognito), RBAC |

### Microservices

| Service | Port | Description |
|---------|------|-------------|
| vinheria-catalog | 8081 | Wine catalog |
| vinheria-supplier | 8082 | Suppliers, purchase conditions |
| vinheria-customer | 8083 | B2B customers, sales conditions |
| vinheria-warehouse | 8084 | Warehouses, stock positions |
| vinheria-purchase | 8085 | Purchase orders |
| vinheria-sales | 8086 | Sales orders, fulfillments |
| vinheria-pricing | 8087 | Price tables, margins |
| vinheria-identity | 8088 | Auth, RBAC |

### Inter-Service Communication

- **Domain Events**: Debezium CDC + Outbox pattern → Kafka (simple events like `WineRegistered`, `StockReserved`)
- **Sagas**: Orkes Conductor CE for complex workflows (sales order saga, fulfillment saga)
- **Real-time Updates**: HTTP + SSE for stock/price changes to frontend

## Key Domain Models

### SalesOrder (with warehouse per item)
```kotlin
SalesOrder
├── customerId: CustomerId
├── items: List<SalesOrderItem>
│   ├── sku: Sku
│   ├── warehouseId: WarehouseId    // Warehouse selected per item
│   ├── quantity: Int
│   ├── unitPrice: Money
│   ├── unitCost: Money             // From StockPosition.averageCost
│   └── marginPercentage: BigDecimal
├── totalAmount: Money
├── totalMargin: Money              // Company profit
├── marginPercentage: BigDecimal
├── status: DRAFT → PENDING_APPROVAL → APPROVED → FULFILLED → DELIVERED
└── fulfillments: List<Fulfillment> // One per warehouse (generated on approval)
```

### Fulfillment (generated per warehouse)
```kotlin
Fulfillment
├── salesOrderId: SalesOrderId
├── warehouseId: WarehouseId
├── items: List<FulfillmentItem>    // Items from this warehouse only
├── status: PENDING → PICKING → PACKED → SHIPPED → DELIVERED
└── trackingCode: String?
```

### StockPosition (per warehouse)
```kotlin
StockPosition
├── warehouseId: WarehouseId
├── sku: Sku
├── availableQuantity: Int
├── reservedQuantity: Int
├── averageCost: Money              // Weighted average cost
```

### Customer (with default conditions)
```kotlin
Customer
├── companyName, taxId (CNPJ)
├── salesCondition: SalesCondition
│   ├── priceTableId: PriceTableId  // Default or custom
│   ├── paymentTermDays: Int        // 30, 60, 90
│   ├── discountPercentage: BigDecimal
│   └── creditLimit: Money
└── status: ACTIVE, INACTIVE, BLOCKED
```

## Approval Workflow

```
User creates order (Purchase or Sales)
        │
        ▼
   Is ADMIN? ──YES──▶ Auto-APPROVED
        │
       NO
        ▼
   Status = PENDING_APPROVAL
        │
        ▼
   MANAGER or ADMIN reviews
        │
   ┌────┴────┐
   ▼         ▼
APPROVED  REJECTED
```

## Conventions

### Backend (Kotlin)
- `Uni<T>` / `Multi<T>` for all I/O (never block)
- One use case per file: `CreateSalesOrder.kt`, `ApprovePurchaseOrder.kt`
- `data class` for VOs, `sealed class DomainError` for errors
- No `var` in domain/application
- `Money` value object for all amounts
- Always calculate and display margin on sales

### Frontend (Angular)
- PrimeNG components, customize via `--p-*` CSS vars
- Angular Signals + Signal Store
- `*transloco` for all user-visible text (3 languages)
- Jest for testing

### Git
- Trunk-based: `main` always deployable
- Branch: `feat/VNH-{ticket}-{slug}` (max 48h)
- Conventional Commits: `type(scope): description`

**Commit Types:**
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructure (no behavior change) |
| `test` | Adding/updating tests |
| `docs` | Documentation only |
| `chore` | Build, CI, dependencies |
| `perf` | Performance improvement |

**Scopes:** `catalog`, `sales`, `purchase`, `warehouse`, `pricing`, `customer`, `supplier`, `identity`, `frontend`, `shared`, `infra`, `docker`, `terraform`, `ci`, `k6`

**Examples:**
```
feat(sales): add multi-warehouse fulfillment
fix(warehouse): correct stock reservation on concurrent updates
refactor(pricing): extract margin calculation to value object
test(catalog): add property-based tests for Wine aggregate
chore(infra): upgrade Kafka to 3.7
```

### Naming
| Element | Pattern | Example |
|---------|---------|---------|
| Aggregate | Singular noun | `SalesOrder`, `Warehouse` |
| Use Case | Verb infinitive | `CreateSalesOrder`, `ApproveOrder` |
| Domain Event | Noun + Past | `SalesOrderApproved`, `FulfillmentShipped` |
| Kafka topic | `vinheria.{ctx}.{event}` | `vinheria.sales.order-approved` |

## Multi-Warehouse Sales Flow

```
SalesOrder #001 (Customer: Restaurant XYZ)
├── Item 1: Malbec      │ Qty: 10 │ Warehouse: SP-01
├── Item 2: Cabernet    │ Qty: 5  │ Warehouse: SP-01
├── Item 3: Tannat      │ Qty: 3  │ Warehouse: PY-01
└── Item 4: Carménère   │ Qty: 6  │ Warehouse: RJ-01
                │
                ▼ (On Approval)
    ┌───────────┼───────────┐
    ▼           ▼           ▼
Fulfillment  Fulfillment  Fulfillment
   SP-01        PY-01        RJ-01
(Items 1,2)   (Item 3)     (Item 4)
```

## Claude Code Hooks

Automated hooks in `.claude/settings.json`:
- **PostToolUse**: TDD test runner + Detekt lint on `.kt` edits
- **PreToolUse**: Domain purity guard (blocks framework imports in domain/)
- **PreToolUse**: Validates Conventional Commit messages
- **Stop**: Full validation (all tests + coverage)

## Documentation

Detailed docs in `docs/`:
- `docs/02-arquitetura.md` — Architecture
- `docs/03-backend-quarkus-kotlin.md` — Backend conventions
- `docs/04-frontend-angular-primeng.md` — Frontend conventions
- `docs/09-test-pyramid.md` — Testing strategy
- `docs/15-agent-instructions.md` — Agent rules
