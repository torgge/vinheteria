# 12. Git Strategy — Trunk-Based Development + Conventional Commits


### 11.1 Branching Model: Trunk-Based Development

> **`main` é a única branch de longa duração.** Feature branches são curtas (< 24h idealmente, max 48h). Nenhuma branch `develop`, `release/*` ou `hotfix/*`. Deploy vem direto do trunk.

```
  main (trunk) ─────●────●────●────●────●────●────●────●──── → sempre deployável
                    │         │         │    ▲
                    │         │         │    │
                    ▼         ▼         ▼    │
                  feat/     feat/     feat/  │
                  VNH-42    VNH-57    VNH-63 │
                  (2h)      (4h)      (1d)   │
                    │         │         │    │
                    └─PR──────┘─PR──────┘────┘
                                              │
                                         release/v1.2.0 (cut from main, short-lived)
                                              │
                                              ● tag v1.2.0
                                              │
                                              🗑️ delete branch
```

### 11.2 Regras de Branching

| Regra | Detalhamento |
|-------|-------------|
| **Trunk** | `main` — sempre verde, sempre deployável |
| **Feature branches** | `feat/VNH-{ticket}-{slug}` — vida máxima 48h |
| **Fix branches** | `fix/VNH-{ticket}-{slug}` — vida máxima 24h |
| **Release branches** | `release/v{X.Y.Z}` — cortadas do main, apenas hardening, deletadas após tag |
| **Merge strategy** | Squash merge via PR — um commit por feature no trunk |
| **Branch protection** | `main` protegida: requer PR + CI verde + 1 approval + squash only |
| **Feature flags** | Features incompletas entram no trunk desabilitadas via feature toggle |
| **Fix forward** | Bugs em produção são corrigidos com novo commit, não com revert |

### 11.3 Conventional Commits — Formato Obrigatório

