export type ScadParamType = 'number' | 'string' | 'text' | 'boolean' | 'vector' | 'enum';

export interface ScadParam {
  name: string;
  type: ScadParamType;
  default: ScadValue;
  help: string;
  options?: string[];
}

export type ScadValue = number | string | boolean | number[];

/** Output formats the build pipeline knows how to produce. */
export type ArtifactFormat = 'stl' | '3mf';

export const ARTIFACT_FORMATS: readonly ArtifactFormat[] = ['stl', '3mf'];

/**
 * Everything needed to render one artifact. Doubles as the payload a client
 * sends alongside a cache-missing artifact URL — see `encodeRenderRequest`.
 */
export interface RenderRequest {
  slug: string;
  /** Module name, or the `parts/`/`previews/` file base name. */
  target: string;
  format: ArtifactFormat;
  /** Raw user values. Canonicalized against the param schema before hashing. */
  params?: Record<string, ScadValue>;
}
