import "server-only";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_TABLE = "users";

type SgidUser = {
  openid: string;
  name: string;
};

export type UserProfile = {
  id: string;
  rank: string | null;
  name: string;
  is_admin: boolean;
  is_technician: boolean;
  is_verified: boolean;
  facility_code: string;
  ord_date: string | null;
  phone: string | null;
  unit: string | null;
  depot?: string | null;
  created_at: string;
};

export type UserRegistration = {
  rank: string;
  ordDate: string;
  isTechnician: boolean;
  phone?: string | null;
  unit?: string | null;
  name?: string;
  facilityCode?: string;
};

export type Facility = {
  code: string;
  name: string;
};

export type SafetyMessage = {
  id: string;
  message: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_by: string | null;
  facility_code: string | null;
  created_at: string;
};

export type ParkingLevelConfig = {
  id: string;
  label: string;
  desc?: string;
  icon?: string;
  totalLots?: number;
  lots?: string[];
  layout?: {
    columns: ParkingLayoutColumn[];
  };
};

export type ParkingLayoutColumn =
  | {
      type: "lots";
      id: string;
      label?: string;
      lots: string[];
    }
  | {
      type: "mixed";
      id: string;
      label?: string;
      cells: ParkingLayoutCell[];
    }
  | {
      type: "driveway";
      id: string;
      label?: string;
    }
  | {
      type: "spacer";
      id: string;
    };

export type ParkingLayoutCell =
  | {
      type: "lot";
      id: string;
      label?: string;
    }
  | {
      type: "area";
      id: string;
      label: string;
      rowSpan?: number;
    };

export type ParkingConfig = {
  levels: ParkingLevelConfig[];
};

const USER_PROFILE_SELECT =
  "id, rank, name, is_admin, is_technician, is_verified, facility_code, ord_date, phone, unit, created_at";
const LEGACY_USER_PROFILE_SELECT =
  "id, rank, name, is_admin, is_technician, is_verified, facility_code, ord_date, phone, depot, created_at";
// Fallbacks for a database that hasn't had the multi-depot migration run
// yet (no `facility_code` column). Rather than hard-failing every profile
// lookup in that case, fall back to these and default facility_code to
// "11FMD" client-side — the app stays usable while the migration is
// pending, instead of the profile screen silently hanging forever.
const NO_FACILITY_USER_PROFILE_SELECT =
  "id, rank, name, is_admin, is_technician, is_verified, ord_date, phone, unit, created_at";
const NO_FACILITY_LEGACY_USER_PROFILE_SELECT =
  "id, rank, name, is_admin, is_technician, is_verified, ord_date, phone, depot, created_at";

function isMissingFacilityColumnError(message: string) {
  return message.toLowerCase().includes("facility_code");
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is set to a publishable key. Use a Supabase secret/service_role key for server-side sgID writes.",
    );
  }

  if (key.startsWith("eyJ")) {
    const [, payload] = key.split(".");

    try {
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
        role?: string;
      };

      if (claims.role && claims.role !== "service_role") {
        throw new Error(
          `SUPABASE_SERVICE_ROLE_KEY is using the "${claims.role}" role. Use the service_role key for server-side sgID writes.`,
        );
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase JWT key.");
      }

      throw error;
    }
  }

  return { url, key };
}

function getSupabaseAdmin() {
  const config = getSupabaseConfig();

  if (!config) {
    console.warn(
      "[Supabase] Skipping sgID user upsert. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    return null;
  }

  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
    },
  });
}

function getUsersTable() {
  return process.env.SUPABASE_USERS_TABLE || DEFAULT_TABLE;
}

function toLegacyUnitPayload(payload: Record<string, any>) {
  const legacyPayload: Record<string, any> = { ...payload };

  if (legacyPayload.unit !== undefined) {
    legacyPayload.depot = legacyPayload.unit;
    delete legacyPayload.unit;
  }

  if (legacyPayload.driver_unit !== undefined) {
    legacyPayload.driver_depot = legacyPayload.driver_unit;
    delete legacyPayload.driver_unit;
  }

  return legacyPayload;
}

function withoutLegacyPlate(payload: Record<string, any>) {
  const nextPayload: Record<string, any> = { ...payload };
  delete nextPayload.plate;
  return nextPayload;
}

