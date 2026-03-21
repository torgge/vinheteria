# 6. Orkes Conductor — Saga Orchestration


### 6.1 Workflow Definition (Checkout Saga)

```json
{
  "name": "checkout_saga_wf",
  "version": 1,
  "description": "Orchestrated saga for wine purchase checkout",
  "failureWorkflow": "checkout_compensation_wf",
  "tasks": [
    {
      "name": "validate_order",
      "taskReferenceName": "validate_order_ref",
      "type": "SIMPLE",
      "inputParameters": {
        "orderId": "${workflow.input.orderId}",
        "items": "${workflow.input.items}"
      }
    },
    {
      "name": "reserve_stock",
      "taskReferenceName": "reserve_stock_ref",
      "type": "SIMPLE",
      "inputParameters": {
        "orderId": "${validate_order_ref.output.orderId}",
        "items": "${validate_order_ref.output.validatedItems}"
      }
    },
    {
      "name": "process_payment",
      "taskReferenceName": "process_payment_ref",
      "type": "SIMPLE",
      "inputParameters": {
        "orderId": "${reserve_stock_ref.output.orderId}",
        "amount": "${reserve_stock_ref.output.totalAmount}",
        "paymentMethod": "${workflow.input.paymentMethod}"
      }
    },
    {
      "name": "initiate_shipment",
      "taskReferenceName": "initiate_shipment_ref",
      "type": "SIMPLE",
      "inputParameters": {
        "orderId": "${process_payment_ref.output.orderId}",
        "shippingAddress": "${workflow.input.shippingAddress}"
      }
    },
    {
      "name": "send_confirmation",
      "taskReferenceName": "send_confirmation_ref",
      "type": "SIMPLE",
      "inputParameters": {
        "orderId": "${initiate_shipment_ref.output.orderId}",
        "trackingCode": "${initiate_shipment_ref.output.trackingCode}",
        "customerEmail": "${workflow.input.customerEmail}"
      }
    }
  ]
}
```

### 6.2 Compensation Workflow

```json
{
  "name": "checkout_compensation_wf",
  "version": 1,
  "description": "Compensation workflow for failed checkout saga",
  "tasks": [
    { "name": "cancel_shipment", "taskReferenceName": "cancel_shipment_ref", "type": "SIMPLE", "optional": true },
    { "name": "refund_payment", "taskReferenceName": "refund_payment_ref", "type": "SIMPLE", "optional": true },
    { "name": "cancel_stock_reservation", "taskReferenceName": "cancel_stock_reservation_ref", "type": "SIMPLE" },
    { "name": "notify_customer_failure", "taskReferenceName": "notify_failure_ref", "type": "SIMPLE" }
  ]
}
```

### 6.3 Ambiente por Stage

| Ambiente      | Conductor                                          | Config                            |
|---------------|----------------------------------------------------|-----------------------------------|
| Local (dev)   | `orkesio/orkes-conductor-community-standalone` Docker | `conductor.server.url=http://localhost:8080` |
| Staging       | Orkes CE em K8s (não produção)                     | Volumes Postgres + Valkey          |
| Produção      | **Orkes Cloud** (managed)                          | Orkes-hosted ou customer-hosted   |

---
