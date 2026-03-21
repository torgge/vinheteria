# 13. Bounded Contexts & Domain Events

### 13.1 Context Map — B2B

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VINHERIA DIGITAL B2B                                 │
│                                                                              │
│  ┌──────────────┐  Published    ┌──────────────┐                            │
│  │   Catalog    │──Language───▶│   Pricing    │                            │
│  │   Context    │              │   Context    │                            │
│  │  (vinhos)    │              │  (tabelas)   │                            │
│  └──────────────┘              └──────────────┘                            │
│         │                             │                                     │
│         │ ACL                         │ ACL                                 │
│         ▼                             ▼                                     │
│  ┌──────────────┐              ┌──────────────┐                            │
│  │  Warehouse   │◄────────────▶│   Purchase   │                            │
│  │   Context    │    kafka     │   Context    │                            │
│  │ (depósitos,  │              │ (pedidos de  │                            │
│  │   estoque)   │              │   compra)    │                            │
│  └──────────────┘              └──────────────┘                            │
│         │                             │                                     │
│         │ kafka                       │                                     │
│         ▼                             │                                     │
│  ┌──────────────┐              ┌──────────────┐                            │
│  │    Sales     │◄─────────────│   Approval   │                            │
│  │   Context    │   conductor  │   Context    │                            │
│  │ (pedidos de  │              │  (workflow   │                            │
│  │   venda)     │              │  aprovação)  │                            │
│  └──────────────┘              └──────────────┘                            │
│         │                                                                   │
│         │ kafka                                                             │
│         ▼                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  Supplier    │  │  Customer    │  │  Identity    │                      │
│  │   Context    │  │   Context    │  │   Context    │                      │
│  │(fornecedores)│  │(clientes B2B)│  │ (auth, RBAC) │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Legenda:
  ◄──kafka──▶  = Domain events via Debezium CDC (Outbox → Kafka)
  ───conductor── = Sagas complexas orquestradas pelo Orkes Conductor
