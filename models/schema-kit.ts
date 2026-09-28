import { z } from 'zod';

// Shared by every models/<slug>/schema.ts. The customizer prints an issue's
// message after the parameter's name, so each one is a predicate:
// "spool_diameter must be at least 100".

export function between(min: number, max: number) {
  return z.number()
    .min(min, `must be at least ${min}`)
    .max(max, `must be at most ${max}`);
}

export function wholeBetween(min: number, max: number) {
  return between(min, max).int('must be a whole number');
}

export { z };
