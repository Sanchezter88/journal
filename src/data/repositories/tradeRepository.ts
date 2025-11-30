import { v4 as uuid } from 'uuid';
import type { Trade } from '../models';
import { buildUserKey, loadAll, saveAll } from '../storage/localStorageClient';

const RESOURCE = 'trades';

const getKey = (userId: string) => buildUserKey(userId, RESOURCE);

const sortTrades = (trades: Trade[]) =>
  [...trades].sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });

export const getTrades = async (userId: string): Promise<Trade[]> => {
  const trades = loadAll<Trade>(getKey(userId));
  return sortTrades(trades);
};

export const createTrade = async (
  userId: string,
  input: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Trade> => {
  const key = getKey(userId);
  const trades = loadAll<Trade>(key);
  const now = new Date().toISOString();
  const trade: Trade = {
    ...input,
    id: uuid(),
    userId,
    createdAt: now,
    updatedAt: now,
  };
  const nextTrades = sortTrades([...trades, trade]);
  saveAll(key, nextTrades);
  return trade;
};

export const updateTrade = async (
  userId: string,
  tradeId: string,
  patch: Partial<Trade>
): Promise<Trade> => {
  const key = getKey(userId);
  const trades = loadAll<Trade>(key);
  const existing = trades.find((trade) => trade.id === tradeId);
  if (!existing) {
    throw new Error('Trade not found');
  }
  const updated: Trade = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  const nextTrades = sortTrades(trades.map((trade) => (trade.id === tradeId ? updated : trade)));
  saveAll(key, nextTrades);
  return updated;
};

export const deleteTrade = async (userId: string, tradeId: string): Promise<void> => {
  const key = getKey(userId);
  const trades = loadAll<Trade>(key);
  const nextTrades = trades.filter((trade) => trade.id !== tradeId);
  saveAll(key, nextTrades);
};
