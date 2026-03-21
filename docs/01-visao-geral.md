# 1. Visão Geral do Projeto

**Vinheria Digital** é uma plataforma B2B de distribuição de vinhos para uso interno da equipe comercial. O sistema gerencia compras de fornecedores, estoque em múltiplos depósitos, e vendas para clientes B2B cadastrados (restaurantes, adegas, hotéis, distribuidores).

### Características Principais

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

### Modelo de Negócio

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

### Stack Tecnológico

| Camada        | Tecnologia                                  |
|---------------|---------------------------------------------|
| Backend       | Quarkus 3.x + Kotlin + Gradle Kotlin DSL   |
| Frontend      | Angular 18+ + PrimeNG 19                    |
| i18n          | Transloco (pt-BR, es-PY, en-US)             |
| Multi-Currency| BRL (Real), PYG (Guaraní), USD (Dólar)      |
| Comunicação   | Reactive REST (Mutiny) + SSE + gRPC         |
| Orquestração  | Orkes Conductor CE (Saga Pattern)           |
| Mensageria    | Apache Kafka **KRaft** (sem Zookeeper)      |
| CDC           | Debezium + Kafka Connect (Outbox Pattern)   |
| Database      | PostgreSQL 16 (R2DBC reativo, WAL logical)  |
| Cache         | Valkey 8 (catálogo, sessões, rate limiting) |
| Search        | OpenSearch (busca de vinhos por facets)      |
| Observability | OpenTelemetry (traces + metrics + logs/MDC) → Grafana Stack |
| CI/CD         | GitHub Actions                              |
| Containers    | Amazon EKS (Karpenter), Amazon ECR     |
| Cloud         | **AWS** (us-east-1), Terraform IaC      |
| Frontend Host | CloudFront + S3 (Angular SPA)           |
| Auth          | AWS Cognito (OAuth 2.0, JWT, RBAC)      |

### Decisões Arquiteturais (ADRs Resumidos)

- **B2B Fechado**: Sistema interno para equipe comercial. Sem acesso público. Vendedores realizam vendas para clientes cadastrados, compradores realizam compras de fornecedores cadastrados.
- **Multi-Depósito**: Estoque gerenciado por depósito (SP, RJ, PY, etc.). Na venda, cada item pode sair de um depósito diferente, gerando fulfillments separados.
- **Fluxo de Aprovação**: Pedidos de compra e venda requerem aprovação de MANAGER ou ADMIN (exceto quando criados por ADMIN, que são auto-aprovados).
- **Margem de Lucro**: Sistema calcula e exibe margem bruta (preço de venda - custo médio do estoque) em cada pedido de venda.
- **Condições Comerciais**: Cada cliente tem condições customizáveis (tabela de preço, prazo de pagamento, desconto, limite de crédito). Modelo padrão aplicado no cadastro.
- **Valkey sobre Redis**: Licença BSD 3-Clause (100% open-source), throughput ~37% maior em writes via I/O threading multi-core, compatibilidade total com protocolo Redis.
- **PrimeNG sobre PatternFly**: PatternFly 6 é React-first. PrimeNG oferece 80+ componentes Angular nativos, DataTable com virtualização, tema customizável via design tokens.
- **Orkes Conductor CE (Híbrido)**: Saga orquestrado para fluxos complexos (sales_order_saga, purchase_order_saga). Domain events via Debezium CDC/Outbox.
- **Debezium CDC + Outbox Pattern**: Elimina dual-write. Domain events persistidos na tabela outbox na mesma transação ACID, Debezium captura via WAL e publica no Kafka.
- **Kafka KRaft (sem Zookeeper)**: KRaft simplifica operação, reduz footprint.
- **BRL como Moeda Contábil**: Empresa brasileira — escrituração fiscal obrigatória em BRL. Toda transação registra dual-amount: moeda original + equivalente em BRL.
- **AWS us-east-1 (Virginia)**: Custo ~25% menor que sa-east-1, maior catálogo de serviços. Latência mitigada via CloudFront.

---
