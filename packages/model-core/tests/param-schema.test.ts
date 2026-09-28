import { describe, it, expect } from 'vitest';
import { validateParams, type ParamsSchema } from '../src/param-schema.ts';

function schemaReturning(result: unknown): ParamsSchema {
  return { '~standard': { version: 1, vendor: 'test', validate: () => result as never } };
}

describe('validateParams', () => {
  it('returns nothing for values the schema accepts', () => {
    expect(validateParams(schemaReturning({ value: {} }), { width: 40 })).toEqual([]);
  });

  it('pins an issue to the first path segment, in either Standard Schema form', () => {
    const schema = schemaReturning({
      issues: [
        { message: 'must be at least 100', path: ['spool_diameter'] },
        { message: 'must be a whole number', path: [{ key: 'lanes' }] },
      ],
    });
    expect(validateParams(schema, {})).toEqual([
      { param: 'spool_diameter', message: 'must be at least 100' },
      { param: 'lanes', message: 'must be a whole number' },
    ]);
  });

  it('leaves an issue with no path on the set as a whole', () => {
    const schema = schemaReturning({ issues: [{ message: 'the stand is wider than the box' }] });
    expect(validateParams(schema, {})).toEqual([{ param: null, message: 'the stand is wider than the box' }]);
  });

  it('refuses an asynchronous schema', () => {
    expect(() => validateParams(schemaReturning(Promise.resolve({ value: {} })), {})).toThrow(/synchronously/);
  });
});
