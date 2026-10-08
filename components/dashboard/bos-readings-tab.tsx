"use client";

import { format } from "date-fns";
import {
  CarFront,
  CheckCircle2,
  Download,
  Edit2,
  FileText,
  Filter,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

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
  is_vor?: boolean | null;
  next_servicing?: string | null;
  check_in?: string | null;
};

type FireExtStatus = {
  label: string;
  color: string;
  bg: string;
};

type VorFilterValue = "operational" | "vor";
type MeasurementSortDirection = "none" | "desc" | "asc";
type MeasurementKey = "odometer" | "engine_hours" | "starter" | "auxiliary" | "fuel";

type BosReadingsTabProps = {
  activeFacilityName: string;
  isLoading: boolean;
  isUnverified: boolean;
  vehicles: BosVehicle[];
  getFireExtStatus: (date: string | null) => FireExtStatus;
  isServicingDue: (vehicle: BosVehicle) => boolean;
  onLogVehicleIn: () => void;
  onExportCsv: (vehicles: BosVehicle[]) => void;
  onExportPdf: (vehicles: BosVehicle[]) => void;
  onOpenVehicle: (vehicle: BosVehicle) => void;
  onUpdateVehicle: (vehicle: BosVehicle) => void;
  vehicleUnitColor: (vehicle: { vehicle_unit?: string | null }) => string | null;
};

function vehicleUnitLabel(vehicle: BosVehicle) {
  return vehicle.vehicle_unit || "No vehicle unit";
}

function loggedDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd MMM yyyy");
}

const MEASUREMENT_FILTERS: {
  key: MeasurementKey;
  label: string;
}[] = [
  { key: "odometer", label: "Odometer" },
  { key: "engine_hours", label: "Engine hours" },
  { key: "starter", label: "Starter" },
  { key: "auxiliary", label: "Auxiliary" },
  { key: "fuel", label: "Fuel" },
];

function uniqueSortedValues(values: (string | null | undefined)[]) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));
}

function toggleArrayValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function numericValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function measurementValue(vehicle: BosVehicle, key: MeasurementKey) {
  if (key === "odometer") return numericValue(vehicle.odometer);
  if (key === "engine_hours") return numericValue(vehicle.engine_hours);
  if (key === "starter") {
    return numericValue(vehicle.starter_pct) ?? numericValue(vehicle.starter_v);
  }
  if (key === "auxiliary") {
    return numericValue(vehicle.aux_pct) ?? numericValue(vehicle.aux_v);
  }
  return numericValue(vehicle.fuel_pct) ?? numericValue(vehicle.fuel_l);
}

function compareText(a?: string | null, b?: string | null) {
  return String(a ?? "").localeCompare(String(b ?? ""));
}

