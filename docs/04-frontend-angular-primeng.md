# 4. Convenções de Código — Frontend (Angular + PrimeNG)


### 4.1 Estrutura do Projeto Angular

```
vinheria-web/
├── angular.json
├── package.json
├── src/
│   ├── app/
│   │   ├── core/                         # Singleton services, guards, interceptors
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── api/
│   │   │   │   ├── api-client.service.ts  # HttpClient reativo base
│   │   │   │   └── sse-client.service.ts  # EventSource wrapper reativo
│   │   │   └── state/
│   │   │       └── global-state.service.ts
│   │   │
│   │   ├── shared/                       # Componentes, pipes, directives reutilizáveis
│   │   │   ├── components/
│   │   │   │   ├── wine-card/
│   │   │   │   ├── price-tag/
│   │   │   │   └── stock-badge/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   │
│   │   ├── features/                     # Feature modules (Vertical Slices)
│   │   │   ├── catalog/
│   │   │   │   ├── catalog.routes.ts
│   │   │   │   ├── pages/
│   │   │   │   │   ├── wine-list/
│   │   │   │   │   │   ├── wine-list.component.ts
│   │   │   │   │   │   ├── wine-list.component.html
│   │   │   │   │   │   └── wine-list.store.ts     # Signal Store (NgRx Signals)
│   │   │   │   │   └── wine-detail/
│   │   │   │   ├── components/           # Componentes exclusivos do slice
│   │   │   │   ├── services/
│   │   │   │   │   └── catalog-api.service.ts
│   │   │   │   └── models/
│   │   │   │       └── wine.model.ts
│   │   │   │
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   └── dashboard/
│   │   │
│   │   └── app.routes.ts                # Lazy-loaded feature routes
│   │
│   ├── styles/
│   │   ├── _primeng-theme.scss           # Tema customizado Vinheria
│   │   ├── _variables.scss               # Design tokens customizados
│   │   └── global.scss
│   │
│   └── environments/
```

### 4.2 PrimeNG Integration & Theme

```typescript
// angular.json — styles configuration
"styles": [
  "node_modules/primeng/resources/themes/lara-dark-purple/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css",
  "src/styles/global.scss"
]
```

```scss
// styles/_primeng-theme.scss — Tema Vinheria (custom design tokens)
// REGRA: Customizar via CSS variables do PrimeNG, nunca override bruto
:root {
  // Core palette — Vinho
  --p-primary-color: #722F37;              /* Bordeaux */
  --p-primary-color-text: #FFFFFF;
  --p-primary-50: #FDF2F3;
  --p-primary-100: #F9D5D8;
  --p-primary-200: #F0A8AE;
  --p-primary-300: #E27A84;
  --p-primary-400: #C74D5A;
  --p-primary-500: #722F37;
  --p-primary-600: #5E2630;
  --p-primary-700: #4A1D28;
  --p-primary-800: #361420;
  --p-primary-900: #220B18;

  // Surface — Dark mode elegante
  --p-surface-0: #FFFFFF;
  --p-surface-50: #F8F7F6;
  --p-surface-900: #1A1A2E;
  --p-surface-ground: #F5F3F0;            /* Parchment-like background */

  // Typography
  --p-font-family: 'Source Sans 3', sans-serif;
  --vinheria-font-display: 'Playfair Display', serif;

  // Semantic
  --p-highlight-background: rgba(114, 47, 55, 0.1);
  --p-highlight-text-color: #722F37;
}
```

### 4.3 Componentes PrimeNG Estratégicos

