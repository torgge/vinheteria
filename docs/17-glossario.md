# 17. Glossário Ubíquo (Ubiquitous Language)

## Termos do Domínio B2B

| Termo PT-BR | Termo Código (EN) | Definição |
|-------------|-------------------|-----------|
| **Catálogo** | | |
| Vinho | Wine | Produto principal, aggregate root do catálogo |
| SKU | Sku | Identificador único de produto para estoque |
| Safra | Vintage | Ano de colheita da uva |
| Cepa / Variedade | GrapeVariety | Tipo de uva (Malbec, Cabernet, Tannat, etc.) |
| Região | WineRegion | Denominação de origem (Mendoza, Bordeaux, etc.) |
| **Fornecedores** | | |
| Fornecedor | Supplier | Empresa que vende vinhos para a Vinheria |
| Condições de Fornecimento | SupplierCondition | Prazos, preços e regras de compra do fornecedor |
| Pedido Mínimo | MinimumOrder | Quantidade ou valor mínimo por pedido de compra |
| **Clientes B2B** | | |
| Cliente B2B | Customer | Empresa que compra vinhos da Vinheria (restaurante, hotel, etc.) |
| Condições Comerciais | CommercialCondition | Tabela de preço, prazo, desconto e crédito do cliente |
| Tabela de Preço | PriceTable | Conjunto de preços aplicável a um cliente ou grupo |
| Prazo de Pagamento | PaymentTerms | Condições de pagamento (à vista, 30/60/90 dias) |
| Limite de Crédito | CreditLimit | Valor máximo de compras em aberto |
| Taxa de Desconto | DiscountRate | Percentual de desconto aplicável |
| **Depósitos e Estoque** | | |
| Depósito | Warehouse | Local físico de armazenamento de estoque |
| Posição de Estoque | StockPosition | Quantidade de um SKU em um depósito específico |
| Quantidade Disponível | AvailableQuantity | Estoque disponível para venda |
| Quantidade Reservada | ReservedQuantity | Estoque reservado para pedidos em andamento |
| Custo Médio | AverageCost | Custo médio ponderado do estoque |
| Reserva de Estoque | StockReservation | Bloqueio temporário de unidades para um pedido |
| **Compras** | | |
| Pedido de Compra | PurchaseOrder | Solicitação de compra para um fornecedor |
| Item de Compra | PurchaseOrderItem | Linha do pedido de compra (SKU + quantidade) |
| Recebimento | StockReceival | Entrada de mercadoria no depósito |
| **Vendas** | | |
| Pedido de Venda | SalesOrder | Solicitação de venda para um cliente B2B |
| Item de Venda | SalesOrderItem | Linha do pedido (SKU + quantidade + depósito) |
| Fulfillment | Fulfillment | Despacho de um depósito (um por warehouse no pedido) |
| Item do Fulfillment | FulfillmentItem | Linha do fulfillment |
| Margem | Margin | Lucro bruto (preço de venda - custo médio) |
| **Precificação** | | |
| Tabela de Preço | PriceTable | Conjunto de preços por SKU |
| Entrada de Preço | PriceTableEntry | Preço de um SKU em uma tabela |
| Regra de Margem | MarginRule | Regra para cálculo de margem mínima |
| **Aprovação** | | |
| Aprovação | Approval | Workflow de aprovação de pedidos |
| Solicitação de Aprovação | ApprovalRequest | Pedido aguardando aprovação |
| Status de Aprovação | ApprovalStatus | PENDING, APPROVED, REJECTED |
| Auto-Aprovação | AutoApproval | Aprovação automática para ADMIN |
| **Usuários e Roles** | | |
| Vendedor | Seller | Usuário que realiza vendas para clientes |
| Comprador | Purchaser | Usuário que realiza compras de fornecedores |
| Gerente | Manager | Usuário que aprova pedidos e visualiza relatórios |
| Administrador | Admin | Usuário com acesso total ao sistema |
| **Multi-Moeda** | | |
| Moeda | Currency | BRL (Real), PYG (Guaraní), USD (Dólar) |
| Taxa de Câmbio | ExchangeRate | Conversão entre moedas |
| Moeda Contábil | AccountingCurrency | BRL — moeda funcional para fins fiscais |
| Registro Contábil | TransactionRecord | Dual-amount: moeda original + equivalente BRL |
| Ganho Cambial | ExchangeGain | Diferença positiva de câmbio |
| Perda Cambial | ExchangeLoss | Diferença negativa de câmbio |
| Período Fiscal | FiscalPeriod | Competência mensal para escrituração |

## Termos Técnicos

| Termo | Definição |
|-------|-----------|
| Saga | Transação distribuída com compensação automática |
| Workflow | Definição de fluxo no Orkes Conductor |
| Worker | Executor de task individual dentro de uma saga |
| Compensação | Rollback orquestrado em caso de falha de saga |
| CDC | Change Data Capture — captura de mudanças via WAL |
| Outbox | Tabela de eventos para publicação atômica no Kafka |
| Debezium Connector | Componente que lê WAL e publica no Kafka |
| KRaft | Kafka sem Zookeeper, metadata via Raft consensus |
| Locale | Combinação idioma + região (pt-BR, es-PY, en-US) |
| JWT | Access token emitido pelo Cognito (OAuth 2.0) |
| RBAC | Role-Based Access Control |
| Feature Flag | Toggle para habilitar/desabilitar features |

## Status de Pedidos

### Pedido de Compra (PurchaseOrder)

| Status | Descrição |
|--------|-----------|
| DRAFT | Rascunho, não enviado |
| PENDING_APPROVAL | Aguardando aprovação (se não ADMIN) |
| APPROVED | Aprovado, pronto para envio |
| SENT | Enviado ao fornecedor |
| PARTIAL_RECEIVED | Parcialmente recebido |
| RECEIVED | Totalmente recebido |
| CANCELLED | Cancelado |

### Pedido de Venda (SalesOrder)

| Status | Descrição |
|--------|-----------|
| DRAFT | Rascunho |
| PENDING_APPROVAL | Aguardando aprovação (se não ADMIN) |
| APPROVED | Aprovado, fulfillments criados |
| PARTIAL_FULFILLED | Alguns fulfillments entregues |
| FULFILLED | Todos fulfillments despachados |
| DELIVERED | Todos fulfillments entregues |
| CANCELLED | Cancelado |

### Fulfillment

| Status | Descrição |
|--------|-----------|
| PENDING | Aguardando separação |
| PICKING | Em separação |
| PACKED | Embalado |
| SHIPPED | Despachado |
| DELIVERED | Entregue |

---

> **Última atualização**: Março 2026
> **Mantido por**: Equipe Vinheria Digital
> **Versão**: 5.0.0 (B2B)
