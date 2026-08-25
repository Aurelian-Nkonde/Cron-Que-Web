"use client";

import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useNotifications } from "@/lib/notifications-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function NotificationsContent() {
  const { notifications, loading, markAsRead } = useNotifications();

  useEffect(() => {
    for (const n of notifications) {
      if (!n.isRead) markAsRead(n.id);
    }
  }, [notifications, markAsRead]);

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {notifications.map((n) => (
                <li key={n.id} className="border-b pb-3 last:border-none">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
