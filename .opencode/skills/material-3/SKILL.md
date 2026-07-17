---
name: material-3
description: >
  Implement Material Design 3 UI patterns in Angular 18 + Angular Material 18 + CSS custom properties.
  Covers the DESIGN.md token system (--color-*, --space-*, --radius-*, --font-*, --shadow-*),
  the Material theme override file, elevation, typography scale, shape, component patterns,
  responsive layout, and MD3 compliance auditing. Use ONLY when the user
  asks about Material Design, MD3, Material You, M3 tokens, or wants to audit/fix/stylize
  UI components following Google's design system spec.
---

# Material Design 3 — Vinheria Digital

This skill guides implementation of Google's Material Design 3 (MD3) in the Vinheria Digital stack: **Angular 18 + Angular Material 18 (`^18.2.14`) + CSS custom properties**.

## Project Token System

**DESIGN.md** (at repo root) is the authoritative source of truth. It defines a Notion-inspired design language: primary blue `#0075de`, Inter font, white canvas with `#f6f5f4` soft surfaces, hairline borders, barely-there shadows. Tokens are CSS custom properties defined in `frontend/src/styles/_variables.scss`:

| Category | Tokens | Examples |
|----------|--------|----------|
| Colors | `--color-*` | `--color-primary` (#0075de), `--color-primary-active` (#005bab), `--color-secondary` (#213183), `--color-canvas` (#ffffff), `--color-canvas-soft` (#f6f5f4), `--color-surface`, `--color-ink`, `--color-ink-secondary`, `--color-ink-muted`, `--color-ink-faint`, `--color-hairline` (#e6e6e6), `--color-error` |
| Accent (decorative only) | `--color-accent-*` | `sky`, `purple`, `pink`, `orange`, `teal`, `green`, `brown` — never structural, never CTAs |
| Typography | `--font-*` | `--font-family` (Inter), `--font-mono`, composite tokens `--font-display-1/2`, `--font-heading-1/2/3`, `--font-title`, `--font-body-md/sm`, `--font-button`, `--font-caption`, `--font-eyebrow`; standalone sizes `--font-size-xs` … `--font-size-3xl` |
| Spacing | `--space-*` | `--space-xxs` (4px), `--space-xs` (8px), `--space-sm` (12px), `--space-md` (16px), `--space-lg` (24px), `--space-xl` (28px), `--space-xxl` (32px), `--space-3xl` (64px) |
| Radius | `--radius-*` | `--radius-xs` (4px, inputs), `--radius-sm` (5px), `--radius-md` (8px), `--radius-lg` (12px, cards), `--radius-xl` (16px, dialogs), `--radius-full` (9999px, buttons/badges) |
| Elevation | `--shadow-level-*` | `--shadow-level-0` (none), `--shadow-level-1`, `--shadow-level-2` — Notion barely-there stacked shadows |
| Motion | `--motion-*` | `--motion-fast` (150ms), `--motion-normal` (200ms), `--motion-slow` (300ms), all `ease` |
| State layers | `--state-*-opacity` | hover 0.08, focus 0.12, press 0.12, drag 0.16 |
| Layout | `--layout-*` | `--layout-sidebar-width` (260px), `--layout-topbar-height` (56px), `--layout-content-max-width` (1400px) |

All tokens defined in: `frontend/src/styles/_variables.scss`

## Stack-Specific Patterns

### Angular Material + DESIGN.md

- **Buttons**: `<button mat-flat-button>` (M3 filled, primary CTA), `<button mat-stroked-button>` (M3 outlined, secondary), `<button mat-button>` (M3 text). Pill shape via `--mdc-*-button-container-shape: var(--radius-full)`
- **Icon buttons**: `<button mat-icon-button matTooltip="...">` with `<mat-icon fontIcon="..." />` — 40dp touch target. Always add `matTooltip` for accessibility
- **Icons**: Material Symbols Outlined loaded from Google Fonts in `index.html`; registered as default fontset in `app.config.ts` (`registry.setDefaultFontSetClass('material-symbols-outlined', 'mat-ligature-font')`). Use `<mat-icon fontIcon="add" />` — never PrimeIcons or inline ligatures
- **Tables**: `mat-table` + `matSort` (`(matSortChange)` into a `Sort` signal, client-side sorting via `computed`)
- **Selects/filters**: `mat-form-field appearance="outline"` + `mat-select` with `FilterOption<T>` objects (`{ label, value }`); search inputs use `matInput` with `<mat-icon matPrefix fontIcon="search" />`
- **Dialogs**: `MatDialog` (`inject(MatDialog)`), opening `TemplateRef` or components. Confirmations use `shared/components/confirm-dialog` (`ConfirmDialogComponent` + `ConfirmDialogData`)
- **Notifications**: `core/services/notification.service.ts` — `NotificationService` wraps `MatSnackBar` with a `{ severity, summary, detail, life }` API (`snackbar-{severity}` panel classes)
- **Cards**: `<mat-card appearance="outlined">` + variant classes from `_material-theme.scss` — `.card-elevated`, `.card-filled`, `.card-outlined`
- **State layers**: `.state-layer-hover` utility class, or `rgba(var(--color-primary-rgb), var(--state-hover-opacity))`
- **Typography**: Inter for everything (`--font-family`); JetBrains Mono for code/tax IDs (`--font-mono`). Negative tracking on display/headings per DESIGN.md
- **Motion**: `--motion-fast` (150ms), `--motion-normal` (200ms), `--motion-slow` (300ms). All use `ease`

### Theme Files

| File | Purpose |
|------|---------|
| `frontend/src/styles/_variables.scss` | All DESIGN.md CSS custom properties (colors, spacing, radius, shadows, typography, motion, layout) |
| `frontend/src/styles/_material-theme.scss` | Angular Material theme (`mat.all-component-themes`) + `--mdc-*`/`--mat-*` overrides forcing exact DESIGN.md hex values, card variant classes, state layer utility |
| `frontend/src/styles/m3-theme.scss` | Generated M3 tonal palette (seed `#0075de`) consumed by `_material-theme.scss` |
| `frontend/src/styles/_typography.scss` | Heading/body text styles, Google Fonts imports |
| `frontend/src/styles.scss` | Global reset, utility classes, empty-state, badges |

## Decision Tree

```
What are you building?
├── New component           → Check "Component Quick Reference" below + references/component-catalog.md
├── Fix/audit existing UI   → Run MD3 compliance audit (section below)
├── Custom theme/variables  → Edit _variables.scss (DESIGN.md is authoritative) + _material-theme.scss for Material overrides
├── Layout/navigation       → See references/layout-and-responsive.md + navigation-patterns.md
├── Typography/shape/motion → See references/typography-and-shape.md
└── Form / search / input   → mat-form-field appearance="outline" + matInput / mat-select
```

## Component Quick Reference (Angular Material + DESIGN.md)

| Component | Angular Material | M3 Variant | Key CSS |
|-----------|------------------|-----------|---------|
| Filled Button | `<button mat-flat-button>` | M3 filled | `--mdc-filled-button-container-color: var(--color-primary)`, pill shape |
| Outlined Button | `<button mat-stroked-button>` | M3 outlined | `--mdc-outlined-button-outline-color: var(--color-hairline)` |
| Text Button | `<button mat-button>` | M3 text | `--mdc-text-button-label-text-color: var(--color-primary)` |
| Icon Button | `<button mat-icon-button>` + `<mat-icon fontIcon="..." />` | M3 standard icon | 40dp touch target, `matTooltip` required |
| Card | `<mat-card appearance="outlined">` + `.card-elevated/.card-filled/.card-outlined` | M3 elevated/filled/outlined | `var(--radius-lg)`, hairline border |
| Text Field | `<mat-form-field appearance="outline">` + `matInput` | M3 outlined | `var(--radius-xs)`, focus outline `var(--color-primary)` |
| Search Bar | `mat-form-field` + `<mat-icon matPrefix fontIcon="search" />` | M3 search | outline appearance |
| Dropdown | `<mat-select>` + `FilterOption<T>` | M3 exposed menu | `mat-option` per option |
| Data Table | `mat-table` + `matSort` | M3 data table | `--mat-table-row-item-outline-color: var(--color-hairline)` |
| Dialog | `MatDialog` + `mat-dialog-title/content/actions` | M3 dialog | `var(--radius-xl)` |
| Confirm Dialog | `ConfirmDialogComponent` (shared) | M3 basic dialog | `MAT_DIALOG_DATA` typed as `ConfirmDialogData` |
| Tooltip | `matTooltip` | M3 plain tooltip | `MatTooltipModule` |
| Menu | `<mat-menu>` + `mat-menu-item` | M3 menu | topbar user menu pattern |
| Divider | `<mat-divider>` | M3 divider | hairline color |
| Badge/Tag | `.badge` + `.badge-{severity}` classes | M3 badge | `var(--radius-full)`, `var(--font-eyebrow)` |
| Snackbar | `NotificationService` (wraps `MatSnackBar`) | M3 snackbar | `--mdc-snackbar-container-color: var(--color-ink-secondary)` |

## Anti-Patterns (Never Do These)

- **Hardcode hex colors**: Always use `var(--color-*)` tokens. Hardcoded colors break theming and contradict DESIGN.md.
- **Use accent colors structurally**: `--color-accent-*` are decorative stickers only — never CTAs, never nav, never status-critical UI.
- **Bypass NotificationService**: Never inject `MatSnackBar` directly in features; use `NotificationService` for consistent positioning/duration.
- **Reinvent confirmation dialogs**: Use `shared/components/confirm-dialog`, not ad-hoc dialogs per feature.
- **Use raw `px` values for spacing/radius**: Use `--space-*` / `--radius-*` tokens for consistent rhythm.
- **Use shadows as primary depth cue**: DESIGN.md is hairline-first — `--shadow-level-1/2` are barely-there and supplementary.
- **Skip tooltips on icon-only buttons**: Always add `matTooltip` with `MatTooltipModule` imported.
- **Override Material internals with `::ng-deep`**: Prefer the `--mdc-*`/`--mat-*` token overrides in `_material-theme.scss`. `::ng-deep` only as last resort, scoped with `:host`.
- **Hardcode user-visible strings**: Everything goes through `*transloco` (pt-BR, es-PY, en-US).
- **Use PrimeNG patterns**: PrimeNG/PrimeIcons are fully removed. No `p-*` components, no `--p-*` vars, no `pi pi-*` icons.

## MD3 Compliance Audit

When asked to audit MD3 compliance, score each category 0–10:

| Category | What to check in our stack |
|----------|---------------------------|
| **Color tokens** | Are `--color-*` tokens used? Any hardcoded hex? Accents kept decorative? |
| **Typography** | Inter via `--font-family`? Composite `--font-*` tokens or `--font-size-*` scale used? |
| **Shape** | Correct radius tokens per component (buttons=full, cards=lg, inputs=xs, dialogs=xl)? |
| **Elevation** | `--shadow-level-*` used? Hairline borders as primary boundary cue? |
| **Components** | Angular Material components themed via `_material-theme.scss`? Correct variants? |
| **Layout** | `--layout-*` dimensions respected? Content max-width on large screens? |
| **Navigation** | Sidebar/topbar follow layout tokens + state layers? |
| **Motion** | `--motion-*` tokens used? `ease` timing consistent? |
| **Accessibility** | Tooltips on icon-only buttons? 40dp touch targets? WCAG AA contrast? |
| **Theming** | All tokens in `_variables.scss`? Material overrides only in `_material-theme.scss`? No hardcoded values? |

### Quick audit commands:
```bash
# Find hardcoded hex colors
grep -rn '#[0-9a-fA-F]\{3,6\}' frontend/src/app/ --include='*.ts' --include='*.scss' | grep -v '_variables.scss' | grep -v 'node_modules'

# Find missing MatTooltipModule imports
grep -rn 'matTooltip' frontend/src/app/ --include='*.ts' -l | while read f; do grep -q 'MatTooltipModule' "$f" || echo "MISSING: $f"; done

# Find direct MatSnackBar usage outside NotificationService
grep -rn 'MatSnackBar' frontend/src/app/ --include='*.ts' | grep -v 'notification.service.ts'

# Find leftover PrimeNG usage (must be zero)
grep -rn 'primeng\|p-button\|pi pi-\|--p-' frontend/src/app/ --include='*.ts' --include='*.html' --include='*.scss'
```

## Reference Documents

- `references/color-system.md` — Color roles, tonal palettes, dynamic color, CSS mapping
- `references/typography-and-shape.md` — Type scale, shape corners, elevation, motion tokens
- `references/component-catalog.md` — 30+ components with web/Compose mappings
- `references/navigation-patterns.md` — Navigation selection, responsive shell
- `references/layout-and-responsive.md` — Breakpoints, canonical layouts, foldables
- `references/theming-and-dynamic-color.md` — Theme generation, brand colors, dark mode
