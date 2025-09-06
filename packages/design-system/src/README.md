# NuBlox Design System — World‑Class Core (2025-08-29)

This package is a **framework-agnostic, progressive CSS design system** optimised for SvelteKit/vanilla apps.

## What’s new / world‑class

- **@layered architecture:** `tokens → base → typography → utilities → components → motion → themes → print`
- **Progressive color:** hex fallbacks → `color-mix(in srgb, …)` → `oklch(… )` when supported
- **Theming via attributes:** `[data-theme="light|dark"]`, **density** via `[data-density="compact|cozy|comfortable"]`
- **A11y at the core:** focus rings, high-contrast/forced-colors support, reduced motion
- **Fluid type scale**, sane spacing/radius/shadows/z‑index tokens
- Minimal **utilities** and **production-ready components** (buttons, cards, forms, alerts, tables, nav)
- **Print stylesheet** included

## Usage

Import the single CSS file or cherry-pick layers:

```html
<link rel="stylesheet" href="/css/nublox-design-system.css">
<!-- or -->
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/typography.css">
<link rel="stylesheet" href="/css/utilities.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/motion.css">
<link rel="stylesheet" href="/css/themes.css">
<link rel="stylesheet" href="/css/print.css">
```

Theme & density toggles:

```js
document.documentElement.setAttribute('data-theme', 'dark'); // or 'light'
document.documentElement.setAttribute('data-density', 'compact'); // or 'cozy' | 'comfortable'
```

## Tokens

See `tokens/tokens.json` for a programmatic view that can feed build tooling (e.g., Drizzle/adapters for docs).

## Notes

- No third-party dependencies. No Tailwind required.
- All colours and styles are **token-driven** so you can plug into your SQLX/Studio apps.
- Tested with modern Chromium/Firefox/Safari engines.