```typescript
// REGRA: Usar componentes PrimeNG como building blocks — nunca reinventar
// Mapeamento de necessidades do projeto para componentes PrimeNG:

// Catálogo de vinhos (5K+ SKUs)
// → p-table (DataTable) com virtualScroll, lazy loading, filtros server-side
// → p-dataView para grid/list toggle
// → p-paginator para navegação

// Busca e filtros
// → p-multiSelect para uvas/regiões
// → p-slider para faixa de preço
// → p-autoComplete para busca por nome

// Carrinho e checkout
// → p-stepper para fluxo multi-step
// → p-card para itens do carrinho
// → p-messages para feedback de validação

// Dashboard admin
// → p-chart (Chart.js wrapper) para métricas de vendas
// → p-table com edição inline para gestão de estoque
// → p-toast para notificações em tempo real (SSE)
```

### 4.4 Comunicação Reativa (Frontend ↔ Backend)

```typescript
// core/api/sse-client.service.ts
// SSE para streaming de atualizações em tempo real
@Injectable({ providedIn: 'root' })
export class SseClientService {
  connect<T>(url: string): Observable<T> {
    return new Observable<T>(observer => {
      const eventSource = new EventSource(url);
      eventSource.onmessage = (event) => {
        observer.next(JSON.parse(event.data) as T);
      };
      eventSource.onerror = (error) => {
        observer.error(error);
        eventSource.close();
      };
      return () => eventSource.close();
    }).pipe(
      retry({ count: 3, delay: 2000 }),
      share()  // Multicast para múltiplos subscribers
    );
  }
}

// features/catalog/services/catalog-api.service.ts
@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly sse = inject(SseClientService);
  private readonly baseUrl = inject(API_BASE_URL);

  // REST Reativo — chamadas pontuais
  searchWines(criteria: WineSearchCriteria): Observable<PaginatedResult<Wine>> {
    return this.http.get<PaginatedResult<Wine>>(`${this.baseUrl}/api/v1/wines`, {
      params: toHttpParams(criteria)
    });
  }

  // SSE — streaming contínuo de atualizações
  streamCatalogUpdates(): Observable<WineUpdateEvent> {
    return this.sse.connect<WineUpdateEvent>(`${this.baseUrl}/api/v1/wines/stream`);
  }
}
```

### 4.5 State Management com Signals

```typescript
// features/catalog/pages/wine-list/wine-list.store.ts
// REGRA: Cada page tem seu próprio Signal Store
export const WineListStore = signalStore(
  { providedIn: 'root' },
  withState<WineListState>({
    wines: [],
    loading: false,
    filters: defaultFilters(),
    pagination: { page: 0, size: 20, total: 0 },
    error: null
  }),
  withComputed((store) => ({
    activeWines: computed(() => store.wines().filter(w => w.status === 'ACTIVE')),
    hasMore: computed(() => store.pagination().page * store.pagination().size < store.pagination().total),
  })),
  withMethods((store, catalogApi = inject(CatalogApiService)) => ({
    loadWines: rxMethod<WineSearchCriteria>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(criteria => catalogApi.searchWines(criteria).pipe(
          tapResponse({
            next: (result) => patchState(store, {
              wines: result.items,
              pagination: result.pagination,
              loading: false
            }),
            error: (err) => patchState(store, { error: err, loading: false })
          })
        ))
      )
    )
  }))
);
```

### 4.6 Naming Conventions (Frontend)

| Elemento             | Padrão                          | Exemplo                        |
|----------------------|--------------------------------|-------------------------------|
| Feature module       | kebab-case, singular            | `catalog/`, `order/`          |
| Component            | kebab-case + `.component.ts`    | `wine-card.component.ts`      |
| Service              | kebab-case + `.service.ts`      | `catalog-api.service.ts`      |
| Signal Store         | kebab-case + `.store.ts`        | `wine-list.store.ts`          |
| Model/Interface      | kebab-case + `.model.ts`        | `wine.model.ts`               |
| Route file           | `{feature}.routes.ts`           | `catalog.routes.ts`           |
| CSS class (custom)   | `vinheria-{component}__element` | `vinheria-wine-card__price`   |

### 4.7 Internacionalização (i18n) — Transloco

> A aplicação suporta **3 idiomas** (pt-BR, es-PY, en-US) e **3 moedas** (BRL, PYG, USD) com troca em runtime sem reload.

