import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { TradingAccount, User } from '../data/models';
import { clearAccountResource } from '../data/storage/localStorageClient';

const CURRENT_USER_KEY = 'tradingJournal.currentUser';
const USERS_KEY = 'tradingJournal.users';
const accountListKey = (userId: string) => `tradingJournal.${userId}.accounts`;
const selectedAccountKey = (userId: string) => `tradingJournal.${userId}.selectedAccount`;
const ACCOUNT_RESOURCES = ['trades', 'journalEntries', 'strategies', 'strategyItems', 'strategyChecklist', 'screenshots'] as const;

type AuthContextValue = {
  currentUser: User | null;
  currentAccount: TradingAccount | null;
  accounts: TradingAccount[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectAccount: (accountId: string) => void;
  addAccount: (name: string) => Promise<void>;
  renameAccount: (accountId: string, name: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const loadUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as User[];
  } catch (error) {
    console.error('Failed to parse stored users', error);
    return [];
  }
};

const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const persistCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
};

const loadAccounts = (userId: string): TradingAccount[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(accountListKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TradingAccount[];
  } catch (error) {
    console.error('Failed to parse accounts', error);
    return [];
  }
};

const saveAccounts = (userId: string, accounts: TradingAccount[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(accountListKey(userId), JSON.stringify(accounts));
};

const loadSelectedAccountId = (userId: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(selectedAccountKey(userId));
};

const persistSelectedAccountId = (userId: string, accountId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(selectedAccountKey(userId), accountId);
};

const migrateLegacyDataToAccount = (userId: string, accountId: string) => {
  if (typeof window === 'undefined') return;
  ACCOUNT_RESOURCES.forEach((resource) => {
    const legacyKey = `tradingJournal.${userId}.${resource}`;
    const scopedKey = `tradingJournal.${userId}.${accountId}.${resource}`;
    const legacyValue = window.localStorage.getItem(legacyKey);
    if (legacyValue && !window.localStorage.getItem(scopedKey)) {
      window.localStorage.setItem(scopedKey, legacyValue);
      window.localStorage.removeItem(legacyKey);
    }
  });
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureAccounts = useCallback((user: User): TradingAccount[] => {
    let list = loadAccounts(user.id);
    if (list.length === 0) {
      const now = new Date().toISOString();
      const defaultAccount: TradingAccount = {
        id: uuid(),
        userId: user.id,
        name: 'Account 1',
        createdAt: now,
        updatedAt: now,
      };
      list = [defaultAccount];
      saveAccounts(user.id, list);
      migrateLegacyDataToAccount(user.id, defaultAccount.id);
    }
    return list;
  }, []);

  const hydrateAccounts = useCallback(
    (user: User) => {
      const list = ensureAccounts(user);
      setAccounts(list);
      const storedAccountId = loadSelectedAccountId(user.id);
      const nextAccountId =
        storedAccountId && list.some((account) => account.id === storedAccountId)
          ? storedAccountId
          : list[0]?.id ?? null;
      if (nextAccountId) {
        persistSelectedAccountId(user.id, nextAccountId);
      }
      setSelectedAccountId(nextAccountId);
    },
    [ensureAccounts]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        const storedUser = JSON.parse(raw) as User;
        setCurrentUser(storedUser);
        hydrateAccounts(storedUser);
      } catch (error) {
        console.error('Failed to parse current user', error);
      }
    }
    setLoading(false);
  }, [hydrateAccounts]);

  useEffect(() => {
    if (!currentUser) {
      setAccounts([]);
      setSelectedAccountId(null);
    }
  }, [currentUser]);

  const currentAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    if (selectedAccountId) {
      const match = accounts.find((account) => account.id === selectedAccountId);
      if (match) return match;
    }
    return accounts[0];
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (!currentUser) return;
    if (accounts.length === 0) return;
    if (selectedAccountId) return;
    const fallbackId = accounts[0]?.id;
    if (fallbackId) {
      setSelectedAccountId(fallbackId);
      persistSelectedAccountId(currentUser.id, fallbackId);
    }
  }, [accounts, selectedAccountId, currentUser]);

  const upsertUser = async (email: string): Promise<User> => {
    const now = new Date().toISOString();
    const users = loadUsers();
    const existing = users.find((user) => user.email === email);
    if (existing) {
      const nextUser = { ...existing, updatedAt: now };
      const updatedUsers = users.map((u) => (u.id === nextUser.id ? nextUser : u));
      saveUsers(updatedUsers);
      return nextUser;
    }
    const newUser: User = {
      id: uuid(),
      email,
      createdAt: now,
      updatedAt: now,
    };
    saveUsers([...users, newUser]);
    return newUser;
  };

  const login = async (email: string) => {
    const user = await upsertUser(email.trim().toLowerCase());
    setCurrentUser(user);
    persistCurrentUser(user);
    hydrateAccounts(user);
  };

  const register = async (email: string) => {
    const user = await upsertUser(email.trim().toLowerCase());
    setCurrentUser(user);
    persistCurrentUser(user);
    hydrateAccounts(user);
  };

  const logout = async () => {
    setCurrentUser(null);
    setAccounts([]);
    setSelectedAccountId(null);
    persistCurrentUser(null);
  };

  const selectAccount = (accountId: string) => {
    if (!currentUser) return;
    const exists = accounts.some((account) => account.id === accountId);
    if (!exists) return;
    setSelectedAccountId(accountId);
    persistSelectedAccountId(currentUser.id, accountId);
  };

  const addAccount = async (name: string) => {
    if (!currentUser) return;
    const trimmed = name.trim() || `Account ${accounts.length + 1}`;
    const now = new Date().toISOString();
    const newAccount: TradingAccount = {
      id: uuid(),
      userId: currentUser.id,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    const nextAccounts = [...accounts, newAccount];
    setAccounts(nextAccounts);
    saveAccounts(currentUser.id, nextAccounts);
    setSelectedAccountId(newAccount.id);
    persistSelectedAccountId(currentUser.id, newAccount.id);
  };

  const renameAccount = async (accountId: string, name: string) => {
    if (!currentUser) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const nextAccounts = accounts.map((account) =>
      account.id === accountId ? { ...account, name: trimmed, updatedAt: new Date().toISOString() } : account
    );
    setAccounts(nextAccounts);
    saveAccounts(currentUser.id, nextAccounts);
  };

  const deleteAccount = async (accountId: string) => {
    if (!currentUser) return;
    if (accounts.length <= 1) {
      throw new Error('At least one account is required.');
    }
    const remaining = accounts.filter((account) => account.id !== accountId);
    if (remaining.length === accounts.length) return;
    setAccounts(remaining);
    saveAccounts(currentUser.id, remaining);
    ACCOUNT_RESOURCES.forEach((resource) => clearAccountResource(currentUser.id, accountId, resource));
    if (selectedAccountId === accountId) {
      const fallbackId = remaining[0]?.id ?? null;
      setSelectedAccountId(fallbackId);
      if (fallbackId) {
        persistSelectedAccountId(currentUser.id, fallbackId);
      }
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      currentAccount,
      accounts,
      loading,
      login,
      register,
      logout,
      selectAccount,
      addAccount,
      renameAccount,
      deleteAccount,
    }),
    [currentUser, currentAccount, accounts, loading, login, register, logout, selectAccount, addAccount, renameAccount, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
