# Vinheria Digital — System Design Documentation

> Documentação completa do System Design v5.0 (B2B)

## Modelo de Negócio

**Vinheria Digital** é uma plataforma B2B de distribuição de vinhos para uso interno da equipe comercial. Sistema fechado para vendas a clientes B2B cadastrados (restaurantes, adegas, hotéis) e compras de fornecedores cadastrados (vinícolas, importadoras).

## Índice

### Fundamentos

| # | Documento | Descrição |
|---|---|---|
| 01 | [Visão Geral](./01-visao-geral.md) | Stack tecnológico, ADRs, modelo B2B |
| 02 | [Arquitetura](./02-arquitetura.md) | Hexagonal + Vertical Slices, mapa de microserviços B2B |
| 13 | [Bounded Contexts](./13-bounded-contexts.md) | Context map B2B, domain events, saga workflows |
| 17 | [Glossário Ubíquo](./17-glossario.md) | Termos PT-BR ↔ EN (Ubiquitous Language B2B) |

### Desenvolvimento

| # | Documento | Descrição |
|---|---|---|
| 03 | [Backend — Quarkus + Kotlin](./03-backend-quarkus-kotlin.md) | Gradle, Ktlint, Detekt, naming conventions, patterns |
| 04 | [Frontend — Angular + PrimeNG](./04-frontend-angular-primeng.md) | Estrutura, tema Bordeaux, i18n (Transloco), multi-currency |
| 05 | [Comunicação Reativa](./05-comunicacao-reativa.md) | REST, SSE, gRPC, performance targets (SLOs) |
| 09 | [Test Pyramid](./09-test-pyramid.md) | Kotest, Jest, K6, ArchUnit, coverage rules |
| 12 | [Git Strategy](./12-git-strategy.md) | Trunk-Based Development, Conventional Commits |

### Infraestrutura & Operações

| # | Documento | Descrição |
|---|---|---|
| 06 | [Saga Orchestration](./06-saga-orkes-conductor.md) | Orkes Conductor, sales/purchase/fulfillment workflows |
| 07 | [Observability](./07-observability-otel.md) | OpenTelemetry, MDC, Grafana, 3 sinais |
| 08 | [CDC — Debezium](./08-cdc-debezium-outbox.md) | Outbox Pattern, Kafka KRaft, connectors |
| 10 | [CI/CD](./10-cicd-github-actions.md) | GitHub Actions, pipelines, OIDC federation |
| 11 | [AWS Cloud](./11-aws-cloud-terraform.md) | Terraform IaC, EKS, service mapping, cost estimation |

### Segurança & Identidade

| # | Documento | Descrição |
|---|---|---|
| 14 | [Users, Roles & Auth](./14-users-roles-auth.md) | SELLER/PURCHASER/MANAGER/ADMIN, Cognito, RBAC, approval workflow |

### AI Agent Context

| # | Documento | Descrição |
|---|---|---|
| 15 | [Agent Instructions](./15-agent-instructions.md) | Regras para AI assistants (backend, frontend, ops) |
| 16 | [Claude Code Hooks](./16-claude-code-hooks.md) | TDD automation, quality gates, K6 scripts |

## Como usar este repositório

### Para Desenvolvedores

Leia na ordem: **01 → 02 → 03/04 → 05 → 09 → 12 → 14**

### Para DevOps / SRE

Leia na ordem: **01 → 07 → 08 → 10 → 11**

### Para AI Agents (Claude Code, Copilot)

Use o [`CLAUDE.md`](../CLAUDE.md) na raiz do projeto — é o arquivo de contexto com todas as regras de agente.

## Microserviços B2B

| Serviço | Porta | Bounded Context | Responsabilidade |
|---------|-------|-----------------|------------------|
| `vinheria-catalog` | 8081 | Catalog | Catálogo de vinhos, variedades, regiões |
| `vinheria-supplier` | 8082 | Supplier | Fornecedores, condições de compra |
| `vinheria-customer` | 8083 | Customer | Clientes B2B, condições comerciais, crédito |
| `vinheria-warehouse` | 8084 | Warehouse | Depósitos, posições de estoque |
| `vinheria-purchase` | 8085 | Purchase | Pedidos de compra (fornecedor → depósito) |
| `vinheria-sales` | 8086 | Sales | Pedidos de venda, fulfillments |
| `vinheria-pricing` | 8087 | Pricing | Tabelas de preço, margem |
| `vinheria-identity` | 8088 | Identity | Autenticação, RBAC |

## Roles do Sistema

| Role | Descrição |
|------|-----------|
| **SELLER** | Vendedor — realiza vendas para clientes B2B |
| **PURCHASER** | Comprador — realiza compras de fornecedores |
| **MANAGER** | Gerente — aprova pedidos, visualiza relatórios |
| **ADMIN** | Administrador — acesso total ao sistema |

---

> **Versão**: 5.0.0 (B2B)
> **Última atualização**: Março 2026
