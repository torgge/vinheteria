# Migração PrimeNG → Angular Material 18 (M3) — Plano de Implementação

> **Execução:** delegações via `oc-delegate.sh` (cmux/OpenCode) — `deepseek/deepseek-v4-pro` implementa; **review gate por fase:** após cada commit de delegate, `nvidia/z-ai/glm-5.2` revisa o diff (read-only) — tokens DESIGN.md, APIs públicas, primeng residual, `::ng-deep` — e o coordenador arbitra antes da fase seguinte. Uma delegação por fase/fatia, prompt self-contained (delegates não acumulam contexto). Coordenador (Claude) executa a Fase 0 no checkout principal (worktrees não enxergam mudanças não-commitadas), integra e verifica cada retorno contra este plano. Steps usam checkbox (`- [ ]`).

**Goal:** Remover 100% das referências a PrimeNG/PrimeIcons do frontend e adotar Angular Material 18 (Material 3) como biblioteca de componentes, tematizada pelos tokens canônicos do `DESIGN.md` (Notion-inspired).

**Architecture:** Angular 18 standalone components + Signals (inalterado). Angular Material substitui PrimeNG componente a componente; o tema M3 é gerado pelo schematic `m3-theme` (seed `#0075de`) e ajustado por overrides de design tokens (`--mdc-*` / `--mat-*` / `--sys-*`) que consomem os CSS custom properties `--color-*` já definidos em `frontend/src/styles/_variables.scss`. Serviços PrimeNG (MessageService, ConfirmationService) viram wrappers próprios sobre MatSnackBar/MatDialog para minimizar churn nos call sites.

**Tech Stack:** Angular 18.2, @angular/material 18, @angular/cdk 18, chart.js 4 (direto, sem wrapper de lib), Material Symbols Outlined (ícones), Transloco (inalterado).

## Global Constraints

- Angular fica em 18.2 — **não** fazer `ng update` para 19/20 neste trabalho.
- `@angular/material` e `@angular/cdk` na major 18 (compatível com Angular 18).
- Tokens do `DESIGN.md` são autoritativos: nenhum hex/spacing/radius hardcoded que contradiga `--color-*`/`--space-*`/`--radius-*` de `_variables.scss`.
- Todo texto visível ao usuário via `*transloco` (chaves existentes; não criar chaves novas sem necessidade).
- Standalone components only; Signals para estado (padrão existente).
- Conventional Commits com escopo `frontend` (padrão do repo: `refactor(frontend): ...`).
- App **compila em todo commit** (`npm run build` verde) — PrimeNG e Material coexistem até a Fase 5.
- Não criar suite de testes nova (frontend tem 0 specs hoje); verificação = build + smoke visual + grep gates.
- Surgical changes: não "melhorar" código adjacente fora do escopo da migração.

## Verificação por fase (repetir ao fim de CADA tarefa)

```bash
cd frontend
npm run build          # deve terminar verde
```

Gate final (Fase 5): `grep -ri "primeng\|primeicons\|pi pi-\|PrimeNG" frontend/src frontend/package.json` retorna vazio.

---

## Inventário (baseline auditada em 2026-07-12)

- 37 arquivos referenciam PrimeNG; 26 módulos distintos; 3 serviços (`MessageService` em 6 arquivos, `ConfirmationService` em 1, `PrimeNGConfig` em `app.config.ts`).
- ~151 usos de ícones `pi pi-*` (~49 classes distintas).
- Styles: `styles.scss` importa `primeng.min.css`, `primeicons.css`, `styles/primeng-theme`; `_primeng-theme.scss` (967 linhas) será **deletado**; `_variables.scss` tem blocos de alias `--p-*` (linhas ~120–156) e `--m3-*` (~158–213) que serão removidos ao final.
- Arquivos SEM PrimeNG (não tocar): `customer-detail`, `supplier-detail`, `purchase-order-create`, `sales-order-detail`, `warehouse-list`, `warehouse-stock`, `fulfillment-tracking`, `price-tables`, `user-management`, `dashboard.component`, `price-display`, `margin-indicator` (só ícones pi-*), `kpi-card` (só ícones).

## Tabela de mapeamento canônica (usar em TODAS as tarefas)

