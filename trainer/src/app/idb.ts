// Synchronous macro getter for initial config (returns empty string if not loaded)
let cachedMacros = "";
export function getCachedMacros() {
  return cachedMacros;
}
export async function loadMacrosToCache() {
  cachedMacros = await getMacros();
}
export type ProblemKey = `${string}:${string}`; // `${year}:${problemId}`

export interface ProblemUserData {
  key: ProblemKey;
  year: string;
  problemId: string;
  done: boolean;
  working: boolean;
  notes: string;
  updatedAt: number;
}

const DB_NAME = 'putnam-trainer';
const DB_VERSION = 2;
const STORE = 'problems';
const MACROS_STORE = 'macros';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(MACROS_STORE)) {
        db.createObjectStore(MACROS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
// Macros helpers
export async function getMacros(): Promise<string> {
  const db = await openDB();
  try {
    const res = await tx<{ id: string; value: string } | undefined>(db, 'readonly', (store) => db.transaction(MACROS_STORE, 'readonly').objectStore(MACROS_STORE).get('user'));
    return res?.value ?? "";
  } finally {
    db.close();
  }
}

export async function saveMacros(macros: string): Promise<void> {
  const db = await openDB();
  try {
    await tx(db, 'readwrite', (store) => db.transaction(MACROS_STORE, 'readwrite').objectStore(MACROS_STORE).put({ id: 'user', value: macros }));
  } finally {
    db.close();
  }
}

function tx<T = unknown>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export async function getProblemData(year: string, problemId: string): Promise<ProblemUserData | undefined> {
  const key: ProblemKey = `${year}:${problemId}`;
  const db = await openDB();
  try {
    const res = await tx<ProblemUserData | undefined>(db, 'readonly', (store) => store.get(key));
    return res;
  } finally {
    db.close();
  }
}

export async function saveProblemData(year: string, problemId: string, patch: Partial<Pick<ProblemUserData, 'done' | 'working' | 'notes'>>): Promise<ProblemUserData> {
  const key: ProblemKey = `${year}:${problemId}`;
  const db = await openDB();
  try {
    const existing = await tx<ProblemUserData | undefined>(db, 'readonly', (store) => store.get(key));
    const next: ProblemUserData = {
      key,
      year,
      problemId,
      done: patch.done ?? existing?.done ?? false,
      working: patch.working ?? existing?.working ?? false,
      notes: patch.notes ?? existing?.notes ?? '',
      updatedAt: Date.now(),
    };
    await tx(db, 'readwrite', (store) => store.put(next));
    return next;
  } finally {
    db.close();
  }
}
