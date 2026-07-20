"use client";

import { Bell, ChevronDown, ChevronUp, Flame, User } from "lucide-react";
import { useState } from "react";

import {
  formatPlateDisplay,
  type AdminUserRecord,
  type DashboardVehicle,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type FireExtAlert = {
  vehicle: DashboardVehicle;
  daysLeft: number | null;
};

type OrdAlert = {
  user: AdminUserRecord;
  daysLeft: number | null;
};

type ReminderTrayProps = {
  fireExtAlerts: FireExtAlert[];
  myOrdReminder: number | null;
  ordAlerts: OrdAlert[];
  ordWarningDays: number;
  profileName: string;
  profileUnit: string;
  onOpenVehicle: (vehicle: DashboardVehicle) => void;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

export function ReminderTray({
  fireExtAlerts,
  myOrdReminder,
  ordAlerts,
  ordWarningDays,
  profileName,
  profileUnit,
  onOpenVehicle,
  vehicleUnitLabel,
}: ReminderTrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const alertCount =
    fireExtAlerts.length + ordAlerts.length + (myOrdReminder !== null ? 1 : 0);
  const hasUrgentReminder =
    fireExtAlerts.some((entry) => (entry.daysLeft ?? 0) <= 0) ||
    ordAlerts.some((entry) => entry.daysLeft === 0) ||
    myOrdReminder === 0;

  if (alertCount === 0) return null;

  return (
    <div className="relative z-40">
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-white shadow-lg ring-1 ring-black/5 transition-all",
          isOpen
            ? "absolute right-0 top-11 w-[calc(100vw-1.5rem)] max-w-sm"
            : "w-10 sm:w-auto",
          hasUrgentReminder ? "border-red-200" : "border-amber-200",
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-3 px-2 text-left transition hover:bg-zinc-50 sm:px-3",
            isOpen ? "border-b border-zinc-100" : "",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                hasUrgentReminder
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              <Bell className="size-4" />
            </span>
            <span
              className={cn("min-w-0", isOpen ? "block" : "hidden sm:block")}
            >
              <span className="block text-xs font-black uppercase tracking-wider text-zinc-800">
                Reminders
              </span>
              <span className="block text-[11px] font-semibold text-zinc-500">
                {alertCount} active
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-black",
                hasUrgentReminder
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {alertCount}
            </span>
            {isOpen ? (
              <ChevronUp className="size-4 text-zinc-400" />
            ) : (
              <ChevronDown className="hidden size-4 text-zinc-400 sm:block" />
            )}
          </span>
        </button>

        {isOpen && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-3">
            {fireExtAlerts.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                  <Flame className="size-4" />
                  Fire Extinguisher
                </div>
                <div className="space-y-1.5">
                  {fireExtAlerts.map(({ vehicle, daysLeft }) => (
                    <button
                      type="button"
                      key={vehicle.id}
                      onClick={() => onOpenVehicle(vehicle)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50/70 px-3 py-2 text-left transition hover:bg-red-50"
                    >
                      <span className="min-w-0 text-sm font-bold text-zinc-800">
                        {formatPlateDisplay(vehicle.plate)}
                        <span className="ml-2 text-xs font-semibold text-zinc-400">
                          {vehicleUnitLabel(vehicle)}
                        </span>
                        <span className="ml-2 font-medium text-zinc-500">
                          ({vehicle.variant})
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-bold",
                          (daysLeft ?? 0) < 0
                            ? "text-red-700"
                            : "text-amber-700",
                        )}
                      >
                        {(daysLeft ?? 0) < 0
                          ? `Expired ${Math.abs(daysLeft ?? 0)}d ago`
                          : `Expires in ${daysLeft}d`}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {myOrdReminder !== null && (
              <section className="space-y-2">
                <div
                  className={cn(
                    "flex items-center gap-2 font-bold text-xs uppercase tracking-wider",
                    myOrdReminder === 0 ? "text-red-800" : "text-amber-800",
                  )}
                >
                  <User className="size-4" />
                  My ORD
                </div>
                <div
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium text-zinc-800",
                    myOrdReminder === 0
                      ? "border-red-200 bg-red-50"
                      : "border-amber-100 bg-amber-50/70",
                  )}
                >
                  {profileName}, {profileUnit || "No unit"} due to ORD{" "}
                  {myOrdReminder === 0
                    ? "today"
                    : `within ${ordWarningDays} days`}
                  .
                </div>
              </section>
            )}

            {ordAlerts.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <User className="size-4" />
                  ORD Reminders
                </div>
                <div className="space-y-1.5">
                  {ordAlerts.map(({ user, daysLeft }) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                        daysLeft === 0
                          ? "bg-red-50 border-red-200"
                          : "bg-amber-50/70 border-amber-100",
                      )}
                    >
                      <span className="min-w-0 text-sm font-medium text-zinc-800">
                        {user.name}, {user.unit || user.depot || "No unit"} due
                        to ORD{" "}
                        {daysLeft === 0
                          ? "today"
                          : `within ${ordWarningDays} days`}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-bold",
                          daysLeft === 0 ? "text-red-700" : "text-amber-700",
                        )}
                      >
                        {daysLeft === 0 ? "Remove" : `${daysLeft}d left`}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
