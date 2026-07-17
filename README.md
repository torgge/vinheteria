# Vinheria Digital — B2B Wine Distribution Platform

> Plataforma B2B de distribuição de vinhos para uso interno da equipe comercial. Sistema fechado para compras de fornecedores e vendas para clientes B2B cadastrados (restaurantes, adegas, hotéis, distribuidores).

---

## Modelo de Negócio

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VINHERIA DIGITAL B2B                                 │
│                                                                              │
│  ┌──────────────┐      COMPRA        ┌──────────────┐       VENDA           │
│  │ FORNECEDORES │ ─────────────────▶ │  DEPÓSITOS   │ ─────────────────▶    │
│  │ (Suppliers)  │                    │  (Warehouses)│                       │
│  │              │  Purchase Order    │              │   Sales Order         │
│  │ - Vinícolas  │  ┌─────────────┐   │ ┌──────────┐ │   ┌─────────────┐     │
│  │ - Importad.  │  │ Aprovação?  │   │ │ Depósito │ │   │ Aprovação?  │     │
│  │ - Distrib.   │  │ (se não ADM)│   │ │   SP     │ │   │ (se não ADM)│     │
│  └──────────────┘  └─────────────┘   │ ├──────────┤ │   └─────────────┘     │
│                                       │ │ Depósito │ │                       │
│                                       │ │   RJ     │ │   ┌──────────────┐   │
│                                       │ ├──────────┤ │   │ CLIENTES B2B │   │
│                                       │ │ Depósito │ │──▶│ (Customers)  │   │
│                                       │ │   PY     │ │   │              │   │
│                                       │ └──────────┘ │   │ - Restaur.   │   │
│                                       └──────────────┘   │ - Adegas     │   │
│                                                          │ - Hotéis     │   │
│  USUÁRIOS INTERNOS                                       │ - Distrib.   │   │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐          └──────────────┘   │
│  │ SELLER │ │PURCHASER │ │ MANAGER │ │ ADMIN │                              │
│  └────────┘ └──────────┘ └─────────┘ └───────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Características Principais

| Característica | Descrição |
|----------------|-----------|
| **Modelo** | B2B fechado — apenas usuários internos autenticados |
| **Compras** | Pedidos de compra de fornecedores cadastrados |
| **Vendas** | Pedidos de venda para clientes B2B cadastrados |
| **Multi-depósito** | Estoque por depósito, seleção por item do pedido |
| **Fulfillment** | Um fulfillment por depósito no pedido de venda |
| **Aprovação** | Pedidos requerem aprovação (exceto ADMIN) |
| **Margem** | Exibe margem de lucro da empresa nas vendas |
| **Multi-moeda** | BRL, PYG, USD (moeda contábil: BRL) |
| **Multi-idioma** | pt-BR, es-PY, en-US |

## Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Backend | Quarkus 3.x + Kotlin + Gradle Kotlin DSL |
| Frontend | Angular 18+ + Angular Material 18 |
| Comunicação | Reactive REST (Mutiny) + SSE + gRPC |
| Orquestração | Orkes Conductor CE (Saga Pattern) |
| Mensageria | Apache Kafka KRaft (sem Zookeeper) |
| CDC | Debezium + Kafka Connect (Outbox Pattern) |
| Database | PostgreSQL 16 (R2DBC, WAL logical) |
| Cache | Valkey 8 |
| Search | OpenSearch |
| Observability | OpenTelemetry → AMP + AMG + ADOT |
| Cloud | AWS us-east-1, Terraform IaC |
| Auth | AWS Cognito (SELLER/PURCHASER/MANAGER/ADMIN) |
| i18n | Transloco (pt-BR, es-PY, en-US) |
| Moedas | BRL / PYG / USD (contábil: BRL) |
| CI/CD | GitHub Actions |
| Git | Trunk-Based + Conventional Commits |

## Microserviços

| Serviço | Descrição | Porta |
|---------|-----------|-------|
| `vinheria-catalog` | Catálogo de vinhos, SKU | 8081 |
| `vinheria-supplier` | Fornecedores, condições | 8082 |
| `vinheria-customer` | Clientes B2B, condições comerciais | 8083 |
| `vinheria-warehouse` | Depósitos, estoque | 8084 |
| `vinheria-purchase` | Pedidos de compra | 8085 |
| `vinheria-sales` | Pedidos de venda, fulfillments | 8086 |
| `vinheria-pricing` | Tabelas de preço, margem | 8087 |
| `vinheria-identity` | Auth (Cognito), RBAC | 8088 |

## Documentação

A documentação completa do System Design está em [`docs/`](./docs/):

| Documento | Conteúdo |
|-----------|----------|
| [01 — Visão Geral](docs/01-visao-geral.md) | Stack, ADRs, modelo B2B |
| [02 — Arquitetura](docs/02-arquitetura.md) | Hexagonal + Vertical Slices, mapa de serviços |
| [13 — Bounded Contexts](docs/13-bounded-contexts.md) | Context map B2B, domain events |
| [14 — Auth](docs/14-users-roles-auth.md) | SELLER/PURCHASER/MANAGER/ADMIN, RBAC, approval |
| [17 — Glossário](docs/17-glossario.md) | Termos PT-BR ↔ EN |

## Roles do Sistema

| Role | Descrição |
|------|-----------|
| **SELLER** | Vendedor — realiza vendas para clientes B2B |
| **PURCHASER** | Comprador — realiza compras de fornecedores |
| **MANAGER** | Gerente — aprova pedidos, visualiza relatórios |
| **ADMIN** | Administrador — acesso total ao sistema |

## Pré-requisitos

- **JDK 21+** (GraalVM para native image)
- **Node.js 20+** + **pnpm**
- **Docker** + **Docker Compose**
- **Gradle 8.x** (wrapper incluído)
- **Terraform 1.6+**
- **kubectl** + **AWS CLI v2**

## Início Rápido

```bash
# 1. Subir infraestrutura local
docker compose up -d

# 2. Backend (cada microserviço)
cd services/vinheria-catalog
./gradlew quarkusDev

# 3. Frontend
cd frontend
pnpm install
pnpm start
```

## Licença

Proprietary — All rights reserved.
