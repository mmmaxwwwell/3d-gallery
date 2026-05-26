export type ScadParamType = 'number' | 'string' | 'text' | 'boolean' | 'vector' | 'enum';

export interface ScadParam {
  name: string;
  type: ScadParamType;
  default: ScadValue;
  help: string;
  options?: string[];
}

export type ScadValue = number | string | boolean | number[];
