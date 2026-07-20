export type VehicleRequestBody = Record<string, unknown>;

export type VehicleAccessProfile = {
  id: string;
  name?: string | null;
  is_admin?: boolean | null;
  facility_code?: string | null;
};

export type FacilityOption = {
  code: string;
};

export const NUMERIC_VEHICLE_FIELDS = [
  ["odometer", "Odometer"],
  ["engine_hours", "Engine hours"],
  ["starter_v", "Starter voltage"],
  ["aux_v", "Auxiliary voltage"],
  ["fuel_l", "Fuel litres"],
] as const;

export const PERCENTAGE_VEHICLE_FIELDS = [
  ["starter_pct", "Starter percentage"],
  ["aux_pct", "Auxiliary percentage"],
  ["fuel_pct", "Fuel percentage"],
] as const;

export const VEHICLE_UPDATE_FIELDS = [
  "variant",
  "vehicle_unit",
  "driver",
  "driver_phone",
  "driver_unit",
  "lot",
  "odometer",
  "engine_hours",
  "starter_v",
  "starter_pct",
  "aux_v",
  "aux_pct",
  "fuel_l",
  "fuel_pct",
  "fire_ext_expiry",
  "is_vor",
  "next_servicing",
  "last_serviced",
  "notes",
] as const;

export function parseNonNegativeNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }

  return parsed;
}

export function parsePercentage(value: unknown, label: string) {
  const parsed = parseNonNegativeNumber(value, label);
  if (parsed !== null && parsed > 100) {
    throw new Error(`${label} must be 100 or below`);
  }

  return parsed === null ? null : Math.trunc(parsed);
}

export function isVehicleValidationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("must be") ||
      error.message.includes("is required") ||
      error.message.includes("Vehicle plate"))
  );
}

export function validateVehicleNumbers(row: VehicleRequestBody | undefined) {
  if (!row) return;

  NUMERIC_VEHICLE_FIELDS.forEach(([field, label]) => {
    if (field in row) {
      row[field] = parseNonNegativeNumber(row[field], label);
    }
  });

  PERCENTAGE_VEHICLE_FIELDS.forEach(([field, label]) => {
    if (field in row) {
      row[field] = parsePercentage(row[field], label);
    }
  });
}

function trimToNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function trimToDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function pickVehicleUpdateData(body: VehicleRequestBody) {
  const updateData: VehicleRequestBody = {};

  VEHICLE_UPDATE_FIELDS.forEach((field) => {
    if (field in body) {
      updateData[field] = body[field];
    }
  });

  if (typeof updateData.lot === "string") {
    updateData.lot = updateData.lot.toUpperCase().trim();
  }

  if ("vehicle_unit" in updateData) {
    updateData.vehicle_unit = trimToNull(updateData.vehicle_unit);
  }

  (["fire_ext_expiry", "next_servicing", "last_serviced"] as const).forEach(
    (field) => {
      if (field in updateData) {
        updateData[field] = updateData[field] || null;
      }
    },
  );

  validateVehicleNumbers(updateData);
  return updateData;
}

export function buildVehicleCheckInPayload({
  id,
  facilityCode,
  actorId,
  body,
  checkIn,
}: {
  id: string;
  facilityCode: string;
  actorId: string;
  body: VehicleRequestBody;
  checkIn: string;
}) {
  return {
    id,
    facility_code: facilityCode,
    vehicle_unit: trimToNull(body.vehicle_unit),
    variant: trimToDefault(body.variant, "-"),
    driver_id: actorId,
    driver: trimToDefault(body.driver, "-"),
    driver_phone: trimToDefault(body.driver_phone, "-"),
    driver_unit: trimToDefault(body.driver_unit, "-"),
    level: body.level,
    lot: String(body.lot).toUpperCase().trim(),
    odometer: parseNonNegativeNumber(body.odometer, "Odometer"),
    engine_hours: parseNonNegativeNumber(body.engine_hours, "Engine hours"),
    starter_v: parseNonNegativeNumber(body.starter_v, "Starter voltage"),
    starter_pct: parsePercentage(body.starter_pct, "Starter percentage"),
    aux_v: parseNonNegativeNumber(body.aux_v, "Auxiliary voltage"),
    aux_pct: parsePercentage(body.aux_pct, "Auxiliary percentage"),
    fuel_l: parseNonNegativeNumber(body.fuel_l, "Fuel litres"),
    fuel_pct: parsePercentage(body.fuel_pct, "Fuel percentage"),
    fire_ext_expiry: body.fire_ext_expiry || null,
    is_vor: body.is_vor === true,
    next_servicing: body.next_servicing || null,
    last_serviced: body.last_serviced || null,
    notes: body.notes || null,
    check_in: checkIn,
  };
}

export function resolveRequestedFacilityForProfile(
  profile: VehicleAccessProfile,
  requestedFacility: string | null | undefined,
  facilities: FacilityOption[],
) {
  if (profile.is_admin && requestedFacility) {
    const match = facilities.find((facility) => facility.code === requestedFacility);
    if (match) return match.code;
  }

  return profile.facility_code || "11FMD";
}

export function assertVehicleFacilityAllowed(
  profile: VehicleAccessProfile,
  vehicleFacility: string,
) {
  if (profile.is_admin) return;

  if (vehicleFacility !== profile.facility_code) {
    throw new Error("This vehicle belongs to a different depot.");
  }
}
