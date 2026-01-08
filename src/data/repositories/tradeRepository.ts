import { v4 as uuid } from 'uuid';
import type { Trade } from '../models';
import { buildAccountKey, loadAccountCollection, saveAll } from '../storage/localStorageClient';
import { getSessionDate } from '../../utils/tradingDay';

const RESOURCE = 'trades';

const getKey = (userId: string, accountId: string) => buildAccountKey(userId, accountId, RESOURCE);

const sortTrades = (trades: Trade[]) =>
  [...trades].sort((a, b) => {
    const sessionA = getSessionDate(a.date, a.time);
    const sessionB = getSessionDate(b.date, b.time);
    if (sessionA === sessionB) {
      return a.time.localeCompare(b.time);
    }
    return sessionA.localeCompare(sessionB);
  });

export const getTrades = async (userId: string, accountId: string): Promise<Trade[]> => {
  const trades = loadAccountCollection<Trade>(userId, accountId, RESOURCE);
  return sortTrades(trades);
};

export const createTrade = async (
  userId: string,
  accountId: string,
  input: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Trade> => {
  const key = getKey(userId, accountId);
  const trades = loadAccountCollection<Trade>(userId, accountId, RESOURCE);
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
  accountId: string,
  tradeId: string,
  patch: Partial<Trade>
): Promise<Trade> => {
  const key = getKey(userId, accountId);
  const trades = loadAccountCollection<Trade>(userId, accountId, RESOURCE);
  const existing = trades.find((trade) => trade.id === tradeId);
  if (!existing) {
    throw new Error('Trade not found');
  }
  const updated: Trade = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  const nextTrades = sortTrades(trades.map((trade) => (trade.id === tradeId ? updated : trade)));
  saveAll(key, nextTrades);
  return updated;
};

export const deleteTrade = async (userId: string, accountId: string, tradeId: string): Promise<void> => {
  const key = getKey(userId, accountId);
  const trades = loadAccountCollection<Trade>(userId, accountId, RESOURCE);
  const nextTrades = trades.filter((trade) => trade.id !== tradeId);
  saveAll(key, nextTrades);
};
