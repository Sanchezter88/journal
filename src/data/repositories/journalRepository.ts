import { v4 as uuid } from 'uuid';
import type { JournalEntry } from '../models';
import { buildUserKey, loadAll, saveAll } from '../storage/localStorageClient';

const RESOURCE = 'journalEntries';

const getKey = (userId: string) => buildUserKey(userId, RESOURCE);

export const getJournalEntry = async (
  userId: string,
  date: string
): Promise<JournalEntry | null> => {
  const entries = loadAll<JournalEntry>(getKey(userId));
  return entries.find((entry) => entry.date === date) ?? null;
};

export const upsertJournalEntry = async (
  userId: string,
  date: string,
  notes: string
): Promise<JournalEntry> => {
  const key = getKey(userId);
  const entries = loadAll<JournalEntry>(key);
  const now = new Date().toISOString();
  const existing = entries.find((entry) => entry.date === date);
  let nextEntry: JournalEntry;
  if (existing) {
    nextEntry = { ...existing, notes, updatedAt: now };
    saveAll(
      key,
      entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))
    );
  } else {
    nextEntry = {
      id: uuid(),
      userId,
      date,
      notes,
      createdAt: now,
      updatedAt: now,
    };
    saveAll(key, [...entries, nextEntry]);
  }
  return nextEntry;
};
