# AGENTS.md — Vinheria Digital

B2B wine distribution platform (closed system, internal users). Angular 18 + Angular Material 18 frontend. Quarkus + Kotlin backend is **planned but not implemented**.

## Repo State

- **`services/` does NOT exist.** Backend is designed in `docs/` but has zero code. Do NOT create backend code without explicit confirmation.
- **Frontend lives at `frontend/`.** `frontend/vinheria-web/` is a stale duplicate (missing Angular Material, Transloco, @ngrx/signals) — do not use it.
- **No test files exist.** `angular.json` sets `"skipTests": true` for all schematics — `ng generate` will not create spec files. You must create them manually.
- **No ESLint or Prettier** is configured in this repo.

## Commands

```bash
# Infrastructure (Docker Compose profiles)
docker compose --profile core up -d                                     # Postgres + Valkey
docker compose --profile core --profile events up -d                     # + Kafka
docker compose --profile core --profile events --profile connect --profile tools up -d  # + Debezium + Kafka UI
docker compose --profile core --profile events --profile connect --profile search --profile saga --profile tools up -d  # all
docker compose --profile '*' down -v                                    # Full teardown

# Frontend (package manager is npm, not pnpm — README is stale)
cd frontend
npm install && npm start          # Dev server (http://localhost:4200)
npm test                          # Jest (jest-preset-angular)
npm run build                     # Production build
```

Kafka must be healthy before Kafka Connect starts (30s healthcheck). Conductor takes ~60s.

`infra/` has Grafana/Prometheus/Tempo/OTEL configs but they are **NOT wired as compose services or profiles**. `frontend/Dockerfile` exists but is not in compose.

## Docker Runtime Permissions (learned the hard way)

- **`--tmpfs /app` kills the app.** tmpfs mounts as empty, wiping `COPY` artifacts — results in `ENOENT` on `package.json`.
- **`--tmpfs /app/.angular/cache` blocks Vite.** tmpfs is root-owned by default, so UID 1000 gets `EACCES` creating subdirs.
- **Solution:** `RUN mkdir -p /app/.angular/cache && chown -R 1000:1000 /app` in Dockerfile. At runtime, tmpfs only on `/tmp`. No tmpfs on any path that the build created and the process needs to write into.
- **`ng serve` runs as UID 1000, needs write access to `/app/.angular/cache` and `/app/node_modules/.cache`.** The `chown` at build time ensures these are writable without tmpfs.

## Frontend Conventions

- **Standalone components only** (no NgModules). Every component uses `standalone: true`.
- **State: Angular Signals** (`signal`, `computed`, `input`) + `@ngrx/signals` Signal Store. No RxJS Subjects for component state.
- **i18n: `*transloco`** for every user-visible string. 3 languages: `pt-BR` (default), `es-PY`, `en-US`. Keys: `{scope}.{feature}.{element}`. Translations at `src/assets/i18n/{locale}.json`.
- **UI: Angular Material 18** (`^18.2.14`). Themed via DESIGN.md tokens (`--color-*`, `--space-*`, `--radius-*`, `--font-*`) in `frontend/src/styles/_variables.scss`; Material overrides in `frontend/src/styles/_material-theme.scss`. Never hardcode values that contradict DESIGN.md.
- **Multi-currency:** prices as `{ BRL, PYG, USD }`. Accounting currency is BRL. `CurrencyService` handles display.
- **Feature structure:** `features/{context}/pages/{page-name}/` (e.g. `features/catalog/pages/wine-list/`).
- **Testing: Jest** (jest-preset-angular). Config in `frontend/jest.config.js`; run with `npm test`. Reusable Transloco stub at `src/testing/transloco-testing.ts` (`provideTranslocoStub`). Set signal inputs in tests via `fixture.componentRef.setInput(name, value)`.
- **Mock data:** `src/app/mock/data/` — typed fixtures for wines, orders, customers, suppliers, warehouses. Keep shapes in sync with planned backend DTOs.
- **Styling:** SCSS. `src/styles.scss` + `src/styles/` directory.

## Commit Conventions (Enforced)

Sources of truth: `commitlint.config.js` + `.github/workflows/pr-validation.yml`

```
type(scope): lowercase description, max 72 chars

Valid types: feat, fix, refactor, test, docs, style, perf, build, ci, chore
Valid scopes: catalog | sales | purchase | warehouse | pricing | customer | supplier | identity
              frontend | shared | infra | docker | terraform | ci | k6
Branch: {type}/VNH-{ticket}-{slug}  (max 48h, trunk-based)
```

PR validation enforces: PR title format, branch naming, PR size <=400 lines (warning). `claude/` and `dependabot/` branches are exempt from naming rules.

## CI (`.github/workflows/ci.yml`)

Smart backend detection — if no `gradlew` or `settings.gradle*` exists, all Gradle jobs are skipped. Currently all backend jobs are skipped since `services/` is empty.

## Formatting (`.editorconfig`)

- Kotlin `.kt`/`.kts`: indent 4, ktlint_official style, trailing commas, no wildcard imports, max 120 chars
- TS/JS/JSON/HTML/SCSS/CSS/YAML: indent 2
- Markdown: preserve trailing whitespace

## Claude Code Hooks

`.claude/settings.json` wires hooks for Claude Code sessions (not OpenCode): TDD runner, detekt lint, domain-purity guard, commit validation. The TDD hook's frontend path references `vinheria-web/` but the actual frontend is at `frontend/` — known discrepancy.

## OpenCode Config

- Skill: `.opencode/skills/material-3/` (MD3 + Angular Material + DESIGN.md token system)
- Commands: `.opencode/commands/k6-smoke.md`, `k6-load.md`, `k6-e2e.md`

## Infra Services (Local Dev)

| Service | Port | Notes |
|---------|------|-------|
| PostgreSQL 16 | 5432 | WAL logical, multi-db init |
| Valkey 8 | 6379 | Redis-compatible cache |
| Kafka KRaft | 9092 / 9093 (ctrl) | No Zookeeper |
| OpenSearch | 9200 | Security disabled in dev |
| Conductor CE | 8080 (API), 5000 (UI) | Saga orchestration |
| Kafka Connect | 8083 | Debezium connectors |
| Kafka UI | 9090 | Dev tool |
