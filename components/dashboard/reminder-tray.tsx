"use client";

import {
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  User,
  Wrench,
} from "lucide-react";
import { useState } from "react";

import {
  formatPlateDisplay,
  type AnnouncementRecord,
  type AdminUserRecord,
  type DashboardVehicle,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type FireExtAlert = {
  vehicle: DashboardVehicle;
  daysLeft: number | null;
};

type ServicingAlert = {
  vehicle: DashboardVehicle;
  daysLeft: number | null;
};

type OrdAlert = {
  user: AdminUserRecord;
  daysLeft: number | null;
};

type ReminderTrayProps = {
  announcements: AnnouncementRecord[];
  fireExtAlerts: FireExtAlert[];
  myOrdReminder: number | null;
  ordAlerts: OrdAlert[];
  ordWarningDays: number;
  profileName: string;
  profileUnit: string;
  servicingAlerts: ServicingAlert[];
  onOpenAdminUsers: () => void;
  onOpenNotifications: () => void;
  onOpenVehicle: (vehicle: DashboardVehicle) => void;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

export function ReminderTray({
  announcements,
  fireExtAlerts,
  myOrdReminder,
  ordAlerts,
  ordWarningDays,
  profileName,
  profileUnit,
  servicingAlerts,
  onOpenAdminUsers,
  onOpenNotifications,
  onOpenVehicle,
  vehicleUnitLabel,
}: ReminderTrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const alertCount =
    announcements.length +
    fireExtAlerts.length +
    servicingAlerts.length +
    ordAlerts.length +
    (myOrdReminder !== null ? 1 : 0);
  const hasUrgentReminder =
    fireExtAlerts.some((entry) => (entry.daysLeft ?? 0) <= 0) ||
    servicingAlerts.some((entry) => (entry.daysLeft ?? 0) <= 0) ||
    ordAlerts.some((entry) => entry.daysLeft === 0) ||
    myOrdReminder === 0;

  if (alertCount === 0) return null;

  return (
    <div className="relative z-40">
      <div
        className={cn(
          "overflow-visible rounded-lg border bg-white shadow-lg ring-1 ring-black/5 transition-all",
          isOpen
            ? "fixed left-1/2 top-20 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2"
            : "w-8 sm:w-auto",
          hasUrgentReminder ? "border-red-200" : "border-amber-200",
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className={cn(
            "relative flex h-8 w-full items-center gap-3 text-left transition hover:bg-zinc-50 sm:h-10 sm:px-3",
            isOpen
              ? "justify-between border-b border-zinc-100 px-3 pt-2 sm:pt-3"
              : "justify-center px-0 sm:justify-between",
          )}
        >
          <span className="flex min-w-0 items-center justify-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md sm:size-8 sm:rounded-lg",
                hasUrgentReminder
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              <Bell className="size-3.5 sm:size-4" />
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
                "absolute -right-1.5 -top-2 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none shadow-sm sm:static sm:px-2 sm:text-xs sm:shadow-none",
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
          <div className="max-h-[70vh] space-y-4 overflow-y-auto rounded-b-lg p-3 pt-4">
            {announcements.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sky-800 font-bold text-xs uppercase tracking-wider">
                  <Bell className="size-4" />
                  Notifications
                </div>
                <div className="space-y-1.5">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onOpenNotifications();
                        }}
                        className="w-full text-left"
                      >
                        {announcement.title && (
                          <p className="text-sm font-bold text-sky-950">
                            {announcement.title}
                          </p>
                        )}
                        <p className="text-sm font-medium leading-relaxed text-sky-900">
                          {announcement.message}
                        </p>
                      </button>
                      {announcement.link_url && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                announcement.link_url || "",
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
                          >
                            <ExternalLink className="size-3" />
                            {announcement.button_label || "Open link"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

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

            {servicingAlerts.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Wrench className="size-4" />
                  Servicing
                </div>
                <div className="space-y-1.5">
                  {servicingAlerts.map(({ vehicle, daysLeft }) => (
                    <button
                      type="button"
                      key={vehicle.id}
                      onClick={() => onOpenVehicle(vehicle)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-left transition hover:bg-amber-50"
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
                          (daysLeft ?? 0) <= 0
                            ? "text-red-700"
                            : "text-amber-700",
                        )}
                      >
                        {(daysLeft ?? 0) < 0
                          ? `Overdue ${Math.abs(daysLeft ?? 0)}d`
                          : daysLeft === 0
                            ? "Due today"
                            : `Due in ${daysLeft}d`}
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
                      {daysLeft === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenAdminUsers();
                          }}
                          className="shrink-0 rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-700 transition hover:bg-red-200"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-amber-700">
                          {daysLeft}d left
                        </span>
                      )}
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
