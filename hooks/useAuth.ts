"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

const NAME_STORAGE_KEY = "sgid:name";
const OPENID_STORAGE_KEY = "sgid:openid";
const RANK_STORAGE_KEY = "sgid:rank";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [openid, setOpenid] = useState<string | null>(null);
  const [rank, setRankState] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem(NAME_STORAGE_KEY));
    setOpenid(localStorage.getItem(OPENID_STORAGE_KEY));
    setRankState(localStorage.getItem(RANK_STORAGE_KEY));
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    isAuthenticated: !!name && !!openid,
    name,
    openid,
    rank,
    setRank: (newRank: string | null) => {
      if (newRank) {
        localStorage.setItem(RANK_STORAGE_KEY, newRank);
      } else {
        localStorage.removeItem(RANK_STORAGE_KEY);
      }
      setRankState(newRank);
    },
    login: () => {
      window.location.href = "/api/auth/sgid";
    },
    logout: async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout failed on server:", err);
      }
      localStorage.removeItem(NAME_STORAGE_KEY);
      localStorage.removeItem(OPENID_STORAGE_KEY);
      localStorage.removeItem(RANK_STORAGE_KEY);
      setName(null);
      setOpenid(null);
      setRankState(null);
      window.location.reload();
    },
  };
}
