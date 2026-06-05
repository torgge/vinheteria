---
name: material-3
description: >
  Implement Material Design 3 UI patterns in Angular + PrimeNG + CSS custom properties.
  Covers color tokens (--m3-*), surface containers, elevation, typography scale, shape,
  30+ components, responsive layout, and MD3 compliance auditing. Use ONLY when the user
  asks about Material Design, MD3, Material You, M3 tokens, or wants to audit/fix/stylize
  UI components following Google's design system spec.
---

# Material Design 3 — Vinheria Digital

This skill guides implementation of Google's Material Design 3 (MD3) in the Vinheria Digital stack: **Angular 18 + PrimeNG 17 + CSS custom properties**.

## Project Token System

The project uses a custom token namespace (`--m3-*`) that maps to the MD3 spec (`--md-sys-*`):

| M3 Spec Token | Vinheria Token | Usage |
|---------------|---------------|-------|
| `--md-sys-color-primary` | `--m3-primary` | Primary brand color (#722F37 Bordeaux) |
| `--md-sys-color-primary-container` | `--m3-primary-container` | Primary container |
| `--md-sys-color-on-primary` | `--m3-on-primary` | Text/icons on primary |
| `--md-sys-color-surface` | `--m3-surface` | Default background |
| `--md-sys-color-surface-container` | `--m3-surface-container` | Navigation areas |
| `--md-sys-color-surface-container-lowest` | `--m3-surface-container-lowest` | Page background |
| `--md-sys-color-surface-container-highest` | `--m3-surface-container-highest` | Search bars, filled inputs |
| `--md-sys-color-outline` | `--m3-outline` | Important boundaries |
| `--md-sys-color-outline-variant` | `--m3-outline-variant` | Dividers, card borders |
| `--md-sys-color-inverse-surface` | `--m3-inverse-surface` | Tooltips, snackbars |
| `--md-sys-shape-corner-extra-small` | `--m3-radius-xs` | Chips, snackbars (4px) |
| `--md-sys-shape-corner-small` | `--m3-radius-sm` | Inputs, menus (8px) |
| `--md-sys-shape-corner-medium` | `--m3-radius-md` | Cards (12px) |
| `--md-sys-shape-corner-large` | `--m3-radius-lg` | FAB, dialogs (16px) |
| `--md-sys-shape-corner-extra-large` | `--m3-radius-xl` | Search bar (28px) |
| `--md-sys-shape-corner-full` | `--m3-radius-full` | Buttons, badges (9999px) |

All tokens defined in: `frontend/src/styles/_variables.scss`

## Stack-Specific Patterns

### Angular + PrimeNG + M3

- **Buttons**: Use PrimeNG `<p-button>` with variants: `[text]="true"` (M3 standard), `[outlined]="true"` (M3 outlined), default (M3 filled), `severity="primary|secondary|success|info|warning|danger|help|contrast"`
- **Icon buttons**: `<p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" />` — 40dp touch target (no `size="small"`). Always add `[pTooltip]` for accessibility
- **Text fields**: Use `<p-iconField>` + `<input pInputText>` with M3 filled search bar styling (28px border-radius, surface-container-highest background)
- **Cards**: Three variants via CSS classes — `.vinheria-card-elevated`, `.vinheria-card-filled`, `.vinheria-card-outlined`
- **Surface hierarchy**: Layout components use `--m3-surface-container-*` hierarchy (shell → lowest, cards → surface, search → highest)
- **Elevation**: `--m3-elevation-1` through `--m3-elevation-5` with primary-color-tinted shadows
- **State layers**: Hover/press via `rgba(var(--m3-primary-rgb), var(--m3-state-hover-opacity))`
- **Ripple**: Enabled via `PrimeNGConfig.ripple = true` in `app.config.ts`
- **Typography**: Playfair Display (brand/display) + Source Sans 3 (body/label). Typescale tokens: `--m3-typescale-{role}-{size}-{property}`
- **Motion**: `--vinheria-transition-fast` (150ms), `--vinheria-transition-normal` (250ms), `--vinheria-transition-slow` (350ms). All use `ease`

### Theme Files

| File | Purpose |
|------|---------|
| `frontend/src/styles/_variables.scss` | All CSS custom properties (colors, spacing, radius, shadows, typography, motion) |
| `frontend/src/styles/_primeng-theme.scss` | PrimeNG component overrides + M3 patterns (search bar, tooltip, tabview, chip, divider, etc.) |
| `frontend/src/styles/_typography.scss` | Heading/body text styles, Google Fonts imports |
| `frontend/src/styles.scss` | Global reset, utility classes, empty-state, FAB, card variants |

## Decision Tree

```
What are you building?
├── New component           → Check "Component Quick Reference" below + references/component-catalog.md
├── Fix/audit existing UI   → Run MD3 compliance audit (section below)
├── Custom theme/variables  → Edit _variables.scss following references/color-system.md + theming-and-dynamic-color.md
├── Layout/navigation       → See references/layout-and-responsive.md + navigation-patterns.md
├── Typography/shape/motion → See references/typography-and-shape.md
└── Form / search / input   → Use M3 filled search bar pattern from _primeng-theme.scss
```

## Component Quick Reference (PrimeNG + M3)

| Component | PrimeNG | M3 Variant | Key CSS |
|-----------|---------|-----------|---------|
| Filled Button | `<p-button>` | M3 filled | `background: var(--m3-primary)` |
| Outlined Button | `<p-button [outlined]="true" />` | M3 outlined | `border-color: var(--m3-primary)` |
| Text Button | `<p-button [text]="true" />` | M3 text | No background, state layer hover |
| Icon Button | `<p-button icon="..." [rounded]="true" [text]="true" />` | M3 standard icon | 40dp touch target |
| FAB | `<app-fab icon="add" />` | M3 FAB | `--m3-primary-container` bg |
| Card | `<p-card>` + `.vinheria-card-elevated` | M3 elevated/filled/outlined | 12px radius, elevation |
| Text Field | `<input pInputText>` | M3 outlined | 8px radius |
| Search Bar | `<p-iconField>` + `<input pInputText>` | M3 filled search | 28px radius, filled bg |
| Dropdown | `<p-dropdown>` | M3 exposed menu | 8px radius, elevation-3 panel |
| DataTable | `<p-table>` | M3 data table | Surface cards, small action buttons |
| Dialog | `<p-dialog>` | M3 dialog | 16px radius, elevation-4 |
| Tooltip | `[pTooltip]` | M3 rich tooltip | inverse-surface bg, 4px radius |
| TabView | `<p-tabView>` | M3 primary tabs | Primary indicator, state layer |
| Chip | `<p-chip>` | M3 assist/filter chip | secondary-container bg |
| Divider | `<p-divider>` | M3 divider | outline-variant color |
| Badge/Tag | `<p-tag>` | M3 badge | Full radius, semantic colors |
| Toast | `<p-toast>` | M3 snackbar | 8px radius, left-border accent |
| Skeleton | `<p-skeleton>` | M3 skeleton | surface-container-high bg |

## Anti-Patterns (Never Do These)

- **Hardcode hex colors**: Always use `var(--m3-*)` or `var(--vinheria-*)` tokens. Hardcoded colors break theming and dark mode.
- **Use `size="small"` on table action buttons**: M3 standard icon button is 40dp. Small buttons violate touch targets.
- **Use `severity="secondary"` for interactive buttons**: Gray = disabled/unavailable in M3. Use `info`/`warning`/`success`/`danger`.
- **Mix `--m3-*` and `--vinheria-*` inconsistently**: Pick one naming convention per component. Both resolve to the same values but mixing creates confusion.
- **Use `--p-surface-border` for dividers**: Use `--m3-outline-variant`. `outline` is for interactive boundaries.
- **Use shadows as primary depth cue**: MD3 communicates elevation through tonal surface color. Shadows are supplementary.
- **Skip tooltips on icon-only buttons**: Always add `[pTooltip]="t('common.view')"` with `TooltipModule` imported.
- **Define `@keyframes fadeIn` locally**: Already defined globally in `styles.scss`. Components should reference it, not redefine it.
- **Use raw `px` values for spacing**: Use `--vinheria-spacing-*` tokens for consistent rhythm.
- **Forget `::ng-deep` when overriding PrimeNG**: PrimeNG components use view encapsulation. Use `:host ::ng-deep` for component-level overrides.

## MD3 Compliance Audit

When asked to audit MD3 compliance, score each category 0–10:

| Category | What to check in our stack |
|----------|---------------------------|
| **Color tokens** | Are `--m3-*` tokens used? Any hardcoded hex? Proper tonal pairs (`on-primary` on `primary`)? |
| **Typography** | Are `--m3-typescale-*` tokens used? Playfair for display/headline, Source Sans for body? |
| **Shape** | Correct radius tokens per component (buttons=full, cards=medium, search=xl)? |
| **Elevation** | `--m3-elevation-*` used? Tonal surfaces as primary depth cue? |
| **Components** | PrimeNG components styled via `_primeng-theme.scss`? Correct M3 variants? |
| **Layout** | Surface container hierarchy respected? Content max-width on large screens? |
| **Navigation** | Proper nav patterns (sidebar/topbar with elevation + state layers)? |
| **Motion** | `--vinheria-transition-*` tokens used? `ease` timing consistent? |
| **Accessibility** | Tooltips on icon-only buttons? 40dp touch targets? Contrast ratios? |
| **Theming** | All tokens in `_variables.scss`? Dark mode prepared? No hardcoded values? |

### Quick audit commands:
```bash
# Find hardcoded hex colors
grep -rn '#[0-9a-fA-F]\{3,6\}' frontend/src/app/ --include='*.ts' --include='*.scss' | grep -v '_variables.scss' | grep -v 'node_modules'

# Find size="small" on action buttons
grep -rn 'size="small"' frontend/src/app/ --include='*.ts'

# Find missing TooltipModule imports
grep -rn 'pTooltip' frontend/src/app/ --include='*.ts' -l | while read f; do grep -q 'TooltipModule' "$f" || echo "MISSING: $f"; done

# Find duplicate @keyframes fadeIn
grep -rn '@keyframes fadeIn' frontend/src/app/ --include='*.ts'
```

## Reference Documents

- `references/color-system.md` — Color roles, tonal palettes, dynamic color, CSS mapping
- `references/typography-and-shape.md` — Type scale, shape corners, elevation, motion tokens
- `references/component-catalog.md` — 30+ components with web/Compose mappings
- `references/navigation-patterns.md` — Navigation selection, responsive shell
- `references/layout-and-responsive.md` — Breakpoints, canonical layouts, foldables
- `references/theming-and-dynamic-color.md` — Theme generation, brand colors, dark mode
