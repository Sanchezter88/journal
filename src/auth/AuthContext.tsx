import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { User } from '../data/models';

const CURRENT_USER_KEY = 'tradingJournal.currentUser';
const USERS_KEY = 'tradingJournal.users';

type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw) as User);
      } catch (error) {
        console.error('Failed to parse current user', error);
      }
    }
    setLoading(false);
  }, []);

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
  };

  const register = async (email: string) => {
    const user = await upsertUser(email.trim().toLowerCase());
    setCurrentUser(user);
    persistCurrentUser(user);
  };

  const logout = async () => {
    setCurrentUser(null);
    persistCurrentUser(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      login,
      register,
      logout,
    }),
    [currentUser, loading]
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