function withVehiclePlate(record: Record<string, any>) {
  // History rows have their own primary key (`id`) separate from the
  // vehicle they refer to (`vehicle_id` holds the actual plate). Vehicle
  // rows don't have a `vehicle_id` column at all — their `id` IS the plate.
  // Checking `vehicle_id` first fixes checked-out vehicles showing the
  // history row's own id instead of the vehicle's plate.
  return { ...record, plate: record.vehicle_id ?? record.id ?? record.plate };
}

export async function upsertSgidUser({ openid, name }: SgidUser) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return;

  const table = getUsersTable();
  const { error } = await supabase.from(table).upsert(
    {
      id: openid,
      name,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(`Failed to upsert sgID user: ${error.message}`);
  }
}

export async function getUserProfile(id: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const table = process.env.SUPABASE_USERS_TABLE || DEFAULT_TABLE;
  const result = await supabase
    .from(table)
    .select(USER_PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle<UserProfile>();

  if (!result.error) {
    return result.data;
  }

  if (isMissingFacilityColumnError(result.error.message)) {
    const noFacilityResult = await supabase
      .from(table)
      .select(NO_FACILITY_USER_PROFILE_SELECT)
      .eq("id", id)
      .maybeSingle<Omit<UserProfile, "facility_code">>();

    if (noFacilityResult.error) {
      throw new Error(`Failed to fetch user profile: ${noFacilityResult.error.message}`);
    }

    return noFacilityResult.data
      ? ({ ...noFacilityResult.data, facility_code: "11FMD" } as UserProfile)
      : null;
  }

  if (!result.error.message.toLowerCase().includes("unit")) {
    throw new Error(`Failed to fetch user profile: ${result.error.message}`);
  }

  const legacyResult = await supabase
    .from(table)
    .select(LEGACY_USER_PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle<Omit<UserProfile, "unit">>();

  if (legacyResult.error) {
    if (isMissingFacilityColumnError(legacyResult.error.message)) {
      const noFacilityLegacyResult = await supabase
        .from(table)
        .select(NO_FACILITY_LEGACY_USER_PROFILE_SELECT)
        .eq("id", id)
        .maybeSingle<Omit<UserProfile, "unit" | "facility_code">>();

      if (noFacilityLegacyResult.error) {
        throw new Error(
          `Failed to fetch user profile: ${noFacilityLegacyResult.error.message}`,
        );
      }

      return noFacilityLegacyResult.data
        ? ({
            ...noFacilityLegacyResult.data,
            unit: noFacilityLegacyResult.data.depot ?? null,
            facility_code: "11FMD",
          } as UserProfile)
        : null;
    }

    throw new Error(`Failed to fetch user profile: ${legacyResult.error.message}`);
  }

  return legacyResult.data
    ? ({ ...legacyResult.data, unit: legacyResult.data.depot ?? null } as UserProfile)
    : null;
}

export async function updateUserRegistration(
  id: string,
  { rank, ordDate, isTechnician, phone, unit, name, facilityCode }: UserRegistration,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const table = getUsersTable();
  const upsertPayload: any = {
    id,
    name: name || "Unknown",
    rank,
    ord_date: ordDate,
    is_technician: isTechnician,
  };
  if (phone !== undefined) upsertPayload.phone = phone;
  if (unit !== undefined) upsertPayload.unit = unit;
  if (facilityCode !== undefined) upsertPayload.facility_code = facilityCode;

  const runUpsert = async (payload: any, selectFields: string) =>
    supabase
      .from(table)
      .upsert(payload, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select(selectFields)
      .single<UserProfile>();

  let { data, error } = await runUpsert(upsertPayload, USER_PROFILE_SELECT);

  if (error && isMissingFacilityColumnError(error.message)) {
    const noFacilityPayload = { ...upsertPayload };
    delete noFacilityPayload.facility_code;
    const noFacilityResult = await runUpsert(
      noFacilityPayload,
      NO_FACILITY_USER_PROFILE_SELECT,
    );
    data = noFacilityResult.data
      ? ({ ...noFacilityResult.data, facility_code: "11FMD" } as UserProfile)
      : null;
    error = noFacilityResult.error;
  } else if (error && error.message.toLowerCase().includes("unit")) {
    const legacyPayload = { ...upsertPayload };
    if (legacyPayload.unit !== undefined) {
      legacyPayload.depot = legacyPayload.unit;
      delete legacyPayload.unit;
    }
    const legacyResult = await runUpsert(legacyPayload, LEGACY_USER_PROFILE_SELECT);
    data = legacyResult.data
      ? ({ ...legacyResult.data, unit: legacyResult.data.depot ?? null } as UserProfile)
      : null;
    error = legacyResult.error;
  }

  if (error) {
    throw new Error(`Failed to update user registration: ${error.message}`);
  }

  return data;
}

export async function getUsers() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const table = getUsersTable();
  const result = await supabase
    .from(table)
    .select(USER_PROFILE_SELECT)
    .order("is_verified", { ascending: true })
    .order("name", { ascending: true });

  if (!result.error) {
    return result.data || [];
  }

  if (isMissingFacilityColumnError(result.error.message)) {
    const noFacilityResult = await supabase
      .from(table)
      .select(NO_FACILITY_USER_PROFILE_SELECT)
      .order("is_verified", { ascending: true })
      .order("name", { ascending: true });

    if (noFacilityResult.error) throw noFacilityResult.error;
    return (noFacilityResult.data || []).map((user) => ({
      ...user,
      facility_code: "11FMD",
    })) as UserProfile[];
  }

  if (!result.error.message.toLowerCase().includes("unit")) {
    throw result.error;
  }

  const legacyResult = await supabase
    .from(table)
    .select(LEGACY_USER_PROFILE_SELECT)
    .order("is_verified", { ascending: true })
    .order("name", { ascending: true });

  if (legacyResult.error) throw legacyResult.error;
  return (legacyResult.data || []).map((user) => ({
    ...user,
    unit: user.depot ?? null,
  })) as UserProfile[];
}

export function isRegistrationComplete(profile: UserProfile | null) {
  return (
    !!profile?.rank &&
    !!profile.ord_date &&
    !!profile.phone &&
    !!(profile.unit || profile.depot) &&
    !!profile.facility_code
  );
}

export async function getFacilities(): Promise<{
  facilities: Facility[];
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { facilities: [], error: "Supabase admin client is not configured." };
  }

  const { data, error } = await supabase
    .from("facilities")
    .select("code, name")
    .order("code", { ascending: true });

  if (error) {
    // Most likely the multi-depot migration hasn't been run yet (no
    // "facilities" table), or the table exists but service_role wasn't
    // granted access to it (a known Supabase quirk for tables created via
    // raw SQL rather than the Table Editor). Fail soft on the data (an
    // empty list just means depot pickers show nothing) but surface the
    // real reason so it's visible instead of a silent empty dropdown.
    const message = toErrorMessage(error);
    console.error("Failed to load facilities:", message);
    return { facilities: [], error: message };
  }
  return { facilities: (data || []) as Facility[] };
}

// Figures out which depot a request should operate on. Regular users are
// always locked to their own depot (requestedFacility is ignored for them,
// so there's no way to spoof access to another depot's data from the
// client). Admins can pass a `facility` param to view/act on any real
// depot; an invalid or omitted value falls back to their own.
export async function resolveFacilityCode(
  actorId: string,
  requestedFacility?: string | null,
) {
  const profile = await getUserProfile(actorId);
  if (!profile) {
    throw new Error("User not found.");
  }

  if (profile.is_admin && requestedFacility) {
    const { facilities } = await getFacilities();
    const match = facilities.find((f) => f.code === requestedFacility);
    if (match) return match.code;
  }

  return profile.facility_code || "11FMD";
}

// Every vehicle's id is prefixed with its depot's facility code (see
// app/api/vehicles/route.ts), so the vehicle's own facility can be read
// straight off its id without an extra lookup.
export function getFacilityCodeFromVehicleId(id: string) {
  const [prefix] = id.split("-");
  return prefix;
}

// Non-admins may only update/checkout vehicles that belong to their own
// depot. Admins may act on any depot (that's the point of the toggle).
export async function assertVehicleFacilityAccess(actorId: string, vehicleId: string) {
  const profile = await getUserProfile(actorId);
  if (!profile) {
    throw new Error("User not found.");
  }
  if (profile.is_admin) return;

  const vehicleFacility = getFacilityCodeFromVehicleId(vehicleId);
  if (vehicleFacility !== profile.facility_code) {
    throw new Error("This vehicle belongs to a different depot.");
  }
}

export async function requireAdmin(actorId: string) {
  const profile = await getUserProfile(actorId);

  if (!profile?.is_admin) {
    throw new Error("Only admins can perform this action.");
  }

  return profile;
}

// Unverified users can browse the app (viewer mode) but can't check
// vehicles in/out or edit records until an admin verifies them. Admins are
// always exempt so verifying the first admin can never become a
// chicken-and-egg lockout.
export async function requireVerified(actorId: string) {
  const profile = await getUserProfile(actorId);

  if (!profile) {
    throw new Error("User not found.");
  }

  if (!profile.is_admin && !profile.is_verified) {
    throw new Error(
      "Your account hasn't been verified by an admin yet. You can view the app, but can't make changes until you're verified.",
    );
  }

  return profile;
}

// Supabase's PostgrestError objects aren't always real `Error` instances,
// so `err instanceof Error` can silently miss them and fall back to a
// useless generic message. This checks for a `.message` property directly
// instead, which works for both native Errors and Supabase's error shape.
function toErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const e = err as { message?: unknown; hint?: unknown; code?: unknown };
    const base = typeof e.message === "string" ? e.message : String(e.message);
    const hint = e.hint ? ` (hint: ${e.hint})` : "";
    const code = e.code ? ` [${e.code}]` : "";
    return `${base}${hint}${code}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function logAuditEvent(entry: {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  targetId?: string | null;
  targetLabel?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase admin client is not configured." };
  }

  // Logging failures should never block the action that triggered them —
  // catch and return the reason rather than throw.
  try {
    const { error } = await supabase.from("audit_log").insert([
      {
        actor_id: entry.actorId ?? null,
        actor_name: entry.actorName ?? null,
        action: entry.action,
        target_id: entry.targetId ?? null,
        target_label: entry.targetLabel ?? null,
        details: entry.details ?? null,
      },
    ]);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = toErrorMessage(err);
    console.error("Failed to write audit log entry:", message);
    return { success: false, error: message };
  }
}

export async function getAuditLog(limit = 200) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `${error.message}${error.hint ? ` (hint: ${error.hint})` : ""}${error.code ? ` [${error.code}]` : ""}`,
    );
  }
  return data || [];
}

export async function setUserAdmin(actorId: string, targetId: string, isAdmin: boolean) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const actor = await requireAdmin(actorId);

  const table = getUsersTable();
  let { data, error } = await supabase
    .from(table)
    .update({ is_admin: isAdmin })
    .eq("id", targetId)
    .select(USER_PROFILE_SELECT)
    .single<UserProfile>();

  if (error && error.message.toLowerCase().includes("unit")) {
    const retry = await supabase
      .from(table)
      .update({ is_admin: isAdmin })
      .eq("id", targetId)
      .select(LEGACY_USER_PROFILE_SELECT)
      .single<Omit<UserProfile, "unit">>();
    data = retry.data
      ? ({ ...retry.data, unit: retry.data.depot ?? null } as UserProfile)
      : null;
    error = retry.error;
  }

  if (error) throw error;

  const auditResult = await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: isAdmin ? "user.admin.grant" : "user.admin.revoke",
    targetId,
    targetLabel: data?.name ?? targetId,
  });
  if (!auditResult.success) {
    console.error(
      `Audit log entry failed for action user.admin.${isAdmin ? "grant" : "revoke"} on ${targetId}: ${auditResult.error}`,
    );
  }

  return data
    ? {
        ...withVehiclePlate(data),
        _auditLogged: auditResult.success,
        _auditError: auditResult.error,
      }
    : data;
}

export async function setUserVerified(
  actorId: string,
  targetId: string,
  isVerified: boolean,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const actor = await requireAdmin(actorId);

  const table = getUsersTable();
  let { data, error } = await supabase
    .from(table)
    .update({ is_verified: isVerified })
    .eq("id", targetId)
    .select(USER_PROFILE_SELECT)
    .single<UserProfile>();

  if (error && error.message.toLowerCase().includes("unit")) {
    const retry = await supabase
      .from(table)
      .update({ is_verified: isVerified })
      .eq("id", targetId)
      .select(LEGACY_USER_PROFILE_SELECT)
      .single<Omit<UserProfile, "unit">>();
    data = retry.data
      ? ({ ...retry.data, unit: retry.data.depot ?? null } as UserProfile)
      : null;
    error = retry.error;
  }

  if (error) throw error;

  const auditResult = await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: isVerified ? "user.verify" : "user.unverify",
    targetId,
    targetLabel: data?.name ?? targetId,
  });
  if (!auditResult.success) {
    console.error(
      `Audit log entry failed for action user.${isVerified ? "verify" : "unverify"} on ${targetId}: ${auditResult.error}`,
    );
  }

  return data
    ? { ...data, _auditLogged: auditResult.success, _auditError: auditResult.error }
    : data;
}

export async function getVehicles(facilityCode: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("facility_code", facilityCode)
    .not("lot", "is", null)
    .order("check_in", { ascending: false });
  if (error) throw error;
  return (data || []).map(withVehiclePlate);
}

export async function checkinVehicle(vehicleData: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const vehiclePayload = withoutLegacyPlate(vehicleData);
  let { data, error } = await supabase
    .from("vehicles")
    .upsert([vehiclePayload], { onConflict: "id" })
    .select()
    .single();

  if (error && error.message.toLowerCase().includes("driver_unit")) {
    const retry = await supabase
      .from("vehicles")
      .upsert([toLegacyUnitPayload(vehiclePayload)], { onConflict: "id" })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data ? withVehiclePlate(data) : data;
}

export async function updateVehicle(id: string, updateData: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  let { data, error } = await supabase
    .from("vehicles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error && error.message.toLowerCase().includes("driver_unit")) {
    const retry = await supabase
      .from("vehicles")
      .update(toLegacyUnitPayload(updateData))
      .eq("id", id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
}

export async function deleteVehicle(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

export async function moveOutVehicle(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("vehicles")
    .update({ lot: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data ? withVehiclePlate(data) : data;
}

export async function getHistory(
  facilityCode: string,
  vehicleId?: string,
  onlyCheckouts: boolean = false,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase
    .from("history")
    .select("*")
    .eq("facility_code", facilityCode);
  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }
  if (onlyCheckouts) {
    query = query.not("check_out", "is", null);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(withVehiclePlate);
}

export async function insertHistory(historyData: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const historyPayload = withoutLegacyPlate(historyData);
  let { data, error } = await supabase
    .from("history")
    .insert([historyPayload])
    .select()
    .single();

  if (error && error.message.toLowerCase().includes("driver_unit")) {
    const retry = await supabase
      .from("history")
      .insert([toLegacyUnitPayload(historyPayload)])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data ? withVehiclePlate(data) : data;
}

export async function getLatestTurretEscLog(vehicleId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("turret_esc_logs")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? withVehiclePlate(data) : data;
}

export async function insertTurretEscLog(logData: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const logPayload = withoutLegacyPlate(logData);
  const { data, error } = await supabase
    .from("turret_esc_logs")
    .insert([logPayload])
    .select()
    .single();
  if (error) throw error;
  return data ? withVehiclePlate(data) : data;
}

export async function getParkingConfig(facilityCode: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("parking_config")
    .select("layout")
    .eq("id", facilityCode)
    .maybeSingle<{ layout: ParkingConfig }>();

  if (error) throw error;

  return data?.layout ?? null;
}

export async function getActiveSafetyMessages(facilityCode: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("safety_messages")
    .select("*")
    .eq("is_active", true)
    // Messages tagged for this facility, plus legacy/global messages that
    // predate multi-depot support (facility_code is null = shown everywhere).
    .or(`facility_code.eq.${facilityCode},facility_code.is.null`)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as SafetyMessage[];
}

export async function getSafetyMessages(facilityCode: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("safety_messages")
    .select("*")
    .or(`facility_code.eq.${facilityCode},facility_code.is.null`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as SafetyMessage[];
}

export async function createSafetyMessage(messageData: {
  message: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  created_by?: string | null;
  facility_code?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("safety_messages")
    .insert([messageData])
    .select()
    .single<SafetyMessage>();

  if (error) throw error;
  return data;
}

export async function updateSafetyMessage(
  id: string,
  updateData: {
    message?: string;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active?: boolean;
  },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("safety_messages")
    .update(updateData)
    .eq("id", id)
    .select()
    .single<SafetyMessage>();

  if (error) throw error;
  return data;
}

export async function deleteSafetyMessage(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { error } = await supabase.from("safety_messages").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
