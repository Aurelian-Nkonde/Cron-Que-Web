"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { login as apiLogin, registerUser as apiRegisterUser } from "./api";
import { getCurrentUserFromToken, type CurrentUser } from "./jwt";

const TOKEN_KEY = "cron_que_token";
const EXPIRES_AT_KEY = "cron_que_expires_at";

interface StoredSession {
  token: string;
  expiresAt: string;
  user: CurrentUser;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

// Module-level store backing useSyncExternalStore: localStorage is a
// browser-only API, so reading it has to happen outside render/effects to
// stay hydration-safe. getSnapshot must return a referentially stable value
// until the store actually changes, hence the cache below.
const listeners = new Set<() => void>();
let initialized = false;
let cachedSnapshot: StoredSession | null = null;

function computeSnapshot(): StoredSession | null {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedExpiresAt = localStorage.getItem(EXPIRES_AT_KEY);

  if (storedToken && storedExpiresAt && !isExpired(storedExpiresAt)) {
    return {
      token: storedToken,
      expiresAt: storedExpiresAt,
      user: getCurrentUserFromToken(storedToken),
    };
  }

  return null;
}

function getSnapshot(): StoredSession | null {
  if (!initialized) {
    cachedSnapshot = computeSnapshot();
    initialized = true;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): StoredSession | null {
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSnapshot(next: StoredSession | null) {
  cachedSnapshot = next;
  initialized = true;
  for (const listener of listeners) listener();
}

function writeSession(token: string, expiresAt: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
  setSnapshot({ token, expiresAt, user: getCurrentUserFromToken(token) });
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  setSnapshot(null);
}

interface AuthContextValue {
  token: string | null;
  expiresAt: string | null;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  async function login(email: string, password: string) {
    const res = await apiLogin({ email, password });
    writeSession(res.token, res.expiresAt);
  }

  async function register(name: string, email: string, password: string) {
    await apiRegisterUser({ name, email, password });
    await login(email, password);
  }

  function logout() {
    clearSession();
  }

  return (
    <AuthContext.Provider
      value={{
        token: session?.token ?? null,
        expiresAt: session?.expiresAt ?? null,
        user: session?.user ?? null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
