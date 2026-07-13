"use client";

import type { FormEvent } from "react";

import { FireExpiryPicker } from "@/components/dashboard/fire-expiry-picker";
import { RequiredMark } from "@/components/dashboard/required-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PLATE_MASK_ENABLED,
  PLATE_MAX_DIGITS,
  VEHICLE_VARIANT_OPTIONS,
  normalizeParkingValue,
  type ParkingLevelConfig,
} from "@/lib/dashboard/dashboard-data";

type VehicleUnitOption = {
  id: string;
  name: string;
};

type CheckInDialogProps = {
  activeFacilityName: string;
  ciBattAuxPct: string;
  ciBattAuxV: string;
  ciBattStarterPct: string;
  ciBattStarterV: string;
  ciDriver: string;
  ciDriverPhone: string;
  ciDriverUnit: string;
  ciEngineHours: string;
  ciFireExpiry: string;
  ciFuelL: string;
  ciFuelPct: string;
  ciLevel: string;
  ciLevelLots: string[];
  ciLot: string;
  ciNotes: string;
  ciOccupiedLots: Record<string, unknown>;
  ciOdometer: string;
  ciPlate: string;
  ciVariant: string;
  ciVehicleUnit: string;
  formError: string | null;
  isSubmitting: boolean;
  parkingLevels: ParkingLevelConfig[];
  vehicleUnits: VehicleUnitOption[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setCiBattAuxPct: (value: string) => void;
  setCiBattAuxV: (value: string) => void;
  setCiBattStarterPct: (value: string) => void;
  setCiBattStarterV: (value: string) => void;
  setCiEngineHours: (value: string) => void;
  setCiFireExpiry: (value: string) => void;
  setCiFuelL: (value: string) => void;
  setCiFuelPct: (value: string) => void;
  setCiLevel: (value: string) => void;
  setCiLot: (value: string) => void;
  setCiNotes: (value: string) => void;
  setCiOdometer: (value: string) => void;
  setCiPlate: (value: string) => void;
  setCiVariant: (value: string) => void;
  setCiVehicleUnit: (value: string) => void;
};

export function CheckInDialog({
  activeFacilityName,
  ciBattAuxPct,
  ciBattAuxV,
  ciBattStarterPct,
  ciBattStarterV,
  ciDriver,
  ciDriverPhone,
  ciDriverUnit,
  ciEngineHours,
  ciFireExpiry,
  ciFuelL,
  ciFuelPct,
  ciLevel,
  ciLevelLots,
  ciLot,
  ciNotes,
  ciOccupiedLots,
  ciOdometer,
  ciPlate,
  ciVariant,
  ciVehicleUnit,
  formError,
  isSubmitting,
  parkingLevels,
  vehicleUnits,
  onClose,
  onSubmit,
  setCiBattAuxPct,
  setCiBattAuxV,
  setCiBattStarterPct,
  setCiBattStarterV,
  setCiEngineHours,
  setCiFireExpiry,
  setCiFuelL,
  setCiFuelPct,
  setCiLevel,
  setCiLot,
  setCiNotes,
  setCiOdometer,
  setCiPlate,
  setCiVariant,
  setCiVehicleUnit,
}: CheckInDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <Card className="w-full max-w-lg rounded-xl border-zinc-200 shadow-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <CardHeader className="border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Log Vehicle In</CardTitle>
              <CardDescription>
                Record a vehicle parking at {activeFacilityName}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="rounded-full size-8 p-0"
            >
              x
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto px-6 flex-1 space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            {formError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Vehicle Plate
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  value={ciPlate}
                  onChange={(event) =>
                    setCiPlate(
                      event.target.value
                        .replace(/[^\d()]/g, "")
                        .slice(
                          0,
                          PLATE_MASK_ENABLED
                            ? PLATE_MAX_DIGITS + 4
                            : undefined,
                        ),
                    )
                  }
                  placeholder="e.g. 087"
                  inputMode="text"
                  maxLength={
                    PLATE_MASK_ENABLED ? PLATE_MAX_DIGITS + 4 : undefined
                  }
                  required
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                />
                <p className="text-[10px] font-medium text-zinc-500">
                  {PLATE_MASK_ENABLED
                    ? `Enter up to ${PLATE_MAX_DIGITS} digits. If this plate is already in use by a different vehicle, add a number in brackets, e.g. 675(1).`
                    : "Enter numbers only."}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Variant / Model
                  <RequiredMark />
                </label>
                <select
                  value={ciVariant}
                  onChange={(event) => setCiVariant(event.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                >
                  <option value="" disabled>
                    Select variant
                  </option>
                  {VEHICLE_VARIANT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Vehicle Unit
                {vehicleUnits.length > 0 && <RequiredMark />}
              </label>
              <select
                value={ciVehicleUnit}
                onChange={(event) => setCiVehicleUnit(event.target.value)}
                required={vehicleUnits.length > 0}
                disabled={vehicleUnits.length === 0}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="" disabled>
                  {vehicleUnits.length
                    ? "Select vehicle unit"
                    : "No vehicle units configured"}
                </option>
                {vehicleUnits.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Driver Name
                <RequiredMark />
              </label>
              <input
                type="text"
                value={ciDriver}
                readOnly
                placeholder="Full name"
                className="h-10 w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none text-zinc-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Driver Phone
                  <RequiredMark />
                </label>
                <input
                  type="tel"
                  value={ciDriverPhone}
                  readOnly
                  placeholder="+65 9XXX XXXX"
                  className="h-10 w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none text-zinc-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Driver Unit
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  value={ciDriverUnit}
                  readOnly
                  placeholder="e.g. 11FMD"
                  className="h-10 w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none text-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Level
                  <RequiredMark />
                </label>
                <select
                  value={ciLevel}
                  onChange={(event) => {
                    setCiLevel(event.target.value);
                    setCiLot("");
                  }}
                  required
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                >
                  <option value="" disabled>
                    Select level
                  </option>
                  {parkingLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Lot No.
                  <RequiredMark />
                </label>
                <select
                  value={ciLot}
                  onChange={(event) => setCiLot(event.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                >
                  <option value="" disabled>
                    Select lot
                  </option>
                  {ciLevelLots.map((lot) => {
                    const occupiedVehicle =
                      ciOccupiedLots[normalizeParkingValue(lot)];

                    return (
                      <option
                        key={lot}
                        value={lot}
                        disabled={Boolean(occupiedVehicle)}
                      >
                        {lot}
                        {occupiedVehicle ? " (occupied)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Odometer (km)
                  <RequiredMark />
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={ciOdometer}
                  onChange={(event) => setCiOdometer(event.target.value)}
                  placeholder="e.g. 50000"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Engine Hours
                  <RequiredMark />
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={ciEngineHours}
                  onChange={(event) => setCiEngineHours(event.target.value)}
                  placeholder="e.g. 120.5"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-3 space-y-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Starter Battery (24V System)
                <RequiredMark />
              </span>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={ciBattStarterV}
                  onChange={(event) => setCiBattStarterV(event.target.value)}
                  placeholder="Volts (e.g. 24.0)"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={ciBattStarterPct}
                  onChange={(event) => setCiBattStarterPct(event.target.value)}
                  placeholder="Percentage %"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Auxiliary Battery (24V System)
                <RequiredMark />
              </span>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={ciBattAuxV}
                  onChange={(event) => setCiBattAuxV(event.target.value)}
                  placeholder="Volts (e.g. 24.0)"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={ciBattAuxPct}
                  onChange={(event) => setCiBattAuxPct(event.target.value)}
                  placeholder="Percentage %"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Fuel Level
                <RequiredMark />
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                    Litres (L)
                    <RequiredMark />
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ciFuelL}
                    onChange={(event) => setCiFuelL(event.target.value)}
                    placeholder="e.g. 1140"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                    Percentage (%)
                    <RequiredMark />
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={ciFuelPct}
                    onChange={(event) => setCiFuelPct(event.target.value)}
                    placeholder="e.g. 100"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Fire Extinguisher Expiry Date
                <RequiredMark />
              </label>
              <FireExpiryPicker
                value={ciFireExpiry}
                onChange={setCiFireExpiry}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Notes / Faults
              </label>
              <textarea
                value={ciNotes}
                onChange={(event) => setCiNotes(event.target.value)}
                placeholder="Any notes on arrival..."
                className="w-full min-h-[60px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-100 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 h-10 font-bold text-white"
              >
                {isSubmitting ? "Checking In..." : "Check In"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
