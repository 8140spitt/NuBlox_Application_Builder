type BrandSeed = {
    name: string;
    hex: string;
};
type Step = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
type HSL = {
    h: number;
    s: number;
    l: number;
};
type Swatch = {
    step: Step;
    hex: string;
    hsl: HSL;
    on: "#000000" | "#FFFFFF";
    crWhite: number;
    crBlack: number;
};
type Ramp = Record<Step, Swatch>;
type BrandSet = Record<string, Ramp>;
type Mode = "light" | "dark";
type Theme = {
    brands: BrandSet;
    neutral: Ramp;
    status: {
        success: Ramp;
        warning: Ramp;
        danger: Ramp;
        info: Ramp;
    };
    tokens: {
        light: string;
        dark: string;
    };
    resolveRole: (role: Role, mode?: Mode) => ResolvedSwatch;
};
type Role = "primary" | "secondary" | "tertiary" | "quaternary" | "link" | "chip" | "badge" | "surface" | "surface-2";
type ResolvedSwatch = {
    brand?: string;
    step: Step;
    hex: string;
    on: "#000000" | "#FFFFFF";
    role?: Role;
};
declare const STEPS: Step[];
declare const STATUS_HUES: {
    readonly success: 145;
    readonly warning: 38;
    readonly danger: 4;
    readonly info: 210;
};
declare function normalizeHex(hex: string): string;
declare function isValidHex(hex: string): boolean;
declare function contrastRatio(a: string, b: string): number;
declare function buildRamp(h: number, baseS: number, opts?: {
    neutral?: boolean;
    sMin?: number;
    sMax?: number;
    lHi?: number;
    lLo?: number;
}): Ramp;
declare function buildRampFromHex(hex: string, opts?: {
    neutral?: boolean;
}): Ramp;
declare function buildTheme({ seeds, brandOrder, statusOverrides, options, }: {
    seeds: BrandSeed[];
    brandOrder?: string[];
    statusOverrides?: Partial<Record<keyof typeof STATUS_HUES, string>>;
    options?: {
        neutralHue?: number;
        neutralSat?: number;
    };
}): Theme;
declare function buildThemeQuick(hexes: string[], options?: {
    neutralHue?: number;
    neutralSat?: number;
}): Theme;
type JsonTokens = {
    brands: BrandSet;
    neutral: Ramp;
    status: Theme['status'];
};
declare function toJsonTokens(theme: Theme): JsonTokens;
declare function toCssTokens(theme: Theme, opts?: {
    includeComments?: boolean;
}): string;
declare function pickForRole(theme: Theme, role: Role, mode?: Mode): ResolvedSwatch;

export { type BrandSeed, type BrandSet, type HSL, type JsonTokens, type Mode, type Ramp, type ResolvedSwatch, type Role, STEPS, type Step, type Swatch, type Theme, buildRamp, buildRampFromHex, buildTheme, buildThemeQuick, contrastRatio, isValidHex, normalizeHex, pickForRole, toCssTokens, toJsonTokens };
