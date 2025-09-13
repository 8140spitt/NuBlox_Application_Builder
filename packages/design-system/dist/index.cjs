"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  STEPS: () => STEPS,
  ThemeEngine: () => ThemeEngine,
  buildRamp: () => buildRamp,
  buildRampFromHex: () => buildRampFromHex,
  buildTheme: () => buildTheme,
  buildThemeQuick: () => buildThemeQuick,
  contrastRatio: () => contrastRatio,
  isValidHex: () => isValidHex,
  normalizeHex: () => normalizeHex,
  pickForRole: () => pickForRole,
  toCssTokens: () => toCssTokens,
  toJsonTokens: () => toJsonTokens
});
module.exports = __toCommonJS(index_exports);

// src/palettes/palettes-multibrand.ts
var STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
var STATUS_HUES = { success: 145, warning: 38, danger: 4, info: 210 };
var ROLE_PREFS = {
  primary: [600, 700, 500],
  secondary: [600, 700, 500],
  tertiary: [600, 700, 500],
  quaternary: [600, 700, 500],
  link: [700, 600, 800],
  chip: [100, 200, 300],
  badge: [300, 400, 500],
  surface: [50, 100, 200],
  "surface-2": [100, 200, 300]
};
var clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
function normalizeHex(hex) {
  let s = (hex || "").trim().toLowerCase();
  if (!s) return "";
  if (s[0] !== "#") s = "#" + s;
  if (/^#([0-9a-f]{3})$/.test(s)) {
    const t = s.slice(1);
    s = "#" + t.split("").map((ch) => ch + ch).join("");
  }
  return s;
}
function isValidHex(hex) {
  const s = normalizeHex(hex);
  return /^#([0-9a-f]{6})$/.test(s);
}
function hexToRgb(hex) {
  const s = normalizeHex(hex).slice(1);
  const x = parseInt(s, 16);
  return { r: x >> 16 & 255, g: x >> 8 & 255, b: x & 255 };
}
function rgbToHex(r, g, b) {
  const to = (v) => Math.round(v).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}
