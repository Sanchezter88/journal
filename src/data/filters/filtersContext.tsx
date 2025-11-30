import React, { createContext, useContext, useMemo, useState } from 'react';
import { addDays, formatISO } from 'date-fns';
import type { DayOfWeekFilter, DateRange, FiltersState, TimeRangeOption } from '../models';

const today = new Date();
const thirtyDaysAgo = addDays(today, -30);

const defaultFilters: FiltersState = {
  dateRange: {
    start: formatISO(thirtyDaysAgo, { representation: 'date' }),
    end: formatISO(today, { representation: 'date' }),
  },
  timeRange: 'ALL',
  dayOfWeek: 'ALL',
  instrument: 'ALL',
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
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setDateRange: (dateRange) => setFilters((prev) => ({ ...prev, dateRange })),
      setTimeRange: (timeRange) => setFilters((prev) => ({ ...prev, timeRange })),
      setDayOfWeek: (dayOfWeek) => setFilters((prev) => ({ ...prev, dayOfWeek })),
      setInstrument: (instrument) => setFilters((prev) => ({ ...prev, instrument })),
      resetFilters: () => setFilters(defaultFilters),
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
