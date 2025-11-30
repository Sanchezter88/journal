import { v4 as uuid } from 'uuid';
import type { Strategy, StrategyItem } from '../models';
import { buildUserKey, loadAll, saveAll } from '../storage/localStorageClient';

const STRATEGIES_RESOURCE = 'strategies';
const ITEMS_RESOURCE = 'strategyItems';

const getStrategiesKey = (userId: string) => buildUserKey(userId, STRATEGIES_RESOURCE);
const getItemsKey = (userId: string) => buildUserKey(userId, ITEMS_RESOURCE);

export type StrategyUpsertInput = {
  id?: string;
  name: string;
  items: { id?: string; text: string; orderIndex?: number }[];
};

export const getStrategies = async (userId: string): Promise<Strategy[]> => {
  return loadAll<Strategy>(getStrategiesKey(userId));
};

export const getStrategyItems = async (userId: string, strategyId: string): Promise<StrategyItem[]> => {
  const items = loadAll<StrategyItem>(getItemsKey(userId));
  return items.filter((item) => item.strategyId === strategyId).sort((a, b) => a.orderIndex - b.orderIndex);
};

export const createOrUpdateStrategy = async (
  userId: string,
  input: StrategyUpsertInput
): Promise<{ strategy: Strategy; items: StrategyItem[] }> => {
  const strategiesKey = getStrategiesKey(userId);
  const itemsKey = getItemsKey(userId);
  const strategies = loadAll<Strategy>(strategiesKey);
  const items = loadAll<StrategyItem>(itemsKey);
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

export const deleteStrategy = async (userId: string, strategyId: string): Promise<void> => {
  const strategiesKey = getStrategiesKey(userId);
  const itemsKey = getItemsKey(userId);
  const strategies = loadAll<Strategy>(strategiesKey);
  const items = loadAll<StrategyItem>(itemsKey);
  saveAll(
    strategiesKey,
    strategies.filter((strategy) => strategy.id !== strategyId)
  );
  saveAll(
    itemsKey,
    items.filter((item) => item.strategyId !== strategyId)
  );
};
