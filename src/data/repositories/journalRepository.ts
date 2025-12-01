import { v4 as uuid } from 'uuid';
import type { JournalEntry } from '../models';
import { buildAccountKey, loadAccountCollection, saveAll } from '../storage/localStorageClient';

const RESOURCE = 'journalEntries';

const getKey = (userId: string, accountId: string) => buildAccountKey(userId, accountId, RESOURCE);

export const getJournalEntry = async (
  userId: string,
  accountId: string,
  date: string
): Promise<JournalEntry | null> => {
  const entries = loadAccountCollection<JournalEntry>(userId, accountId, RESOURCE);
  return entries.find((entry) => entry.date === date) ?? null;
};

export const upsertJournalEntry = async (
  userId: string,
  accountId: string,
  date: string,
  notes: string
): Promise<JournalEntry> => {
  const key = getKey(userId, accountId);
  const entries = loadAccountCollection<JournalEntry>(userId, accountId, RESOURCE);
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
