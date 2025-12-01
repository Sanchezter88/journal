const getRaw = (key: string) => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const setRaw = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

const removeRaw = (key: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
};

export const buildUserKey = (userId: string, resource: string) =>
  `tradingJournal.${userId}.${resource}`;

const buildLegacyKey = (userId: string, resource: string) => buildUserKey(userId, resource);

export const buildAccountKey = (userId: string, accountId: string, resource: string) =>
  `tradingJournal.${userId}.${accountId}.${resource}`;

export function loadAll<T>(key: string): T[] {
  const raw = getRaw(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch (error) {
    console.error('Failed to parse localStorage for key', key, error);
    return [];
  }
}

export function saveAll<T>(key: string, items: T[]): void {
  setRaw(key, JSON.stringify(items));
}

export const loadAccountCollection = <T>(userId: string, accountId: string, resource: string): T[] => {
  if (!userId || !accountId) return [];
  const scopedKey = buildAccountKey(userId, accountId, resource);
  const scopedItems = loadAll<T>(scopedKey);
  if (scopedItems.length > 0) {
    return scopedItems;
  }
  const legacyKey = buildLegacyKey(userId, resource);
  const legacyItems = loadAll<T>(legacyKey);
  if (legacyItems.length > 0) {
    saveAll(scopedKey, legacyItems);
    removeRaw(legacyKey);
  }
  return legacyItems;
};

export const clearAccountResource = (userId: string, accountId: string, resource: string) => {
  if (!userId || !accountId) return;
  const key = buildAccountKey(userId, accountId, resource);
  removeRaw(key);
};
