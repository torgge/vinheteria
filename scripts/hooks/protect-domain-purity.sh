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
