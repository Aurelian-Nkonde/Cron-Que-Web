"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { getNotifications, markNotificationAsRead } from "./api";
import { useAuth } from "./auth-context";
import type { Notification } from "./types";

const POLL_MS = 4000;

export type NotificationConnectionState = "Disconnected" | "Connecting" | "Connected" | "Reconnecting";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  connectionState: NotificationConnectionState;
  markAsRead: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function sortByCreatedAtDesc(list: Notification[]): Notification[] {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<NotificationConnectionState>("Disconnected");

  // Poll: source of truth and a fallback for whatever the live push misses (missed events, dropped socket, etc).
  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;

    async function poll() {
      if (!token || !user) return;
      const all = await getNotifications(token);
      if (cancelled) return;
      const mine = all.filter((n) => n.userId === user.id);
      setNotifications(sortByCreatedAtDesc(mine));
      setLoading(false);
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, user]);

  // Live push over SignalR: merges new notifications in immediately instead of waiting for the next poll tick.
  useEffect(() => {
    if (!token || !user) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hubs/notifications`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (incoming: Notification) => {
      if (incoming.userId !== user.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return sortByCreatedAtDesc([incoming, ...prev]);
      });
    });

    connection.onreconnecting(() => setConnectionState("Reconnecting"));
    connection.onreconnected(() => setConnectionState("Connected"));
    connection.onclose(() => setConnectionState("Disconnected"));

    setConnectionState("Connecting");
    connection
      .start()
      .then(() => setConnectionState("Connected"))
      .catch((err) => {
        console.error("SignalR notifications connection failed: ", err);
        setConnectionState("Disconnected");
      });

    return () => {
      connection.off("ReceiveNotification");
      connection.stop();
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
      value={{ notifications, unreadCount, loading, connectionState, markAsRead }}
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
