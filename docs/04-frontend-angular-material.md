# 4. Convenções de Código — Frontend (Angular + Angular Material)


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
│   │   ├── _variables.scss               # Design tokens DESIGN.md (--color-*, --space-*, --radius-*, --font-*)
│   │   ├── _material-theme.scss          # Tema Angular Material + overrides DESIGN.md
│   │   ├── _typography.scss              # Estilos de texto (Inter)
│   │   └── m3-theme.scss                 # Paleta M3 gerada (seed #0075de)
│   │
│   └── environments/
```

### 4.2 Angular Material Integration & Theme

O tema é dirigido pelo **DESIGN.md** (raiz do frontend) — fonte de verdade para cores, tipografia, espaçamento e raio. Os tokens são CSS custom properties definidos em `styles/_variables.scss`:

```scss
// styles/_variables.scss — DESIGN.md canonical tokens (Notion-inspired)
:root {
  // Colors
  --color-primary:         #0075de;
  --color-primary-active:  #005bab;
  --color-secondary:       #213183;
  --color-canvas:          #ffffff;
  --color-canvas-soft:     #f6f5f4;
  --color-surface:         #ffffff;
  --color-ink:             #000000;
  --color-ink-muted:       #615d59;
  --color-hairline:        #e6e6e6;

  // Typography — Inter
  --font-family: 'Inter', -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;

  // Spacing
  --space-xxs: 4px;  --space-xs: 8px;  --space-sm: 12px;
  --space-md: 16px;  --space-lg: 24px; --space-xxl: 32px;

  // Radius
  --radius-xs: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-full: 9999px;
}
```

Os overrides do Angular Material vivem em `styles/_material-theme.scss` — mapeiam os tokens `--mdc-*`/`--mat-*` da major 18 para os tokens do DESIGN.md:

```scss
// styles/_material-theme.scss — Angular Material M3, DESIGN.md como fonte de verdade
@use '@angular/material' as mat;
@use './m3-theme' as m3;

@include mat.core();

html {
  @include mat.all-component-themes(m3.$light-theme);
}

:root {
  // REGRA: overrides sempre referenciam tokens DESIGN.md — nunca hex hardcoded
  --mdc-filled-button-container-color: var(--color-primary);
  --mdc-filled-button-container-shape: var(--radius-full);
  --mdc-outlined-card-outline-color: var(--color-hairline);
  --mdc-outlined-card-container-shape: var(--radius-lg);
  --mdc-outlined-text-field-container-shape: var(--radius-xs);
  --mat-table-row-item-outline-color: var(--color-hairline);
  --mdc-dialog-container-shape: var(--radius-xl);
}
```

Ícones usam **Material Symbols Outlined** (Google Fonts, carregado no `index.html`), registrado como fontset default em `app.config.ts`. Uso: `<mat-icon fontIcon="add" />` — nunca ligatures inline nem PrimeIcons.

### 4.3 Componentes Angular Material Estratégicos

```typescript
// REGRA: Usar componentes Angular Material como building blocks — nunca reinventar
// Mapeamento de necessidades do projeto para componentes Material:

// Listagens (catálogo, clientes, pedidos, estoque)
// → mat-table + matSort (sorting client-side via signal de Sort)
// → colunas via matColumnDef; empty state custom dentro da tabela

// Busca e filtros
// → mat-form-field appearance="outline" + matInput para busca
// → mat-select com objetos FilterOption<T> ({ label, value }) para dropdowns
// → botão mat-stroked-button para limpar filtros

// Dialogs e confirmação
// → MatDialog (inject(MatDialog)) — abre TemplateRef ou component
// → shared/components/confirm-dialog (ConfirmDialogComponent + ConfirmDialogData)
//   para confirmações — substitui o antigo ConfirmationService

// Notificações
// → core/services/notification.service.ts (NotificationService) — wrapper de
//   MatSnackBar com API { severity, summary, detail } — substitui o MessageService

// Navegação e layout
// → mat-menu para menus de usuário, mat-divider, mat-select no topbar
//   (idioma/moeda), mat-icon-button para ações

// Botões
// → mat-flat-button (primário), mat-stroked-button (secundário),
//   mat-icon-button + matTooltip para ações de tabela
```

Exemplos reais no código: `features/customers/pages/customer-list/customer-list.component.ts` (mat-table + filtros + MatDialog) e `shared/components/layout/topbar/topbar.component.ts` (mat-select + mat-menu).

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

  <mat-form-field appearance="outline">
    <mat-icon matPrefix fontIcon="search" />
    <input matInput [placeholder]="t('catalog.searchPlaceholder')" />
  </mat-form-field>

  <!-- Filtros -->
  <mat-form-field appearance="outline">
    <mat-label>{{ t('catalog.filters.region') }}</mat-label>
    <mat-select>
      <mat-option *ngFor="let r of regions" [value]="r">{{ r }}</mat-option>
    </mat-select>
  </mat-form-field>

  <!-- Resultados -->
  <p>{{ t('catalog.results', { count: totalWines() }) }}</p>

  <!-- Wine Card -->
  @for (wine of wines(); track wine.sku) {
    <mat-card appearance="outlined" class="card-outlined">
      <mat-card-content>
        <h3>{{ wine.name }}</h3>
        <p>{{ t('catalog.wine.vintage', { year: wine.vintage }) }}</p>
        <p>{{ t('catalog.wine.region', { region: wine.region }) }}</p>

        <!-- Preço com formatação de moeda local -->
        <span class="price">
          {{ wine.price.amount | translocoCurrency: wine.price.currency }}
        </span>
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button [disabled]="wine.stock === 0">
          {{ t('common.addToCart') }}
        </button>
      </mat-card-actions>
    </mat-card>
  }
</ng-container>
```

#### Language Switcher Component

```typescript
// shared/components/language-switcher/language-switcher.component.ts
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatSelectModule, FormsModule],
  template: `
    <mat-select
      [ngModel]="currentLang()"
      (ngModelChange)="switchLang($event)"
    >
      @for (lang of languages; track lang.id) {
        <mat-option [value]="lang.id">{{ lang.flag }} {{ lang.label }}</mat-option>
      }
    </mat-select>
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
  imports: [MatSelectModule, FormsModule],
  template: `
    <mat-select
      [ngModel]="currencyService.selectedCurrency()"
      (ngModelChange)="currencyService.setCurrency($event)"
    >
      @for (opt of options; track opt.value) {
        <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
      }
    </mat-select>
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