| PrimeNG | Angular Material / substituto | Nota |
|---|---|---|
| `p-button`, `pButton` | `<button mat-flat-button>` (primário), `mat-stroked-button` (secundário), `mat-icon-button` (ícone) | Pill via theme override (`--radius-full`); severity → classes utilitárias próprias |
| `p-card` | `<mat-card appearance="outlined">` | Hairline `--color-hairline` via override |
| `p-tag` | `shared/components/status-badge` (interno vira `<span class="badge">` próprio, sem lib) | status-badge/stock-badge já encapsulam; migrar só o interno |
| `pTooltip` | `matTooltip` | `tooltipPosition` → `matTooltipPosition` |
| `p-table` + `p-sortIcon` + `pTemplate` | `<table mat-table>` + `matSort` + `matColumnDef` | Maior refactor; manter signals/computed de filtro client-side |
| `p-dropdown` | `<mat-form-field><mat-select>` | `optionLabel` some: iterar `<mat-option [value]>` com label explícito; `[showClear]` → `<mat-option [value]="null">` |
| `p-multiSelect` | `<mat-select multiple>` | |
| `p-dialog [(visible)]` | `MatDialog.open(Component)` ou `open(TemplateRef)` | TemplateRef = menor refactor para dialogs de detalhe |
| `p-toast` + `MessageService` | `core/services/notification.service.ts` (wrapper `MatSnackBar`) | Assinatura compatível `add({severity, summary, detail})` — call sites mudam só o import |
| `p-confirmDialog` + `ConfirmationService` | `shared/components/confirm-dialog` via `MatDialog` | |
| `pInputText`, `p-inputtextarea` | `<mat-form-field><input matInput>` / `<textarea matInput>` | |
| `p-inputNumber` | `<input matInput type="number">` | |
| `p-iconField`/`p-inputIcon` | `<mat-icon matPrefix>` / `matSuffix` | |
| `p-divider` | `<mat-divider>` | |
| `p-menu` | `matMenuTriggerFor` + `<mat-menu>` | |
| `p-avatar` | `<span class="avatar">` próprio (CSS circle, iniciais) | Sem equivalente Material |
| `p-badge` | `matBadge` | |
| `p-chip` | `<mat-chip-set><mat-chip>` | |
| `p-tabView`/`p-tabPanel` | `<mat-tab-group><mat-tab>` | |
| `p-slider [range]` | `<mat-slider><input matSliderStartThumb/EndThumb>` | Range nativo no Material 18 |
| `p-timeline` | `shared/components/timeline` próprio (CSS, ~60 linhas) | Sem equivalente Material |
| `p-dataView` | CSS grid + `@for` | Já existe `.vinheria-card-grid` em styles.scss |
| `p-autoComplete` | `matAutocomplete` + `matInput` | |
| `p-chart` | `shared/components/chart` próprio envolvendo chart.js direto | chart.js já é dependência; NÃO adicionar ng2-charts |
| `pRipple`/`PrimeNGConfig.ripple` | MatRipple (embutido nos componentes Material) | Deletar bloco APP_INITIALIZER |

## Mapa de ícones `pi pi-*` → Material Symbols (`<mat-icon>`)

`pi-search→search · pi-plus→add · pi-minus→remove · pi-home→home · pi-bars→menu · pi-chevron-down→expand_more · pi-angle-left/right→chevron_left/chevron_right · pi-check→check · pi-check-circle→check_circle · pi-times→close · pi-times-circle→cancel · pi-clock→schedule · pi-box→inventory_2 · pi-book→menu_book · pi-shopping-cart→shopping_cart · pi-truck→local_shipping · pi-users→group · pi-building→domain · pi-warehouse→warehouse · pi-dollar→attach_money · pi-user-edit→manage_accounts · pi-pencil→edit · pi-eye→visibility · pi-map-marker→location_on · pi-tag→sell · pi-barcode→barcode_reader · pi-send→send · pi-list→list · pi-exclamation-circle→error · pi-exclamation-triangle→warning · pi-ban→block · pi-arrow-up/down→arrow_upward/arrow_downward · pi-chart-bar→bar_chart · pi-sign-out→logout · pi-save→save`

Uso: `<mat-icon fontIcon="search" />` (fontset default configurado na Fase 1). Ícone sem equivalente óbvio: escolher o Material Symbol semanticamente mais próximo em https://fonts.google.com/icons.

---

### Fase 0 — Chore baseline (branch `chore/VNH-0-workspace-cleanup`)

