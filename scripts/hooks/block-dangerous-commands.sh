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
