import { Theme } from './palettes/palettes-multibrand.cjs';

declare class ThemeEngine {
    private styleEl;
    private id;
    mode: 'light' | 'dark';
    constructor(id?: string);
    applyHexes(hexes: string[]): Theme;
    setMode(mode: 'light' | 'dark'): void;
}

export { ThemeEngine };
