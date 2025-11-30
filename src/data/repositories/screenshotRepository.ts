import { v4 as uuid } from 'uuid';
import type { Screenshot } from '../models';
import { buildUserKey, loadAll, saveAll } from '../storage/localStorageClient';

const RESOURCE = 'screenshots';

const getKey = (userId: string) => buildUserKey(userId, RESOURCE);

export const getScreenshotsForDate = async (userId: string, date: string): Promise<Screenshot[]> => {
  const shots = loadAll<Screenshot>(getKey(userId));
  return shots.filter((shot) => shot.date === date);
};

export const addScreenshot = async (
  userId: string,
  input: Omit<Screenshot, 'id' | 'userId' | 'createdAt'>
): Promise<Screenshot> => {
  const key = getKey(userId);
  const shots = loadAll<Screenshot>(key);
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

export const deleteScreenshot = async (userId: string, screenshotId: string): Promise<void> => {
  const key = getKey(userId);
  const shots = loadAll<Screenshot>(key);
  saveAll(
    key,
    shots.filter((shot) => shot.id !== screenshotId)
  );
};