#### Biblioteca: `@jsverse/transloco`

Transloco é a biblioteca recomendada para Angular i18n com runtime switching. DX superior, lazy loading de traduções por feature, e plugin de locale para formatação de datas/números/moedas.

```bash
# Instalação
ng add @jsverse/transloco
npm install @jsverse/transloco-locale         # Pipes de data/número/moeda
npm install @jsverse/transloco-persist-lang    # Persistir idioma em localStorage
npm install @jsverse/transloco-preload-lang    # Pré-carregar traduções
```

#### Configuração — `app.config.ts`

```typescript
// app.config.ts
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';
import { provideTranslocoPreloadLangs } from '@jsverse/transloco-preload-lang';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... outros providers

    provideTransloco({
      config: {
        availableLangs: [
          { id: 'pt-BR', label: 'Português (Brasil)' },
          { id: 'es-PY', label: 'Español (Paraguay)' },
          { id: 'en-US', label: 'English (USA)' },
        ],
        defaultLang: 'pt-BR',
        fallbackLang: 'en-US',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: true,       // Log keys faltantes em dev
          useFallbackTranslation: true,
        },
      },
      loader: TranslocoHttpLoader,
    }),

    // Locale: formatação de data, número e moeda por idioma
    provideTranslocoLocale({
      langToLocaleMapping: {
        'pt-BR': 'pt-BR',
        'es-PY': 'es-PY',
        'en-US': 'en-US',
      },
    }),

    // Persistir idioma escolhido no localStorage
    provideTranslocoPersistLang({
      storage: { useValue: localStorage },
      storageKey: 'vinheria-lang',
    }),

    // Pré-carregar todos os idiomas no background
    provideTranslocoPreloadLangs(['pt-BR', 'es-PY', 'en-US']),
  ],
};
```

#### Estrutura de Arquivos de Tradução

```
src/assets/i18n/
├── pt-BR.json                   # Traduções globais pt-BR
├── es-PY.json                   # Traduções globais es-PY
├── en-US.json                   # Traduções globais en-US
├── catalog/
│   ├── pt-BR.json               # Traduções do slice catalog
│   ├── es-PY.json
│   └── en-US.json
├── order/
│   ├── pt-BR.json
│   ├── es-PY.json
│   └── en-US.json
└── shared/
    ├── pt-BR.json
    ├── es-PY.json
    └── en-US.json
```

#### Exemplo — Arquivo de Tradução Global

```json
// assets/i18n/pt-BR.json
{
  "common": {
    "appName": "Vinheria Digital",
    "search": "Buscar",
    "cart": "Carrinho",
    "checkout": "Finalizar Compra",
    "loading": "Carregando...",
    "error": "Ocorreu um erro",
    "retry": "Tentar novamente",
    "outOfStock": "Esgotado",
    "addToCart": "Adicionar ao carrinho",
    "currency": "Moeda",
    "language": "Idioma"
  },
  "nav": {
    "catalog": "Catálogo",
    "orders": "Meus Pedidos",
    "dashboard": "Painel",
    "account": "Minha Conta"
  },
  "auth": {
    "login": "Entrar",
    "register": "Cadastrar",
    "logout": "Sair"
  },
  "footer": {
    "rights": "Todos os direitos reservados"
  }
}
```

```json
// assets/i18n/es-PY.json
{
  "common": {
    "appName": "Vinheria Digital",
    "search": "Buscar",
    "cart": "Carrito",
    "checkout": "Finalizar Compra",
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "retry": "Reintentar",
    "outOfStock": "Agotado",
    "addToCart": "Agregar al carrito",
    "currency": "Moneda",
    "language": "Idioma"
  },
  "nav": {
    "catalog": "Catálogo",
    "orders": "Mis Pedidos",
    "dashboard": "Panel",
    "account": "Mi Cuenta"
  }
}
```

