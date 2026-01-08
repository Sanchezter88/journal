import React, { createContext, useContext, useMemo, useState } from 'react';
import { addDays, formatISO, parseISO } from 'date-fns';
import type { DayOfWeekFilter, DateRange, FiltersState, TimeRangeOption } from '../models';
import { getCurrentSessionDate } from '../../utils/tradingDay';

const buildDefaultFilters = (): FiltersState => {
  const sessionTodayIso = getCurrentSessionDate();
  const sessionToday = parseISO(sessionTodayIso);
  const start = formatISO(addDays(sessionToday, -30), { representation: 'date' });
  return {
    dateRange: { start, end: sessionTodayIso },
    timeRange: 'ALL',
    dayOfWeek: 'ALL',
    instrument: 'ALL',
  };
};

type FiltersContextValue = {
  filters: FiltersState;
  setDateRange: (range: DateRange) => void;
  setTimeRange: (timeRange: TimeRangeOption) => void;
  setDayOfWeek: (day: DayOfWeekFilter) => void;
  setInstrument: (instrument: string | 'ALL') => void;
  resetFilters: () => void;
};

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

export const FiltersProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [filters, setFilters] = useState<FiltersState>(() => buildDefaultFilters());

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setDateRange: (dateRange) => setFilters((prev) => ({ ...prev, dateRange })),
      setTimeRange: (timeRange) => setFilters((prev) => ({ ...prev, timeRange })),
      setDayOfWeek: (dayOfWeek) => setFilters((prev) => ({ ...prev, dayOfWeek })),
      setInstrument: (instrument) => setFilters((prev) => ({ ...prev, instrument })),
      resetFilters: () => setFilters(buildDefaultFilters()),
    }),
    [filters]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
};

export const useFilters = () => {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return ctx;
};