Toda mensagem de commit segue a especificação [Conventional Commits v1.0.0](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types Permitidos

| Type       | Quando usar                              | SemVer     | Exemplo                                      |
|------------|------------------------------------------|------------|----------------------------------------------|
| `feat`     | Nova funcionalidade                      | **MINOR**  | `feat(catalog): add wine search by region`   |
| `fix`      | Correção de bug                          | **PATCH**  | `fix(order): handle null payment method`     |
| `docs`     | Documentação apenas                      | —          | `docs(readme): update setup instructions`    |
| `style`    | Formatação (sem mudança de lógica)       | —          | `style(catalog): fix indentation in Wine.kt` |
| `refactor` | Refatoração (sem feat nem fix)           | —          | `refactor(pricing): extract discount rule`   |
| `perf`     | Melhoria de performance                  | **PATCH**  | `perf(catalog): add Valkey cache to search`  |
| `test`     | Adição/correção de testes                | —          | `test(order): add Kotest for PlaceOrder`     |
| `build`    | Build system, dependências               | —          | `build(gradle): bump Quarkus to 3.18`        |
| `ci`       | GitHub Actions, CI/CD config             | —          | `ci: add K6 smoke test to pipeline`          |
| `chore`    | Tarefas gerais (não afetam src/test)     | —          | `chore: update .editorconfig`                |
| `revert`   | Reverter commit anterior                 | —          | `revert: feat(catalog): add wine search`     |

#### Scopes Válidos (por microserviço)

```
catalog | order | inventory | pricing | payment | shipping | identity
shared  | infra | k6 | docker | terraform | ci
```

#### Breaking Changes

```bash
# Via ! após o type/scope
feat(order)!: change checkout API to async saga

# Via footer BREAKING CHANGE
feat(order): change checkout API to async saga

BREAKING CHANGE: POST /api/v1/orders/checkout now returns 202 Accepted
with workflow tracking URL instead of synchronous 201 Created.
```

#### Exemplos Completos

```bash
# ✅ BOM — Conciso, com scope, descreve O QUE mudou
feat(catalog): add SSE endpoint for real-time stock updates

# ✅ BOM — Com body explicando o WHY
fix(inventory): prevent negative stock on concurrent reservations

Multiple concurrent requests could race and both reserve the last unit.
Added optimistic locking with version column on StockQuantity.

Closes VNH-142

# ✅ BOM — Breaking change com migration guide
feat(order)!: migrate checkout to Conductor saga orchestration

BREAKING CHANGE: Checkout endpoint changed from synchronous to async.
Clients must poll /api/v1/orders/{id}/status for completion.
See migration guide: docs/migration/checkout-v2.md

# ❌ RUIM — Sem type, sem scope, vago
fix stuff

# ❌ RUIM — Type errado, mensagem muito longa
feat: I fixed the bug where the wine catalog search was returning wrong results when user searches by region and grape variety at the same time

# ❌ RUIM — Commit genérico
chore: update code
```

### 11.4 Validação Automática — Git Hooks + CI

#### `.husky/commit-msg` — Validação local (commitlint)

```bash
#!/bin/bash
# .husky/commit-msg — Valida formato Conventional Commits
# Instalação: npx husky init && npm install --save-dev @commitlint/{cli,config-conventional}

npx --no -- commitlint --edit "$1"
```

#### `commitlint.config.js` — Regras de validação

```javascript
// commitlint.config.js — Configuração Conventional Commits Vinheria
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types permitidos
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert',
    ]],
    // Scopes válidos do projeto
    'scope-enum': [1, 'always', [
      'catalog', 'order', 'inventory', 'pricing',
      'payment', 'shipping', 'identity', 'shared',
      'infra', 'k6', 'docker', 'terraform', 'ci',
    ]],
    // Formato
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
```

#### `.github/workflows/pr-validation.yml` — Validação no PR

```yaml
# Valida título do PR (usado como commit message no squash merge)
name: PR Validation

on:
  pull_request:
    types: [opened, edited, synchronize]
    branches: [main]

jobs:
  validate-pr-title:
    name: "📝 Validate PR Title (Conventional Commits)"
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          scopes: |
            catalog
            order
            inventory
            pricing
            payment
            shipping
            identity
            shared
            infra
            k6
            docker
            terraform
            ci
          requireScope: true
          subjectPattern: ^[a-z].+$
          subjectPatternError: |
            O título do PR "{subject}" não segue Conventional Commits.
            Formato: <type>(<scope>): <description em lowercase>
            Exemplo: feat(catalog): add wine search by region

  validate-branch-name:
    name: "🌿 Validate Branch Name"
    runs-on: ubuntu-latest
    steps:
      - name: Check branch naming convention
        run: |
          BRANCH="${{ github.head_ref }}"
          PATTERN="^(feat|fix|docs|refactor|perf|test|build|ci|chore)/VNH-[0-9]+-[a-z0-9-]+$"
          if [[ ! "$BRANCH" =~ $PATTERN ]]; then
            echo "❌ Branch '$BRANCH' não segue o padrão: <type>/VNH-<ticket>-<slug>"
            echo "   Exemplo: feat/VNH-42-wine-search-by-region"
            exit 1
          fi
          echo "✅ Branch name valid: $BRANCH"

  validate-pr-size:
    name: "📏 Validate PR Size"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check PR diff size
        run: |
          ADDITIONS=$(gh pr view ${{ github.event.pull_request.number }} --json additions -q '.additions')
          if [ "$ADDITIONS" -gt 400 ]; then
            echo "⚠️ PR has $ADDITIONS additions. Trunk-Based Development recomenda PRs < 400 linhas."
            echo "   Considere quebrar em PRs menores com feature flags."
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 11.5 Claude Code Hook — Validação de Commit Message

```bash
# scripts/hooks/validate-commit-message.sh
# Usado pelo Claude Code para validar mensagens antes de commit
#!/bin/bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Interceptar git commit
if echo "$COMMAND" | grep -qE '^git commit'; then
  # Extrair a mensagem de commit
  MSG=$(echo "$COMMAND" | grep -oP '(?<=-m ")[^"]+' || echo "$COMMAND" | grep -oP "(?<=-m ')[^']+")

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
```

Adicionar ao `.claude/settings.json` (na seção PreToolUse):

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "$CLAUDE_PROJECT_DIR/scripts/hooks/validate-commit-message.sh",
      "timeout": 5
    }
  ]
}
```

### 11.6 Versionamento — SemVer + Conventional Commits

```
Conventional Commit Type  →  SemVer Bump  →  Exemplo
─────────────────────────────────────────────────────
feat(...)!: BREAKING       →  MAJOR (X.0.0) →  2.0.0
feat(...):                 →  MINOR (x.Y.0) →  1.3.0
fix(...):  / perf(...):    →  PATCH (x.y.Z) →  1.2.4
docs/style/refactor/test   →  nenhum bump   →  —
```

Releases são geradas automaticamente via tags no trunk:

```bash
# Cut release branch from main
git checkout -b release/v1.3.0 main

# Hardening (apenas fixes, NUNCA features)
git commit -m "fix(catalog): handle edge case in search"

# Tag e merge back
git tag v1.3.0
git checkout main
git merge release/v1.3.0
git push origin main --tags

# Delete release branch
git branch -d release/v1.3.0
git push origin --delete release/v1.3.0
```

### 11.7 Regras para Agentes AI

1. **SEMPRE** usar Conventional Commits em todo `git commit -m`
2. **SEMPRE** incluir scope (microserviço ou área)
3. **NUNCA** commitar direto no `main` — sempre via feature branch + PR
4. **SEMPRE** nomear branches como `<type>/VNH-<ticket>-<slug>`
5. **SEMPRE** fazer squash merge no PR — um commit limpo por feature
6. **NUNCA** criar branches de longa duração (> 48h)
7. **SEMPRE** usar feature flags para funcionalidades incompletas no trunk
8. **SEMPRE** manter o PR < 400 linhas de adição — quebrar em PRs menores se necessário
9. **SEMPRE** escrever description em lowercase, sem ponto final, max 72 caracteres
10. **SEMPRE** referenciar ticket no body ou footer: `Closes VNH-{number}`

---
