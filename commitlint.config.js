// commitlint.config.js — Vinheria Digital
// Validates Conventional Commits format
// Enforced at 3 layers: Husky (local), Claude Code hooks, GitHub Actions

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade                → MINOR
        'fix',      // Correção de bug                    → PATCH
        'docs',     // Documentação                       → —
        'style',    // Formatação (sem mudança de código) → —
        'refactor', // Sem feat nem fix                   → —
        'perf',     // Performance                        → PATCH
        'test',     // Testes                             → —
        'build',    // Build, deps                        → —
        'ci',       // CI/CD config                       → —
        'chore',    // Tarefas gerais                     → —
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Bounded contexts
        'catalog',
        'sales',
        'purchase',
        'warehouse',
        'pricing',
        'customer',
        'supplier',
        'identity',
        // Cross-cutting
        'frontend',
        'shared',
        // Infrastructure
        'infra',
        'docker',
        'terraform',
        // CI / Testing
        'ci',
        'k6',
      ],
    ],
    'scope-empty': [1, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
};
