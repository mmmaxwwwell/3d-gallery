/** Base class for every error this module throws. `code` is part of the public API. */
export class GalleryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/** A manifest failed schema validation. `issues` lists every problem found, not just the first. */
export class ManifestError extends GalleryError {
  readonly issues: string[];

  constructor(issues: string[]) {
    super('E_MANIFEST', `Invalid manifest (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n  - ${issues.join('\n  - ')}`);
    this.issues = issues;
  }
}

/** A parameter value is not acceptable for its declared schema entry. */
export class ParamError extends GalleryError {
  readonly param: string;

  constructor(param: string, message: string) {
    super('E_PARAM', `Parameter "${param}": ${message}`);
    this.param = param;
  }
}

/** A render request did not hash to the artifact key it was presented under. */
export class KeyMismatchError extends GalleryError {
  constructor(expected: string, actual: string) {
    super('E_KEY_MISMATCH', `Render request hashes to ${actual}, but was requested under ${expected}`);
  }
}
