"use client";

import { LogIn, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginGateProps = {
  isLoading: boolean;
  onLogin: () => void;
};

export function LoginGate({ isLoading, onLogin }: LoginGateProps) {
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
              Use Singpass once to continue to the parking dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="h-11 w-full bg-red-600 hover:bg-red-700"
            onClick={onLogin}
            disabled={isLoading}
          >
            <LogIn className="size-4" aria-hidden="true" />
            {isLoading ? "Checking login..." : "Sign in with Singpass"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
