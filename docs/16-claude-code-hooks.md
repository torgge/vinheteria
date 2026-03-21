# 16. Claude Code Hooks — TDD Automation & Quality Gates


> **Hooks são comandos shell que executam automaticamente em pontos específicos do ciclo de vida do Claude Code.** Eles garantem que o pattern TDD seja seguido em cada alteração, sem depender do modelo "lembrar" de rodar testes.

### 12.1 Configuração — `.claude/settings.json`

```json
{
  "hooks": {

    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/session-start.sh",
            "timeout": 15
          }
        ]
      }
    ],

    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/tdd-test-runner.sh",
            "timeout": 120
          }
        ]
      },
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/detekt-lint.sh",
            "timeout": 30
          }
        ]
      }
    ],

    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/protect-domain-purity.sh",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/block-dangerous-commands.sh",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/validate-commit-message.sh",
            "timeout": 5
          }
        ]
      }
    ],

    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/full-validation.sh",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

### 12.2 Hook Scripts

#### `scripts/hooks/session-start.sh` — Carrega contexto do projeto

```bash
#!/bin/bash
# Injetar contexto de desenvolvimento na sessão
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

echo "=== Vinheria Digital — Session Context ==="
echo ""

# Git status resumido
echo "## Git Status"
cd "$PROJECT_DIR"
git branch --show-current
git log --oneline -5
echo ""

# Testes que falharam na última execução
echo "## Last Test Results"
if [ -f "$PROJECT_DIR/build/reports/tests/test/index.html" ]; then
  FAILURES=$(grep -c "failures" "$PROJECT_DIR/build/reports/tests/test/index.html" 2>/dev/null || echo "0")
  echo "Previous test failures: $FAILURES"
else
  echo "No previous test results found"
fi
echo ""

# Verificar se infraestrutura local está rodando
echo "## Infrastructure Check"
for service in postgres:5432 valkey:6379 kafka:9092; do
  host="${service%%:*}"
  port="${service##*:}"
  if nc -z localhost "$port" 2>/dev/null; then
    echo "  ✓ $host (port $port)"
  else
    echo "  ✗ $host (port $port) — run: docker compose up -d"
  fi
done
```

#### `scripts/hooks/tdd-test-runner.sh` — TDD: roda testes a cada edição

```bash
#!/bin/bash
# ============================================================
# TDD HOOK — Roda testes automaticamente após cada edição
# ============================================================
# Estratégia:
#   1. Arquivo .kt editado no domain/  → roda unit tests do slice
#   2. Arquivo .kt editado no application/ → roda unit tests do slice
#   3. Arquivo *Test.kt editado → roda aquele teste específico
#   4. Arquivo no adapters/ → roda integration tests do slice
#   5. Arquivo .ts editado no frontend → roda jest do componente
# ============================================================
set -euo pipefail

# Lê o JSON de input via stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0  # Nenhum arquivo, nada a fazer
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

