# 3. Convenções de Código — Backend (Quarkus + Kotlin)


### 3.1 Gradle Kotlin DSL

```kotlin
// build.gradle.kts — estrutura padrão de cada microserviço
plugins {
    kotlin("jvm") version "2.0.+"
    kotlin("plugin.allopen") version "2.0.+"
    id("io.quarkus") version "3.17.+"
    id("org.jetbrains.kotlinx.kover") version "0.8.+"
    id("io.gitlab.arturbosch.detekt") version "1.23.+"
    id("org.jlleitschuh.gradle.ktlint") version "12.1.+"   // Ktlint (formatting)
}

// ─── Ktlint Configuration ───────────────────────────────────
ktlint {
    version.set("1.5.0")               // Pinned ktlint engine version
    android.set(false)
    outputToConsole.set(true)
    outputColorName.set("RED")
    ignoreFailures.set(false)           // Falha o build em violações
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.SARIF)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
    }
    filter {
        exclude("**/generated/**")
        include("**/kotlin/**")
    }
}

allOpen {
    annotation("jakarta.ws.rs.Path")
    annotation("jakarta.enterprise.context.ApplicationScoped")
    annotation("io.quarkus.test.junit.QuarkusTest")
}

dependencies {
    // Core Quarkus Reativo
    implementation("io.quarkus:quarkus-resteasy-reactive-kotlin")
    implementation("io.quarkus:quarkus-resteasy-reactive-jackson")
    implementation("io.quarkus:quarkus-mutiny-kotlin")

    // Persistência Reativa
    implementation("io.quarkus:quarkus-reactive-pg-client")
    implementation("io.quarkus:quarkus-flyway")

    // Mensageria
    implementation("io.quarkus:quarkus-smallrye-reactive-messaging-kafka")

    // Orquestração (Conductor)
    implementation("io.orkes.conductor:orkes-conductor-client:4.0.+")
    implementation("org.conductoross:java-sdk:4.0.+")

    // Observability (Traces + Metrics + Logs)
    implementation("io.quarkus:quarkus-opentelemetry")
    implementation("io.quarkus:quarkus-micrometer-registry-prometheus")
    implementation("io.quarkus:quarkus-smallrye-health")
    implementation("io.quarkus:quarkus-logging-json")  // Structured JSON logs

    // Cache (Valkey — protocolo compatível com Redis client)
    implementation("io.quarkus:quarkus-redis-client")

    // Testes — Kotest (domain/unit) + JUnit5 (integration com Quarkus)
    // NOTA: Kotest com Quarkus @QuarkusTest não tem integração nativa completa.
    // Estratégia: Kotest puro para domain → JUnit5 runner + Kotest assertions para integration.
    testImplementation("io.kotest:kotest-runner-junit5:5.9.+")       // Runner JUnit5 para Kotest specs
    testImplementation("io.kotest:kotest-assertions-core:5.9.+")     // Matchers e assertions
    testImplementation("io.kotest:kotest-property:5.9.+")            // Property-based testing
    testImplementation("io.kotest:kotest-framework-datatest:5.9.+")  // Data-driven testing
    testImplementation("io.quarkus:quarkus-junit5")                  // @QuarkusTest (integration)
    testImplementation("io.rest-assured:rest-assured")
    testImplementation("org.testcontainers:testcontainers")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:kafka")
    testImplementation("com.tngtech.archunit:archunit-junit5:1.3.0")
    testImplementation("io.mockk:mockk:1.13.+")
    testImplementation("io.quarkus:quarkus-test-vertx")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()  // Habilita Kotest runner via JUnit Platform
}
```

### 3.2 Ktlint — Code Formatting & Style

#### `.editorconfig` (raiz do projeto)

