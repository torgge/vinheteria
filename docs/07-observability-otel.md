# 7. Observability (OpenTelemetry + Structured Logging + MDC)


### 7.1 Configuração — Três Sinais Habilitados

```yaml
# application.yaml — cada microserviço
quarkus:
  application:
    name: vinheria-catalog
  otel:
    enabled: true
    traces:
      enabled: true
    metrics:
      enabled: true
    logs:
      enabled: true                  # Export logs via OTLP
    exporter:
      otlp:
        endpoint: http://otel-collector:4317
    resource:
      attributes:
        service.name: vinheria-catalog
        service.version: ${quarkus.application.version}
        deployment.environment: ${ENVIRONMENT:dev}

  # Structured JSON Logging com MDC
  log:
    console:
      json:
        enabled: true
    # MDC fields injetados automaticamente pelo Quarkus OTel:
    # traceId, spanId, sampled
    console.format: >
      %d{yyyy-MM-dd HH:mm:ss,SSS} %-5p [%c{3.}] (%t)
      traceId=%X{traceId} spanId=%X{spanId}
      %X{requestId} %s%e%n

  micrometer:
    export:
      prometheus:
        enabled: true
```

### 7.2 MDC Customizado com Kotlin (Context Propagation Reativo)

```kotlin
// _shared/adapters/RequestContextFilter.kt
// REGRA: MDC é propagado automaticamente pelo Quarkus em contextos reativos
//        Adicionar campos custom de negócio para enriquecer logs

private const val REQUEST_ID_HEADER = "X-Request-ID"
private const val REQUEST_ID_MDC_KEY = "requestId"

@ApplicationScoped
class RequestContextFilter {

    @ServerRequestFilter
    fun onRequest(requestContext: ContainerRequestContext) {
        val requestId = requestContext.getHeaderString(REQUEST_ID_HEADER)
            ?: UUID.randomUUID().toString()
        MDC.put(REQUEST_ID_MDC_KEY, requestId)
    }

    @ServerResponseFilter
    fun onResponse(responseContext: ContainerResponseContext) {
        MDC.remove(REQUEST_ID_MDC_KEY)
    }
}

// Propagação do requestId em chamadas REST outbound
@Provider
class RequestIdPropagationFilter : ClientRequestFilter {
    override fun filter(requestContext: ClientRequestContext) {
        MDC.get(REQUEST_ID_MDC_KEY)?.let {
            requestContext.headers[REQUEST_ID_HEADER] = listOf(it)
        }
    }
}
```

### 7.3 Instrumentação de Use Cases com Spans + MDC

```kotlin
// REGRA: Cada Use Case DEVE ter span customizado + log com MDC
@ApplicationScoped
class RegisterWine(
    private val repository: WineRepository,
    private val eventPublisher: EventPublisher,
    @Inject private val tracer: Tracer
) {
    private val logger = Logger.getLogger(RegisterWine::class.java)

    fun execute(command: Command): Uni<Wine> {
        val span = tracer.spanBuilder("RegisterWine.execute")
            .setAttribute("wine.sku", command.sku)
            .setAttribute("wine.region", command.region)
            .startSpan()

        // traceId/spanId/requestId incluídos automaticamente no log via MDC
        logger.info("Registering wine SKU=${command.sku} region=${command.region}")

        return Context.current().with(span).makeCurrent().use {
            repository.save(command.toDomain())
                .flatMap { saved ->
                    logger.info("Wine registered id=${saved.id.value} sku=${saved.sku.value}")
                    eventPublisher.publish(WineRegistered(saved))
                        .replaceWith(saved)
                }
                .onFailure().invoke { e ->
                    span.recordException(e)
                    logger.error("Failed to register wine SKU=${command.sku}", e)
                }
                .eventually { -> Uni.createFrom().voidItem().invoke { span.end() } }
        }
    }
}
```

### 7.4 Stack de Observability

```
App (OTel SDK) → OTel Collector → ┬→ Tempo (traces)
                                   ├→ Loki (structured logs com traceId/spanId/requestId)
                                   └→ Prometheus → Grafana (dashboards + alerts)

Correlação: Log → Trace → Metrics
  Loki query: {service="vinheria-catalog"} |= "requestId=abc-123"
  → Clica no traceId do log → Abre trace completo no Tempo
  → Dashboard Grafana mostra latência/throughput do mesmo período
```

---
