# 9. Test Pyramid


### 8.1 Distribuição Obrigatória

```
            ╱╲
           ╱  ╲         E2E (K6) + Performance   ~5%
          ╱────╲         Contract (Pact)          ~10%
         ╱      ╲
        ╱────────╲       Integration              ~25%
       ╱          ╲      (Testcontainers + Quarkus + Kotest assertions)
      ╱────────────╲
     ╱              ╲    Unit (Kotest + MockK)     ~60%
    ╱────────────────╲
```

### 8.2 Frameworks de Teste

| Camada          | Backend                        | Frontend             |
|-----------------|-------------------------------|---------------------|
| Unit            | **Kotest** (FunSpec/BehaviorSpec) + MockK | **Jest** + Angular Testing Library |
| Integration     | JUnit5 runner + **Kotest assertions** + Testcontainers | Jest + MSW (Mock Service Worker) |
| Architecture    | ArchUnit (JUnit5)             | ESLint rules         |
| Contract        | Pact (JUnit5)                 | Pact (Jest)          |
| E2E             | **K6** (fluxos HTTP completos) | K6 (browser scripting) |
| Performance     | **K6** (load/stress)          | Lighthouse CI        |

### 8.3 Regras de Teste

- **Unit (Domain)**: **Kotest puro** — `FunSpec` ou `BehaviorSpec`, sem framework. Testar regras de negócio do Aggregate.
- **Unit (Use Case)**: **Kotest** + MockK para ports. Validar orquestração.
- **Integration (Adapter)**: **JUnit5 runner** (`@QuarkusTest`) + **Kotest assertions** + Testcontainers (Postgres, Kafka, Valkey). Kotest runner não é compatível com `@QuarkusTest`, então usamos JUnit5 como runner mas Kotest `shouldBe`/`shouldContain` como assertions.
- **Integration (Conductor)**: Mock do Conductor server para validar worker I/O e idempotência.
- **Architecture (ArchUnit)**: Validar que slices não se acoplam e dependências apontam para dentro.
- **Contract (Pact)**: Consumer-driven contracts entre front e back.
- **E2E + Performance (K6)**: Fluxos HTTP completos (checkout saga) + load testing para endpoints de alta carga.
- **Frontend (Jest)**: Angular components com `jest-preset-angular`, mocks com `jest.fn()`, Signal Store testing.
- **Coverage mínimo**: 80% line coverage por slice (Kover backend, Jest --coverage frontend).

### 8.4 Exemplos Kotest — Backend

#### Unit Test: Domain (Kotest puro — BehaviorSpec)

```kotlin
// test/unit/catalog/domain/WineTest.kt
// REGRA: Testes de domain usam Kotest puro — ZERO imports de framework
class WineTest : BehaviorSpec({

    given("a wine with 10 units in stock") {
        val wine = WineFixture.create(stock = StockQuantity(10))

        `when`("reserving 3 units") {
            val (updated, event) = wine.reserve(3)

            then("stock should decrease to 7") {
                updated.stock.available shouldBe 7
            }
            then("should emit WineReserved event") {
                event.shouldBeInstanceOf<WineReserved>()
                event.quantity shouldBe 3
                event.sku shouldBe wine.sku
            }
        }

        `when`("reserving 15 units (more than available)") {
            then("should throw with descriptive message") {
                val exception = shouldThrow<IllegalArgumentException> {
                    wine.reserve(15)
                }
                exception.message shouldContain "Estoque insuficiente"
                exception.message shouldContain wine.sku.value
            }
        }
    }

    given("a wine with ACTIVE status") {
        val wine = WineFixture.create(status = WineStatus.ACTIVE)

        `when`("applying a 20% discount") {
            val discounted = wine.applyDiscount(BigDecimal("20.00"))

            then("price should be 80% of original") {
                discounted.price.amount shouldBe wine.price.amount * BigDecimal("0.80")
            }
        }

        `when`("applying a discount above 50%") {
            then("should reject the discount") {
                shouldThrow<IllegalArgumentException> {
                    wine.applyDiscount(BigDecimal("51.00"))
                }
            }
        }
    }
})
```