```editorconfig
# .editorconfig — Regras de estilo Kotlin para Ktlint
# Ktlint lê este arquivo automaticamente. Centraliza regras de formatação.
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true
max_line_length = 120

[*.{kt,kts}]
# Kotlin code style (não Android)
ktlint_code_style = ktlint_official

# Imports: sem wildcards, ordenados
ij_kotlin_imports_layout = *,java.**,javax.**,jakarta.**,kotlin.**,^
ij_kotlin_packages_to_use_import_on_demand = unset
ij_kotlin_allow_trailing_comma = true
ij_kotlin_allow_trailing_comma_on_call_site = true

# Function signatures: multiline quando > 3 parâmetros
ktlint_function_signature_rule_force_multiline_when_parameter_count_greater_or_equal_than = 4
ktlint_function_signature_body_expression_wrapping = multiline

# Regras habilitadas/desabilitadas
ktlint_standard_no-wildcard-imports = enabled
ktlint_standard_enum-entry-name-case = enabled
ktlint_standard_filename = enabled
ktlint_standard_class-naming = enabled
ktlint_standard_function-naming = enabled
ktlint_standard_property-naming = enabled
ktlint_standard_package-name = enabled

[*.md]
trim_trailing_whitespace = false

[*.yaml]
indent_size = 2

[*.json]
indent_size = 2
```

#### Comandos Gradle Ktlint

```bash
# Verificar formatação (falha o build se houver violações)
./gradlew ktlintCheck

# Auto-formatar código
./gradlew ktlintFormat

# Verificar formatação + detekt juntos
./gradlew ktlintCheck detekt

# Instalar git pre-commit hook (auto-format em staged files)
./gradlew addKtlintFormatGitPreCommitHook
```

#### Ktlint vs Detekt — Escopo Complementar

| Ferramenta | Escopo                          | Quando falha                          |
|------------|---------------------------------|---------------------------------------|
| **Ktlint** | Formatação e estilo de código   | Indentação, imports, naming, trailing comma |
| **Detekt** | Análise estática / code smells  | Complexidade ciclomática, long methods, magic numbers |

Ambos rodam no CI e nos hooks. Ktlint foca em **como o código é formatado**; Detekt foca em **como o código é estruturado**.

### 3.3 Patterns Obrigatórios

#### Domain — Aggregate Root

```kotlin
// catalog/domain/Wine.kt
// REGRA: Domain é Kotlin PURO — sem annotations de framework
data class Wine(
    val id: WineId,
    val name: String,
    val region: WineRegion,
    val grapeVarieties: List<GrapeVariety>,
    val vintage: Year,
    val sku: Sku,
    val stock: StockQuantity,
    val price: Money,
    val status: WineStatus
) {
    // Business rules vivem AQUI
    fun reserve(quantity: Int): Pair<Wine, WineReserved> {
        require(stock.available >= quantity) { "Estoque insuficiente para SKU ${sku.value}" }
        val updated = copy(stock = stock.decrease(quantity))
        val event = WineReserved(id, sku, quantity, Instant.now())
        return updated to event
    }

    fun applyDiscount(percentage: BigDecimal): Wine {
        require(percentage in BigDecimal.ZERO..BigDecimal("50.00")) { "Desconto máximo: 50%" }
        return copy(price = price.discountBy(percentage))
    }
}

enum class WineStatus { ACTIVE, OUT_OF_STOCK, DISCONTINUED }
```

#### Port (Interface no Domain)

```kotlin
// catalog/domain/WineRepository.kt
// REGRA: Port retorna Uni<T> (Mutiny) para manter reatividade
//        mas NÃO importa nada de infraestrutura
interface WineRepository {
    fun findById(id: WineId): Uni<Wine?>
    fun findBySku(sku: Sku): Uni<Wine?>
    fun search(criteria: WineSearchCriteria): Uni<PaginatedResult<Wine>>
    fun save(wine: Wine): Uni<Wine>
}
```

#### Use Case (Application Layer)

```kotlin
// catalog/application/RegisterWine.kt
// REGRA: Um use case por arquivo. Nome = verbo no infinitivo.
@ApplicationScoped
class RegisterWine(
    private val repository: WineRepository,
    private val eventPublisher: EventPublisher
) {
    data class Command(
        val name: String,
        val region: String,
        val grapeVarieties: List<String>,
        val vintage: Int,
        val sku: String,
        val initialStock: Int,
        val price: BigDecimal,
        val currency: String = "BRL"
    )

    fun execute(command: Command): Uni<Wine> {
        val wine = command.toDomain()
        return repository.save(wine)
            .flatMap { saved ->
                eventPublisher.publish(WineRegistered(saved))
                    .replaceWith(saved)
            }
    }
}
```

