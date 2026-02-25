"use client";

import { useState, useEffect, useCallback } from "react";
import { type User } from "firebase/auth";
import { onAuthChange, signOut } from "@/lib/firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  return { user, loading, logout };
}
