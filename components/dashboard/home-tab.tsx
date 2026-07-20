"use client";

import { CarFront, Plus, ShieldCheck, User } from "lucide-react";

import { Skeleton } from "@/components/dashboard/status-indicators";
import { Button } from "@/components/ui/button";
import {
  formatPlateDisplay,
  getLevelLots,
  getLotOccupancyClasses,
  type DashboardVehicle,
  type ParkingLevelConfig,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type HomeTabProps = {
  activeFacilityName: string;
  counts: Record<string, number>;
  isLoading: boolean;
  isUnverified: boolean;
  parkingLevels: ParkingLevelConfig[];
  recentVehicles: DashboardVehicle[];
  safetyDate: string;
  safetyMessage: string;
  vehicleCount: number;
  formatTimeAgo: (iso?: string | null) => string;
  onLogVehicleIn: () => void;
  onOpenParkingLevel: (levelId: string) => void;
  onOpenVehicle: (vehicle: DashboardVehicle) => void;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

export function HomeTab({
  activeFacilityName,
  counts,
  isLoading,
  isUnverified,
  parkingLevels,
  recentVehicles,
  safetyDate,
  safetyMessage,
  vehicleCount,
  formatTimeAgo,
  onLogVehicleIn,
  onOpenParkingLevel,
  onOpenVehicle,
  vehicleUnitLabel,
}: HomeTabProps) {
  return (
    <div className="space-y-6">
      {isUnverified && (
        <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-zinc-700 font-bold text-xs uppercase tracking-wider">
            <User className="size-4" />
            Pending Verification
          </div>
          <p className="text-zinc-600 text-sm font-medium">
            Your account has not been verified by an admin yet. You can look
            around, but you will not be able to check vehicles in/out or edit
            records until you are verified.
          </p>
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="size-4" />
          Safety Message of the Day
        </div>
        <p className="text-zinc-800 text-sm sm:text-base font-medium leading-relaxed italic">
          &quot;{safetyMessage}&quot;
        </p>
        <p className="text-zinc-500 text-[11px] font-medium">{safetyDate}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-500 tracking-wider uppercase">
          Quick Actions
        </h2>
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

      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
            {parkingLevels.map((level) => (
              <Skeleton
                key={level.id}
                className="h-16 w-full sm:w-24 rounded-lg"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <div className="text-5xl font-black tracking-tight text-red-600">
              {vehicleCount}
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
              Vehicles currently parked in {activeFacilityName}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
            {parkingLevels.map((level) => {
              const count = counts[level.id] || 0;
              const levelTotal = level.totalLots ?? getLevelLots(level).length;
              const occupancyClasses = getLotOccupancyClasses(
                count,
                levelTotal,
              );

              return (
                <button
                  type="button"
                  key={level.id}
                  onClick={() => onOpenParkingLevel(level.id)}
                  className={cn(
                    "cursor-pointer border rounded-lg p-3 w-full sm:w-24 text-center transition-colors shadow-xs",
                    occupancyClasses.box ||
                      "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
                  )}
                >
                  <div className="text-lg font-black text-zinc-800">
                    {count}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">
                    {level.icon || level.id}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 tracking-wider uppercase">
          Recently Checked In
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-4"
              >
                <Skeleton className="size-10 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : recentVehicles.length > 0 ? (
            recentVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onOpenVehicle(vehicle)}
                className="cursor-pointer bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xs p-4 rounded-xl flex items-center justify-between gap-4 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-zinc-100 text-zinc-600 rounded-lg flex items-center justify-center">
                    <CarFront className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900">
                      {formatPlateDisplay(vehicle.plate)}
                    </div>
                    <p className="text-[11px] font-semibold text-zinc-400">
                      {vehicleUnitLabel(vehicle)}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium">
                      {vehicle.variant} - {vehicle.level} - Lot {vehicle.lot}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-red-600 font-semibold">
                    {formatTimeAgo(vehicle.check_in)}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                    {vehicle.driver || "-"}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-zinc-500 text-sm py-4 text-center col-span-full font-medium">
              No active vehicles checked in yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
