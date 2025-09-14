import type { CapabilityMatrix } from '../core/types.js';
export declare const BASE_MYSQL_CAPS: CapabilityMatrix;
export declare function refineByServerVersion(base: CapabilityMatrix, versionString: string): CapabilityMatrix;
