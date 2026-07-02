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
};

export type SafetyMessage = {
  id: string;
  message: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_by: string | null;
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
  "id, rank, name, is_admin, is_technician, is_verified, ord_date, phone, unit, created_at";
const LEGACY_USER_PROFILE_SELECT =
  "id, rank, name, is_admin, is_technician, is_verified, ord_date, phone, depot, created_at";

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

  if (!result.error.message.toLowerCase().includes("unit")) {
    throw new Error(`Failed to fetch user profile: ${result.error.message}`);
  }

  const legacyResult = await supabase
    .from(table)
    .select(LEGACY_USER_PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle<Omit<UserProfile, "unit">>();

  if (legacyResult.error) {
    throw new Error(`Failed to fetch user profile: ${legacyResult.error.message}`);
  }

  return legacyResult.data
    ? ({ ...legacyResult.data, unit: legacyResult.data.depot ?? null } as UserProfile)
    : null;
}

export async function updateUserRegistration(
  id: string,
  { rank, ordDate, isTechnician, phone, unit, name }: UserRegistration,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const table = getUsersTable();
  const updatePayload: any = {
    rank,
    ord_date: ordDate,
    is_technician: isTechnician,
  };
  if (phone !== undefined) updatePayload.phone = phone;
  if (unit !== undefined) updatePayload.unit = unit;
  if (name !== undefined) updatePayload.name = name;

  const runUpdate = async (payload: any, selectFields: string) =>
    supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .select(selectFields)
      .single<UserProfile>();

  let { data, error } = await runUpdate(updatePayload, USER_PROFILE_SELECT);

  if (error && error.message.toLowerCase().includes("unit")) {
    const legacyPayload = { ...updatePayload };
    if (legacyPayload.unit !== undefined) {
      legacyPayload.depot = legacyPayload.unit;
      delete legacyPayload.unit;
    }
    const legacyResult = await runUpdate(legacyPayload, LEGACY_USER_PROFILE_SELECT);
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
  return !!profile?.rank && !!profile.ord_date && !!profile.phone && !!(profile.unit || profile.depot);
}

export async function requireAdmin(actorId: string) {
  const profile = await getUserProfile(actorId);

  if (!profile?.is_admin) {
    throw new Error("Only admins can perform this action.");
  }

  return profile;
}

export async function setUserAdmin(actorId: string, targetId: string, isAdmin: boolean) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  await requireAdmin(actorId);

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
  return data ? withVehiclePlate(data) : data;
}

export async function setUserVerified(
  actorId: string,
  targetId: string,
  isVerified: boolean,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  await requireAdmin(actorId);

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
  return data;
}

export async function getVehicles() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
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

export async function getHistory(vehicleId?: string, onlyCheckouts: boolean = false) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase.from("history").select("*");
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

export async function getParkingConfig() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("parking_config")
    .select("layout")
    .eq("id", "default")
    .maybeSingle<{ layout: ParkingConfig }>();

  if (error) throw error;

  return data?.layout ?? null;
}

export async function getActiveSafetyMessages() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("safety_messages")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as SafetyMessage[];
}

export async function getSafetyMessages() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("safety_messages")
    .select("*")
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