#### Unit Test: Use Case (Kotest + MockK)

```kotlin
// test/unit/catalog/application/RegisterWineTest.kt
class RegisterWineTest : FunSpec({

    val repository = mockk<WineRepository>()
    val eventPublisher = mockk<EventPublisher>()
    val registerWine = RegisterWine(repository, eventPublisher)

    beforeEach {
        clearAllMocks()
    }

    test("should register a wine and publish WineRegistered event") {
        // Arrange
        val command = RegisterWine.Command(
            name = "Malbec Reserva",
            region = "Mendoza",
            grapeVarieties = listOf("Malbec"),
            vintage = 2020,
            sku = "VNH-MAL-2020-001",
            initialStock = 100,
            price = BigDecimal("189.90")
        )
        val savedWine = command.toDomain()

        coEvery { repository.save(any()) } returns Uni.createFrom().item(savedWine)
        coEvery { eventPublisher.publish(any()) } returns Uni.createFrom().voidItem()

        // Act
        val result = registerWine.execute(command).await().atMost(Duration.ofSeconds(5))

        // Assert (Kotest assertions)
        result.shouldNotBeNull()
        result.sku.value shouldBe "VNH-MAL-2020-001"
        result.name shouldBe "Malbec Reserva"

        coVerify(exactly = 1) { repository.save(any()) }
        coVerify(exactly = 1) { eventPublisher.publish(match { it is WineRegistered }) }
    }

    test("should propagate repository failure without publishing event") {
        val command = RegisterWineFixture.validCommand()

        coEvery { repository.save(any()) } returns
            Uni.createFrom().failure(RuntimeException("DB error"))

        shouldThrow<RuntimeException> {
            registerWine.execute(command).await().atMost(Duration.ofSeconds(5))
        }

        coVerify(exactly = 0) { eventPublisher.publish(any()) }
    }
})
```

#### Integration Test: Adapter (JUnit5 runner + Kotest assertions)

```kotlin
// test/integration/catalog/adapters/WinePostgresRepositoryTest.kt
// REGRA: @QuarkusTest requer JUnit5 runner — usar Kotest assertions dentro
@QuarkusTest
@TestProfile(IntegrationTestProfile::class)
class WinePostgresRepositoryTest {

    @Inject
    lateinit var repository: WineRepository

    @Test
    fun `should save and retrieve wine by SKU`() {
        // Arrange
        val wine = WineFixture.create(sku = Sku("VNH-TEST-001"))

        // Act
        val saved = repository.save(wine).await().atMost(Duration.ofSeconds(5))
        val found = repository.findBySku(Sku("VNH-TEST-001")).await().atMost(Duration.ofSeconds(5))

        // Assert (Kotest assertions inside JUnit5 test)
        saved.shouldNotBeNull()
        found.shouldNotBeNull()
        found!!.sku shouldBe Sku("VNH-TEST-001")
        found.name shouldBe wine.name
        found.price.amount.shouldBeCloseTo(wine.price.amount, BigDecimal("0.01"))
    }

    @Test
    fun `should return null for non-existent SKU`() {
        val result = repository.findBySku(Sku("NON-EXISTENT"))
            .await().atMost(Duration.ofSeconds(5))

        result.shouldBeNull()
    }
}
```

#### Property-Based Test: Domain (Kotest Property Testing)

