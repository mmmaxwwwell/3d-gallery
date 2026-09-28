import type { ParamsSchema } from "@3d-gallery/model-core";

const modules = import.meta.glob<{ default: ParamsSchema }>("../../../models/*/schema.ts", { eager: true });

/** Each model's input schema (`models/<slug>/schema.ts`), keyed by slug. */
export const PARAM_SCHEMAS: Record<string, ParamsSchema> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [path.split("/").at(-2)!, mod.default]),
);
