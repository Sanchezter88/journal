import { v4 as uuid } from 'uuid';
import type { Screenshot } from '../models';
import { buildAccountKey, loadAccountCollection, saveAll } from '../storage/localStorageClient';

const RESOURCE = 'screenshots';

const getKey = (userId: string, accountId: string) => buildAccountKey(userId, accountId, RESOURCE);

export const getScreenshotsForDate = async (
  userId: string,
  accountId: string,
  date: string
): Promise<Screenshot[]> => {
  const shots = loadAccountCollection<Screenshot>(userId, accountId, RESOURCE);
  return shots.filter((shot) => shot.date === date);
};

export const addScreenshot = async (
  userId: string,
  accountId: string,
  input: Omit<Screenshot, 'id' | 'userId' | 'createdAt'>
): Promise<Screenshot> => {
  const key = getKey(userId, accountId);
  const shots = loadAccountCollection<Screenshot>(userId, accountId, RESOURCE);
  const now = new Date().toISOString();
  const screenshot: Screenshot = {
    ...input,
    id: uuid(),
    userId,
    createdAt: now,
  };
  saveAll(key, [...shots, screenshot]);
  return screenshot;
};

export const deleteScreenshot = async (
  userId: string,
  accountId: string,
  screenshotId: string
): Promise<void> => {
  const key = getKey(userId, accountId);
  const shots = loadAccountCollection<Screenshot>(userId, accountId, RESOURCE);
  saveAll(
    key,
    shots.filter((shot) => shot.id !== screenshotId)
  );
};
