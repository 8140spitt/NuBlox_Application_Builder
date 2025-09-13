# @nublox/design-system

NuBlox-only, Spectrum-inspired, contrast-first design system with multi-brand palette generators,
light/dark tokens, semantic & state tokens, and framework-agnostic CSS components.

## Build
```sh
pnpm -F @nublox/design-system install
pnpm -F @nublox/design-system build
# or override seeds:
pnpm -F @nublox/design-system tokens -- "#a65de9,#47a4ff,#47ffd7,#fba94c"
```

## Use in apps
CSS-first:
```css
@import "@nublox/design-system/css/tokens.css";
@import "@nublox/design-system/css/nublox-design-system.css";
```

Optional JS API (runtime theming):
```ts
import { ThemeEngine } from "@nublox/design-system/api";
new ThemeEngine().applyHexes(["#a65de9","#47a4ff","#47ffd7","#fba94c"]);
```
