"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ItemThumbnail({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-[10px] text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- arbitrary
  // user-supplied URLs, not project-local assets next/image can optimize
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("h-12 w-12 rounded-md border object-cover", className)}
    />
  );
}