#### Adapter Inbound (REST Reativo)

```kotlin
// catalog/adapters/inbound/WineResource.kt
@Path("/api/v1/wines")
@Produces(MediaType.APPLICATION_JSON)
@ApplicationScoped
class WineResource(
    private val registerWine: RegisterWine,
    private val searchWines: SearchWines
) {
    @POST
    fun register(@Valid request: RegisterWineRequest): Uni<Response> =
        registerWine.execute(request.toCommand())
            .map { wine -> Response.created(URI.create("/api/v1/wines/${wine.id.value}")).entity(wine.toResponse()).build() }

    // SSE para streaming reativo de atualizações de catálogo
    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RestSseElementType(MediaType.APPLICATION_JSON)
    fun streamUpdates(): Multi<WineUpdateEvent> =
        searchWines.streamCatalogUpdates()
}
```

#### Conductor Worker (Saga Step)

```kotlin
// order/adapters/inbound/OrderConductorWorker.kt
// REGRA: Workers são stateless, idempotentes, e seguem Single Responsibility
@ApplicationScoped
class ReserveStockWorker(
    private val reserveStock: ReserveStock
) {
    @WorkerTask("reserve_stock")
    fun execute(input: ReserveStockInput): ReserveStockOutput {
        // Worker chama o use case do hexagonal — NUNCA lógica de negócio aqui
        return reserveStock.execute(input.toCommand())
            .map { it.toWorkerOutput() }
            .await().atMost(Duration.ofSeconds(30))
    }
}

// Compensation worker para rollback
@ApplicationScoped
class CancelStockReservationWorker(
    private val cancelReservation: CancelStockReservation
) {
    @WorkerTask("cancel_stock_reservation")
    fun execute(input: CancelReservationInput): CancelReservationOutput {
        return cancelReservation.execute(input.toCommand())
            .map { it.toWorkerOutput() }
            .await().atMost(Duration.ofSeconds(30))
    }
}
```

### 3.3 Naming Conventions (Backend)

| Elemento                | Padrão                          | Exemplo                         |
|-------------------------|--------------------------------|--------------------------------|
| Microserviço (repo)     | `vinheria-{domain}`            | `vinheria-catalog`             |
| Package base            | `com.vinheria.{service}`       | `com.vinheria.catalog`         |
| Aggregate Root          | Substantivo singular           | `Wine`, `Order`, `Customer`    |
| Value Object            | Substantivo composto           | `WineRegion`, `Money`, `Sku`   |
| Use Case                | Verbo infinitivo               | `RegisterWine`, `PlaceOrder`   |
| Domain Event            | Substantivo + Past participle  | `WineRegistered`, `OrderPlaced`|
| Port (interface)        | Substantivo + Repository/Gateway | `WineRepository`, `PaymentGateway` |
| Adapter inbound REST    | `{Entity}Resource`             | `WineResource`                 |
| Adapter outbound        | `{Entity}{Tech}{Port}`         | `WinePostgresRepository`       |
| Conductor Worker        | `{Action}Worker`               | `ReserveStockWorker`           |
| Conductor Workflow      | `{flow}_saga_wf`               | `checkout_saga_wf`             |
| Request DTO             | `{Action}{Entity}Request`      | `RegisterWineRequest`          |
| Response DTO            | `{Entity}Response`             | `WineResponse`                 |
| Kafka topic             | `vinheria.{service}.{event}`   | `vinheria.catalog.wine-registered` |

### 3.4 Regras de Estilo Kotlin

- **Imutabilidade**: Use `val` por padrão, `data class` para Value Objects
- **Null safety**: Nunca use `!!` — use `?.let {}`, `?:`, ou `Uni<T?>`
- **Extensions**: Use extension functions para mappers (domain ↔ DTO ↔ Worker I/O)
- **Sealed classes**: Para representar estados e resultados (`sealed class DomainError`)
- **No var**: Variáveis mutáveis proibidas em domain e application layers
- **Detekt**: Executar em cada PR, zero warnings permitidos

---
