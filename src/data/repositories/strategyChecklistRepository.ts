import { v4 as uuid } from 'uuid';
import type { StrategyChecklistState } from '../models';
import { buildUserKey, loadAll, saveAll } from '../storage/localStorageClient';

const RESOURCE = 'strategyChecklist';

const getKey = (userId: string) => buildUserKey(userId, RESOURCE);

export const getChecklistStates = async (
  userId: string,
  date: string
): Promise<StrategyChecklistState[]> => {
  const allStates = loadAll<StrategyChecklistState>(getKey(userId));
  return allStates.filter((state) => state.date === date);
};

export const setChecklistState = async (
  userId: string,
  date: string,
  strategyId: string,
  itemId: string,
  checked: boolean
): Promise<StrategyChecklistState> => {
  const key = getKey(userId);
  const allStates = loadAll<StrategyChecklistState>(key);
  const existing = allStates.find(
    (state) =>
      state.date === date && state.strategyId === strategyId && state.itemId === itemId && state.userId === userId
  );

  let nextState: StrategyChecklistState;
  if (existing) {
    nextState = { ...existing, checked };
    saveAll(
      key,
      allStates.map((state) => (state.id === existing.id ? nextState : state))
    );
  } else {
    nextState = {
      id: uuid(),
      userId,
      date,
      strategyId,
      itemId,
      checked,
    };
    saveAll(key, [...allStates, nextState]);
  }

  return nextState;
};
