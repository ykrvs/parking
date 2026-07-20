"use client";

import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatPlateDisplay,
  getLevelLots,
  getLotOccupancyClasses,
  normalizeParkingValue,
  type ParkingLevelConfig,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type ParkingVehicle = {
  id: string;
  plate?: string | null;
  vehicle_unit?: string | null;
  variant?: string | null;
  driver?: string | null;
  driver_unit?: string | null;
  driver_depot?: string | null;
};

type ParkingTabProps = {
  counts: Record<string, number>;
  isLoadingParkingConfig: boolean;
  parkingLevels: ParkingLevelConfig[];
  selectedLevel: string;
  selectedLevelConfig?: ParkingLevelConfig;
  selectedLevelLots: string[];
  selectedLot: string | null;
  selectedLotVehicle: ParkingVehicle | null;
  occupiedLotsMap: (level: string) => Record<string, ParkingVehicle | undefined>;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onLotClick: (lotId: string, vehicle?: ParkingVehicle | null) => void;
  onOpenParkingLevel: (level: string) => void;
  onOpenVehicle: (vehicle: ParkingVehicle) => void;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

export function ParkingTab({
  counts,
  isLoadingParkingConfig,
  parkingLevels,
  selectedLevel,
  selectedLevelConfig,
  selectedLevelLots,
  selectedLot,
  selectedLotVehicle,
  occupiedLotsMap,
  onExportCsv,
  onExportPdf,
  onLotClick,
  onOpenParkingLevel,
  onOpenVehicle,
  vehicleUnitLabel,
}: ParkingTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          {parkingLevels.map((level) => {
            const occ = counts[level.id] || 0;
            const levelTotal = level.totalLots ?? getLevelLots(level).length;
            const occupancyClasses = getLotOccupancyClasses(occ, levelTotal);

            return (
              <button
                key={level.id}
                type="button"
                onClick={() => onOpenParkingLevel(level.id)}
                className={cn(
                  "cursor-pointer border p-3 w-full sm:w-36 rounded-xl flex items-center gap-3 shadow-xs transition-all text-left",
                  occupancyClasses.box ||
                    "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50",
                  selectedLevel === level.id && "ring-2 ring-red-600/40",
                )}
              >
                <div className="size-9 bg-zinc-100 rounded-lg flex items-center justify-center text-sm font-semibold select-none">
                  {level.icon || level.id}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs tracking-tight text-zinc-800 leading-tight">
                    {level.label}
                  </div>
                  <p
                    className={cn(
                      "text-[10px] font-medium mt-0.5",
                      occupancyClasses.text || "text-zinc-500",
                    )}
                  >
                    {occ}/{levelTotal} lots
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!parkingLevels.length}
            onClick={onExportCsv}
            className="h-9 text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" />
            CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!parkingLevels.length}
            onClick={onExportPdf}
            className="h-9 text-xs font-bold"
          >
            <FileText className="size-3.5 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-800">
              Parking Map - {selectedLevelConfig?.label ?? "Not configured"}
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {selectedLevelConfig?.desc ??
                "Load layout configuration from Supabase."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span className="size-3.5 border-1.5 border-emerald-700 bg-emerald-100 rounded"></span>
              Occupied
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span className="size-3.5 border-1.5 border-zinc-300 bg-white rounded"></span>
              Empty
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span className="size-3.5 border-1.5 border-amber-500 bg-amber-100 rounded"></span>
              Selected
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-85 select-none bg-zinc-50 border border-zinc-100 rounded-lg p-2 flex justify-center">
          {isLoadingParkingConfig ? (
            <p className="py-10 text-center text-sm font-medium text-zinc-500">
              Loading parking layout...
            </p>
          ) : selectedLevelConfig ? (
            <div className="inline-flex w-fit gap-1 rounded-lg bg-white/70 p-2">
              {(selectedLevelConfig.layout?.columns?.length
                ? selectedLevelConfig.layout.columns
                : [
                    {
                      type: "lots" as const,
                      id: "default",
                      lots: selectedLevelLots,
                    },
                  ]
              ).map((column, columnIndex) => {
                const columnKey = `${column.id}-${column.type}-${columnIndex}`;

                if (column.type === "driveway") {
                  return (
                    <div
                      key={columnKey}
                      className="flex min-h-full w-4 items-center justify-center rounded-md bg-zinc-50 text-[9px] font-bold tracking-[0.12em] text-zinc-400"
                    >
                      <span className="[writing-mode:vertical-rl] rotate-180">
                        {column.label || "DRIVEWAY"}
                      </span>
                    </div>
                  );
                }

                if (column.type === "spacer") {
                  return <div key={columnKey} className="w-3" />;
                }

                const cells =
                  column.type === "mixed"
                    ? column.cells
                    : column.lots.map((lot) => ({
                        type: "lot" as const,
                        id: lot,
                      }));

                return (
                  <div
                    key={columnKey}
                    className="grid auto-rows-[1.5rem] gap-1 self-start"
                  >
                    {cells.map((cell, cellIndex) => {
                      const cellKey = `${columnKey}-${cell.id}-${cellIndex}`;

                      if (cell.type === "area") {
                        return (
                          <div
                            key={cellKey}
                            style={{ gridRow: `span ${cell.rowSpan ?? 1}` }}
                            className="flex w-8 flex-col items-center justify-center rounded-md border border-sky-200 bg-sky-50 px-0.5 text-center text-[8px] font-extrabold leading-tight text-sky-800"
                          >
                            {cell.label.split("\n").map((line) => (
                              <span key={line}>{line}</span>
                            ))}
                          </div>
                        );
                      }

                      const lot = cell.id;
                      const occupiedLots = occupiedLotsMap(selectedLevel);
                      const vehicle = occupiedLots[normalizeParkingValue(lot)];

                      return (
                        <button
                          key={cellKey}
                          type="button"
                          onClick={() => onLotClick(lot, vehicle)}
                          className={cn(
                            "h-full w-8 rounded-md border text-[10px] font-bold transition-colors",
                            vehicle
                              ? "border-emerald-700 bg-emerald-100 text-emerald-900"
                              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
                            selectedLot === lot &&
                              "border-amber-500 bg-amber-100 text-amber-900",
                          )}
                        >
                          {lot}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm font-medium text-zinc-500">
              Parking layout is not configured.
            </p>
          )}
        </div>

        <div
          id="lot-detail-panel"
          className="min-h-20 flex items-center justify-center"
        >
          {selectedLot ? (
            selectedLotVehicle ? (
              <div className="w-full bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-zinc-900">
                      {formatPlateDisplay(selectedLotVehicle.plate)}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                      Lot {selectedLot}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    {selectedLotVehicle.variant || "-"}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                    {vehicleUnitLabel(selectedLotVehicle)}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium mt-2">
                    <span className="font-bold text-zinc-800">
                      {selectedLotVehicle.driver}
                    </span>
                    &nbsp;·&nbsp;{" "}
                    {selectedLotVehicle.driver_unit ||
                      selectedLotVehicle.driver_depot}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => onOpenVehicle(selectedLotVehicle)}
                  className="bg-red-600 hover:bg-red-700 h-8 text-xs font-semibold px-4 shrink-0"
                >
                  View details
                </Button>
              </div>
            ) : (
              <div className="w-full py-4 text-center text-sm font-semibold text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg animate-in fade-in duration-100">
                Lot <span className="text-zinc-700 font-bold">{selectedLot}</span>{" "}
                is currently empty.
              </div>
            )
          ) : (
            <div className="text-xs font-semibold text-zinc-400">
              Click any slot in the floor plan to view lot details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
