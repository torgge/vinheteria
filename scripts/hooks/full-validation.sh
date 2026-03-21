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
