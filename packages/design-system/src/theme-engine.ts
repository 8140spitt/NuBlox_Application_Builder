import { buildThemeQuick, toCssTokens } from './palettes/palettes-multibrand';

export class ThemeEngine {
  private styleEl: HTMLStyleElement;
  private id: string;
  mode: 'light'|'dark' = 'light';

  constructor(id = 'nublox-theme') {
    this.id = id;
    const el = document.getElementById(id) as HTMLStyleElement | null;
    this.styleEl = el ?? Object.assign(document.createElement('style'), { id });
    if (!el) document.head.appendChild(this.styleEl);
  }
  applyHexes(hexes: string[]) {
    const theme = buildThemeQuick(hexes);
    this.styleEl.textContent = toCssTokens(theme);
    return theme;
  }
  setMode(mode: 'light'|'dark') {
    this.mode = mode;
    document.documentElement.setAttribute('data-theme', mode);
  }
}
