# AGENTS.md — Vinheria Digital

B2B wine distribution platform (closed system, internal users). Quarkus + Kotlin backend, Angular 18 + PrimeNG frontend.

## Repo State (Critical)

- **`services/` does NOT exist yet.** Backend microservices are documented but not implemented. Do NOT create backend code without explicit confirmation.
- **Frontend exists** under `frontend/src/`. Real working dir: `frontend/`.
- **Package manager**: use `npm` (only `package-lock.json` exists, no `pnpm-lock.yaml`), despite `angular.json` declaring `"packageManager": "pnpm"`.

## Quick Start

```bash
docker compose up -d                          # Core infra (Postgres, Kafka, Valkey, OpenSearch, Conductor)
docker compose --profile observability up -d  # + Grafana/Prometheus/Tempo/Loki
docker compose --profile '*' down -v          # Full teardown, remove volumes

cd frontend
npm install && npm start                      # Angular dev server
npm test                                      # Frontend tests
```

## Commit Conventions (Enforced)

```
type(scope): lowercase description, max 72 chars

Valid types: feat, fix, refactor, test, docs, style, perf, build, ci, chore
Valid scopes (source of truth: commitlint.config.js):
   catalog | sales | purchase | warehouse | pricing | customer | supplier | identity
   frontend | shared | infra | docker | terraform | ci | k6
Branch: {type}/VNH-{ticket}-{slug}  (max 48h)
```

**⚠️ Scope mismatch:** `commitlint.config.js` uses B2B scopes above. `.github/workflows/pr-validation.yml` has older scopes (`order`, `inventory`, `payment`, `shipping`) that don't match the B2B model. Use the scopes from `commitlint.config.js`.

## Architecture Rules (For When Backend Is Built)

### Kotlin — Domain Purity

- `domain/` **must have zero framework imports** (enforced by ArchUnit + Claude hook)
- All I/O returns `Uni<T>` / `Multi<T>` (Mutiny reactive) — never block
- `Money(amount, currency)` for all monetary values — never raw `BigDecimal`
- `data class` for VOs, `sealed class DomainError` for errors, no `var` in domain/application
- Use cases: verb infinitive (`CreateSalesOrder`, not `SalesOrderCreator`)
- Kafka topics: `vinheria.{context}.{event-kebab-case}` (e.g. `vinheria.sales.order-approved`)

### Kotlin — Testing Gotcha

- **Unit tests**: Kotest (`BehaviorSpec`/`FunSpec`) + MockK. No JUnit `@Test`.
- **Integration tests**: `@QuarkusTest` requires **JUnit5 runner** (Kotest runner incompatible). Use Kotest *assertions* (`shouldBe`, `shouldContain`) inside JUnit5 `@Test` methods.
- Coverage gate: `./gradlew koverVerify` (≥80%)
- CI order: `lint → test(-Punit, -Pintegration, -Parchitecture) → koverVerify`

### Angular — Frontend Rules

- Standalone components only (no NgModules)
- State: Angular Signals + `@ngrx/signals` Signal Store. No RxJS Subjects for state.
- **Every user-visible string → `*transloco`**. 3 languages: `pt-BR` (default), `es-PY`, `en-US`. Keys: `{scope}.{feature}.{element}`.
- Tests: **Jest** + `jest-preset-angular` (not Karma, despite being in devDeps)
- Multi-currency: prices stored as `{ BRL, PYG, USD }`, accounting currency is BRL

### Business-Critical Constraints

- `warehouseId` lives on **each `SalesOrderItem`**, never on the order
- **Fulfillments generated on approval**, one per unique warehouse — not earlier
- **ADMIN auto-approves**; SELLER/PURCHASER require MANAGER/ADMIN approval
- Every sales item must carry `unitCost`, `marginPercentage`, `totalMargin`

## Infra Services (Local Dev)

| Service | Port | Notes |
|---------|------|-------|
| PostgreSQL 16 | 5432 | WAL logical enabled for CDC |
| Valkey 8 | 6379 | Redis-compatible cache |
| Kafka KRaft | 9092 (internal), 9093 (controller) | No Zookeeper |
| OpenSearch | 9200 | Security disabled in dev |
| Conductor CE | 8080 (API), 5000 (UI) | Saga orchestration |
| Kafka Connect | 8083 | Debezium connectors |
| Kafka UI | 9090 | Dev tool |

Kafka must be healthy before Kafka Connect starts — there's a 30s `start_period` on the healthcheck. Conductor takes ~60s to start.

## Instruction Files

- `CLAUDE.md` — detailed Claude Code agent instructions (long-form reference)
- `.github/copilot-instructions.md` — summarized version for GitHub Copilot
- `.claude/settings.json` — Claude Code hooks (TDD runner, detekt lint, domain purity guard, commit validation)
- `docs/` — 17-file system design documentation
