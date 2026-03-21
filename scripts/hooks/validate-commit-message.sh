#!/bin/bash
# scripts/hooks/validate-commit-message.sh
# Usado pelo Claude Code para validar mensagens antes de commit
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Interceptar git commit
if echo "$COMMAND" | grep -qE '^git commit'; then
  # Extrair a mensagem de commit (compatível com macOS e Linux)
  MSG=$(echo "$COMMAND" | sed -n 's/.*-m "\([^"]*\)".*/\1/p')
  if [ -z "$MSG" ]; then
    MSG=$(echo "$COMMAND" | sed -n "s/.*-m '\([^']*\)'.*/\1/p")
  fi
  # Handle HEREDOC style: git commit -m "$(cat <<'EOF' ... EOF)"
  if [ -z "$MSG" ] && echo "$COMMAND" | grep -q 'cat <<'; then
    MSG=$(echo "$COMMAND" | sed -n '/cat <</{n;p;}' | head -1)
  fi

  if [ -z "$MSG" ]; then
    exit 0  # Commit sem -m, editor vai abrir
  fi

  # Regex Conventional Commits
  PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z]+\))?(!)?: .{1,72}$"

  if [[ ! "$MSG" =~ $PATTERN ]]; then
    echo '{"block": true, "message": "🚫 Commit message não segue Conventional Commits.\n\nFormato: <type>(<scope>): <description>\nExemplo: feat(catalog): add wine search by region\n\nTypes: feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert\nScopes: catalog|order|inventory|pricing|payment|shipping|identity|shared|infra"}' >&2
    exit 2
  fi
fi

exit 0
