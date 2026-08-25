"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.replace(token ? "/items" : "/login");
  }, [token, router]);

  return null;
}
