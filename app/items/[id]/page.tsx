"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Countdown } from "@/components/countdown";
import { ItemThumbnail } from "@/components/item-thumbnail";
import { useAuth } from "@/lib/auth-context";
import { createLike, deleteLike, getItemById, getLikes } from "@/lib/api";
import type { Item, Like } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RETRY_POLL_MS = 3000;
const MAX_RETRIES = 10;

function ItemDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);
  const retriesRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadItem = useCallback(async () => {
    if (!token) return null;
    const fresh = await getItemById(id, token);
    setItem(fresh);
    return fresh;
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([getItemById(id, token), getLikes(token)])
      .then(([fetchedItem, fetchedLikes]) => {
        setItem(fetchedItem);
        setLikes(fetchedLikes);
      })
      .finally(() => setLoading(false));

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [id, token]);

  const handleExpire = useCallback(() => {
    retriesRef.current = 0;

    const poll = async () => {
      const fresh = await loadItem();
      retriesRef.current += 1;
      if (fresh && fresh.status === "ACTIVE" && retriesRef.current < MAX_RETRIES) {
        pollTimerRef.current = setTimeout(poll, RETRY_POLL_MS);
      }
    };

    poll();
  }, [loadItem]);

  const myLike = likes.find((l) => l.userId === user?.id && l.itemId === id);

  async function handleLikeToggle() {
    if (!token || !user || !item) return;
    setLikeBusy(true);

    try {
      if (myLike) {
        await deleteLike(myLike.id, token);
        setLikes((prev) => prev.filter((l) => l.id !== myLike.id));
      } else {
        const created = await createLike({ userId: user.id, itemId: item.id }, token);
        setLikes((prev) => [...prev, created]);
      }
    } finally {
      setLikeBusy(false);
    }
  }

  if (loading || !item) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{item.name}</CardTitle>
          <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
            {item.status}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ItemThumbnail
            src={item.imageUrl}
            alt={item.name}
            className="h-48 w-full rounded-lg"
          />
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="text-sm">
            Time remaining:{" "}
            <span className="font-medium">
              <Countdown
                expiresAt={item.expiresAt}
                active={item.status === "ACTIVE"}
                onExpire={handleExpire}
              />
            </span>
          </div>
          <Button onClick={handleLikeToggle} disabled={likeBusy} variant="outline">
            {myLike ? "Unlike" : "Like"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <AuthGuard>
      <ItemDetailContent />
    </AuthGuard>
  );
}
