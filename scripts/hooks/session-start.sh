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
