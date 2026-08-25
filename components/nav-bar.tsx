"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NavBar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link href="/items">Items</Link>
        <Link href="/notifications" className="flex items-center gap-1.5">
          Notifications
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
        </Link>
        <Link href="/jobs">Jobs</Link>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-muted-foreground">{user.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
