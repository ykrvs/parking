"use client";

import { CarFront, Search } from "lucide-react";

import { Skeleton } from "@/components/dashboard/status-indicators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPlateDisplay } from "@/lib/dashboard/dashboard-data";

type SearchVehicle = {
  id: string;
  plate?: string | null;
  vehicle_unit?: string | null;
  variant?: string | null;
  level?: string | null;
  lot?: string | null;
  check_in?: string | null;
  driver?: string | null;
};

type VehicleUnitOption = {
  id: string;
  name: string;
};

type SearchVehiclesTabProps = {
  filteredVehicles: SearchVehicle[];
  isLoading: boolean;
  searchQuery: string;
  searchVehicleUnit: string;
  vehicleUnits: VehicleUnitOption[];
  formatTimeAgo: (iso: string) => string;
  onOpenVehicle: (vehicle: SearchVehicle) => void;
  onSearchQueryChange: (value: string) => void;
  onSearchVehicleUnitChange: (value: string) => void;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

export function SearchVehiclesTab({
  filteredVehicles,
  isLoading,
  searchQuery,
  searchVehicleUnit,
  vehicleUnits,
  formatTimeAgo,
  onOpenVehicle,
  onSearchQueryChange,
  onSearchVehicleUnitChange,
  vehicleUnitLabel,
}: SearchVehiclesTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search vehicle plate, unit, variant or driver..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 bg-white text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 shadow-xs"
          />
        </div>
        <Select
          value={searchVehicleUnit}
          onValueChange={onSearchVehicleUnitChange}
        >
          <SelectTrigger className="w-full h-10 bg-white border-zinc-200 focus:border-red-600 focus:ring-3 focus:ring-red-600/15 justify-between">
            <SelectValue placeholder="All vehicle units" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-zinc-200 shadow-md rounded-md">
            <SelectItem value="all" className="cursor-pointer">
              All vehicle units
            </SelectItem>
            {vehicleUnits.map((unit) => (
              <SelectItem
                key={unit.id}
                value={unit.name}
                className="cursor-pointer"
              >
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-4"
            >
              <Skeleton className="size-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
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
                    {vehicle.variant} &nbsp;·&nbsp; {vehicle.level} · Lot{" "}
                    {vehicle.lot}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-red-600 font-semibold">
                  {formatTimeAgo(vehicle.check_in || "")}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                  {vehicle.driver || "-"}
                </p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-zinc-500 text-sm py-8 text-center col-span-full font-medium">
            No active vehicles found matching search.
          </p>
        )}
      </div>
    </div>
  );
}