**Files:** todo o working tree atual já modificado (deleção `frontend/vinheria-web/**`, `frontend/Dockerfile`, `.github/dependabot.yml`, `CLAUDE.md`, `frontend/src/app/app.routes.ts`, 4 list components com fix FilterOption, i18n JSONs, `frontend/package-lock.json`, `.claude/settings.local.json`).

- [ ] **Step 0.1:** `git checkout -b chore/VNH-0-workspace-cleanup`
- [ ] **Step 0.2:** `cd frontend && npm run build` — esperado: verde (baseline sã)
- [ ] **Step 0.3:** `git add -A && git commit -m "chore(frontend): remove duplicate vinheria-web app, fix routes/dropdowns, update tooling"`
- [ ] **Step 0.4:** Abrir PR, squash-merge em `main`, voltar para `main` atualizada.
- [ ] **Step 0.5:** `git checkout -b feat/VNH-0-material3-migration` — branch única de toda a migração (Fases 1–6).

### Fase 1 — Setup Angular Material + tema DESIGN.md

**Files:**
- Modify: `frontend/package.json` (deps novas)
- Create: `frontend/src/styles/m3-theme.scss` (gerado por schematic)
- Create: `frontend/src/styles/_material-theme.scss`
- Modify: `frontend/src/styles.scss`, `frontend/src/index.html`, `frontend/src/app/app.config.ts`

**Produces (contrato para fases seguintes):** tema Material aplicado globalmente; `<mat-icon fontIcon="...">` funcional; tokens Material lendo `--color-*`.

- [ ] **Step 1.1:** `cd frontend && npm install @angular/material@18 @angular/cdk@18`
- [ ] **Step 1.2:** Gerar paleta M3 a partir do seed DESIGN.md:
  `npx ng generate @angular/material:m3-theme --primaryColor=0075de --directory=src/styles` (se o schematic pedir interativo, responder: sem secondary/tertiary/neutral custom, tema light, SCSS). Renomear saída para `src/styles/m3-theme.scss` se vier com outro nome.
- [ ] **Step 1.3:** Criar `src/styles/_material-theme.scss`:

```scss
// Vinheria Digital — Angular Material M3 theme, DESIGN.md como fonte de verdade
@use '@angular/material' as mat;
@use './m3-theme' as m3;

@include mat.core();

html {
  @include mat.all-component-themes(m3.$light-theme);
}

// ── DESIGN.md fidelity overrides ──────────────────────────────
// A paleta tonal gerada aproxima o seed; os tokens abaixo forçam
// os hex exatos do DESIGN.md nos papéis estruturais.
// IMPORTANTE (executor): os nomes --mdc-*/--mat-* abaixo são a
// convenção da major 18 — CONFIRME no CSS emitido (inspecionar
// dist/ ou DevTools) antes de dar a fase por pronta; ajuste nomes
// se divergirem.
:root {
  // Botões
  --mdc-filled-button-container-color: var(--color-primary);
  --mdc-filled-button-label-text-color: var(--color-on-primary);
  --mdc-filled-button-container-shape: var(--radius-full);
  --mdc-outlined-button-outline-color: var(--color-hairline);
  --mdc-outlined-button-label-text-color: var(--color-ink);
  --mdc-outlined-button-container-shape: var(--radius-full);
  --mdc-text-button-label-text-color: var(--color-primary);

  // Cards (hairline + flat, elevação Notion barely-there)
  --mdc-outlined-card-outline-color: var(--color-hairline);
  --mdc-outlined-card-container-shape: var(--radius-lg);
  --mdc-outlined-card-container-color: var(--color-surface);

  // Form fields (inputs 4px, tight — DESIGN.md text-input)
  --mdc-outlined-text-field-container-shape: var(--radius-xs);
  --mdc-outlined-text-field-outline-color: var(--color-hairline);
  --mdc-outlined-text-field-focus-outline-color: var(--color-primary);

  // Tabela
  --mat-table-background-color: var(--color-surface);
  --mat-table-header-headline-color: var(--color-ink-muted);
  --mat-table-row-item-outline-color: var(--color-hairline);

  // Dialog / snackbar
  --mdc-dialog-container-shape: var(--radius-xl);
  --mdc-dialog-container-color: var(--color-surface);
  --mdc-snackbar-container-color: var(--color-ink-secondary);
  --mdc-snackbar-supporting-text-color: var(--color-on-primary);

  // Tipografia base
  --mat-app-body-medium-font: var(--font-family);
}
```

