"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Countdown({
  expiresAt,
  active,
  onExpire,
}: {
  expiresAt: string;
  active: boolean;
  onExpire: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active]);

  const msRemaining = new Date(expiresAt).getTime() - now;

  useEffect(() => {
    if (active && msRemaining <= 0) {
      onExpire();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, msRemaining <= 0]);

  if (!active) {
    return <span>Expired</span>;
  }

  return <span>{formatRemaining(msRemaining)}</span>;
}
