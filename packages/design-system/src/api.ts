// Public, stable API surface for the design system.
// Re-export engine primitives and palettes, plus tiny color utilities
// used by the palette preview page.

export * from './theme-engine.js';

// bundle all palette helpers under a single namespace
import * as MultiBrand from './palettes/palettes-multibrand.js';
export const palettes = MultiBrand;

// Common ramp steps used by the preview
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// Minimal contrast utility (WCAG)
function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const v = h.length === 3
        ? h.split('').map((c) => c + c).join('')
        : h.padStart(6, '0').slice(0, 6);
    const n = parseInt(v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
    const toLin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const R = toLin(r), G = toLin(g), B = toLin(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
export function contrastRatio(fgHex: string, bgHex: string) {
    const L1 = relLuminance(hexToRgb(fgHex));
    const L2 = relLuminance(hexToRgb(bgHex));
    const [a, b] = L1 >= L2 ? [L1, L2] : [L2, L1];
    return (a + 0.05) / (b + 0.05);
}
