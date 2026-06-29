"use client";

import { LogIn, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const errorMessages: Record<string, string> = {
  failed: "sgID could not complete the login. Please try again.",
  invalid_session: "Your login session expired. Please try again.",
  no_code: "sgID did not return a login code. Please try again.",
  no_name: "sgID did not return a name for this account.",
  user_save_failed: "Your sgID login worked, but saving your profile failed.",
};

export default function LoginClient() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? errorMessages[error] : undefined;

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/");
    }
  }, [auth.isAuthenticated, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <Card className="w-full max-w-sm rounded-lg border-zinc-200 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-600 text-white">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Sign in to Parking</CardTitle>
            <CardDescription>
              Use sgID once to continue to the parking dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <Button
            size="lg"
            className="h-11 w-full bg-red-600 hover:bg-red-700"
            onClick={auth.login}
            disabled={auth.isLoading}
          >
            <LogIn className="size-4" aria-hidden="true" />
            {auth.isLoading ? "Checking login..." : "Sign in with sgID"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
