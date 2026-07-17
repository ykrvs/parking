"use client";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatPlateDisplay,
  type DashboardVehicle,
  type DriveoutRecord,
} from "@/lib/dashboard/dashboard-data";

type VehicleHistoryTabProps = {
  historyRecords: DriveoutRecord[];
  vehicle: DashboardVehicle;
  formatLocalTime: (iso?: string | null) => string;
  onBack: () => void;
};

export function VehicleHistoryTab({
  historyRecords,
  vehicle,
  formatLocalTime,
  onBack,
}: VehicleHistoryTabProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-8 px-2 font-semibold text-xs"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to detail
        </Button>
        <h3 className="text-sm font-black text-zinc-800">
          {formatPlateDisplay(vehicle.plate)} History Log
        </h3>
      </div>

      <div className="space-y-4">
        {historyRecords.length > 0 ? (
          historyRecords.map((record, index) => (
            <div
              key={record.id || index}
              className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/25"
            >
              <div className="flex items-center justify-between text-xs font-semibold border-b border-zinc-100 pb-2">
                <span className="text-zinc-800">
                  {formatLocalTime(record.created_at)}
                </span>
                <span className="text-zinc-500">
                  Updated by: {record.driver || "-"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  Odometer:{" "}
                  {record.odometer != null
                    ? `${Number(record.odometer).toLocaleString()} km`
                    : "-"}
                </div>
                <div>Engine Hours: {record.engine_hours ?? "-"} hrs</div>
                <div>
                  Starter Battery: {record.starter_v ?? "-"}
                  {record.starter_v == null ? "" : "V"} -{" "}
                  {record.starter_pct ?? "-"}
                  {record.starter_pct == null ? "" : "%"}
                </div>
                <div>
                  Aux Battery: {record.aux_v ?? "-"}
                  {record.aux_v == null ? "" : "V"} - {record.aux_pct ?? "-"}
                  {record.aux_pct == null ? "" : "%"}
                </div>
                <div>
                  Fuel Level: {record.fuel_pct ?? "-"}
                  {record.fuel_pct == null ? "" : "%"} - {record.fuel_l ?? "-"}
                  {record.fuel_l == null ? "" : "L"}
                </div>
                {record.fire_ext_expiry && (
                  <div className="col-span-2 text-zinc-500 font-semibold mt-1">
                    Fire Ext. Expiry:{" "}
                    {format(
                      new Date(record.fire_ext_expiry + "T00:00:00"),
                      "dd MMM yyyy",
                    )}
                  </div>
                )}
              </div>

              {record.notes && (
                <p className="text-xs italic text-zinc-500 border-t border-zinc-100 pt-2 mt-2">
                  {record.notes}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-zinc-500 text-sm py-8 text-center font-medium">
            No historical records found for this platform.
          </p>
        )}
      </div>
    </div>
  );
}