```json
// assets/i18n/en-US.json
{
  "common": {
    "appName": "Vinheria Digital",
    "search": "Search",
    "cart": "Cart",
    "checkout": "Checkout",
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Try again",
    "outOfStock": "Out of Stock",
    "addToCart": "Add to Cart",
    "currency": "Currency",
    "language": "Language"
  },
  "nav": {
    "catalog": "Catalog",
    "orders": "My Orders",
    "dashboard": "Dashboard",
    "account": "My Account"
  }
}
```

#### Exemplo — Tradução por Feature Slice (Catalog)

```json
// assets/i18n/catalog/pt-BR.json
{
  "catalog": {
    "title": "Nossos Vinhos",
    "searchPlaceholder": "Buscar por nome, região ou uva...",
    "filters": {
      "region": "Região",
      "grape": "Uva",
      "vintage": "Safra",
      "priceRange": "Faixa de Preço",
      "clearAll": "Limpar Filtros"
    },
    "wine": {
      "vintage": "Safra {{year}}",
      "region": "Região: {{region}}",
      "stock": "{{count}} unidades disponíveis",
      "noStock": "Sem estoque",
      "sku": "SKU: {{sku}}"
    },
    "sort": {
      "relevance": "Relevância",
      "priceAsc": "Menor Preço",
      "priceDesc": "Maior Preço",
      "newest": "Mais Recentes"
    },
    "results": "{{count}} vinhos encontrados"
  }
}
```

#### Uso em Templates — Structural Directive (recomendado)

```html
<!-- wine-list.component.html -->
<!-- REGRA: Usar *transloco directive (DRY, memoized, 1 subscription) -->
<ng-container *transloco="let t; scope: 'catalog'">
  <h1>{{ t('catalog.title') }}</h1>

  <input
    pInputText
    [placeholder]="t('catalog.searchPlaceholder')"
    (input)="onSearch($event)"
  />

  <!-- Filtros -->
  <p-multiSelect
    [options]="regions"
    [placeholder]="t('catalog.filters.region')"
  />

  <!-- Resultados -->
  <p>{{ t('catalog.results', { count: totalWines() }) }}</p>

  <!-- Wine Card -->
  <p-card *ngFor="let wine of wines()">
    <h3>{{ wine.name }}</h3>
    <p>{{ t('catalog.wine.vintage', { year: wine.vintage }) }}</p>
    <p>{{ t('catalog.wine.region', { region: wine.region }) }}</p>

    <!-- Preço com formatação de moeda local -->
    <span class="price">
      {{ wine.price.amount | translocoCurrency: wine.price.currency }}
    </span>

    <p-button
      [label]="t('common.addToCart')"
      [disabled]="wine.stock === 0"
    />
  </p-card>
</ng-container>
```

#### Language Switcher Component

```typescript
// shared/components/language-switcher/language-switcher.component.ts
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslocoModule, DropdownModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dropdown
      [options]="languages"
      [ngModel]="currentLang()"
      (ngModelChange)="switchLang($event)"
      optionLabel="label"
      optionValue="id"
      [style]="{ width: '180px' }"
    >
      <ng-template let-item pTemplate="selectedItem">
        <span>{{ item.flag }} {{ item.label }}</span>
      </ng-template>
      <ng-template let-item pTemplate="item">
        <span>{{ item.flag }} {{ item.label }}</span>
      </ng-template>
    </p-dropdown>
  `,
})
export class LanguageSwitcherComponent {
  private translocoService = inject(TranslocoService);

  currentLang = toSignal(this.translocoService.langChanges$);

