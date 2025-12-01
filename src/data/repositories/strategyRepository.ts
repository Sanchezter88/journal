import { v4 as uuid } from 'uuid';
import type { Strategy, StrategyItem } from '../models';
import { buildAccountKey, loadAccountCollection, saveAll } from '../storage/localStorageClient';

const STRATEGIES_RESOURCE = 'strategies';
const ITEMS_RESOURCE = 'strategyItems';

const getStrategiesKey = (userId: string, accountId: string) => buildAccountKey(userId, accountId, STRATEGIES_RESOURCE);
const getItemsKey = (userId: string, accountId: string) => buildAccountKey(userId, accountId, ITEMS_RESOURCE);

export type StrategyUpsertInput = {
  id?: string;
  name: string;
  items: { id?: string; text: string; orderIndex?: number }[];
};

export const getStrategies = async (userId: string, accountId: string): Promise<Strategy[]> => {
  return loadAccountCollection<Strategy>(userId, accountId, STRATEGIES_RESOURCE);
};

export const getStrategyItems = async (
  userId: string,
  accountId: string,
  strategyId: string
): Promise<StrategyItem[]> => {
  const items = loadAccountCollection<StrategyItem>(userId, accountId, ITEMS_RESOURCE);
  return items.filter((item) => item.strategyId === strategyId).sort((a, b) => a.orderIndex - b.orderIndex);
};

export const createOrUpdateStrategy = async (
  userId: string,
  accountId: string,
  input: StrategyUpsertInput
): Promise<{ strategy: Strategy; items: StrategyItem[] }> => {
  const strategiesKey = getStrategiesKey(userId, accountId);
  const itemsKey = getItemsKey(userId, accountId);
  const strategies = loadAccountCollection<Strategy>(userId, accountId, STRATEGIES_RESOURCE);
  const items = loadAccountCollection<StrategyItem>(userId, accountId, ITEMS_RESOURCE);
  const now = new Date().toISOString();

  let strategy: Strategy;
  if (input.id) {
    const existing = strategies.find((s) => s.id === input.id);
    if (!existing) {
      throw new Error('Strategy not found');
    }
    strategy = { ...existing, name: input.name, updatedAt: now };
  } else {
    strategy = {
      id: uuid(),
      userId,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  const nextStrategies = input.id
    ? strategies.map((s) => (s.id === strategy.id ? strategy : s))
    : [...strategies, strategy];

  const normalizedItems: StrategyItem[] = input.items.map((item, index) => ({
    id: item.id ?? uuid(),
    strategyId: strategy.id,
    text: item.text,
    orderIndex: item.orderIndex ?? index,
  }));

  const otherItems = items.filter((item) => item.strategyId !== strategy.id);
  const nextItems = [...otherItems, ...normalizedItems];

  saveAll(strategiesKey, nextStrategies);
  saveAll(itemsKey, nextItems);

  return { strategy, items: normalizedItems.sort((a, b) => a.orderIndex - b.orderIndex) };
};

export const deleteStrategy = async (userId: string, accountId: string, strategyId: string): Promise<void> => {
  const strategiesKey = getStrategiesKey(userId, accountId);
  const itemsKey = getItemsKey(userId, accountId);
  const strategies = loadAccountCollection<Strategy>(userId, accountId, STRATEGIES_RESOURCE);
  const items = loadAccountCollection<StrategyItem>(userId, accountId, ITEMS_RESOURCE);
  saveAll(
    strategiesKey,
    strategies.filter((strategy) => strategy.id !== strategyId)
  );
  saveAll(
    itemsKey,
    items.filter((item) => item.strategyId !== strategyId)
  );
};
