const getRaw = (key: string) => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const setRaw = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

export const buildUserKey = (userId: string, resource: string) =>
  `tradingJournal.${userId}.${resource}`;

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