export function BosReadingsTab({
  activeFacilityName,
  isLoading,
  isUnverified,
  vehicles,
  getFireExtStatus,
  isServicingDue,
  onLogVehicleIn,
  onExportCsv,
  onExportPdf,
  onOpenVehicle,
  onUpdateVehicle,
  vehicleUnitColor,
}: BosReadingsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [selectedVorStatus, setSelectedVorStatus] =
    useState<VorFilterValue | null>(null);
  const [measurementSorts, setMeasurementSorts] = useState<
    Record<MeasurementKey, MeasurementSortDirection>
  >({
    odometer: "none",
    engine_hours: "none",
    starter: "none",
    auxiliary: "none",
    fuel: "none",
  });
  const [includeEmptyMeasurements, setIncludeEmptyMeasurements] = useState(true);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const vehicleUnitOptions = useMemo(
    () => uniqueSortedValues(vehicles.map((vehicle) => vehicle.vehicle_unit)),
    [vehicles],
  );
  const variantOptions = useMemo(
    () => uniqueSortedValues(vehicles.map((vehicle) => vehicle.variant)),
    [vehicles],
  );
  const activeMeasurementSorts = useMemo(
    () =>
      MEASUREMENT_FILTERS.filter(
        ({ key }) => measurementSorts[key] !== "none",
      ),
    [measurementSorts],
  );
  const activeFilterCount =
    selectedUnits.length +
    selectedVariants.length +
    (selectedVorStatus ? 1 : 0) +
    activeMeasurementSorts.length +
    (includeEmptyMeasurements ? 0 : 1);

  const filteredVehicles = useMemo(() => {
    const searchedVehicles = normalizedSearchQuery
      ? vehicles.filter((vehicle) =>
          [
            vehicle.plate,
            vehicle.vehicle_unit,
            vehicle.variant,
            vehicle.level,
            vehicle.lot,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedSearchQuery),
          ),
        )
      : vehicles;

    const narrowedVehicles = searchedVehicles.filter((vehicle) => {
      if (
        selectedUnits.length &&
        !selectedUnits.includes(vehicle.vehicle_unit || "")
      ) {
        return false;
      }
      if (
        selectedVariants.length &&
        !selectedVariants.includes(vehicle.variant || "")
      ) {
        return false;
      }
      if (selectedVorStatus) {
        const vorStatus: VorFilterValue = vehicle.is_vor ? "vor" : "operational";
        if (selectedVorStatus !== vorStatus) return false;
      }
      if (!includeEmptyMeasurements && activeMeasurementSorts.length) {
        return activeMeasurementSorts.every(
          ({ key }) => measurementValue(vehicle, key) !== null,
        );
      }
      return true;
    });

    if (!activeMeasurementSorts.length) return narrowedVehicles;

    return [...narrowedVehicles].sort((a, b) => {
      for (const { key } of activeMeasurementSorts) {
        const direction = measurementSorts[key];
        const aValue = measurementValue(a, key);
        const bValue = measurementValue(b, key);

        if (aValue === null && bValue === null) continue;
        if (aValue === null) return includeEmptyMeasurements ? 1 : 0;
        if (bValue === null) return includeEmptyMeasurements ? -1 : 0;
        if (aValue === bValue) continue;

        return direction === "desc" ? bValue - aValue : aValue - bValue;
      }

      return (
        compareText(a.vehicle_unit, b.vehicle_unit) ||
        compareText(a.variant, b.variant) ||
        compareText(a.plate, b.plate)
      );
    });
  }, [
    activeMeasurementSorts,
    includeEmptyMeasurements,
    measurementSorts,
    normalizedSearchQuery,
    selectedUnits,
    selectedVariants,
    selectedVorStatus,
    vehicles,
  ]);

  const resetFilters = () => {
    setSelectedUnits([]);
    setSelectedVariants([]);
    setSelectedVorStatus(null);
    setMeasurementSorts({
      odometer: "none",
      engine_hours: "none",
      starter: "none",
      auxiliary: "none",
      fuel: "none",
    });
    setIncludeEmptyMeasurements(true);
  };

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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!filteredVehicles.length}
            onClick={() => onExportCsv(filteredVehicles)}
            className="h-9 text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" />
            CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!filteredVehicles.length}
            onClick={() => onExportPdf(filteredVehicles)}
            className="h-9 text-xs font-bold"
          >
            <FileText className="size-3.5 mr-1.5" />
            PDF
          </Button>
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
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-zinc-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search plate, vehicle unit, variant, level or lot..."
          aria-label="Search BOS vehicles"
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 text-sm shadow-xs outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
        />
      </div>

      <details className="rounded-xl border border-zinc-200 bg-white shadow-xs">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-extrabold text-zinc-800 marker:hidden">
          <span className="flex items-center gap-2">
            <Filter className="size-4 text-zinc-500" />
            Filter by
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-700">
                {activeFilterCount}
              </span>
            )}
          </span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                resetFilters();
              }}
              className="text-xs font-bold text-zinc-500 hover:text-red-700"
            >
              Clear
            </button>
          )}
        </summary>
        <div className="grid gap-4 border-t border-zinc-100 p-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-[11px] font-black uppercase text-zinc-400">
              Vehicle unit
            </p>
            <div className="space-y-2">
              {vehicleUnitOptions.length ? (
                vehicleUnitOptions.map((unit) => (
                  <label
                    key={unit}
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUnits.includes(unit)}
                      onChange={() =>
                        setSelectedUnits((current) =>
                          toggleArrayValue(current, unit),
                        )
                      }
                      className="size-4 rounded border-zinc-300 text-red-600"
                    />
                    <span>{unit}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs font-medium text-zinc-400">No units</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-black uppercase text-zinc-400">
              Vehicle variant
            </p>
            <div className="space-y-2">
              {variantOptions.length ? (
                variantOptions.map((variant) => (
                  <label
                    key={variant}
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVariants.includes(variant)}
                      onChange={() =>
                        setSelectedVariants((current) =>
                          toggleArrayValue(current, variant),
                        )
                      }
                      className="size-4 rounded border-zinc-300 text-red-600"
                    />
                    <span>{variant}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs font-medium text-zinc-400">No variants</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-black uppercase text-zinc-400">
              VOR status
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
              {[
                { value: "operational" as const, label: "Operational" },
                { value: "vor" as const, label: "VOR" },
              ].map((status) => (
                <button
                  type="button"
                  key={status.value}
                  onClick={() => setSelectedVorStatus(status.value)}
                  className={cn(
                    "h-9 rounded-md px-2 text-xs font-black transition",
                    selectedVorStatus === status.value
                      ? "bg-white text-red-700 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase text-zinc-400">
                Measurements
              </p>
              <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-600">
                <input
                  type="checkbox"
                  checked={includeEmptyMeasurements}
                  onChange={(event) =>
                    setIncludeEmptyMeasurements(event.target.checked)
                  }
                  className="size-4 rounded border-zinc-300 text-red-600"
                />
                Include empty
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {MEASUREMENT_FILTERS.map((filter) => (
                <label
                  key={filter.key}
                  className="grid min-w-0 gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700"
                >
                  <span className="truncate">{filter.label}</span>
                  <select
                    value={measurementSorts[filter.key]}
                    onChange={(event) => {
                      const direction = event.target
                        .value as MeasurementSortDirection;
                      setMeasurementSorts({
                        odometer: "none",
                        engine_hours: "none",
                        starter: "none",
                        auxiliary: "none",
                        fuel: "none",
                        [filter.key]: direction,
                      });
                    }}
                    className="h-8 min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-xs font-bold outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/15"
                  >
                    <option value="none">Off</option>
                    <option value="desc">High to low</option>
                    <option value="asc">Low to high</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
        </div>
      </details>

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
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => {
            const fireStatus = getFireExtStatus(
              vehicle.fire_ext_expiry ?? null,
            );
            const serviceDue = isServicingDue(vehicle);
            const unitColor = vehicleUnitColor(vehicle);

            return (
              <div
                key={vehicle.id}
                onClick={() => onOpenVehicle(vehicle)}
                className={cn(
                  "relative cursor-pointer rounded-xl border p-4 shadow-sm transition hover:shadow-md lg:pr-28",
                  serviceDue
                    ? "border-amber-300 bg-amber-50/70 shadow-amber-100 hover:border-amber-400"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <p className="absolute right-4 top-4 hidden text-xs font-bold text-zinc-500 lg:block">
                  {loggedDateLabel(vehicle.check_in)}
                </p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start justify-between gap-3 lg:w-52">
                    <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg border-2 bg-zinc-100 text-zinc-600"
                      style={unitColor ? { borderColor: unitColor } : undefined}
                    >
                      <CarFront
                        className="size-5"
                        style={unitColor ? { color: unitColor } : undefined}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-extrabold text-zinc-900">
                          {formatPlateDisplay(vehicle.plate)}
                        </p>
                        {vehicle.is_vor ? (
                          <XCircle className="size-4 shrink-0 text-red-600" />
                        ) : (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        )}
                      </div>
                      <p className="truncate text-[11px] font-semibold text-zinc-400">
                        {vehicleUnitLabel(vehicle)}
                      </p>
                      <p className="truncate text-xs font-medium text-zinc-500">
                        {vehicle.variant ?? "-"} · {vehicle.level ?? "-"} ·
                        Lot {vehicle.lot ?? "-"}
                      </p>
                    </div>
                    </div>
                    <p className="shrink-0 text-xs font-bold text-zinc-500 lg:hidden">
                      {loggedDateLabel(vehicle.check_in)}
                    </p>
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
                        {vehicle.starter_v ?? "-"}
                        {vehicle.starter_v == null ? "" : "V"} ·{" "}
                        {vehicle.starter_pct ?? "-"}
                        {vehicle.starter_pct == null ? "" : "%"}
                        {vehicle.starter_pct != null && (
                          <PercentDot pct={vehicle.starter_pct} />
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Auxiliary
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-zinc-800">
                        {vehicle.aux_v ?? "-"}
                        {vehicle.aux_v == null ? "" : "V"} ·{" "}
                        {vehicle.aux_pct ?? "-"}
                        {vehicle.aux_pct == null ? "" : "%"}
                        {vehicle.aux_pct != null && (
                          <PercentDot pct={vehicle.aux_pct} />
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">
                        Fuel
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-zinc-800">
                        {vehicle.fuel_l ?? "-"}
                        {vehicle.fuel_l == null ? "" : "L"} ·{" "}
                        {vehicle.fuel_pct ?? "-"}
                        {vehicle.fuel_pct == null ? "" : "%"}
                        {vehicle.fuel_pct != null && (
                          <PercentDot pct={vehicle.fuel_pct} />
                        )}
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
                          : "-"}
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
            {normalizedSearchQuery || activeFilterCount > 0
              ? "No BOS vehicles found matching search or filters."
              : "No active vehicles checked in yet."}
          </p>
        )}
      </div>
    </div>
  );
}