- [ ] **Step 1.4:** Em `src/styles.scss`, adicionar `@use 'styles/material-theme';` como **primeira** linha (antes dos `@import` existentes — `@use` deve preceder `@import` em Sass). NÃO remover ainda os imports primeng (coexistência).
- [ ] **Step 1.5:** Em `src/index.html`, adicionar no `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0..1,-50..200" rel="stylesheet">
```

- [ ] **Step 1.6:** Em `app.config.ts`, adicionar provider para fontset default de ícones:

```ts
import { MatIconRegistry } from '@angular/material/icon'; // APP_INITIALIZER já é importado no arquivo

// dentro de providers[] (manter o bloco PrimeNGConfig por enquanto):
{
  provide: APP_INITIALIZER,
  useFactory: (registry: MatIconRegistry) => () => {
    registry.setDefaultFontSetClass('material-symbols-outlined');
  },
  deps: [MatIconRegistry],
  multi: true,
},
```

- [ ] **Step 1.7:** `npm run build` — verde. Smoke visual: `npm start`, app renderiza idêntico (Material ainda não usado em tela).
- [ ] **Step 1.8:** `git add -A && git commit -m "feat(frontend): add Angular Material 18 with DESIGN.md M3 theme"`

### Fase 2 — Primitivas compartilhadas (shared/ + core/ + layout)

**Files:**
- Create: `frontend/src/app/core/services/notification.service.ts`
- Create: `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- Create: `frontend/src/app/shared/components/chart/chart.component.ts`
- Create: `frontend/src/app/shared/components/timeline/timeline.component.ts`
- Modify: `shared/components/status-badge/`, `stock-badge/`, `wine-card/`, `fab/`, `kpi-card/`, `margin-indicator/` (ícones), `layout/shell/`, `layout/topbar/`, `layout/sidebar/`

**Produces:**
- `NotificationService.add(msg: { severity: 'success'|'info'|'warn'|'error'; summary: string; detail?: string; life?: number }): void`
- `ConfirmDialogComponent` — abrir via `MatDialog.open(ConfirmDialogComponent, { data: { header, message, acceptLabel, rejectLabel } })`; `afterClosed()` emite `boolean`.
- `ChartComponent` — `<app-chart [type]="'bar'" [data]="chartData" [options]="chartOptions" />` (mesmos objetos data/options já passados hoje ao `p-chart`).
- `TimelineComponent` — `<app-timeline [events]="events" />` com `events: { icon?: string; color?: string; title: string; subtitle?: string }[]`.

- [ ] **Step 2.1:** Criar `core/services/notification.service.ts`:

```ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface AppMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail?: string;
  life?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  add(msg: AppMessage): void {
    const text = msg.detail ? `${msg.summary} — ${msg.detail}` : msg.summary;
    this.snackBar.open(text, undefined, {
      duration: msg.life ?? 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: `snackbar-${msg.severity}`,
    });
  }
}
```

- [ ] **Step 2.2:** Criar `shared/components/confirm-dialog/confirm-dialog.component.ts`:

```ts
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  header: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.header }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">{{ data.rejectLabel }}</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="true">{{ data.acceptLabel }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ConfirmDialogComponent>);
}
```

- [ ] **Step 2.3:** Criar `shared/components/chart/chart.component.ts` (chart.js direto):

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`:host { display: block; position: relative; }`],
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  type = input.required<ChartType>();
  data = input.required<ChartConfiguration['data']>();
  options = input<ChartConfiguration['options']>({});

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const data = this.data();
      if (this.chart) {
        this.chart.data = data;
        this.chart.update();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = new Chart(this.canvas().nativeElement, {
      type: this.type(),
      data: this.data(),
      options: { responsive: true, maintainAspectRatio: false, ...this.options() },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
```

- [ ] **Step 2.4:** Criar `shared/components/timeline/timeline.component.ts` (CSS puro, tokens DESIGN.md):

