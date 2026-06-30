import { Suspense } from "react";

import AuthCallbackClient from "@/app/auth/callback/AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-zinc-500">Logging you in...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
