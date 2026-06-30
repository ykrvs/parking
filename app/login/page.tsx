import { Suspense } from "react";

import LoginClient from "@/app/login/LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
          <p className="text-sm text-zinc-500">Loading...</p>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