```ts
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineEvent {
  icon?: string;      // Material Symbol name
  color?: string;     // CSS color; default var(--color-primary)
  title: string;
  subtitle?: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <ol class="timeline">
      @for (event of events(); track $index) {
        <li class="timeline-item">
          <span class="marker" [style.background]="event.color ?? 'var(--color-primary)'">
            @if (event.icon) { <mat-icon [fontIcon]="event.icon" /> }
          </span>
          <div class="content">
            <div class="title">{{ event.title }}</div>
            @if (event.subtitle) { <div class="subtitle">{{ event.subtitle }}</div> }
          </div>
        </li>
      }
    </ol>
  `,
  styles: [`
    .timeline { list-style: none; margin: 0; padding: 0; }
    .timeline-item { display: flex; gap: var(--space-sm); position: relative; padding-bottom: var(--space-lg); }
    .timeline-item:not(:last-child)::before {
      content: ''; position: absolute; left: 15px; top: 32px; bottom: 0;
      width: 1px; background: var(--color-hairline);
    }
    .marker {
      width: 32px; height: 32px; border-radius: var(--radius-full); flex-shrink: 0;
      display: grid; place-items: center; color: var(--color-on-primary);
    }
    .marker mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .title { font: var(--font-body-sm); color: var(--color-ink); font-weight: 600; }
    .subtitle { font: var(--font-caption); color: var(--color-ink-muted); }
  `],
})
export class TimelineComponent {
  events = input.required<TimelineEvent[]>();
}
```

- [ ] **Step 2.5:** Migrar `status-badge` e `stock-badge`: remover `TagModule`/`p-tag`; renderizar `<span class="badge badge-{{severity}}">` com `<mat-icon>` opcional; estilos locais com `--color-*`/`--radius-full`/`--font-eyebrow` (badge-pill do DESIGN.md). **API externa (inputs) inalterada** — consumidores não mudam.
- [ ] **Step 2.6:** Migrar `wine-card`, `fab`, `kpi-card`, `margin-indicator`: trocar `p-card`→`mat-card`, `p-button`→`mat-*-button`, `pTooltip`→`matTooltip`, ícones `pi-*`→`<mat-icon fontIcon>` conforme mapa. APIs externas inalteradas.
- [ ] **Step 2.7:** Migrar layout: `shell` (remover `p-toast`+`MessageService`; MatSnackBar não exige placeholder no template), `topbar` (`p-menu`→`mat-menu`, `p-avatar`→span próprio, `p-dropdown` de idioma/moeda→`mat-select`, `p-badge`→`matBadge`), `sidebar` (`pTooltip`→`matTooltip`, ícones).
- [ ] **Step 2.8:** `npm run build` verde + smoke visual das primitivas. Commit: `refactor(frontend): migrate shared components and layout to Angular Material`

### Fase 3 — Features (um commit por fatia; app verde entre commits)

Ordem (crescente em complexidade, valida padrões cedo): **auth → dashboards → catalog → customers → suppliers → purchases → sales → fulfillments → approvals**.

Padrão de migração de página de lista (aplicar em customer-list, supplier-list, purchase-order-list, sales-order-list, fulfillment-list):

1. Imports: remover módulos `primeng/*`; adicionar `MatTableModule, MatSortModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, MatDialogModule`.
2. `p-table` → `<table mat-table [dataSource]="filteredItems()" matSort>`; cada `<th>/<td>` do `pTemplate` vira `matColumnDef`; `displayedColumns` como readonly array no componente. Sorting client-side: handler `(matSortChange)` alimentando o computed/signal existente (manter lógica de filtro atual intacta).
3. Filtros `p-dropdown` → `mat-select` (com `<mat-option [value]="null">` para "limpar"); busca `p-iconField` → `mat-form-field` com `<mat-icon matPrefix fontIcon="search" />`.
4. Dialog de detalhe `p-dialog [(visible)]` → `MatDialog.open(templateRef)` com `<ng-template #detailDialog>` no próprio template (menor refactor; sem componente novo).
5. Toasts: trocar import `MessageService` → `NotificationService` (call sites `messageService.add({...})` viram `notification.add({...})` — mesma assinatura).
6. SCSS: deletar overrides `:host ::ng-deep .p-*`; estilos de célula usam os tokens `ex-data-table-cell` do DESIGN.md (header `--font-eyebrow`/`--color-canvas-soft`, row border `--color-hairline`).

Exemplo concreto (filtro de status em sales-order-list) — ANTES:

```html
<p-dropdown [options]="statusOptions" [(ngModel)]="selectedStatus"
  optionLabel="label" [placeholder]="t('common.status')" [showClear]="true" />
```

DEPOIS:

```html
<mat-form-field appearance="outline" class="filter-field">
  <mat-label>{{ t('common.status') }}</mat-label>
  <mat-select [(ngModel)]="selectedStatus">
    <mat-option [value]="null">{{ t('common.all') }}</mat-option>
    @for (opt of statusOptions; track opt.value) {
      <mat-option [value]="opt">{{ opt.label }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

(signals `selected*` já guardam `FilterOption<T> | null` após a Fase 0 — manter.)

Tarefas por fatia:

- [ ] **3.1 auth:** `login` (p-card→mat-card, p-button→mat-flat-button, p-dropdown idioma→mat-select), `unauthorized` (p-button). Commit `refactor(frontend): migrate auth to Angular Material`.
- [ ] **3.2 dashboards:** `admin-dashboard`, `manager-dashboard`, `seller-dashboard` — p-card→mat-card, p-chart→`<app-chart>`, p-table→mat-table (tabelas pequenas de "recentes", sem sort), p-tag→status-badge existente, tooltips. Commit `refactor(frontend): migrate dashboards to Angular Material`.
- [ ] **3.3 catalog:** `wine-list` (p-dataview→CSS grid `.vinheria-card-grid` + `@for`; p-multiselect→mat-select multiple; p-slider range→mat-slider two-thumb; busca→mat-form-field), `wine-detail` (mat-card, mat-divider, mat-table simples, badges). Commit.
- [ ] **3.4 customers:** `customer-list` (padrão lista). Commit.
- [ ] **3.5 suppliers:** `supplier-list` (padrão lista + `p-chip`→`mat-chip-set`). Commit.
- [ ] **3.6 purchases:** `purchase-order-list` (padrão lista + `p-inputtextarea`→`textarea matInput` no dialog de rejeição + NotificationService). Commit.
- [ ] **3.7 sales:** `sales-order-list` (padrão lista); `sales-order-create` (maior arquivo: p-autocomplete→matAutocomplete, p-inputNumber→matInput type number, p-confirmDialog+ConfirmationService→ConfirmDialogComponent via MatDialog, p-divider→mat-divider, tabela de itens→mat-table sem sort). Commit.
- [ ] **3.8 fulfillments:** `fulfillment-list` (padrão lista + `p-timeline`→`<app-timeline>`). Commit.
- [ ] **3.9 approvals:** `approval-queue` (p-tabview→mat-tab-group, padrão lista, textarea de rejeição, NotificationService). Commit.
- [ ] **3.10 ícones residuais:** varrer `grep -rn "pi pi-" frontend/src` e migrar o que sobrou (kpi-card, margin-indicator, empty states em páginas sem PrimeNG). Commit `refactor(frontend): replace remaining primeicons with Material Symbols`.

### Fase 4 — Verificação visual intermediária

- [ ] `npm start` e navegar TODAS as rotas (login, dashboard, catalog, catalog/:id, customers, suppliers, purchases, sales, sales/create, fulfillments, approvals, warehouses, pricing, users, settings se existir). Sem erro de console, sem componente PrimeNG renderizado.
- [ ] Checklist DESIGN.md: canvas `#f6f5f4`; CTAs pill azul `#0075de`; cards hairline `#e6e6e6` radius 12px; inputs radius 4px; Inter em tudo; tabelas com header eyebrow.
- [ ] Trocar idioma (pt-BR/es-PY/en-US) no topbar — dropdowns Material funcionando com Transloco.

### Fase 5 — Remoção total de PrimeNG

**Files:** `frontend/src/styles.scss`, delete `frontend/src/styles/_primeng-theme.scss`, `frontend/src/styles/_variables.scss`, `frontend/src/app/app.config.ts`, `frontend/package.json`.

- [ ] **Step 5.1:** Pré-gate: `grep -rn "primeng\|pInput\|pButton\|pTooltip\|pTemplate\|p-" frontend/src/app --include="*.ts" | grep -vi "primeNG-free"` — analisar cada hit; deve restar apenas falso-positivo CSS (`p-`\* utilitários próprios como `.page-content`). Zero imports `from 'primeng/...'`.
- [ ] **Step 5.2:** `app.config.ts`: deletar import `PrimeNGConfig` e o bloco APP_INITIALIZER do ripple.
- [ ] **Step 5.3:** `styles.scss`: deletar as 3 linhas `@import 'primeng/resources/primeng.min.css'; @import 'primeicons/primeicons.css'; @import 'styles/primeng-theme';`. Deletar arquivo `_primeng-theme.scss`. Migrar para `_material-theme.scss` qualquer regra do `_primeng-theme.scss` que estilize componentes Material/próprios ainda referenciada (verificar com build + visual).
- [ ] **Step 5.4:** `_variables.scss`: deletar blocos "PRIMENG TOKEN MAPPING" (`--p-*`) e "M3 TOKEN COMPATIBILITY" (`--m3-*`, `--vinheria-*` aliases). Antes: `grep -rn "\-\-p-\|--m3-\|--vinheria-" frontend/src --include="*.scss" --include="*.ts"` e corrigir cada consumidor para o token canônico `--color-*`/`--space-*`/`--radius-*`/`--font-*`.
- [ ] **Step 5.5:** `npm uninstall primeng primeicons`
- [ ] **Step 5.6:** Gate final:

```bash
cd frontend
grep -ri "primeng\|primeicons\|pi pi-" src package.json   # esperado: vazio
npm run build                                              # verde
grep -ri primeng dist/ | head                              # esperado: vazio
```

- [ ] **Step 5.7:** Commit `refactor(frontend)!: remove PrimeNG and PrimeIcons — Angular Material only` (body: `BREAKING CHANGE: PrimeNG removed; UI library is Angular Material 18 themed by DESIGN.md`).

### Fase 6 — Docs e tooling

**Files:**
- Modify: `CLAUDE.md` (convenção frontend: "PrimeNG components, customize via --p-* CSS vars" → "Angular Material components, theme via DESIGN.md tokens"; hooks note), `AGENTS.md`, `README.md`, `docs/01-visao-geral.md`, `docs/15-agent-instructions.md`, `docs/README.md`, `.github/copilot-instructions.md`, `.github/dependabot.yml` (comentário "Angular/PrimeNG"→"Angular/Material")
- Rename+rewrite: `docs/04-frontend-angular-primeng.md` → `docs/04-frontend-angular-material.md` (atualizar índice em `docs/README.md` e referências no `CLAUDE.md`)
- Rewrite: `.opencode/skills/material-3/SKILL.md` (remover Bordeaux/Playfair/PrimeNG; documentar stack Angular Material 18 + tokens `--color-*` DESIGN.md + overrides `_material-theme.scss`)

- [ ] **Step 6.1:** Atualizar cada arquivo acima; buscar residual com `grep -rn "primeng\|PrimeNG\|primeicons" . --include="*.md" --include="*.yml" -i | grep -v node_modules | grep -v docs/plans`.
- [ ] **Step 6.2:** Commit `docs: update frontend docs and agent instructions to Angular Material`.
- [ ] **Step 6.3:** PR único da branch `feat/VNH-0-material3-migration` → `main`, squash-merge.

## Riscos e trade-offs (executor deve ler antes de começar)

1. **Nomes de tokens Material v18** (`--mdc-*`/`--mat-*`): convenção da major 18, mas variam por componente e minor. Fonte de verdade = CSS emitido no build. Se um override não pegar, inspecionar DevTools e corrigir o nome — não empilhar `::ng-deep`.
2. **Paleta gerada pelo schematic ≠ hex exato**: Material Color Utilities gera tonal palette do seed; os overrides da Fase 1 garantem `#0075de` exato nos papéis estruturais. Cores derivadas (hover/state layers) podem divergir levemente do DESIGN.md — aceitável.
3. **`p-table`→`mat-table` é o maior refactor** (pTemplate→matColumnDef). Não mover lógica de filtro/sort para MatTableDataSource; manter signals/computed existentes e passar o array filtrado a `[dataSource]`.
4. **Zero testes unitários existentes**: verificação é build + smoke visual + grep gates. Não criar suite nova (fora de escopo; débito registrado).
5. **Dialogs declarativos → MatDialog imperativo**: usar `open(templateRef)` para dialogs de detalhe (menor churn); componentes dedicados só para confirm.
6. **Coexistência das libs até a Fase 5**: bundle temporariamente maior; irrelevante (mock data, sem produção).
7. **Angular 19/20 tem `mat.theme-overrides` (API de theming bem melhor)**: upgrade fica como follow-up separado, fora deste escopo.