```

### 13.2 Bounded Contexts — Detalhamento

| Context | Serviço | Responsabilidade |
|---------|---------|------------------|
| **Catalog** | `vinheria-catalog` | Catálogo de vinhos, variedades, regiões, SKUs |
| **Supplier** | `vinheria-supplier` | Fornecedores, condições de compra, contatos |
| **Customer** | `vinheria-customer` | Clientes B2B, condições comerciais, crédito |
| **Warehouse** | `vinheria-warehouse` | Depósitos, posições de estoque, movimentações |
| **Purchase** | `vinheria-purchase` | Pedidos de compra (fornecedor → depósito) |
| **Sales** | `vinheria-sales` | Pedidos de venda, fulfillments (depósito → cliente) |
| **Pricing** | `vinheria-pricing` | Tabelas de preço, margem, regras de desconto |
| **Approval** | `vinheria-approval` | Workflow de aprovação de pedidos |
| **Identity** | `vinheria-identity` | Autenticação, autorização, RBAC |

### 13.3 Domain Events (Kafka — Eventos Simples via CDC)

| Event | Producer | Consumers | Topic Kafka |
|-------|----------|-----------|-------------|
| `WineRegistered` | Catalog | Pricing, Warehouse | `vinheria.catalog.wine-registered` |
| `WineUpdated` | Catalog | Pricing, Sales | `vinheria.catalog.wine-updated` |
| `PriceTableUpdated` | Pricing | Sales, Customer | `vinheria.pricing.price-table-updated` |
| `SupplierCreated` | Supplier | Purchase | `vinheria.supplier.supplier-created` |
| `SupplierConditionsUpdated` | Supplier | Purchase | `vinheria.supplier.conditions-updated` |
| `CustomerCreated` | Customer | Sales, Pricing | `vinheria.customer.customer-created` |
| `CustomerConditionsUpdated` | Customer | Sales, Pricing | `vinheria.customer.conditions-updated` |
| `WarehouseCreated` | Warehouse | Purchase, Sales | `vinheria.warehouse.warehouse-created` |
| `StockReceived` | Warehouse | Catalog, Pricing | `vinheria.warehouse.stock-received` |
| `StockReserved` | Warehouse | Sales | `vinheria.warehouse.stock-reserved` |
| `StockDepleted` | Warehouse | Catalog | `vinheria.warehouse.stock-depleted` |
| `PurchaseOrderCreated` | Purchase | Approval, Warehouse | `vinheria.purchase.order-created` |
| `PurchaseOrderApproved` | Approval | Purchase | `vinheria.approval.purchase-approved` |
| `PurchaseOrderReceived` | Purchase | Warehouse | `vinheria.purchase.order-received` |
| `SalesOrderCreated` | Sales | Approval, Warehouse | `vinheria.sales.order-created` |
| `SalesOrderApproved` | Approval | Sales | `vinheria.approval.sales-approved` |
| `FulfillmentCreated` | Sales | Warehouse | `vinheria.sales.fulfillment-created` |
| `FulfillmentShipped` | Sales | Customer | `vinheria.sales.fulfillment-shipped` |
| `FulfillmentDelivered` | Sales | Sales | `vinheria.sales.fulfillment-delivered` |

### 13.4 Saga Workflows (Conductor — Fluxos Complexos)

| Workflow | Steps (happy path) | Compensation |
|----------|-------------------|--------------|
| `sales_order_saga_wf` | validate→check_credit→approve→reserve_stock→create_fulfillments→notify | release_stock→cancel_fulfillments→notify_fail |
| `purchase_order_saga_wf` | validate→approve→notify_supplier→await_confirmation | cancel_order→notify_fail |
| `fulfillment_saga_wf` | pick→pack→ship→track→deliver→notify | cancel_ship→restock→notify_fail |
| `stock_receive_saga_wf` | validate→inspect→accept→update_stock→update_cost→notify | reject→return_to_supplier→notify_fail |

### 13.5 Domain Objects por Context

#### Catalog Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `Wine` | Vinho cadastrado no catálogo |
| Value Object | `Sku` | Identificador único do produto |
| Value Object | `WineRegion` | Região de origem (Mendoza, Bordeaux, etc.) |
| Value Object | `GrapeVariety` | Variedade de uva (Malbec, Cabernet, etc.) |
| Value Object | `Vintage` | Ano da safra |
| Domain Event | `WineRegistered` | Vinho cadastrado no sistema |
| Domain Event | `WineUpdated` | Dados do vinho atualizados |

#### Supplier Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `Supplier` | Fornecedor cadastrado |
| Entity | `SupplierCondition` | Condições de compra do fornecedor |
| Value Object | `PaymentTerms` | Prazos de pagamento |
| Value Object | `MinimumOrder` | Pedido mínimo |
| Domain Event | `SupplierCreated` | Fornecedor cadastrado |
| Domain Event | `SupplierConditionsUpdated` | Condições atualizadas |

#### Customer Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `Customer` | Cliente B2B cadastrado |
| Entity | `CommercialCondition` | Condições comerciais do cliente |
| Value Object | `PriceTableRef` | Referência à tabela de preço aplicável |
| Value Object | `PaymentTerms` | Prazos de pagamento |
| Value Object | `CreditLimit` | Limite de crédito |
| Value Object | `DiscountRate` | Taxa de desconto |
| Domain Event | `CustomerCreated` | Cliente cadastrado |
| Domain Event | `CustomerConditionsUpdated` | Condições comerciais atualizadas |

#### Warehouse Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `Warehouse` | Depósito físico |
| Entity | `StockPosition` | Posição de estoque de um SKU em um depósito |
| Value Object | `WarehouseLocation` | Localização do depósito |
| Value Object | `StockQuantity` | Quantidade em estoque (available, reserved) |
| Value Object | `AverageCost` | Custo médio ponderado |
| Domain Event | `StockReceived` | Estoque recebido de pedido de compra |
| Domain Event | `StockReserved` | Estoque reservado para pedido de venda |
| Domain Event | `StockDepleted` | Estoque zerado |

#### Purchase Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `PurchaseOrder` | Pedido de compra para fornecedor |
| Entity | `PurchaseOrderItem` | Item do pedido de compra |
| Value Object | `PurchaseOrderStatus` | DRAFT, PENDING_APPROVAL, APPROVED, SENT, RECEIVED, CANCELLED |
| Domain Event | `PurchaseOrderCreated` | Pedido de compra criado |
| Domain Event | `PurchaseOrderApproved` | Pedido aprovado |
| Domain Event | `PurchaseOrderReceived` | Mercadoria recebida |

#### Sales Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `SalesOrder` | Pedido de venda para cliente B2B |
| Entity | `SalesOrderItem` | Item do pedido (com warehouseId) |
| Entity | `Fulfillment` | Despacho de um depósito (1 por warehouse) |
| Entity | `FulfillmentItem` | Item do fulfillment |
| Value Object | `SalesOrderStatus` | DRAFT, PENDING_APPROVAL, APPROVED, PARTIAL_FULFILLED, FULFILLED, DELIVERED, CANCELLED |
| Value Object | `FulfillmentStatus` | PENDING, PICKING, PACKED, SHIPPED, DELIVERED |
| Value Object | `Margin` | Margem de lucro (preço venda - custo médio) |
| Domain Event | `SalesOrderCreated` | Pedido de venda criado |
| Domain Event | `SalesOrderApproved` | Pedido aprovado |
| Domain Event | `FulfillmentCreated` | Fulfillment criado |
| Domain Event | `FulfillmentShipped` | Fulfillment despachado |
| Domain Event | `FulfillmentDelivered` | Fulfillment entregue |

#### Pricing Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `PriceTable` | Tabela de preços |
| Entity | `PriceTableEntry` | Entrada de preço por SKU |
| Value Object | `Price` | Preço em moeda específica |
| Value Object | `MarginRule` | Regra de cálculo de margem |
| Domain Event | `PriceTableUpdated` | Tabela de preço atualizada |

#### Approval Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `ApprovalRequest` | Solicitação de aprovação |
| Value Object | `ApprovalStatus` | PENDING, APPROVED, REJECTED |
| Value Object | `ApprovalType` | PURCHASE_ORDER, SALES_ORDER |
| Domain Event | `ApprovalRequested` | Aprovação solicitada |
| Domain Event | `ApprovalGranted` | Aprovação concedida |
| Domain Event | `ApprovalRejected` | Aprovação rejeitada |

#### Identity Context

| Tipo | Nome | Descrição |
|------|------|-----------|
| Aggregate Root | `User` | Usuário do sistema |
| Value Object | `Role` | SELLER, PURCHASER, MANAGER, ADMIN |
| Value Object | `UserStatus` | ACTIVE, INACTIVE, SUSPENDED |
| Domain Event | `UserCreated` | Usuário criado |
| Domain Event | `UserRoleChanged` | Role do usuário alterada |

### 13.6 Relacionamentos entre Contexts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Fluxo de Dados entre Contexts                             │
│                                                                              │
│  COMPRA (Purchase Flow)                                                      │
│  ───────────────────────                                                     │
│  Supplier → PurchaseOrder → [Approval] → Warehouse (StockReceived)          │
│                                                                              │
│  VENDA (Sales Flow)                                                          │
│  ────────────────────                                                        │
│  Customer → SalesOrder → [Approval] → Warehouse (StockReserved)             │
│                       ↓                                                      │
│             Fulfillments (1 por depósito) → Shipped → Delivered             │
│                                                                              │
│  PRECIFICAÇÃO (Pricing Flow)                                                 │
│  ─────────────────────────────                                               │
│  Catalog (Wine) + Customer (Conditions) → Pricing (PriceTable)              │
│                                       ↓                                      │
│                              Sales (Margin calculation)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---
