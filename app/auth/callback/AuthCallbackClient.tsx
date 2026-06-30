"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackClient() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const name = params.get("name");
    const openid = params.get("openid");
    const error = params.get("error");

    if (error) {
      console.error("[sgID] Auth error:", error);
    } else if (name && openid) {
      localStorage.setItem("sgid:name", name);
      localStorage.setItem("sgid:openid", openid);
    }

    router.replace("/");
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-zinc-500">Logging you in...</p>
    </div>
  );
}
