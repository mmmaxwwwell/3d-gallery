/** Where a set of artifact bytes came from. Useful for logging and for tests. */
export type ArtifactSource = 'memory' | 'cache' | 'network' | 'local';

export interface ArtifactCache {
  get(key: string): Promise<ArrayBuffer | null>;
  put(key: string, bytes: ArrayBuffer): Promise<void>;
  clear(): Promise<void>;
}

/** Always available, always correct, never survives a reload. */
export function createMemoryCache(): ArtifactCache {
  const map = new Map<string, ArrayBuffer>();
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async put(key, bytes) {
      map.set(key, bytes);
    },
    async clear() {
      map.clear();
    },
  };
}

const DB_NAME = '3d-gallery-artifacts';
const STORE = 'artifacts';

function openDb(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Artifact bytes keyed by content hash.
 *
 * IndexedDB rather than localStorage: a 3MF runs to hundreds of kilobytes, and
 * localStorage caps at ~5MB *and* needs base64, which inflates binary by a
 * third. Keys are content hashes, so entries never go stale — an edited model
 * simply stops being asked for.
 *
 * Falls back to an in-memory cache when IndexedDB is unavailable (private
 * browsing, some embedded webviews) rather than failing the render.
 */
export function createIdbCache(dbName = DB_NAME): ArtifactCache {
  const memory = createMemoryCache();
  let dbPromise: Promise<IDBDatabase | null> | null = null;

  function db(): Promise<IDBDatabase | null> {
    dbPromise ??= (typeof indexedDB === 'undefined'
      ? Promise.resolve(null)
      : openDb(dbName).catch(() => null));
    return dbPromise;
  }

  function transact<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
    return db().then((database) => {
      if (!database) return null;
      return new Promise<T | null>((resolve) => {
        try {
          const tx = database.transaction(STORE, mode);
          const request = fn(tx.objectStore(STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    });
  }

  return {
    async get(key) {
      const hit = await memory.get(key);
      if (hit) return hit;
      const stored = await transact<ArrayBuffer>('readonly', (s) => s.get(key) as IDBRequest<ArrayBuffer>);
      if (stored) await memory.put(key, stored);
      return stored;
    },

    async put(key, bytes) {
      await memory.put(key, bytes);
      await transact('readwrite', (s) => s.put(bytes, key) as IDBRequest<IDBValidKey>);
    },

    async clear() {
      await memory.clear();
      await transact('readwrite', (s) => s.clear());
    },
  };
}
