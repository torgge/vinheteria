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
