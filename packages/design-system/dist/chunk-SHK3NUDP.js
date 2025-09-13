import {
  buildThemeQuick,
  toCssTokens
} from "./chunk-VKNYGI6N.js";

// src/theme-engine.ts
var ThemeEngine = class {
  constructor(id = "nublox-theme") {
    this.mode = "light";
    this.id = id;
    const el = document.getElementById(id);
    this.styleEl = el ?? Object.assign(document.createElement("style"), { id });
    if (!el) document.head.appendChild(this.styleEl);
  }
  applyHexes(hexes) {
    const theme = buildThemeQuick(hexes);
    this.styleEl.textContent = toCssTokens(theme);
    return theme;
  }
  setMode(mode) {
    this.mode = mode;
    document.documentElement.setAttribute("data-theme", mode);
  }
};

export {
  ThemeEngine
};