# --- Backend Kotlin (Quarkus + Gradle) ---
if [[ "$FILE_PATH" == *.kt ]]; then

  # Detectar o slice a partir do path
  # Ex: src/main/kotlin/com/vinheria/catalog/order/domain/Wine.kt → slice = "order" ou "catalog"
  SLICE=$(echo "$FILE_PATH" | grep -oP 'com/vinheria/\w+/\K\w+' | head -1)

  # Se é um arquivo de teste, rodar esse teste específico
  if [[ "$FILE_PATH" == *Test.kt ]] || [[ "$FILE_PATH" == *Spec.kt ]]; then
    TEST_CLASS=$(basename "$FILE_PATH" .kt)
    echo "🧪 TDD: Running specific test → $TEST_CLASS"
    ./gradlew test --tests "*${TEST_CLASS}" --no-daemon -q 2>&1
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
      echo '{"feedback": "❌ TEST FAILED — Fix the failing test before continuing"}' >&2
    else
      echo '{"feedback": "✅ Test passed: '"$TEST_CLASS"'"}' >&2
    fi
    exit 0
  fi

  # Arquivo no domain/ ou application/ → unit tests do slice
  if [[ "$FILE_PATH" == */domain/* ]] || [[ "$FILE_PATH" == */application/* ]]; then
    echo "🧪 TDD: Running unit tests for slice → $SLICE"
    ./gradlew test -Punit --tests "com.vinheria.*.${SLICE}.*" --no-daemon -q 2>&1
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
      echo '{"feedback": "❌ UNIT TESTS FAILED in slice '"$SLICE"' — TDD cycle: fix before proceeding"}' >&2
    else
      echo '{"feedback": "✅ Unit tests passed for slice: '"$SLICE"'"}' >&2
    fi
    exit 0
  fi

  # Arquivo no adapters/ → integration tests
  if [[ "$FILE_PATH" == */adapters/* ]]; then
    echo "🧪 TDD: Running integration tests for slice → $SLICE"
    ./gradlew test -Pintegration --tests "com.vinheria.*.${SLICE}.*" --no-daemon -q 2>&1
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
      echo '{"feedback": "❌ INTEGRATION TESTS FAILED in slice '"$SLICE"' — Check adapter implementation"}' >&2
    else
      echo '{"feedback": "✅ Integration tests passed for slice: '"$SLICE"'"}' >&2
    fi
    exit 0
  fi

  # Fallback: qualquer .kt → unit tests completo
  echo "🧪 TDD: Running all unit tests"
  ./gradlew test -Punit --no-daemon -q 2>&1
  exit 0
fi

# --- Frontend TypeScript (Angular) ---
if [[ "$FILE_PATH" == *.ts ]] && [[ "$FILE_PATH" == *vinheria-web* ]]; then
  SPEC_FILE="${FILE_PATH%.ts}.spec.ts"
  COMPONENT_DIR=$(dirname "$FILE_PATH")

  if [[ "$FILE_PATH" == *.spec.ts ]]; then
    echo "🧪 TDD: Running Angular test → $(basename "$FILE_PATH")"
    cd "$PROJECT_DIR/vinheria-web"
    npx ng test --include="$FILE_PATH" --watch=false --browsers=ChromeHeadless 2>&1
  elif [ -f "$SPEC_FILE" ]; then
    echo "🧪 TDD: Running matching spec → $(basename "$SPEC_FILE")"
    cd "$PROJECT_DIR/vinheria-web"
    npx ng test --include="$SPEC_FILE" --watch=false --browsers=ChromeHeadless 2>&1
  fi
  exit 0
fi

# --- K6 Performance/E2E scripts ---
if [[ "$FILE_PATH" == *.js ]] && [[ "$FILE_PATH" == *k6/* ]]; then
  echo "🧪 K6 script changed — validating syntax"
  k6 inspect "$FILE_PATH" 2>&1 || true
  exit 0
fi

exit 0
```

#### `scripts/hooks/detekt-lint.sh` — Ktlint + Detekt em Kotlin

```bash
#!/bin/bash
# Roda Ktlint (formatação) + Detekt (análise estática) nos arquivos Kotlin editados
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ "$FILE_PATH" == *.kt ]] || [[ "$FILE_PATH" == *.kts ]]; then
  cd "${CLAUDE_PROJECT_DIR:-.}"

  # 1. Ktlint auto-format: corrige formatação automaticamente
  echo "🔧 Ktlint: Auto-formatting"
  ./gradlew ktlintFormat --no-daemon -q 2>&1 || true

  # 2. Ktlint check: valida se tudo está formatado
  echo "🔍 Ktlint: Checking code style"
  if ! ./gradlew ktlintCheck --no-daemon -q 2>&1; then
    echo '{"feedback": "⚠️ Ktlint found formatting issues that could not be auto-fixed — review manually"}' >&2
  fi

  # 3. Detekt: análise estática (code smells, complexidade)
  echo "🔍 Detekt: Static analysis"
  if ! ./gradlew detekt --no-daemon -q 2>&1; then
    echo '{"feedback": "⚠️ Detekt found code quality issues — review complexity and structure"}' >&2
  fi
fi

exit 0
```

#### `scripts/hooks/protect-domain-purity.sh` — Guard: domain sem imports de framework

```bash
#!/bin/bash
# ============================================================
# PRE-TOOL HOOK — Bloqueia edições que violem Hexagonal Architecture
# Exit code 2 = BLOCK action | Exit code 0 = ALLOW
# ============================================================
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

# Só verificar arquivos no package domain/
if [[ "$FILE_PATH" == */domain/* ]] && [[ "$FILE_PATH" == *.kt ]]; then

  # Lista de imports proibidos no domain
  FORBIDDEN_IMPORTS=(
    "import jakarta."
    "import javax."
    "import io.quarkus"
    "import io.smallrye"
    "import org.apache.kafka"
    "import io.orkes"
    "import org.eclipse.microprofile"
    "import io.vertx"
  )

  for IMPORT in "${FORBIDDEN_IMPORTS[@]}"; do
    if echo "$CONTENT" | grep -q "$IMPORT"; then
      echo "{\"block\": true, \"message\": \"🚫 HEXAGONAL VIOLATION: Import '$IMPORT' não é permitido no package domain/. Domain deve ser Kotlin puro, sem dependências de framework. Mova essa lógica para um adapter.\"}" >&2
      exit 2
    fi
  done
fi

exit 0
```

#### `scripts/hooks/block-dangerous-commands.sh` — Guard: comandos perigosos

```bash
#!/bin/bash
# Bloqueia comandos destrutivos em produção
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Patterns perigosos
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "DROP DATABASE"
  "DROP TABLE"
  "TRUNCATE"
  "docker system prune -a"
  "git push --force origin main"
  "kubectl delete namespace prod"
  "flyway clean"
)

for PATTERN in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$PATTERN"; then
    echo "{\"block\": true, \"message\": \"🚫 BLOCKED: Comando destrutivo detectado — '$PATTERN'. Operação bloqueada por segurança.\"}" >&2
    exit 2
  fi
done

exit 0
```

#### `scripts/hooks/full-validation.sh` — Stop: validação completa antes de encerrar

```bash
#!/bin/bash
# ============================================================
# STOP HOOK — Validação completa ao final da sessão
# Roda: unit + integration + architecture + detekt + coverage
# ============================================================
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

echo "================================================================"
echo "🏁 FULL VALIDATION — Running complete quality gate"
echo "================================================================"

ERRORS=0

# 1. Ktlint (formatting)
echo ""
echo "── Step 1/6: Ktlint (Code Formatting) ──"
if ! ./gradlew ktlintCheck --no-daemon -q 2>&1; then
  echo "❌ Ktlint FAILED — run ./gradlew ktlintFormat"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Ktlint passed"
fi

# 2. Detekt (static analysis)
echo ""
echo "── Step 2/6: Detekt (Static Analysis) ──"
if ! ./gradlew detekt --no-daemon -q 2>&1; then
  echo "❌ Detekt FAILED"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Detekt passed"
fi

# 3. Unit Tests
echo ""
echo "── Step 3/6: Unit Tests ──"
if ! ./gradlew test -Punit --no-daemon -q 2>&1; then
  echo "❌ Unit Tests FAILED"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Unit Tests passed"
fi

# 4. Integration Tests
echo ""
echo "── Step 4/6: Integration Tests ──"
if ! ./gradlew test -Pintegration --no-daemon -q 2>&1; then
  echo "❌ Integration Tests FAILED"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Integration Tests passed"
fi

# 5. Architecture Tests
echo ""
echo "── Step 5/6: Architecture Tests (ArchUnit) ──"
if ! ./gradlew test -Parchitecture --no-daemon -q 2>&1; then
  echo "❌ Architecture Tests FAILED"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Architecture Tests passed"
fi

# 6. Coverage Verification
echo ""
echo "── Step 6/6: Coverage (Kover ≥ 80%) ──"
if ! ./gradlew koverVerify --no-daemon -q 2>&1; then
  echo "❌ Coverage below 80%"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Coverage meets threshold"
fi

echo ""
echo "================================================================"
if [ $ERRORS -gt 0 ]; then
  echo "⚠️  VALIDATION COMPLETE: $ERRORS gate(s) failed"
  echo "    Review issues above before pushing."
else
  echo "✅ VALIDATION COMPLETE: All gates passed — safe to push"
fi
echo "================================================================"

exit 0
```

### 12.3 K6 — Performance & E2E Tests

#### Estrutura do diretório K6

```
k6/
├── scripts/
│   ├── smoke/                     # Smoke tests (validação rápida)
│   │   ├── catalog-smoke.js
│   │   └── order-smoke.js
│   ├── load/                      # Load tests (throughput sustentado)
│   │   ├── catalog-search-load.js
│   │   └── checkout-saga-load.js
│   ├── stress/                    # Stress tests (encontrar o breaking point)
│   │   └── catalog-stress.js
│   ├── e2e/                       # End-to-end flows completos
│   │   ├── purchase-wine-e2e.js
│   │   └── return-wine-e2e.js
│   └── helpers/
│       ├── auth.js                # Helper: autenticação
│       ├── data-generators.js     # Helper: geração de dados
│       └── checks.js              # Helper: validações comuns
├── thresholds.json                # Thresholds globais
└── k6.config.js                   # Config compartilhada
```

#### Exemplo: E2E — Fluxo completo de compra de vinho

```javascript
// k6/scripts/e2e/purchase-wine-e2e.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const checkoutDuration = new Trend('checkout_saga_duration');
const failureRate = new Rate('checkout_failures');

export const options = {
  scenarios: {
    purchase_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Ramp-up
        { duration: '3m', target: 50 },   // Sustained load
        { duration: '1m', target: 100 },  // Peak
        { duration: '1m', target: 0 },    // Ramp-down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checkout_saga_duration: ['p(95)<2000'],
    checkout_failures: ['rate<0.05'],      // < 5% failure rate
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  group('01 — Browse Catalog', () => {
    const catalog = http.get(`${BASE_URL}/api/v1/wines?page=0&size=20`);
    check(catalog, {
      'catalog returns 200': (r) => r.status === 200,
      'catalog has wines': (r) => JSON.parse(r.body).items.length > 0,
    });
    sleep(1);
  });

  group('02 — Search Wine by Region', () => {
    const search = http.get(`${BASE_URL}/api/v1/wines?region=Mendoza&page=0&size=10`);
    check(search, {
      'search returns 200': (r) => r.status === 200,
    });
    sleep(0.5);
  });

  group('03 — Get Wine Detail', () => {
    const detail = http.get(`${BASE_URL}/api/v1/wines/sku/VNH-MAL-2020-001`);
    check(detail, {
      'detail returns 200': (r) => r.status === 200,
      'detail has price': (r) => JSON.parse(r.body).price !== undefined,
    });
    sleep(0.5);
  });

  group('04 — Checkout Saga (Full Flow)', () => {
    const startTime = Date.now();

    const order = http.post(`${BASE_URL}/api/v1/orders/checkout`, JSON.stringify({
      items: [
        { sku: 'VNH-MAL-2020-001', quantity: 2 },
        { sku: 'VNH-CAB-2019-003', quantity: 1 },
      ],
      paymentMethod: 'CREDIT_CARD',
      shippingAddress: {
        street: 'Rua Augusta, 1200',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01304-001',
      },
      customerEmail: `k6-test-${__VU}@vinheria.test`,
    }), { headers });

    const duration = Date.now() - startTime;
    checkoutDuration.add(duration);

    const success = check(order, {
      'checkout returns 201': (r) => r.status === 201,
      'checkout has orderId': (r) => JSON.parse(r.body).orderId !== undefined,
      'checkout saga < 2s': () => duration < 2000,
    });

    if (!success) failureRate.add(1);
    else failureRate.add(0);

    sleep(2);
  });
}
```

#### Exemplo: Load Test — Catálogo com 5K+ SKUs

```javascript
// k6/scripts/load/catalog-search-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    catalog_sustained: {
      executor: 'constant-arrival-rate',
      rate: 500,                    // 500 req/s target
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<250'],  // Alinhado com SLOs
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:search}': ['p(95)<150'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const REGIONS = ['Mendoza', 'Bordeaux', 'Toscana', 'Douro', 'Napa Valley', 'Barossa'];
const GRAPES = ['Malbec', 'Cabernet Sauvignon', 'Sangiovese', 'Touriga Nacional', 'Pinot Noir'];

export default function () {
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const grape = GRAPES[Math.floor(Math.random() * GRAPES.length)];
  const page = Math.floor(Math.random() * 50);

  const res = http.get(
    `${BASE_URL}/api/v1/wines?region=${region}&grape=${grape}&page=${page}&size=20`,
    { tags: { name: 'search' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'has pagination': (r) => JSON.parse(r.body).pagination !== undefined,
  });

  sleep(0.1);
}
```

#### Hook de Integração K6 — Comando Claude Code

```bash
# .claude/commands/k6-smoke.md
# Roda smoke tests K6 contra o ambiente local

Execute os smoke tests K6 para validação rápida dos endpoints.

Passos:
1. Verificar se os serviços estão rodando: `docker compose ps`
2. Executar: `k6 run k6/scripts/smoke/catalog-smoke.js --env BASE_URL=http://localhost:8080`
3. Analisar os resultados e reportar se algum threshold foi violado
```

```bash
# .claude/commands/k6-load.md
# Roda load tests K6 simulando throughput de produção

Execute os load tests K6 para validar performance sob carga.

Passos:
1. Verificar se os serviços estão rodando com perfil de load test: `docker compose --profile loadtest up -d`
2. Executar: `k6 run k6/scripts/load/catalog-search-load.js --env BASE_URL=http://localhost:8080 --out json=k6/results/catalog-load-$(date +%Y%m%d-%H%M%S).json`
3. Analisar os resultados comparando com os SLOs definidos na seção 5.2
4. Se thresholds foram violados, identificar o bottleneck e sugerir otimização
```

```bash
# .claude/commands/k6-e2e.md
# Roda E2E tests K6 cobrindo fluxos completos

Execute os testes E2E K6 que cobrem sagas completas (checkout, fulfillment, return).

Passos:
1. Verificar se todos os serviços + Conductor estão rodando: `docker compose up -d`
2. Executar: `k6 run k6/scripts/e2e/purchase-wine-e2e.js --env BASE_URL=http://localhost:8080`
3. Validar que `checkout_saga_duration p(95) < 2000ms` e `checkout_failures rate < 5%`
4. Se falhar, verificar logs do Conductor e traces no Grafana/Tempo
```

### 12.4 Fluxo TDD Completo — Ciclo de Desenvolvimento

```
┌─────────────────────────────────────────────────────────────────┐
│                  Claude Code TDD Cycle                           │
│                                                                  │
│  ① Escrever TESTE primeiro (domain/application)                 │
│     └→ PostToolUse hook roda o teste → ❌ RED                   │
│                                                                  │
│  ② Implementar código mínimo para passar                        │
│     └→ PostToolUse hook roda o teste → ✅ GREEN                 │
│     └→ PreToolUse hook valida pureza do domain                  │
│     └→ Detekt hook valida code style                            │
│                                                                  │
│  ③ Refatorar com confiança                                      │
│     └→ PostToolUse hook roda o teste → ✅ STILL GREEN           │
│                                                                  │
│  ④ Ao finalizar sessão (Stop hook)                              │
│     └→ full-validation.sh roda ALL tests + coverage             │
│                                                                  │
│  ⑤ Antes de merge (CI/CD)                                       │
│     └→ GitHub Actions roda tudo + K6 smoke                      │
│                                                                  │
│  ⑥ Antes de release (manual ou scheduled)                       │
│     └→ /k6-load e /k6-e2e validam performance + sagas           │
│                                                                  │
│  RED → GREEN → REFACTOR → VALIDATE → SHIP                      │
└─────────────────────────────────────────────────────────────────┘
```

### 12.5 Regras para Hooks

1. **PostToolUse (TDD runner)** é a peça central — roda em TODA edição de `.kt` e `.ts`
2. **PreToolUse guards** bloqueiam com `exit 2` — violações hexagonais e comandos perigosos
3. **Stop hook** roda a suíte completa — unit + integration + architecture + coverage
4. **K6 NÃO roda automaticamente em hooks** — é invocado via slash commands (`/k6-smoke`, `/k6-load`, `/k6-e2e`) ou CI/CD
5. **Timeout**: TDD runner = 120s, Lint = 30s, Guards = 10s, Full validation = 300s
6. **Feedback via stderr JSON** — hooks retornam `{"feedback": "..."}` para informar Claude sem bloquear

---
