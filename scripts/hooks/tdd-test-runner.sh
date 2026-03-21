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
