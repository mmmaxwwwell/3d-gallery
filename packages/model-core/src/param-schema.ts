import type { ScadValue } from './types.ts';

/**
 * A model's input schema (`models/<slug>/schema.ts`), as any Standard Schema
 * validator — https://standardschema.dev. The schemas are zod; this package
 * sees only the interface, which keeps it free of dependencies.
 */
export interface ParamsSchema {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => StandardResult | Promise<StandardResult>;
  };
}

type StandardPathSegment = PropertyKey | { readonly key: PropertyKey };

type StandardResult =
  | { readonly value: unknown; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<{ readonly message: string; readonly path?: ReadonlyArray<StandardPathSegment> }> };

export interface ParamIssue {
  /** The parameter at fault, or null for a rule about the set as a whole. */
  param: string | null;
  /** A predicate that reads after the parameter's name: "must be at least 100". */
  message: string;
}

/** Every rule `values` breaks; empty when the model can be rendered from them. */
export function validateParams(schema: ParamsSchema, values: Record<string, ScadValue>): ParamIssue[] {
  const result = schema['~standard'].validate(values);
  // The customizer checks on every keystroke, so a schema must answer at once.
  if (result instanceof Promise) throw new Error('A model input schema must validate synchronously');
  if (!result.issues) return [];
  return result.issues.map((issue) => {
    const head = issue.path?.[0];
    const key = typeof head === 'object' ? head.key : head;
    return { param: key === undefined ? null : String(key), message: issue.message };
  });
}
