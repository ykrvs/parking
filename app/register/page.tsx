"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  IdCard,
  LogOut,
  Phone,
  User,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { RequiredMark } from "@/components/dashboard/required-mark";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type ProfileResponse = {
  profile: {
    rank: string | null;
    name: string | null;
    ord_date: string | null;
    is_technician: boolean;
    phone: string | null;
    unit: string | null;
    depot?: string | null;
  } | null;
  registrationComplete: boolean;
};

const RANK_CATEGORIES = [
  {
    label: "Enlisted",
    ranks: ["REC", "PTE", "LCP", "CPL", "CFC"],
  },
  {
    label: "Specialists",
    ranks: ["3SG", "2SG", "1SG", "SSG", "MSG", "SCT"],
  },
  {
    label: "Warrant Officers",
    ranks: ["3WO", "2WO", "1WO", "MWO", "SWO", "CWO"],
  },
  {
    label: "Officers",
    ranks: [
      "2LT",
      "LTA",
      "CPT",
      "MAJ",
      "LTC",
      "SLTC",
      "COL",
      "BG",
      "GEN",
      "ADM",
      "OCT",
    ],
  },
  {
    label: "Military Experts",
    ranks: [
      "ME1T",
      "ME1",
      "ME2",
      "ME3",
      "ME4T",
      "ME4A",
      "ME4",
      "ME5",
      "ME6",
      "ME7",
      "ME8",
    ],
  },
];

// Timezone-safe parser for YYYY-MM-DD strings
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
};

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  const [rank, setRank] = useState("");
  const [ordDate, setOrdDate] = useState("");
  const [isTechnician, setIsTechnician] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated || !auth.openid) {
      router.replace("/");
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch(
          `/api/users/me?openid=${encodeURIComponent(auth.openid!)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as ProfileResponse;

        if (data.registrationComplete) {
          router.replace("/");
          return;
        }

        setRank(data.profile?.rank ?? "");
        setName(data.profile?.name ?? auth.name ?? "");
        setOrdDate(data.profile?.ord_date?.slice(0, 10) ?? "");
        setIsTechnician(data.profile?.is_technician ?? false);
        setPhone(data.profile?.phone ?? "");
        setUnit(data.profile?.unit ?? data.profile?.depot ?? "");
      } catch (profileError) {
        if (!controller.signal.aborted) {
          console.error("[register] Failed to load profile", profileError);
          setError(
            "Could not load your profile. Please refresh and try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [auth.isAuthenticated, auth.isLoading, auth.name, auth.openid, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth.openid) return;

    if (!rank) {
      setError("Please select a rank.");
      return;
    }

    if (!ordDate) {
      setError("Please select an ORD date.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!unit.trim()) {
      setError("Please enter your unit.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          openid: auth.openid,
          name,
          rank,
          ordDate,
          isTechnician,
          phone,
          unit,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save registration.");
      }

      auth.setRank(rank);

      router.replace("/");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save registration.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (auth.isLoading || !auth.isAuthenticated || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
        <p className="text-sm text-zinc-500">Loading registration...</p>
      </main>
    );
  }

  const selectedDate = parseLocalDate(ordDate);
  const currentYear = new Date().getFullYear();
  const selectedYear = selectedDate?.getFullYear() ?? currentYear;
  const ordCalendarStart = new Date(Math.min(currentYear - 5, selectedYear), 0);
  const ordCalendarEnd = new Date(Math.max(currentYear + 45, selectedYear), 11);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <Card className="w-full max-w-lg rounded-lg border-zinc-200 shadow-sm">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl">Complete your profile</CardTitle>
          <CardDescription>
            Add your details before continuing to the parking dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4 text-red-700" aria-hidden="true" />
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="size-4 text-red-700" aria-hidden="true" />
                Rank
                <RequiredMark />
              </label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger className="w-full h-10 bg-white border-zinc-200 focus:border-red-600 focus:ring-3 focus:ring-red-600/15 justify-between">
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white border border-zinc-200 shadow-md rounded-md">
                  {RANK_CATEGORIES.map((category) => (
                    <SelectGroup key={category.label}>
                      <SelectLabel className="px-2 py-1 text-xs font-semibold text-zinc-500 bg-zinc-50/50">
                        {category.label}
                      </SelectLabel>
                      {category.ranks.map((r) => (
                        <SelectItem
                          key={r}
                          value={r}
                          className="cursor-pointer"
                        >
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon
                  className="size-4 text-red-700"
                  aria-hidden="true"
                />
                ORD date
                <RequiredMark />
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-10 bg-white border border-zinc-200 px-3 text-left font-normal justify-between transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 hover:bg-zinc-50",
                      !ordDate && "text-muted-foreground",
                    )}
                  >
                    <span>
                      {selectedDate
                        ? format(selectedDate, "dd MMM yyyy")
                        : "Select date"}
                    </span>
                    <CalendarIcon
                      className="size-4 text-zinc-400"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white border border-zinc-200 shadow-md rounded-md"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    captionLayout="dropdown"
                    navLayout="after"
                    startMonth={ordCalendarStart}
                    endMonth={ordCalendarEnd}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        setOrdDate(`${year}-${month}-${day}`);
                      } else {
                        setOrdDate("");
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="size-4 text-red-700" aria-hidden="true" />
                  Phone
                  <RequiredMark />
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+65 9XXX XXXX"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <IdCard className="size-4 text-red-700" aria-hidden="true" />
                  Unit
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="e.g. Alpha Coy"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                />
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Wrench className="size-4 text-red-700" aria-hidden="true" />
                Technician
              </span>
              <input
                className="size-4 accent-red-700"
                type="checkbox"
                checked={isTechnician}
                onChange={(event) => setIsTechnician(event.target.checked)}
              />
            </label>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={auth.logout}>
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
