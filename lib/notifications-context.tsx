"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getNotifications, markNotificationAsRead } from "./api";
import { useAuth } from "./auth-context";
import type { Notification } from "./types";

const POLL_MS = 4000;

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;

    async function poll() {
      if (!token || !user) return;
      const all = await getNotifications(token);
      if (cancelled) return;
      const mine = all
        .filter((n) => n.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(mine);
      setLoading(false);
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, user]);

  function markAsRead(id: string) {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    markNotificationAsRead(id, token).catch(() => {});
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
