"use client";

import { ArrowLeft } from "lucide-react";

import { PercentDot } from "@/components/dashboard/status-indicators";
import { Button } from "@/components/ui/button";
import {
  formatPlateDisplay,
  type DriveoutRecord,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type CheckedOutVehicleDetailProps = {
  record: DriveoutRecord;
  formatLocalTime: (iso?: string | null) => string;
  getDuration: (isoA: string, isoB: string) => string;
  onBack: () => void;
};

function initials(name?: string | null) {
  return (name || "UN")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fuelToneClass(pct?: number | null) {
  const value = pct ?? 0;
  if (value > 50) return "text-emerald-600";
  if (value > 20) return "text-amber-500";
  return "text-red-600";
}

function fuelBarClass(pct?: number | null) {
  const value = pct ?? 0;
  if (value > 50) return "bg-emerald-500";
  if (value > 20) return "bg-amber-500";
  return "bg-red-500";
}

export function CheckedOutVehicleDetail({
  record,
  formatLocalTime,
  getDuration,
  onBack,
}: CheckedOutVehicleDetailProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-8 px-2 font-semibold text-xs"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to list
        </Button>
        <span className="inline-block bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          Checked Out
        </span>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatPlateDisplay(record.plate)}
        </h2>
        <p className="text-sm text-zinc-500 font-semibold mt-1">
          {record.variant}
        </p>
      </div>

      <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/25 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
              Checked In
            </span>
            {formatLocalTime(record.check_in)}
          </div>
          <div>
            <span className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">
              Checked Out
            </span>
            {formatLocalTime(record.check_out)}
          </div>
        </div>
        {record.check_in && record.check_out && (
          <div className="border-t border-zinc-100 pt-3 text-xs text-zinc-500 font-medium">
            Duration:{" "}
            <strong className="text-zinc-800">
              {getDuration(record.check_in, record.check_out)}
            </strong>{" "}
            - Parked at{" "}
            <strong className="text-zinc-800">
              {record.level} - Lot {record.lot}
            </strong>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Checked Out By
        </h3>
        <div className="border border-zinc-200 rounded-xl p-4 flex items-center gap-4 bg-zinc-50/25">
          <div className="flex size-11 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-700 text-sm">
            {initials(record.driver)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-zinc-900">{record.driver}</p>
            <p className="text-xs text-zinc-500 font-semibold">
              {record.driver_unit || record.driver_depot}
            </p>
            {record.driver_phone && (
              <a
                target="_blank"
                href={`https://wa.me/+65${record.driver_phone}`}
                className="text-xs text-red-600 font-bold mt-1 inline-block hover:underline"
              >
                {record.driver_phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Readings at Check-Out
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-400 font-bold uppercase">
              Odometer
            </div>
            <div className="text-xl font-extrabold text-zinc-800 mt-1">
              {record.odometer != null
                ? Number(record.odometer).toLocaleString()
                : "-"}{" "}
              <span className="text-xs font-normal text-zinc-500">km</span>
            </div>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-400 font-bold uppercase">
              Engine Hours
            </div>
            <div className="text-xl font-extrabold text-zinc-800 mt-1">
              {record.engine_hours ?? "-"}{" "}
              <span className="text-xs font-normal text-zinc-500">hrs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/25 text-xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <span className="font-bold text-zinc-600">Starter Battery</span>
          <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
            {record.starter_v ?? "-"}
            {record.starter_v == null ? "" : "V"} - {record.starter_pct ?? "-"}
            {record.starter_pct == null ? "" : "%"}
            {record.starter_pct != null && (
              <PercentDot pct={record.starter_pct} />
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-600">Aux Battery</span>
          <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
            {record.aux_v ?? "-"}
            {record.aux_v == null ? "" : "V"} - {record.aux_pct ?? "-"}
            {record.aux_pct == null ? "" : "%"}
            {record.aux_pct != null && <PercentDot pct={record.aux_pct} />}
          </span>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-zinc-500">
          <span className="font-bold">Fuel Level</span>
          <span className="font-semibold">
            {record.fuel_l != null ? `${record.fuel_l}L` : "-"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("text-2xl font-black shrink-0", fuelToneClass(record.fuel_pct))}>
            {record.fuel_pct ?? "-"}
            {record.fuel_pct == null ? "" : "%"}
          </div>
          <div className="flex-1">
            <div className="h-2 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", fuelBarClass(record.fuel_pct))}
                style={{ width: `${record.fuel_pct ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {record.notes && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Notes at Check-Out
          </h3>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {record.notes}
          </div>
        </div>
      )}
    </div>
  );
}
