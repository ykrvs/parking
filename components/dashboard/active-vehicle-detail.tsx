"use client";

import {
  ArrowLeft,
  Edit2,
  History,
  LogOut,
  Phone,
  Wrench,
} from "lucide-react";
import { format } from "date-fns";

import { PercentDot } from "@/components/dashboard/status-indicators";
import { Button } from "@/components/ui/button";
import {
  formatPlateDisplay,
  type DashboardVehicle,
  type TurretEscLogRecord,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type FireExtStatus = {
  label: string;
  color: string;
  bg: string;
};

type ActiveVehicleDetailProps = {
  canDriveOut: boolean;
  isTurretEscEnabled: boolean;
  isTechnician: boolean;
  isUnverified: boolean;
  latestEsc: TurretEscLogRecord | null;
  vehicle: DashboardVehicle;
  formatLocalTime: (iso?: string | null) => string;
  getFireExtStatus: (date?: string | null) => FireExtStatus;
  onBack: () => void;
  onDriveOut: () => void;
  onEditTurretEsc: () => void;
  onOpenHistory: () => void;
  onUpdateVehicle: () => void;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

const turretEscChecks: Array<[string, keyof TurretEscLogRecord]> = [
  ["ICS", "ics"],
  ["GSU", "gsu"],
  ["WIM", "wim"],
  ["Trav Actuator", "trav_actuator"],
  ["Elev Actuator", "elev_actuator"],
  ["GCU", "gcu"],
  ["MDCU", "mdcu"],
  ["PSU", "psu"],
  ["Gun Gyro", "gun_gyro"],
  ["Conv Ass", "conv_ass"],
  ["Boost Box Ass", "boost_box_ass"],
  ["Slip Ring", "slip_ring"],
  ["Turr E-stop", "turr_estop"],
  ["Upplink Echute", "upplink_echute"],
  ["Upplink Splate", "upplink_splate"],
  ["Lowlink Splate", "lowlink_splate"],
  ["Lowlink Echute", "lowlink_echute"],
  ["Uppflex Chute", "uppflex_chute"],
  ["Lowflex Chute", "lowflex_chute"],
  ["LWS Comp", "lws_comp"],
];

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

export function ActiveVehicleDetail({
  canDriveOut,
  isTurretEscEnabled,
  isTechnician,
  isUnverified,
  latestEsc,
  vehicle,
  formatLocalTime,
  getFireExtStatus,
  onBack,
  onDriveOut,
  onEditTurretEsc,
  onOpenHistory,
  onUpdateVehicle,
  vehicleUnitLabel,
}: ActiveVehicleDetailProps) {
  const fireStatus = getFireExtStatus(vehicle.fire_ext_expiry);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-8 px-2 font-semibold text-xs"
        >
          <ArrowLeft className="size-4 mr-1" />
          Back to search
        </Button>
        <span className="inline-block bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          {vehicle.level} - Lot {vehicle.lot}
        </span>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatPlateDisplay(vehicle.plate)}
        </h2>
        <p className="text-sm text-zinc-400 font-semibold mt-1">
          {vehicleUnitLabel(vehicle)}
        </p>
        <p className="text-sm text-zinc-500 font-semibold mt-1">
          {vehicle.variant}
        </p>
        <p className="text-[11px] text-zinc-400 font-medium mt-1">
          Checked in: {formatLocalTime(vehicle.check_in)}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Last Operator
        </h3>
        <div className="border border-zinc-200 rounded-xl p-4 flex items-center gap-4 bg-zinc-50/25">
          <div className="flex size-11 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-700 text-sm">
            {initials(vehicle.driver)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-zinc-900">{vehicle.driver}</p>
            <p className="text-xs text-zinc-500 font-semibold">
              {vehicle.driver_unit || vehicle.driver_depot}
            </p>
            {vehicle.driver_phone && (
              <a
                target="_blank"
                href={`https://wa.me/+65${vehicle.driver_phone}`}
                className="text-xs text-red-600 font-bold mt-1 inline-flex items-center gap-1 hover:underline"
              >
                <Phone className="size-3" />
                {vehicle.driver_phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Latest Readings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-400 font-bold uppercase">
              Odometer
            </div>
            <div className="text-xl font-extrabold text-zinc-800 mt-1">
              {vehicle.odometer != null
                ? Number(vehicle.odometer).toLocaleString()
                : "-"}{" "}
              <span className="text-xs font-normal text-zinc-500">km</span>
            </div>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-400 font-bold uppercase">
              Engine Hours
            </div>
            <div className="text-xl font-extrabold text-zinc-800 mt-1">
              {vehicle.engine_hours ?? "-"}{" "}
              <span className="text-xs font-normal text-zinc-500">hrs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/25">
        <div className="flex items-center justify-between text-xs border-b border-zinc-100 pb-2">
          <span className="font-bold text-zinc-600">Starter Battery (24V)</span>
          <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
            {vehicle.starter_v ?? "-"}
            {vehicle.starter_v == null ? "" : "V"} -{" "}
            {vehicle.starter_pct ?? "-"}
            {vehicle.starter_pct == null ? "" : "%"}
            {vehicle.starter_pct != null && (
              <PercentDot pct={vehicle.starter_pct} />
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-600">Auxiliary Battery (24V)</span>
          <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
            {vehicle.aux_v ?? "-"}
            {vehicle.aux_v == null ? "" : "V"} - {vehicle.aux_pct ?? "-"}
            {vehicle.aux_pct == null ? "" : "%"}
            {vehicle.aux_pct != null && <PercentDot pct={vehicle.aux_pct} />}
          </span>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-zinc-500">
          <span className="font-bold">Fuel Level</span>
          <span className="font-semibold">
            {vehicle.fuel_l != null ? `${vehicle.fuel_l}L` : "-"} remaining
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("text-2xl font-black shrink-0", fuelToneClass(vehicle.fuel_pct))}>
            {vehicle.fuel_pct ?? "-"}
            {vehicle.fuel_pct == null ? "" : "%"}
          </div>
          <div className="flex-1">
            <div className="h-2 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  fuelBarClass(vehicle.fuel_pct),
                )}
                style={{ width: `${vehicle.fuel_pct ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border rounded-xl p-4 flex items-center gap-4 shadow-2xs",
          fireStatus.bg,
        )}
      >
        <div className="text-3xl select-none leading-none shrink-0">FE</div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
            Fire Extinguisher
          </p>
          <p className="font-bold text-sm text-zinc-800">
            Expiry:{" "}
            {vehicle.fire_ext_expiry
              ? format(new Date(vehicle.fire_ext_expiry + "T00:00:00"), "dd MMM yyyy")
              : "-"}
          </p>
          <p className={cn("text-xs mt-1", fireStatus.color)}>
            {fireStatus.label}
          </p>
        </div>
      </div>

      {/* Latest Turret ESC Section - temporarily disabled.
          Change `isTurretEscEnabled` to true to restore this section. */}
      {isTurretEscEnabled && isTechnician && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Latest Turret ESC Checklist
          </h3>
          {latestEsc ? (
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/25 space-y-3">
              <div className="text-[11px] text-zinc-500 font-medium">
                Submitted by{" "}
                <strong className="text-zinc-800">
                  {latestEsc.user_name}
                </strong>{" "}
                - {formatLocalTime(latestEsc.created_at)}
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {turretEscChecks.map(([label, key]) => {
                  const value = latestEsc[key];
                  return (
                    <div
                      key={key}
                      className="flex justify-between items-center py-1 border-b border-zinc-100/50"
                    >
                      <span className="text-zinc-500 font-medium">
                        {label}
                      </span>
                      {value === null || value === undefined ? (
                        <span className="text-zinc-400">-</span>
                      ) : value ? (
                        <span className="text-emerald-600 font-extrabold">
                          Pass
                        </span>
                      ) : (
                        <span className="text-red-600 font-extrabold">
                          Fail
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {latestEsc.scu != null && (
                <div className="text-xs font-semibold text-zinc-700 mt-2">
                  SCU: {latestEsc.scu} - DCU: {latestEsc.dcu}
                </div>
              )}

              {latestEsc.fault_list && (
                <div className="text-xs font-bold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  Faults: {latestEsc.fault_list}
                </div>
              )}

              {latestEsc.notes && (
                <p className="text-xs italic text-zinc-500 border-t border-zinc-100 pt-2">
                  {latestEsc.notes}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-sm font-semibold text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg">
              No checklists submitted yet for this vehicle.
            </div>
          )}
        </div>
      )}

      {vehicle.notes && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Description / Faults
          </h3>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {vehicle.notes}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-4 border-t border-zinc-100">
        <Button
          onClick={onUpdateVehicle}
          className={cn(
            "w-full h-10 font-bold",
            isUnverified
              ? "bg-zinc-300 hover:bg-zinc-300 text-zinc-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700",
          )}
        >
          <Edit2 className="size-4 mr-2" />
          Update Vehicle Record
        </Button>
        {/* Edit Turret ESC button - temporarily disabled along with
            the rest of the Turret ESC feature. Change
            `isTurretEscEnabled` to true to restore. */}
        {isTurretEscEnabled && isTechnician && (
          <Button
            type="button"
            variant="outline"
            onClick={onEditTurretEsc}
            className="w-full text-zinc-700 hover:bg-zinc-50 h-10 font-bold border-zinc-200"
          >
            <Wrench className="size-4 mr-2" />
            Edit Turret ESC
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onOpenHistory}
          className="w-full text-zinc-700 hover:bg-zinc-50 h-10 font-bold border-zinc-200"
        >
          <History className="size-4 mr-2" />
          View History Logs
        </Button>
        <Button
          onClick={onDriveOut}
          disabled={!canDriveOut}
          className={cn(
            "w-full h-10 font-bold",
            isUnverified || !canDriveOut
              ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
              : "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-100",
          )}
        >
          <LogOut className="size-4 mr-2" />
          Drive Out / Move Off
        </Button>
      </div>
    </div>
  );
}