var srgbToLin = (v) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLin(r), G = srgbToLin(g), B = srgbToLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(a, b) {
  const L1 = luminance(a), L2 = luminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function pickOn(bg, min = 4.5) {
  const cW = contrastRatio(bg, "#ffffff"), cB = contrastRatio(bg, "#000000");
  if (cW >= min && cW >= cB) return "#FFFFFF";
  if (cB >= min) return "#000000";
  return cW >= cB ? "#FFFFFF" : "#000000";
}
function easeInOut(t) {
  return 0.5 * (1 - Math.cos(Math.PI * t));
}
function buildRamp(h, baseS, opts) {
  const neutral = !!opts?.neutral;
  const sMin = opts?.sMin ?? (neutral ? 4 : 6);
  const sMax = opts?.sMax ?? (neutral ? 10 : Math.min(92, baseS));
  const lHi = opts?.lHi ?? 96;
  const lLo = opts?.lLo ?? 9;
  const entries = STEPS.map((step, i) => {
    const t = i / (STEPS.length - 1);
    const l = lHi - (lHi - lLo) * easeInOut(t);
    const midBoost = 1 - Math.abs(0.5 - t) * 2;
    const s = neutral ? sMax : clamp((sMin + (sMax - sMin) * (0.6 + 0.4 * midBoost)) / 100, 0, 1) * 100;
    const hex = hslToHex(h, s, l);
    const sw = {
      step,
      hex,
      hsl: { h, s, l },
      on: pickOn(hex, 4.5),
      crWhite: contrastRatio(hex, "#ffffff"),
      crBlack: contrastRatio(hex, "#000000")
    };
    return [step, sw];
  });
  return Object.fromEntries(entries);
}
function buildRampFromHex(hex, opts) {
  const n = normalizeHex(hex);
  if (!isValidHex(n)) throw new Error(`Invalid hex: ${hex}`);
  const { r, g, b } = hexToRgb(n);
  const { h, s } = rgbToHsl(r, g, b);
  return buildRamp(h, s, opts);
}
function buildTheme({
  seeds,
  brandOrder = seeds.map((s) => s.name),
  statusOverrides,
  options
}) {
  const brands = {};
  seeds.forEach((s) => {
    brands[s.name] = buildRampFromHex(s.hex);
  });
  const neutralHue = options?.neutralHue ?? 240;
  const neutralSat = options?.neutralSat ?? 10;
  const neutral = buildRamp(neutralHue, neutralSat, { neutral: true, sMin: 4, sMax: Math.max(6, neutralSat) });
  const sOk = (n) => n && brands[n];
  const status = {
    success: sOk(statusOverrides?.success) ? brands[statusOverrides.success] : buildRamp(STATUS_HUES.success, 60),
    warning: sOk(statusOverrides?.warning) ? brands[statusOverrides.warning] : buildRamp(STATUS_HUES.warning, 70),
    danger: sOk(statusOverrides?.danger) ? brands[statusOverrides.danger] : buildRamp(STATUS_HUES.danger, 70),
    info: sOk(statusOverrides?.info) ? brands[statusOverrides.info] : buildRamp(STATUS_HUES.info, 65)
  };
  const emitBrand = (name, ramp) => STEPS.map((k) => [
    `  --${name}-${k}: ${ramp[k].hex};`,
    `  --on-${name}-${k}: ${ramp[k].on};`
  ].join("\n")).join("\n");
  const emitAll = () => {
    const lines = [];
    Object.entries(brands).forEach(([name, ramp]) => lines.push(emitBrand(name, ramp)));
    lines.push(emitBrand("neutral", neutral));
    Object.entries(status).forEach(([name, ramp]) => lines.push(emitBrand(name, ramp)));
    return lines.join("\n");
  };
  const tokens = {
    light: [
      ":root, [data-theme='light'] {",
      emitAll(),
      "  --surface: var(--neutral-50);",
      "  --surface-2: var(--neutral-100);",
      "  --text: #111827;",
      "}"
    ].join("\n"),
    dark: [
      "[data-theme='dark'] {",
      emitAll(),
      "  --surface: var(--neutral-900);",
      "  --surface-2: var(--neutral-800);",
      "  --text: #e5e7eb;",
      "}"
    ].join("\n")
  };
  function chooseBrand(role) {
    return role === "primary" ? brandOrder[0] : role === "secondary" ? brandOrder[1] ?? brandOrder[0] : role === "tertiary" ? brandOrder[2] ?? brandOrder[0] : role === "quaternary" ? brandOrder[3] ?? brandOrder[1] ?? brandOrder[0] : brandOrder[1] ?? brandOrder[0];
  }
  function resolveRole(role, mode = "light") {
    if (role === "surface" || role === "surface-2") {
      const k = role === "surface" ? mode === "light" ? 50 : 900 : mode === "light" ? 100 : 800;
      const sw = neutral[k];
      return { step: k, hex: sw.hex, on: sw.on, role };
    }
    const brandName = chooseBrand(role);
    const ramp = brands[brandName];
    const prefs = [...ROLE_PREFS[role]];
    if (mode === "dark") {
      const bias = { 700: 600, 600: 500, 500: 400, 400: 300 };
      for (let i = 0; i < prefs.length; i++) {
        const mapped = bias[prefs[i]];
        if (mapped) prefs[i] = mapped;
      }
    }
    for (const step of prefs) {
      const sw = ramp[step];
      if (contrastRatio(sw.hex, sw.on) >= 4.5) return { brand: brandName, step, hex: sw.hex, on: sw.on, role };
    }
    let bestStep = 500;
    let best = ramp[bestStep];
    let bestCR = contrastRatio(best.hex, best.on);
    for (const k of STEPS) {
      const s = ramp[k];
      const cr = contrastRatio(s.hex, s.on);
      if (cr > bestCR) {
        bestCR = cr;
        best = s;
        bestStep = k;
      }
    }
    return { brand: brandName, step: bestStep, hex: best.hex, on: best.on, role };
  }
  return { brands, neutral, status, tokens, resolveRole };
}
function buildThemeQuick(hexes, options) {
  const seeds = hexes.map((hex, i) => ({ name: `brand${i + 1}`, hex }));
  return buildTheme({ seeds, options });
}
function toJsonTokens(theme) {
  return { brands: theme.brands, neutral: theme.neutral, status: theme.status };
}
function toCssTokens(theme, opts) {
  const header = opts?.includeComments ? "/* NuBlox tokens \u2014 generated */\n" : "";
  const base = [theme.tokens.light, "", theme.tokens.dark].join("\n");
  const alias = `
@layer base {
  :root, [data-theme='light']{
    --primary:   var(--brand1-600); --on-primary:   var(--on-brand1-600);
    --secondary: var(--brand2-600); --on-secondary: var(--on-brand2-600);
    --accent:    var(--brand3-600); --on-accent:    var(--on-brand3-600);
    --link: var(--brand2-700);
  }
  [data-theme='dark']{
    --primary:   var(--brand1-400); --on-primary:   var(--on-brand1-400);
    --secondary: var(--brand2-400); --on-secondary: var(--on-brand2-400);
    --accent:    var(--brand3-400); --on-accent:    var(--on-brand3-400);
    --link: var(--brand2-300);
  }

  :root, [data-theme='light']{
    --state-hover-delta: 6%; --state-active-delta: 10%;
    --primary-hover:   color-mix(in oklab, var(--primary),   #000 var(--state-hover-delta));
    --primary-active:  color-mix(in oklab, var(--primary),   #000 var(--state-active-delta));
    --secondary-hover: color-mix(in oklab, var(--secondary), #000 var(--state-hover-delta));
    --secondary-active:color-mix(in oklab, var(--secondary), #000 var(--state-active-delta));
    --accent-hover:    color-mix(in oklab, var(--accent),    #000 var(--state-hover-delta));
    --accent-active:   color-mix(in oklab, var(--accent),    #000 var(--state-active-delta));
  }
  [data-theme='dark']{
    --state-hover-delta: 12%; --state-active-delta: 18%;
    --primary-hover:   color-mix(in oklab, var(--primary),   #000 var(--state-hover-delta));
    --primary-active:  color-mix(in oklab, var(--primary),   #000 var(--state-active-delta));
    --secondary-hover: color-mix(in oklab, var(--secondary), #000 var(--state-hover-delta));
    --secondary-active:color-mix(in oklab, var(--secondary), #000 var(--state-active-delta));
    --accent-hover:    color-mix(in oklab, var(--accent),    #000 var(--state-hover-delta));
    --accent-active:   color-mix(in oklab, var(--accent),    #000 var(--state-active-delta));
  }
}
`.trim();
  return header + `@layer tokens {
${[base, alias].join("\n\n")}
}
`;
}
function pickForRole(theme, role, mode = "light") {
  return theme.resolveRole(role, mode);
}

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  STEPS,
  ThemeEngine,
  buildRamp,
  buildRampFromHex,
  buildTheme,
  buildThemeQuick,
  contrastRatio,
  isValidHex,
  normalizeHex,
  pickForRole,
  toCssTokens,
  toJsonTokens
});