```kotlin
// test/unit/catalog/domain/MoneyPropertyTest.kt
// REGRA: Usar property testing para invariantes de domínio
class MoneyPropertyTest : FunSpec({

    test("discount should always result in lower or equal price") {
        checkAll(
            Arb.bigDecimal(min = BigDecimal("0.01"), max = BigDecimal("10000.00")),
            Arb.bigDecimal(min = BigDecimal.ZERO, max = BigDecimal("50.00"))
        ) { amount, discountPercentage ->
            val money = Money(amount, "BRL")
            val discounted = money.discountBy(discountPercentage)

            discounted.amount shouldBeLessThanOrEqual amount
            discounted.amount shouldBeGreaterThanOrEqual BigDecimal.ZERO
            discounted.currency shouldBe "BRL"
        }
    }
})
```

### 8.5 Exemplos Jest — Frontend

#### Configuração Jest (Angular)

```javascript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterSetup: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
  },
};

export default config;
```

#### Unit Test: Signal Store (Jest)

```typescript
// features/catalog/pages/wine-list/wine-list.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { WineListStore } from './wine-list.store';
import { CatalogApiService } from '../../services/catalog-api.service';
import { of, throwError } from 'rxjs';

describe('WineListStore', () => {
  let store: InstanceType<typeof WineListStore>;
  let catalogApi: jest.Mocked<CatalogApiService>;

  beforeEach(() => {
    catalogApi = {
      searchWines: jest.fn(),
      streamCatalogUpdates: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        WineListStore,
        { provide: CatalogApiService, useValue: catalogApi },
      ],
    });

    store = TestBed.inject(WineListStore);
  });

  it('should start with empty state', () => {
    expect(store.wines()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load wines and update state', () => {
    const mockResult = {
      items: [{ sku: 'VNH-001', name: 'Malbec', status: 'ACTIVE' }],
      pagination: { page: 0, size: 20, total: 1 },
    };
    catalogApi.searchWines.mockReturnValue(of(mockResult));

    store.loadWines({ page: 0, size: 20 });

    expect(store.wines()).toHaveLength(1);
    expect(store.wines()[0].sku).toBe('VNH-001');
    expect(store.loading()).toBe(false);
    expect(store.pagination().total).toBe(1);
  });

  it('should handle API errors gracefully', () => {
    catalogApi.searchWines.mockReturnValue(throwError(() => new Error('Network error')));

    store.loadWines({ page: 0, size: 20 });

    expect(store.wines()).toEqual([]);
    expect(store.error()).toBeTruthy();
    expect(store.loading()).toBe(false);
  });
});
```

#### Unit Test: Component (Jest)

```typescript
// shared/components/wine-card/wine-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WineCardComponent } from './wine-card.component';

describe('WineCardComponent', () => {
  let component: WineCardComponent;
  let fixture: ComponentFixture<WineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WineCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WineCardComponent);
    component = fixture.componentInstance;
  });

  it('should display wine name and price', () => {
    fixture.componentRef.setInput('wine', {
      name: 'Cabernet Sauvignon Reserva',
      price: { amount: 299.90, currency: 'BRL' },
      status: 'ACTIVE',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cabernet Sauvignon Reserva');
    expect(compiled.textContent).toContain('299,90');
  });

  it('should show out-of-stock badge when status is OUT_OF_STOCK', () => {
    fixture.componentRef.setInput('wine', {
      name: 'Merlot',
      price: { amount: 89.90, currency: 'BRL' },
      status: 'OUT_OF_STOCK',
    });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.stock-badge--out');
    expect(badge).toBeTruthy();
  });
});
```

### 8.6 ArchUnit (JUnit5 — sem alteração)

```kotlin
// test/architecture/HexagonalArchitectureTest.kt
@AnalyzeClasses(packages = ["com.vinheria.catalog"])
class HexagonalArchitectureTest {
    @ArchTest
    val domain_should_not_depend_on_adapters: ArchRule =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAPackage("..adapters..")

    @ArchTest
    val domain_should_not_depend_on_application: ArchRule =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAPackage("..application..")

    @ArchTest
    val slices_should_not_depend_on_each_other: ArchRule =
        slices().matching("com.vinheria.catalog.(*)..")
            .should().notDependOnEachOther()
}
```

---