  languages = [
    { id: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
    { id: 'es-PY', label: 'Español (PY)', flag: '🇵🇾' },
    { id: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  ];

  switchLang(lang: string): void {
    this.translocoService.setActiveLang(lang);
  }
}
```

### 4.8 Multi-Currency — Real, Guaraní e Dólar

#### Modelo de Moeda — Domain (Backend)

```kotlin
// _shared/domain/Money.kt
// REGRA: Money é Value Object do domain — suporta 3 moedas
data class Money(
    val amount: BigDecimal,
    val currency: Currency
) {
    init {
        require(amount >= BigDecimal.ZERO) { "Amount cannot be negative" }
        require(currency in SUPPORTED_CURRENCIES) { "Currency ${currency.code} not supported" }
    }

    fun convertTo(target: Currency, rate: ExchangeRate): Money {
        if (currency == target) return this
        return Money(
            amount = (amount * rate.rate).setScale(target.decimals, RoundingMode.HALF_UP),
            currency = target
        )
    }

    fun discountBy(percentage: BigDecimal): Money =
        copy(amount = amount * (BigDecimal.ONE - percentage / BigDecimal("100")))

    /** Converte para moeda contábil (BRL) usando taxa fornecida */
    fun toAccountingCurrency(rate: ExchangeRate): Money =
        convertTo(Currency.ACCOUNTING, rate)

    companion object {
        val SUPPORTED_CURRENCIES = setOf(
            Currency.BRL,
            Currency.PYG,
            Currency.USD
        )
    }
}

enum class Currency(val code: String, val symbol: String, val decimals: Int) {
    BRL("BRL", "R$", 2),    // Real Brasileiro — MOEDA CONTÁBIL (functional currency)
    PYG("PYG", "₲", 0),     // Guaraní Paraguaio (sem decimais)
    USD("USD", "US$", 2);   // Dólar Americano

    companion object {
        /** BRL é a moeda contábil — todas as transações são registradas em BRL para fins fiscais */
        val ACCOUNTING = BRL

        fun fromCode(code: String): Currency =
            entries.find { it.code == code }
                ?: throw IllegalArgumentException("Unsupported currency: $code")
    }
}

data class ExchangeRate(
    val from: Currency,
    val to: Currency,
    val rate: BigDecimal,
    val updatedAt: Instant
)
```

### 4.9 Moeda Contábil (Functional Currency) — BRL

> **BRL (Real Brasileiro) é a moeda contábil da Vinheria Digital.** Toda transação, independente da moeda de origem, é registrada também em BRL com a taxa do momento da transação. Isso garante compliance fiscal com a Receita Federal, geração de NF-e em BRL, e consolidação contábil unificada.

#### ADR — Moeda Contábil

| Decisão | Justificativa |
|---------|---------------|
| **BRL como moeda contábil** | Empresa domiciliada no Brasil. Receita Federal exige escrituração em BRL (IN RFB 1.585/2015) |
| **Dual-amount recording** | Toda transação grava `transaction_amount` (moeda original) + `accounting_amount` (BRL) + `exchange_rate` do momento |
| **Taxa no momento da transação** | A taxa de câmbio é congelada no instante da transação (spot rate). Não sofre reavaliação posterior exceto em fechamento contábil |
| **Ganhos/perdas cambiais** | Diferenças de câmbio entre data da venda e data do recebimento são registradas como receita/despesa financeira |
| **NF-e sempre em BRL** | Nota Fiscal Eletrônica emitida exclusivamente em BRL, independente da moeda do cliente |

#### Domain — TransactionRecord (registro contábil dual-currency)

```kotlin
// _shared/domain/TransactionRecord.kt
// REGRA: TODO registro financeiro carrega a moeda original E o equivalente contábil (BRL)
data class TransactionRecord(
    val id: TransactionId,
    val type: TransactionType,
    val referenceId: String,                 // orderId, paymentId, etc.
    val transactionAmount: Money,            // Valor na moeda da transação (BRL, PYG ou USD)
    val accountingAmount: Money,             // Valor SEMPRE em BRL (moeda contábil)
    val exchangeRateUsed: ExchangeRate?,     // Taxa aplicada (null se já for BRL)
    val occurredAt: Instant,
    val fiscalPeriod: YearMonth              // Competência fiscal (mês/ano)
) {
    init {
        require(accountingAmount.currency == Currency.ACCOUNTING) {
            "Accounting amount must be in ${Currency.ACCOUNTING.code}"
        }
    }
}

enum class TransactionType {
    SALE,                // Venda de vinho
    REFUND,              // Devolução/estorno
    EXCHANGE_GAIN,       // Ganho cambial (diferença positiva entre venda e recebimento)
    EXCHANGE_LOSS,       // Perda cambial (diferença negativa)
    TAX_WITHHOLDING      // Retenção de imposto
}
```

#### Use Case — Criar registro contábil na venda

```kotlin
// order/application/RecordSaleTransaction.kt
@ApplicationScoped
class RecordSaleTransaction(
    private val transactionRepository: TransactionRepository,
    private val exchangeRateProvider: ExchangeRateProvider,
    private val event: Event<ExportedEvent<*, *>>
) {
    fun execute(order: Order): Uni<TransactionRecord> {
        val saleAmount = order.totalPrice  // Moeda escolhida pelo cliente (BRL, PYG ou USD)

        return resolveAccountingAmount(saleAmount)
            .flatMap { (accountingAmount, rate) ->
                val record = TransactionRecord(
                    id = TransactionId.generate(),
                    type = TransactionType.SALE,
                    referenceId = order.id.value.toString(),
                    transactionAmount = saleAmount,
                    accountingAmount = accountingAmount,
                    exchangeRateUsed = rate,
                    occurredAt = Instant.now(),
                    fiscalPeriod = YearMonth.now()
                )
                transactionRepository.save(record)
                    .invoke { saved ->
                        event.fire(SaleTransactionRecordedEvent(saved))
                    }
            }
    }

    private fun resolveAccountingAmount(amount: Money): Uni<Pair<Money, ExchangeRate?>> {
        if (amount.currency == Currency.ACCOUNTING) {
            // Já é BRL — não precisa converter
            return Uni.createFrom().item(amount to null)
        }
        return exchangeRateProvider.getRate(amount.currency, Currency.ACCOUNTING)
            .map { rate ->
                amount.toAccountingCurrency(rate) to rate
            }
    }
}
```

#### Schema — Tabela de transações contábeis

```sql
-- db/migration/V010__create_transaction_records.sql
CREATE TABLE transaction_records (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                  VARCHAR(50)  NOT NULL,   -- SALE, REFUND, EXCHANGE_GAIN, etc.
    reference_id          VARCHAR(255) NOT NULL,   -- orderId, paymentId

    -- Moeda da transação (original do cliente)
    transaction_amount    DECIMAL(18,4) NOT NULL,
    transaction_currency  VARCHAR(3)    NOT NULL,  -- BRL, PYG, USD

    -- Moeda contábil (SEMPRE BRL)
    accounting_amount     DECIMAL(18,2) NOT NULL,
    accounting_currency   VARCHAR(3)    NOT NULL DEFAULT 'BRL',

    -- Taxa de câmbio no momento da transação
    exchange_rate         DECIMAL(18,8),            -- null quando transaction = BRL
    exchange_rate_date    TIMESTAMP,

    occurred_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    fiscal_period         VARCHAR(7) NOT NULL,      -- "2026-03"

    CONSTRAINT chk_accounting_currency CHECK (accounting_currency = 'BRL')
);

CREATE INDEX idx_transaction_records_fiscal ON transaction_records(fiscal_period);
CREATE INDEX idx_transaction_records_ref    ON transaction_records(reference_id);
CREATE INDEX idx_transaction_records_type   ON transaction_records(type, fiscal_period);
```

#### API — Relatório fiscal por período

```kotlin
// order/adapters/inbound/FiscalReportResource.kt
@Path("/api/v1/fiscal")
@ApplicationScoped
class FiscalReportResource(
    private val generateFiscalReport: GenerateFiscalReport
) {
    @GET
    @Path("/report/{period}")  // Ex: /api/v1/fiscal/report/2026-03
    fun getReport(@PathParam("period") period: String): Uni<FiscalReportResponse> =
        generateFiscalReport.execute(YearMonth.parse(period))
}

// Resposta — sempre em BRL (moeda contábil)
data class FiscalReportResponse(
    val period: String,                         // "2026-03"
    val accountingCurrency: String,             // "BRL" (sempre)
    val totalSales: BigDecimal,                 // Total de vendas em BRL
    val totalRefunds: BigDecimal,               // Total de devoluções em BRL
    val netRevenue: BigDecimal,                 // Receita líquida em BRL
    val exchangeGains: BigDecimal,              // Ganhos cambiais realizados
    val exchangeLosses: BigDecimal,             // Perdas cambiais realizadas
    val netExchangeResult: BigDecimal,          // Resultado cambial líquido
    val transactionsByOriginalCurrency: Map<String, CurrencyBreakdown>,
    val totalTransactions: Int
)

data class CurrencyBreakdown(
    val currency: String,                       // "PYG"
    val totalOriginalAmount: BigDecimal,        // ₲ 28.340.200
    val totalAccountingAmount: BigDecimal,      // R$ 18.990,00
    val transactionCount: Int,
    val averageExchangeRate: BigDecimal
)
```

#### Fluxo Contábil — Diagrama

```
┌──────────────────────────────────────────────────────────────────┐
│            Fluxo de Registro Contábil                             │
│                                                                   │
│  Cliente (PY)                                                     │
│  compra vinho                                                     │
│  por ₲ 283.402                                                    │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────────────────────────────────┐                     │
│  │ Order Service                            │                     │
│  │  transaction_amount: ₲ 283.402 (PYG)    │                     │
│  │                                          │                     │
│  │  ExchangeRateProvider.getRate(PYG→BRL)   │                     │
│  │  rate: 0.000670 (spot do momento)        │                     │
│  │                                          │                     │
│  │  accounting_amount: R$ 189,88 (BRL) ✓    │                     │
│  │  exchange_rate: 0.000670                 │                     │
│  │  fiscal_period: 2026-03                  │                     │
│  └─────────────┬───────────────────────────┘                     │
│                │                                                  │
│        ┌───────┴──────┐                                          │
│        ▼              ▼                                          │
│  ┌──────────┐   ┌──────────────┐                                 │
│  │ NF-e     │   │ Ledger       │                                 │
│  │ R$189,88 │   │ transaction_ │                                 │
│  │ (sempre  │   │ records      │                                 │
│  │  BRL)    │   │ (dual amount)│                                 │
│  └──────────┘   └──────┬───────┘                                 │
│                        │                                          │
│                        ▼                                          │
│                 ┌──────────────┐                                  │
│                 │ Fiscal Report│                                  │
│                 │ Março 2026   │                                  │
│                 │ Vendas: R$.. │                                  │
│                 │ Δ Câmbio:R$..│                                  │
│                 └──────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Regras Contábeis para Agentes

1. **SEMPRE** registrar `accounting_amount` em BRL em toda transação financeira — sem exceção
2. **SEMPRE** congelar `exchange_rate` no momento exato da transação (spot rate)
3. **NUNCA** reavalilar transações passadas — exchange rate é imutável após registro
4. **SEMPRE** gerar `EXCHANGE_GAIN` ou `EXCHANGE_LOSS` quando houver diferença entre taxa da venda e taxa do recebimento
5. **SEMPRE** emitir NF-e com valor em BRL, independente da moeda do cliente
6. **SEMPRE** indexar por `fiscal_period` (YearMonth) para relatórios fiscais rápidos
7. **SEMPRE** manter `constraint CHECK (accounting_currency = 'BRL')` no banco — defesa em profundidade
8. **NUNCA** armazenar valores contábeis em moeda diferente de BRL

#### Pricing Service — Conversão de Moedas

```kotlin
// pricing/domain/ExchangeRateProvider.kt (Port)
interface ExchangeRateProvider {
    fun getRate(from: Currency, to: Currency): Uni<ExchangeRate>
    fun getAllRates(base: Currency): Uni<List<ExchangeRate>>
}

// pricing/application/ConvertPrice.kt (Use Case)
@ApplicationScoped
class ConvertPrice(
    private val exchangeRateProvider: ExchangeRateProvider
) {
    fun execute(money: Money, targetCurrency: Currency): Uni<Money> {
        if (money.currency == targetCurrency) return Uni.createFrom().item(money)
        return exchangeRateProvider.getRate(money.currency, targetCurrency)
            .map { rate -> money.convertTo(targetCurrency, rate) }
    }
}
```

#### API Response — Multi-Currency

```kotlin
// Toda resposta de preço inclui as 3 moedas pré-calculadas
// O cache Valkey armazena os preços já convertidos (invalidado quando taxa atualiza)
data class WinePriceResponse(
    val sku: String,
    val prices: Map<String, MoneyResponse>
    // Exemplo: { "BRL": { amount: 189.90, formatted: "R$ 189,90" },
    //            "PYG": { amount: 283402, formatted: "₲ 283.402" },
    //            "USD": { amount: 35.50, formatted: "US$ 35.50" } }
)

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String,
    val formatted: String
)
```

#### Frontend — Currency Service + Pipe

```typescript
// core/currency/currency.service.ts
export type SupportedCurrency = 'BRL' | 'PYG' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', decimals: 2 },
  PYG: { code: 'PYG', symbol: '₲',  locale: 'es-PY', decimals: 0 },
  USD: { code: 'USD', symbol: 'US$', locale: 'en-US', decimals: 2 },
};

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly storageKey = 'vinheria-currency';

  // Signal reativo — componentes reagem automaticamente
  selectedCurrency = signal<SupportedCurrency>(
    (localStorage.getItem(this.storageKey) as SupportedCurrency) || 'BRL'
  );

  setCurrency(currency: SupportedCurrency): void {
    this.selectedCurrency.set(currency);
    localStorage.setItem(this.storageKey, currency);
  }

  formatPrice(amount: number, currency?: SupportedCurrency): string {
    const curr = currency || this.selectedCurrency();
    const config = CURRENCIES[curr];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount);
  }
}
```

```typescript
// shared/pipes/wine-price.pipe.ts
// REGRA: Pipe que pega o preço correto do mapa de preços multi-currency
@Pipe({ name: 'winePrice', standalone: true, pure: false })
export class WinePricePipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  transform(prices: Record<string, { amount: number }>): string {
    const currency = this.currencyService.selectedCurrency();
    const price = prices[currency];
    if (!price) return '—';
    return this.currencyService.formatPrice(price.amount, currency);
  }
}
```

#### Currency Switcher Component

```typescript
// shared/components/currency-switcher/currency-switcher.component.ts
@Component({
  selector: 'app-currency-switcher',
  standalone: true,
  imports: [SelectButtonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-selectButton
      [options]="options"
      [ngModel]="currencyService.selectedCurrency()"
      (ngModelChange)="currencyService.setCurrency($event)"
      optionLabel="label"
      optionValue="value"
    />
  `,
})
export class CurrencySwitcherComponent {
  currencyService = inject(CurrencyService);

  options = [
    { label: 'R$', value: 'BRL' },
    { label: '₲', value: 'PYG' },
    { label: 'US$', value: 'USD' },
  ];
}
```

#### Mapeamento Idioma ↔ Moeda (Default)

| Idioma     | Locale  | Moeda Default | Formato Exemplo     |
|------------|---------|---------------|---------------------|
| Português  | pt-BR   | BRL           | R$ 189,90           |
| Español    | es-PY   | PYG           | ₲ 283.402           |
| English    | en-US   | USD           | US$ 35.50           |

Nota: O idioma e a moeda são **independentes**. Um usuário pode usar a interface em Português mas ver preços em USD. A troca de idioma sugere a moeda default, mas o usuário pode sobrescrever.

---
