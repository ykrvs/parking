"use client";

import { format } from "date-fns";
import { CarFront, Edit2, Plus } from "lucide-react";

import { PercentDot, Skeleton } from "@/components/dashboard/status-indicators";
import { Button } from "@/components/ui/button";
import { formatPlateDisplay } from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type BosVehicle = {
  id: string;
  plate?: string | null;
  vehicle_unit?: string | null;
  variant?: string | null;
  level?: string | null;
  lot?: string | null;
  odometer?: number | string | null;
  engine_hours?: number | string | null;
  starter_v?: number | string | null;
  starter_pct?: number | null;
  aux_v?: number | string | null;
  aux_pct?: number | null;
  fuel_l?: number | string | null;
  fuel_pct?: number | null;
  fire_ext_expiry?: string | null;
};

type FireExtStatus = {
  label: string;
  color: string;
  bg: string;
};

type BosReadingsTabProps = {
  activeFacilityName: string;
  isLoading: boolean;
  isUnverified: boolean;
  vehicles: BosVehicle[];
  getFireExtStatus: (date: string | null) => FireExtStatus;
  onLogVehicleIn: () => void;
  onOpenVehicle: (vehicle: BosVehicle) => void;
  onUpdateVehicle: (vehicle: BosVehicle) => void;
};

function vehicleUnitLabel(vehicle: BosVehicle) {
  return vehicle.vehicle_unit || "No vehicle unit";
}

export function BosReadingsTab({
  activeFacilityName,
  isLoading,
  isUnverified,
  vehicles,
  getFireExtStatus,
  onLogVehicleIn,
  onOpenVehicle,
  onUpdateVehicle,
}: BosReadingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900">
            BOS Readings
          </h2>
          <p className="text-xs font-medium text-zinc-500">
            Active vehicles in {activeFacilityName}
          </p>
        </div>
        <Button
          type="button"
          onClick={onLogVehicleIn}
          className={cn(
            "h-9 text-sm",
            isUnverified
              ? "bg-zinc-300 hover:bg-zinc-300 text-zinc-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700",
          )}
        >
          <Plus className="size-4 mr-1.5" />
          Log Vehicle In
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))
        ) : vehicles.length > 0 ? (
          vehicles.map((vehicle) => {
            const fireStatus = getFireExtStatus(
              vehicle.fire_ext_expiry ?? null,
            );

            return (
              <div
                key={vehicle.id}
                onClick={() => onOpenVehicle(vehicle)}
                className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3 lg:w-52">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      <CarFront className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold text-zinc-900">
                        {formatPlateDisplay(vehicle.plate)}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-zinc-400">
                        {vehicleUnitLabel(vehicle)}
                      </p>
                      <p className="truncate text-xs font-medium text-zinc-500">
                        {vehicle.variant} · {vehicle.level} · Lot {vehicle.lot}
                      </p>
                    </div>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Odometer
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-zinc-800">
                        {vehicle.odometer !== null &&
                        vehicle.odometer !== undefined
                          ? Number(vehicle.odometer).toLocaleString()
                          : "-"}{" "}
                        <span className="text-[10px] font-medium text-zinc-500">
                          km
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Engine
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-zinc-800">
                        {vehicle.engine_hours ?? "-"}{" "}
                        <span className="text-[10px] font-medium text-zinc-500">
                          hrs
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Starter
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-zinc-800">
                        {vehicle.starter_v ?? "--"}V ·{" "}
                        {vehicle.starter_pct ?? 0}%
                        <PercentDot pct={vehicle.starter_pct} />
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Auxiliary
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-zinc-800">
                        {vehicle.aux_v ?? "--"}V · {vehicle.aux_pct ?? 0}%
                        <PercentDot pct={vehicle.aux_pct} />
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Fuel
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-zinc-800">
                        {vehicle.fuel_l ?? "--"}L · {vehicle.fuel_pct ?? 0}%
                        <PercentDot pct={vehicle.fuel_pct} />
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2",
                        fireStatus.bg,
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Fire Ext.
                      </p>
                      <p className={cn("mt-1 text-xs", fireStatus.color)}>
                        {vehicle.fire_ext_expiry
                          ? format(
                              new Date(vehicle.fire_ext_expiry + "T00:00:00"),
                              "dd MMM yyyy",
                            )
                          : "Not recorded"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      onUpdateVehicle(vehicle);
                    }}
                    className="h-9 shrink-0 border-zinc-200 text-xs font-bold"
                  >
                    <Edit2 className="size-3.5 mr-1.5" />
                    Update Record
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-sm font-medium text-zinc-500">
            No active vehicles checked in yet.
          </p>
        )}
      </div>
    </div>
  );
}
