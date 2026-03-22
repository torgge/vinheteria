# Copilot Instructions — Vinheria Digital

B2B wine distribution platform (closed system, internal users only). Purchases from suppliers,
multi-warehouse inventory, sales to registered B2B customers (restaurants, hotels, distributors).

## Repository Layout

| Path | Contents |
|------|----------|
| `frontend/` | Angular 18 + PrimeNG 17 SPA |
| `docs/` | 22-file system-design documentation |
| `infra/` | Docker configs, Grafana, Prometheus, Tempo, OTEL |
| `k6/` | Smoke and load test scripts |
| `scripts/hooks/` | Git hook scripts |
| `services/vinheria-{service}/` | Quarkus + Kotlin microservices _(not yet in repo)_ |

## Commands

### Infrastructure

```bash
docker compose up -d                          # Core infra (Postgres, Kafka, Valkey, Conductor…)
docker compose --profile observability up -d  # + Grafana stack
docker compose --profile loadtest up -d       # + K6
docker compose --profile '*' down -v          # Full teardown
```

### Frontend (`cd frontend`)

```bash
pnpm install && pnpm start            # Dev server
pnpm test                             # All tests (Karma)
pnpm build                            # Production build
```

### Backend — each service (`cd services/vinheria-{service}`)

```bash
./gradlew quarkusDev                          # Dev mode with hot reload
./gradlew test                                # All tests
./gradlew test -Punit                         # Unit tests only (Kotest + MockK)
./gradlew test -Pintegration                  # Integration tests (Testcontainers)
./gradlew test -Parchitecture                 # ArchUnit architecture tests
./gradlew test --tests "*SalesOrderTest"      # Single test class
./gradlew ktlintFormat                        # Auto-fix formatting
./gradlew ktlintCheck                         # Validate formatting (CI gate)
./gradlew detekt                              # Static analysis
./gradlew koverVerify                         # Enforce ≥80% coverage
```

### Load Testing

```bash
k6 run k6/scripts/smoke/catalog-smoke.js --env BASE_URL=http://localhost:8081
k6 run k6/scripts/load/catalog-search-load.js --env BASE_URL=http://localhost:8081
```

## Microservices

| Service | Port | Bounded Context |
|---------|------|-----------------|
| `vinheria-catalog` | 8081 | Wine catalog (no pricing) |
| `vinheria-supplier` | 8082 | Suppliers, purchase conditions |
| `vinheria-customer` | 8083 | B2B customers, sales conditions |
| `vinheria-warehouse` | 8084 | Warehouses, stock per SKU |
| `vinheria-purchase` | 8085 | Purchase orders |
| `vinheria-sales` | 8086 | Sales orders, fulfillments |
| `vinheria-pricing` | 8087 | Price tables, margins |
| `vinheria-identity` | 8088 | Auth (Cognito), RBAC |

## Backend Architecture

### Package Structure (Hexagonal + Vertical Slices)

```
com.vinheria.{service}/
├── _config/          # Quarkus config
├── _shared/          # Money, Sku, shared VOs
└── {slice}/          # Feature slice (e.g. salesorder/)
    ├── domain/       # Aggregates, VOs, Ports — pure Kotlin, NO framework imports
    ├── application/  # Use cases — one file per use case, verb infinitive name
    └── adapters/
        ├── inbound/  # REST resources, Kafka consumers, Conductor workers
        └── outbound/ # Repository impls, external service clients
```

**The domain layer must have zero framework imports.** ArchUnit enforces this; the
`-Parchitecture` test profile will catch violations.

### Reactive I/O

All I/O returns `Uni<T>` or `Multi<T>` (SmallRye Mutiny). Never block with `.await()` outside tests.

```kotlin
// Correct
fun findById(id: WineId): Uni<Wine?>

// Wrong — never return T directly from I/O operations
fun findById(id: WineId): Wine?
```

### Domain Modeling Rules

- `data class` for all Value Objects; no `var` anywhere in `domain/` or `application/`
- `Money(amount: BigDecimal, currency: Currency)` for every monetary value — never a raw `BigDecimal`
- `sealed class DomainError` for all error cases; map to HTTP status in the adapter layer
- Use cases named with verb infinitive: `CreateSalesOrder`, `ApprovePurchaseOrder`
- Domain events named noun + past tense: `SalesOrderApproved`, `StockReserved`
- Kafka topics: `vinheria.{context}.{event}` — e.g. `vinheria.sales.order-approved`

### Business-Critical Rules

- **Multi-warehouse per order**: `warehouseId` lives on each `SalesOrderItem`, not the order. Never
  move it to the order level.
- **Fulfillments on approval**: one `Fulfillment` is auto-generated per unique warehouse when an
  order is approved. Don't create them earlier.
- **Approval bypass**: `ADMIN` role auto-approves. All other roles (SELLER, PURCHASER) require a
  MANAGER or ADMIN to approve before status moves to `APPROVED`.
- **Margin always shown**: every sales item must carry `unitCost`, `marginPercentage`, and
  `totalMargin`. Never omit these fields on sales-related responses.

## Backend Testing Conventions

- Use **Kotest** (`BehaviorSpec` or `FunSpec`) — not JUnit-style `@Test` classes
- Use **MockK** — not Mockito
- Integration tests start real infra via **Testcontainers** — no in-memory fakes for Postgres/Kafka
- Coverage gate is `koverVerify` (≥80%); it runs in CI after `test`

```kotlin
// Unit test pattern
class SalesOrderTest : BehaviorSpec({
    given("an approved order with items in two warehouses") {
        `when`("fulfillments are generated") {
            then("one Fulfillment is created per warehouse") { ... }
        }
    }
})
```

## Frontend Conventions

- **State**: Angular Signals + `@ngrx/signals` Signal Store. Do not use RxJS `Subject` /
  `BehaviorSubject` for component or feature state.
- **UI**: PrimeNG components only. Customize via CSS custom properties (`--p-*`), not by overriding
  PrimeNG internal classes.
- **i18n**: Every user-visible string must go through `*transloco`. Zero hardcoded strings in
  templates or components. Translation files are at `frontend/src/assets/i18n/{locale}.json`
  for `pt-BR` (default), `es-PY`, and `en-US`.
- **Components**: standalone only — no NgModules.
- **Multi-currency**: prices stored as `{ BRL, PYG, USD }` objects. The accounting currency is
  BRL; always convert for display using the active locale/currency from the Signal Store.
- **Mock data**: `frontend/src/app/mock/` contains typed fixtures used during development before
  the backend API is wired up. Keep mock shapes in sync with backend DTOs.

## Git Conventions

Branch pattern: `feat/VNH-{ticket}-{slug}` (max 48h — trunk-based development).

Conventional Commits are enforced by commitlint. Valid types:

`feat` · `fix` · `refactor` · `test` · `docs` · `style` · `perf` · `build` · `ci` · `chore`

Valid **scopes** (commitlint enforces these exactly):

`catalog` · `order` · `inventory` · `pricing` · `payment` · `shipping` · `identity` · `shared` ·
`infra` · `k6` · `docker` · `terraform` · `ci`

Subject must be lowercase, max 72 chars; full header max 100 chars.

```
feat(order): add multi-warehouse fulfillment generation
fix(inventory): correct stock reservation on concurrent updates
test(catalog): add BehaviorSpec for Wine aggregate reserve logic
```
