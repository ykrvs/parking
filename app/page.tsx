"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import {
  ArrowLeft,
  Battery,
  Calendar,
  CarFront,
  Check,
  ChevronDown,
  Clock,
  Edit2,
  FileText,
  Flame,
  History,
  IdCard,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";

import { FireExpiryPicker } from "@/components/dashboard/fire-expiry-picker";
import { LoginGate } from "@/components/dashboard/login-gate";
import { RequiredMark } from "@/components/dashboard/required-mark";
import {
  PercentDot,
  Skeleton,
  UnverifiedDot,
} from "@/components/dashboard/status-indicators";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  AUDIT_ACTION_LABELS,
  DEFAULT_PARKING_LEVELS,
  PLATE_MASK_ENABLED,
  PLATE_MAX_DIGITS,
  RANK_CATEGORIES,
  RANK_OPTIONS,
  SAFETY_MESSAGES,
  VEHICLE_VARIANT_OPTIONS,
  exportDriveoutHistoryCSV,
  exportDriveoutHistoryPDF,
  formatPlateDisplay,
  getLevelLots,
  getLotOccupancyClasses,
  localInputToUtcIso,
  normalizeParkingValue,
  parseDateInput,
  toDateInputValue,
  utcIsoToLocalInput,
  vehicleMatchesLevel,
  type AdminUserRecord,
  type AuditLogEntry,
  type ParkingLayoutColumn,
  type ParkingLevelConfig,
  type SafetyMessageRecord,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

export default function Home() {
  const auth = useAuth();
  const router = useRouter();

  // App States
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isVerificationPending, setIsVerificationPending] =
  useState<boolean>(false);
  // The depot whose data is currently shown. Regular users are always
  // locked to their own depot; admins can switch this via the header
  // dropdown to view/manage a different depot's operational data.
  const [activeFacility, setActiveFacility] = useState<string>("");
  const [facilities, setFacilities] = useState<
    { code: string; name: string }[]
  >([]);
  const [parkingLevels, setParkingLevels] = useState<ParkingLevelConfig[]>(
    DEFAULT_PARKING_LEVELS,
  );
  const [isLoadingParkingConfig, setIsLoadingParkingConfig] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [safetyMessages, setSafetyMessages] = useState<SafetyMessageRecord[]>(
    [],
  );
  const [safetyIndex, setSafetyIndex] = useState(0);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminSafetyMessages, setAdminSafetyMessages] = useState<
    SafetyMessageRecord[]
  >([]);
  const [auditLogEntries, setAuditLogEntries] = useState<AuditLogEntry[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<
    "users" | "safety" | "activity"
  >("users");
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [adminDraftAdmins, setAdminDraftAdmins] = useState<
    Record<string, boolean>
  >({});
  const [isSavingAdminUsers, setIsSavingAdminUsers] = useState(false);

  // Dashboard vehicle data state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [driveoutRecords, setDriveoutRecords] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedDriveout, setSelectedDriveout] = useState<any>(null);

  // Checklist Logs and history records
  const [latestEsc, setLatestEsc] = useState<any>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  // Interactive parking states
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [selectedLotVehicle, setSelectedLotVehicle] = useState<any>(null);

  // Forms and Modals state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [driveoutSearchQuery, setDriveoutSearchQuery] = useState<string>("");
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isConfirmingDriveout, setIsConfirmingDriveout] =
    useState<boolean>(false);

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [peName, setPeName] = useState<string>("");
  const [pePhone, setPePhone] = useState<string>("");
  const [peUnit, setPeUnit] = useState<string>("");
  const [peFacility, setPeFacility] = useState<string>("");
  const [peRank, setPeRank] = useState<string>("");
  const [peOrdDate, setPeOrdDate] = useState<string>("");
  const [peIsTechnician, setPeIsTechnician] = useState<boolean>(false);
  const [newSafetyMessage, setNewSafetyMessage] = useState("");
  const [newSafetyStartsAt, setNewSafetyStartsAt] = useState("");
  const [newSafetyEndsAt, setNewSafetyEndsAt] = useState("");
  const [editingSafetyMessageId, setEditingSafetyMessageId] = useState<
    string | null
  >(null);
  const [editSafetyStartsAt, setEditSafetyStartsAt] = useState("");
  const [editSafetyEndsAt, setEditSafetyEndsAt] = useState("");

  // Form submission inputs
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check-in input states
  const [ciPlate, setCiPlate] = useState("");
  const [ciVariant, setCiVariant] = useState("");
  const [ciDriver, setCiDriver] = useState("");
  const [ciDriverPhone, setCiDriverPhone] = useState("");
  const [ciDriverUnit, setCiDriverUnit] = useState("");
  const [ciLevel, setCiLevel] = useState("");
  const [ciLot, setCiLot] = useState("");
  const [ciOdometer, setCiOdometer] = useState("");
  const [ciEngineHours, setCiEngineHours] = useState("");
  const [ciBattStarterV, setCiBattStarterV] = useState("");
  const [ciBattStarterPct, setCiBattStarterPct] = useState("");
  const [ciBattAuxV, setCiBattAuxV] = useState("");
  const [ciBattAuxPct, setCiBattAuxPct] = useState("");
  const [ciFuelL, setCiFuelL] = useState("");
  const [ciFuelPct, setCiFuelPct] = useState("");
  const [ciFireExpiry, setCiFireExpiry] = useState("");
  const [ciNotes, setCiNotes] = useState("");

  // Update input states
  const [upVariant, setUpVariant] = useState("");
  const [upDriver, setUpDriver] = useState("");
  const [upDriverPhone, setUpDriverPhone] = useState("");
  const [upDriverUnit, setUpDriverUnit] = useState("");
  const [upLot, setUpLot] = useState("");
  const [upOdometer, setUpOdometer] = useState("");
  const [upEngineHours, setUpEngineHours] = useState("");
  const [upBattStarterV, setUpBattStarterV] = useState("");
  const [upBattStarterPct, setUpBattStarterPct] = useState("");
  const [upBattAuxV, setUpBattAuxV] = useState("");
  const [upBattAuxPct, setUpBattAuxPct] = useState("");
  const [upFuelL, setUpFuelL] = useState("");
  const [upFuelPct, setUpFuelPct] = useState("");
  const [upFireExpiry, setUpFireExpiry] = useState("");
  const [upNotes, setUpNotes] = useState("");

  // Turret ESC Checklist states
  const [escVehicleId, setEscVehicleId] = useState("");
  const [escChecks, setEscChecks] = useState<Record<string, boolean>>({
    ics: false,
    gsu: false,
    wim: false,
    trav_actuator: false,
    elev_actuator: false,
    gcu: false,
    mdcu: false,
    psu: false,
    gun_gyro: false,
    conv_ass: false,
    boost_box_ass: false,
    slip_ring: false,
    turr_estop: false,
    upplink_echute: false,
    upplink_splate: false,
    lowlink_splate: false,
    lowlink_echute: false,
    uppflex_chute: false,
    lowflex_chute: false,
    lws_comp: false,
  });
  const [escScu, setEscScu] = useState("");
  const [escDcu, setEscDcu] = useState("");
  const [escFaultList, setEscFaultList] = useState("");
  const [escNotes, setEscNotes] = useState("");

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

 // Sync profile & check registration
useEffect(() => {
  if (!auth.isAuthenticated || !auth.openid) return;

  const controller = new AbortController();

  async function checkRegistration() {
    setIsCheckingProfile(true);
    setProfileLoadError(null);
    setIsVerificationPending(false);

    try {
      const response = await fetch(`/api/users/me`, {
        signal: controller.signal,
      });

      if (response.status === 401) {
        auth.logout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check registration");
      }

      if (!data.registrationComplete) {
        router.replace("/register");
        return;
      }

      const loadedProfile = data.profile;

      // Security gate:
      // Registered but unverified users should not enter the parking dashboard.
      if (loadedProfile?.is_verified !== true) {
        setProfile(loadedProfile);
        setIsVerificationPending(true);
        setActiveFacility("");
        setVehicles([]);
        setRecentVehicles([]);
        setDriveoutRecords([]);
        setParkingLevels([]);
        setSafetyMessages([]);
        setProfileLoadError(null);
        return;
      }

      setProfile(loadedProfile);
      setIsVerificationPending(false);

      // Normal users are locked to their own facility.
      // Admins keep their current selected facility, or default to their own facility.
      setActiveFacility((current) => {
        if (!loadedProfile?.is_admin) {
          return loadedProfile?.facility_code || "";
        }

        return current || loadedProfile?.facility_code || "11FMD";
      });

      setProfileLoadError(null);

      // Sync rank to local storage if different or missing
      if (loadedProfile?.rank && auth.rank !== loadedProfile.rank) {
        auth.setRank(loadedProfile.rank);
      }
    } catch (profileError) {
      if (!controller.signal.aborted) {
        console.error("[profile] Failed to check registration", profileError);

        setProfileLoadError(
          profileError instanceof Error
            ? profileError.message
            : "Failed to load your profile.",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsCheckingProfile(false);
      }
    }
  }

  void checkRegistration();

  return () => controller.abort();
}, [auth.isAuthenticated, auth.openid, auth.rank, router]);

  // Load Vehicles & dashboard metrics
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `/api/vehicles?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
        setRecentVehicles((data.vehicles || []).slice(0, 4));
      }
    } catch (err) {
      console.error("Failed to load dashboard vehicles:", err);
      triggerToast("⚠ Could not load vehicle data");
    }
  };

  // Fetch drive-out history
  const fetchDriveoutHistory = async () => {
    try {
      const response = await fetch(
        `/api/history?check_out=notnull&facility=${encodeURIComponent(activeFacility)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDriveoutRecords(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load drive-out history:", err);
      triggerToast("⚠ Could not load drive-out history");
    }
  };

  const fetchParkingConfig = async () => {
    setIsLoadingParkingConfig(true);

    try {
      const response = await fetch(
        `/api/config/parking?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (!response.ok) throw new Error("Config request failed");

      const data = (await response.json()) as {
        config?: { levels?: ParkingLevelConfig[] } | null;
      };
      // DEFAULT_PARKING_LEVELS is 11FMD's static layout — only use it as a
      // fallback for 11FMD itself. Any other depot with no config row yet
      // (e.g. 12FMD before its real layout is set up) should show empty,
      // not silently borrow another depot's lots.
      const levels = data.config?.levels?.length
        ? data.config.levels
        : activeFacility === "11FMD"
          ? DEFAULT_PARKING_LEVELS
          : [];

      setParkingLevels(levels);
      if (
        levels.length > 0 &&
        !levels.some((level) => level.id === selectedLevel)
      ) {
        setSelectedLevel(levels[0].id);
      }
      if (levels.length > 0 && !levels.some((level) => level.id === ciLevel)) {
        setCiLevel(levels[0].id);
      }
    } catch (err) {
      console.error("Failed to load parking config:", err);
      triggerToast("Could not load parking layout config");
    } finally {
      setIsLoadingParkingConfig(false);
    }
  };

  const fetchSafetyMessages = async () => {
    try {
      const response = await fetch(
        `/api/safety-messages?facility=${encodeURIComponent(activeFacility)}`,
      );
      if (!response.ok) throw new Error("Safety message request failed");

      const data = (await response.json()) as {
        messages?: SafetyMessageRecord[];
      };
      setSafetyMessages(data.messages || []);
      setSafetyIndex(0);
    } catch (err) {
      console.error("Failed to load safety messages:", err);
    }
  };

  const fetchAdminData = async () => {
    if (!profile?.is_admin) return;

    setIsLoadingAdmin(true);
    try {
      const [usersResponse, safetyResponse, auditResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch(
          `/api/safety-messages?all=true&facility=${encodeURIComponent(activeFacility)}`,
        ),
        fetch("/api/admin/audit-log"),
      ]);

      if (usersResponse.ok) {
        const usersData = (await usersResponse.json()) as {
          users?: AdminUserRecord[];
        };
        setAdminUsers(usersData.users || []);
      }

      if (safetyResponse.ok) {
        const safetyData = (await safetyResponse.json()) as {
          messages?: SafetyMessageRecord[];
        };
        setAdminSafetyMessages(safetyData.messages || []);
      }

      if (auditResponse.ok) {
        const auditData = (await auditResponse.json()) as {
          entries?: AuditLogEntry[];
        };
        setAuditLogEntries(auditData.entries || []);
      } else {
        const auditErr = await auditResponse.json().catch(() => null);
        console.error("Failed to load audit log:", auditErr?.error || auditResponse.status);
        setAuditLogEntries([]);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
      triggerToast("Could not load admin data");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

useEffect(() => {
  if (!auth.isAuthenticated || !profile || isVerificationPending) return;

  fetch("/api/facilities")
    .then((res) => (res.ok ? res.json() : null))
    .then(
      (
        data: {
          facilities?: { code: string; name: string }[];
          error?: string;
        } | null,
      ) => {
        if (data?.facilities) setFacilities(data.facilities);

        if (data?.error) {
          console.error("Failed to load facilities:", data.error);
          triggerToast(`⚠ Could not load depot list: ${data.error}`);
        }
      },
    )
    .catch((err) => console.error("Failed to load facilities:", err));
}, [auth.isAuthenticated, profile, isVerificationPending]);

useEffect(() => {
  if (!auth.isAuthenticated || !profile || !activeFacility || isVerificationPending) {
    return;
  }

  setIsLoadingDashboard(true);

  fetchDashboardData().finally(() => setIsLoadingDashboard(false));
  fetchParkingConfig();
  fetchSafetyMessages();

  // Admins need the full user list so ORD reminders can show on Home
  // without first opening the Admin tab.
  if (profile.is_admin) {
    fetchAdminData();
  }
}, [auth.isAuthenticated, profile, activeFacility, isVerificationPending]);

  // Periodically re-fetch vehicles so newly checked-in vehicles (and any
  // other check-in/check-out activity from other users) show up without
  // requiring a manual page reload.
useEffect(() => {
  if (!auth.isAuthenticated || !profile || !activeFacility || isVerificationPending) {
    return;
  }

  const AUTO_REFRESH_MS = 30000;

  const interval = window.setInterval(() => {
    fetchDashboardData();

    if (profile.is_admin) {
      fetchAdminData();
    }
  }, AUTO_REFRESH_MS);

  return () => window.clearInterval(interval);
}, [auth.isAuthenticated, profile, activeFacility, isVerificationPending]);

useEffect(() => {
  if (!profile || !activeFacility || isVerificationPending) return;

  if (activeTab === "driveout-history") {
    fetchDriveoutHistory();
  }

  if (activeTab === "admin") {
    fetchAdminData();
  }
}, [activeTab, activeFacility, profile, isVerificationPending]);

  useEffect(() => {
    const activeCount =
      safetyMessages.length > 0
        ? safetyMessages.length
        : SAFETY_MESSAGES.length;

    if (activeCount <= 1) return;

    const interval = window.setInterval(() => {
      setSafetyIndex((index) => (index + 1) % activeCount);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [safetyMessages.length]);

  useEffect(() => {
    if (!profile) return;

    setCiDriver((current) => current || profile.name || "");
    setCiDriverPhone((current) => current || profile.phone || "");
    setCiDriverUnit(
      (current) => current || profile.unit || profile.depot || "",
    );
  }, [profile]);

  useEffect(() => {
    setAdminDraftAdmins(
      Object.fromEntries(adminUsers.map((user) => [user.id, user.is_admin])),
    );
  }, [adminUsers]);

const handleFacilityChange = (facilityCode: string) => {
  if (!profile?.is_admin || !facilityCode || facilityCode === activeFacility) {
    return;
  }

  setActiveFacility(facilityCode);
  setIsLoadingDashboard(true);

  // Clear facility-specific UI state so old facility data does not stay selected.
  setSelectedLot(null);
  setSelectedLotVehicle(null);
  setSelectedVehicle(null);
  setSelectedDriveout(null);
  setLatestEsc(null);
  setHistoryRecords([]);
  setDriveoutRecords([]);
  setSearchQuery("");
  setDriveoutSearchQuery("");
};

const adminFacilityOptions =
  facilities.length > 0
    ? facilities
    : activeFacility
      ? [{ code: activeFacility, name: activeFacility }]
      : [];

const facilitySwitcher =
  profile?.is_admin && adminFacilityOptions.length > 0 ? (
    <label className="flex w-full flex-col gap-1 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm sm:w-56">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Facility
      </span>

      <select
        value={activeFacility}
        onChange={(event) => handleFacilityChange(event.target.value)}
        className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
        aria-label="Select facility"
      >
        {adminFacilityOptions.map((facility) => (
          <option key={facility.code} value={facility.code}>
            {facility.name || facility.code}
          </option>
        ))}
      </select>
    </label>
  ) : null;
  
  if (auth.isLoading || !auth.isAuthenticated) {
    return <LoginGate isLoading={auth.isLoading} onLogin={auth.login} />;
  }

if (isVerificationPending) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
          ⏳
        </div>

        <h1 className="text-xl font-bold text-zinc-900">
          Pending verification
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Your profile has been submitted successfully. An admin needs to verify
          your account before you can view parking and vehicle data.
        </p>

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => auth.logout()}
        >
          Sign out
        </Button>
      </div>
    </main>
  );
}

  if (!profile && profileLoadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
        <div className="max-w-sm space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-800">
            Couldn't load your profile
          </p>
          <p className="text-xs text-red-700">{profileLoadError}</p>
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="h-9 bg-red-600 text-sm hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </main>
    );
  }

  if (!profile || isCheckingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
        <p className="text-sm font-medium text-zinc-500">
          Loading your profile...
        </p>
      </main>
    );
  }

  // Safety Message calculations
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const activeSafetyMessages = safetyMessages.length
    ? safetyMessages.map((item) => item.message)
    : SAFETY_MESSAGES;
  const safetyMessage =
    activeSafetyMessages[safetyIndex % activeSafetyMessages.length] ||
    SAFETY_MESSAGES[dayOfYear % SAFETY_MESSAGES.length];
  const safetyDate = new Date().toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Fire Extinguisher Status calculation
  const getFireExtDaysLeft = (dateStr: string | null) => {
    if (!dateStr) return null;
    return Math.floor(
      (new Date(dateStr + "T00:00:00").getTime() -
        new Date().setHours(0, 0, 0, 0)) /
        86400000,
    );
  };

  const getFireExtStatus = (dateStr: string | null) => {
    if (!dateStr)
      return { label: "Unknown", color: "text-zinc-500", bg: "bg-zinc-100/50" };
    const days = getFireExtDaysLeft(dateStr) ?? 0;
    if (days < 0) {
      return {
        label: `Expired ${Math.abs(days)}d ago`,
        color: "text-red-700 font-semibold",
        bg: "bg-red-50 border-red-200",
      };
    }
    if (days <= 90) {
      return {
        label: `Expires in ${days}d`,
        color: "text-amber-700 font-semibold",
        bg: "bg-amber-50 border-amber-200",
      };
    }
    return {
      label: `Valid · ${days}d left`,
      color: "text-emerald-700 font-semibold",
      bg: "bg-emerald-50 border-emerald-200",
    };
  };

  // Fire extinguishers expired, or expiring within the next 14 days, on
  // vehicles currently parked in the facility.
  const FIRE_EXT_WARNING_DAYS = 14;
  const fireExtAlerts = vehicles
    .map((v) => ({ vehicle: v, daysLeft: getFireExtDaysLeft(v.fire_ext_expiry) }))
    .filter(
      (entry) =>
        entry.daysLeft !== null && entry.daysLeft <= FIRE_EXT_WARNING_DAYS,
    )
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  // ORD reminders. Admins see everyone due within 30 days (day 0 = ORD is
  // today, a cue to remove that user from the database); each user also
  // sees their own reminder on their Home tab.
  const getOrdDaysLeft = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const ordDateOnly = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
    ).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    return Math.floor((ordDateOnly - today) / 86400000);
  };

  const ORD_WARNING_DAYS = 30;
  const ordAlerts = adminUsers
    .filter((u) => u.facility_code === activeFacility)
    .map((u) => ({ user: u, daysLeft: getOrdDaysLeft(u.ord_date) }))
    .filter(
      (entry) =>
        entry.daysLeft !== null &&
        entry.daysLeft >= 0 &&
        entry.daysLeft <= ORD_WARNING_DAYS,
    )
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  const myOrdDaysLeft = getOrdDaysLeft(profile?.ord_date);
  const myOrdReminder =
    myOrdDaysLeft !== null &&
    myOrdDaysLeft >= 0 &&
    myOrdDaysLeft <= ORD_WARNING_DAYS
      ? myOrdDaysLeft
      : null;

  // Calculate Zone metrics
  const counts = parkingLevels.reduce<Record<string, number>>((acc, level) => {
    acc[level.id] = 0;
    return acc;
  }, {});
  vehicles.forEach((v) => {
    const matchingLevel = parkingLevels.find((level) =>
      vehicleMatchesLevel(v, level),
    );
    if (matchingLevel) {
      counts[matchingLevel.id]++;
    }
  });
  const selectedLevelConfig =
    parkingLevels.find((level) => level.id === selectedLevel) ??
    parkingLevels[0];
  const selectedLevelLots = getLevelLots(selectedLevelConfig);
  const profileUnit = profile?.unit || profile?.depot || "";
  const activeFacilityName =
    facilities.find((f) => f.code === activeFacility)?.name || activeFacility;
  // Unverified users can browse the app (viewer mode) but can't check
  // vehicles in/out or edit records until an admin verifies them. Mirrors
  // the same rule enforced server-side in requireVerified().
  const isUnverified = !!profile && !profile.is_admin && !profile.is_verified;
  const guardVerifiedAction = (action: () => void) => {
    if (isUnverified) {
      triggerToast(
        "Your account is pending admin verification. You can view the app, but can't make changes yet.",
      );
      return;
    }
    action();
  };
  const currentYear = new Date().getFullYear();
  const profileOrdDate = parseDateInput(peOrdDate);
  const profileOrdYear = profileOrdDate?.getFullYear() ?? currentYear;
  const profileOrdCalendarStart = new Date(
    Math.min(currentYear - 5, profileOrdYear),
    0,
  );
  const profileOrdCalendarEnd = new Date(
    Math.max(currentYear + 45, profileOrdYear),
    11,
  );

  // Handle open vehicle details
  const handleOpenVehicle = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setSelectedDriveout(null);
    setLatestEsc(null);
    setHistoryRecords([]);

    // Turret ESC feature temporarily disabled. Flip this condition back to
    // `profile.is_technician` to restore fetching the latest Turret ESC
    // checklist when a vehicle is opened.
    if (false && profile.is_technician) {
      try {
        const res = await fetch(`/api/turret-esc?vehicle_id=${vehicle.id}`);
        if (res.ok) {
          const d = await res.json();
          setLatestEsc(d.latestEsc);
        }
      } catch (e) {
        console.warn("Could not fetch turret ESC checklist:", e);
      }
    }

    // Fetch vehicle history logs
    try {
      const res = await fetch(
        `/api/history?vehicle_id=${vehicle.id}&facility=${encodeURIComponent(activeFacility)}`,
      );
      if (res.ok) {
        const d = await res.json();
        setHistoryRecords(d.history || []);
      }
    } catch (e) {
      console.warn("Could not fetch history records:", e);
    }

    setActiveTab("detail");
  };

  // Open checked out vehicle details
  const handleOpenDriveoutDetail = (record: any) => {
    setSelectedDriveout(record);
    setSelectedVehicle(null);
    setActiveTab("driveout-detail");
  };

  // Lot selections in dynamic floor maps
  const occupiedLotsMap = (level: string) => {
    const levelConfig =
      parkingLevels.find((parkingLevel) => parkingLevel.id === level) ??
      parkingLevels.find(
        (parkingLevel) =>
          normalizeParkingValue(parkingLevel.id) ===
          normalizeParkingValue(level),
      );
    const map: Record<string, any> = {};
    vehicles
      .filter((v) => vehicleMatchesLevel(v, levelConfig))
      .forEach((v) => {
        map[normalizeParkingValue(v.lot)] = v;
      });
    return map;
  };

  const ciLevelConfig =
    parkingLevels.find((parkingLevel) => parkingLevel.id === ciLevel) ??
    parkingLevels[0];
  const ciLevelLots = getLevelLots(ciLevelConfig);
  const ciOccupiedLots = occupiedLotsMap(ciLevel);
  const updateLevelConfig = selectedVehicle
    ? parkingLevels.find((parkingLevel) =>
        vehicleMatchesLevel(selectedVehicle, parkingLevel),
      )
    : undefined;
  const updateLevelLots = Array.from(
    new Set([
      ...(updateLevelConfig ? getLevelLots(updateLevelConfig) : []),
      ...(selectedVehicle?.lot ? [selectedVehicle.lot] : []),
    ]),
  );
  const updateOccupiedLots = selectedVehicle
    ? occupiedLotsMap(selectedVehicle.level)
    : {};

  const openCheckinModal = () => {
    setCiDriver(profile.name || "");
    setCiDriverPhone(profile.phone || "");
    setCiDriverUnit(profileUnit);
    setCiBattStarterV("24");
    setCiBattAuxV("24");
    setFormError(null);
    setIsCheckingIn(true);
  };

  const handleLotClick = (lotId: string, occupiedVeh: any) => {
    setSelectedLot(lotId);
    setSelectedLotVehicle(occupiedVeh);
  };

  // Submit check-in handler
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciPlate || !ciLevel || !ciLot) {
      setFormError("Plate, Level and Lot are required");
      return;
    }
    if (!/^\d{1,3}(\(\d{1,2}\))?$/.test(ciPlate)) {
      setFormError(
        "Vehicle plate must be up to 3 digits, optionally followed by a bracketed number, e.g. 675(1)",
      );
      return;
    }
    if (
      !ciOdometer ||
      !ciEngineHours ||
      !ciBattStarterV ||
      !ciBattStarterPct ||
      !ciBattAuxV ||
      !ciBattAuxPct ||
      !ciFuelL ||
      !ciFuelPct ||
      !ciFireExpiry
    ) {
      setFormError("Odometer, engine hours, battery, fuel and fire extinguisher expiry are required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      plate: ciPlate,
      variant: ciVariant,
      driver: profile.name,
      driver_phone: profile.phone,
      driver_unit: profileUnit,
      level: ciLevel,
      lot: ciLot,
      odometer: ciOdometer || null,
      engine_hours: ciEngineHours || null,
      starter_v: ciBattStarterV || null,
      starter_pct: ciBattStarterPct || null,
      aux_v: ciBattAuxV || null,
      aux_pct: ciBattAuxPct || null,
      fuel_l: ciFuelL || null,
      fuel_pct: ciFuelPct || null,
      fire_ext_expiry: ciFireExpiry || null,
      notes: ciNotes || null,
      facility: activeFacility,
    };

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Check-in failed");

      triggerToast(`✓ Vehicle ${ciPlate} checked in → ${ciLevel} Lot ${ciLot}`);
      setIsCheckingIn(false);

      // Clear inputs
      setCiPlate("");
      setCiVariant("");
      setCiDriver("");
      setCiDriverPhone("");
      setCiDriverUnit("");
      setCiLot("");
      setCiOdometer("");
      setCiEngineHours("");
      setCiBattStarterV("24");
      setCiBattStarterPct("");
      setCiBattAuxV("24");
      setCiBattAuxPct("");
      setCiFuelL("");
      setCiFuelPct("");
      setCiFireExpiry("");
      setCiNotes("");

      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Update Modal and populate states
  const handleOpenUpdate = () => {
    if (!selectedVehicle) return;
    const v = selectedVehicle;
    setUpVariant(v.variant || "");
    setUpDriver(v.driver || "");
    setUpDriverPhone(v.driver_phone || "");
    setUpDriverUnit(v.driver_unit || v.driver_depot || "");
    setUpLot(v.lot || "");
    setUpOdometer(v.odometer?.toString() || "");
    setUpEngineHours(v.engine_hours?.toString() || "");
    setUpBattStarterV(v.starter_v?.toString() || "");
    setUpBattStarterPct(v.starter_pct?.toString() || "");
    setUpBattAuxV(v.aux_v?.toString() || "");
    setUpBattAuxPct(v.aux_pct?.toString() || "");
    setUpFuelL(v.fuel_l?.toString() || "");
    setUpFuelPct(v.fuel_pct?.toString() || "");
    setUpFireExpiry(v.fire_ext_expiry || "");
    setUpNotes(v.notes || "");
    setIsUpdating(true);
  };

  // Submit update handler
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (
      !upOdometer ||
      !upEngineHours ||
      !upBattStarterV ||
      !upBattStarterPct ||
      !upBattAuxV ||
      !upBattAuxPct ||
      !upFuelL ||
      !upFuelPct ||
      !upFireExpiry
    ) {
      setFormError("Odometer, engine hours, battery, fuel and fire extinguisher expiry are required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      variant: upVariant || null,
      driver: upDriver || null,
      driver_phone: upDriverPhone || null,
      driver_unit: upDriverUnit || null,
      lot: upLot || null,
      odometer: upOdometer ? parseFloat(upOdometer) : null,
      engine_hours: upEngineHours ? parseFloat(upEngineHours) : null,
      starter_v: upBattStarterV ? parseFloat(upBattStarterV) : null,
      starter_pct: upBattStarterPct ? parseInt(upBattStarterPct, 10) : null,
      aux_v: upBattAuxV ? parseFloat(upBattAuxV) : null,
      aux_pct: upBattAuxPct ? parseInt(upBattAuxPct, 10) : null,
      fuel_l: upFuelL ? parseFloat(upFuelL) : null,
      fuel_pct: upFuelPct ? parseInt(upFuelPct, 10) : null,
      fire_ext_expiry: upFireExpiry || null,
      notes: upNotes || null,
      historyRow: {
        vehicle_id: selectedVehicle.id,
        variant: upVariant || selectedVehicle.variant,
        driver_id: selectedVehicle.driver_id || null,
        driver: upDriver || selectedVehicle.driver,
        driver_phone: upDriverPhone || selectedVehicle.driver_phone,
        driver_unit:
          upDriverUnit ||
          selectedVehicle.driver_unit ||
          selectedVehicle.driver_depot,
        lot: upLot || selectedVehicle.lot,
        level: selectedVehicle.level,
        odometer: upOdometer
          ? parseFloat(upOdometer)
          : selectedVehicle.odometer,
        engine_hours: upEngineHours
          ? parseFloat(upEngineHours)
          : selectedVehicle.engine_hours,
        starter_v: upBattStarterV
          ? parseFloat(upBattStarterV)
          : selectedVehicle.starter_v,
        starter_pct: upBattStarterPct
          ? parseInt(upBattStarterPct, 10)
          : selectedVehicle.starter_pct,
        aux_v: upBattAuxV ? parseFloat(upBattAuxV) : selectedVehicle.aux_v,
        aux_pct: upBattAuxPct
          ? parseInt(upBattAuxPct, 10)
          : selectedVehicle.aux_pct,
        fuel_l: upFuelL ? parseFloat(upFuelL) : selectedVehicle.fuel_l,
        fuel_pct: upFuelPct
          ? parseInt(upFuelPct, 10)
          : selectedVehicle.fuel_pct,
        fire_ext_expiry: upFireExpiry || selectedVehicle.fire_ext_expiry,
        notes: upNotes || selectedVehicle.notes,
      },
    };

    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");

      triggerToast("✓ Record updated");
      setIsUpdating(false);

      // Update local detailed view
      const updatedVeh = { ...selectedVehicle, ...d.vehicle };
      setSelectedVehicle(updatedVeh);

      // Fetch latest history
      const historyRes = await fetch(
        `/api/history?vehicle_id=${selectedVehicle.id}&facility=${encodeURIComponent(activeFacility)}`,
      );
      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistoryRecords(histData.history || []);
      }

      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || "Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drive out checkout handler
  const handleDriveoutConfirm = async () => {
    if (!selectedVehicle) return;

    setIsSubmitting(true);
    try {
      const payload = {
        historyRow: {
          vehicle_id: selectedVehicle.id,
          variant: selectedVehicle.variant,
          level: selectedVehicle.level,
          lot: selectedVehicle.lot,
          check_in: selectedVehicle.check_in,
          driver_id: profile.id || selectedVehicle.driver_id || null,
          driver: profile.name || selectedVehicle.driver,
          driver_phone: profile.phone || selectedVehicle.driver_phone,
          driver_unit:
            profile.unit ||
            profile.depot ||
            selectedVehicle.driver_unit ||
            selectedVehicle.driver_depot,
          odometer: selectedVehicle.odometer,
          engine_hours: selectedVehicle.engine_hours,
          starter_v: selectedVehicle.starter_v,
          starter_pct: selectedVehicle.starter_pct,
          aux_v: selectedVehicle.aux_v,
          aux_pct: selectedVehicle.aux_pct,
          fuel_l: selectedVehicle.fuel_l,
          fuel_pct: selectedVehicle.fuel_pct,
          fire_ext_expiry: selectedVehicle.fire_ext_expiry,
          notes: selectedVehicle.notes,
        },
      };

      const res = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Drive-out checkout failed");
      }

      triggerToast(`✓ ${formatPlateDisplay(selectedVehicle.plate)} driven out`);
      setIsConfirmingDriveout(false);
      setSelectedVehicle(null);
      setActiveTab("search");
      fetchDashboardData();
    } catch (err: any) {
      triggerToast(`⚠ Check-out failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit turret Checklist
  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escVehicleId) {
      triggerToast("⚠ Please select a vehicle first");
      return;
    }

    const matchedVeh = vehicles.find(
      (x) => String(x.id) === String(escVehicleId),
    );
    if (!matchedVeh) {
      triggerToast("⚠ Vehicle not found");
      return;
    }
    if ((escScu && Number(escScu) < 0) || (escDcu && Number(escDcu) < 0)) {
      triggerToast("⚠ SCU and DCU must be non-negative");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      vehicle_id: escVehicleId,
      ...escChecks,
      scu: escScu ? parseInt(escScu, 10) : null,
      dcu: escDcu ? parseInt(escDcu, 10) : null,
      fault_list: escFaultList || null,
      notes: escNotes || null,
    };

    try {
      const res = await fetch("/api/turret-esc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Submission failed");

      triggerToast("✓ Checklist submitted successfully");
      setActiveTab("home");

      // Reset checks
      const resetChecks = { ...escChecks };
      Object.keys(resetChecks).forEach((k) => {
        resetChecks[k] = false;
      });
      setEscChecks(resetChecks);
      setEscScu("");
      setEscDcu("");
      setEscFaultList("");
      setEscNotes("");
      setEscVehicleId("");

      fetchDashboardData();
    } catch (err: any) {
      triggerToast(`⚠ Failed to submit: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTurretEsc = () => {
    if (!selectedVehicle || !profile.is_technician) return;

    setEscVehicleId(String(selectedVehicle.id));
    setEscChecks(
      (currentChecks) =>
        Object.fromEntries(
          Object.keys(currentChecks).map((key) => [
            key,
            latestEsc ? latestEsc[key] === true : false,
          ]),
        ) as Record<string, boolean>,
    );
    setEscScu(latestEsc?.scu != null ? String(latestEsc.scu) : "");
    setEscDcu(latestEsc?.dcu != null ? String(latestEsc.dcu) : "");
    setEscFaultList(latestEsc?.fault_list || "");
    setEscNotes(latestEsc?.notes || "");
    setActiveTab("turret-esc");
  };

  // Save profile updates
  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: peName,
          phone: pePhone,
          unit: peUnit,
          rank: peRank,
          ordDate: peOrdDate,
          isTechnician: peIsTechnician,
          facility: peFacility,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save profile failed");

      setProfile(d.profile);
      // If a non-admin just switched their own depot, follow them there —
      // otherwise they'd keep viewing the old depot's data until reload.
      // (Admins keep whatever depot they've toggled to in the header.)
      if (!profile?.is_admin && d.profile?.facility_code) {
        setActiveFacility(d.profile.facility_code);
      }
      setIsEditingProfile(false);
      triggerToast("✓ Profile saved");
    } catch (err: any) {
      triggerToast(`⚠ Profile update failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAdminUsers = async () => {
    const changedUsers = adminUsers.filter(
      (user) =>
        adminDraftAdmins[user.id] !== undefined &&
        adminDraftAdmins[user.id] !== user.is_admin,
    );

    if (!changedUsers.length) {
      triggerToast("No admin changes to save");
      return;
    }

    setIsSavingAdminUsers(true);
    try {
      const updatedUsers = await Promise.all(
        changedUsers.map(async (user) => {
          const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              targetId: user.id,
              isAdmin: adminDraftAdmins[user.id] === true,
            }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || "Admin update failed");
          return d.user as AdminUserRecord;
        }),
      );

      setAdminUsers((users) =>
        users.map(
          (user) =>
            updatedUsers.find((updated) => updated.id === user.id) ?? user,
        ),
      );
      const auditFailure = updatedUsers.find(
        (u: any) => u._auditLogged === false,
      ) as any;
      triggerToast(
        auditFailure
          ? `Admin changes saved (audit log failed: ${auditFailure._auditError || "unknown error"})`
          : "Admin changes saved",
      );
    } catch (err: any) {
      triggerToast(`Admin update failed: ${err.message}`);
    } finally {
      setIsSavingAdminUsers(false);
    }
  };

  const handleToggleUserVerified = async (
    userId: string,
    isVerified: boolean,
  ) => {
    // Optimistic update so the checkbox feels instant.
    setAdminUsers((users) =>
      users.map((user) =>
        user.id === userId ? { ...user, is_verified: isVerified } : user,
      ),
    );

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: userId, isVerified }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Verification update failed");

      // Re-sort (unverified first) now that a status changed.
      await fetchAdminData();
      const auditFailed = d.user?._auditLogged === false;
      triggerToast(
        auditFailed
          ? `${isVerified ? "User verified" : "User marked unverified"} (audit log failed: ${d.user?._auditError || "unknown error"})`
          : isVerified
            ? "User verified"
            : "User marked unverified",
      );
    } catch (err: any) {
      // Roll back on failure.
      setAdminUsers((users) =>
        users.map((user) =>
          user.id === userId ? { ...user, is_verified: !isVerified } : user,
        ),
      );
      triggerToast(`Verification update failed: ${err.message}`);
    }
  };

  const handleCreateSafetyMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/safety-messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: newSafetyMessage,
          startsAt: localInputToUtcIso(newSafetyStartsAt),
          endsAt: localInputToUtcIso(newSafetyEndsAt),
          facility: activeFacility,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Safety message save failed");

      setNewSafetyMessage("");
      setNewSafetyStartsAt("");
      setNewSafetyEndsAt("");
      await fetchSafetyMessages();
      await fetchAdminData();
      triggerToast(
        d.auditLogged === false
          ? `Safety message scheduled (audit log failed: ${d.auditError || "unknown error"})`
          : "Safety message scheduled",
      );
    } catch (err: any) {
      triggerToast(`Safety message failed: ${err.message}`);
    }
  };

  const startRescheduleSafetyMessage = (msg: SafetyMessageRecord) => {
    setEditingSafetyMessageId(msg.id);
    setEditSafetyStartsAt(utcIsoToLocalInput(msg.starts_at));
    setEditSafetyEndsAt(utcIsoToLocalInput(msg.ends_at));
  };

  const cancelRescheduleSafetyMessage = () => {
    setEditingSafetyMessageId(null);
    setEditSafetyStartsAt("");
    setEditSafetyEndsAt("");
  };

  const handleSaveRescheduleSafetyMessage = async (id: string) => {
    try {
      const res = await fetch("/api/safety-messages", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          startsAt: localInputToUtcIso(editSafetyStartsAt),
          endsAt: localInputToUtcIso(editSafetyEndsAt),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Reschedule failed");

      cancelRescheduleSafetyMessage();
      await fetchSafetyMessages();
      await fetchAdminData();
      triggerToast(
        d.auditLogged === false
          ? `Safety message rescheduled (audit log failed: ${d.auditError || "unknown error"})`
          : "Safety message rescheduled",
      );
    } catch (err: any) {
      triggerToast(`Reschedule failed: ${err.message}`);
    }
  };

  const handleDeleteSafetyMessage = async (id: string) => {
    if (!window.confirm("Delete this safety message? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch("/api/safety-messages", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");

      await fetchSafetyMessages();
      await fetchAdminData();
      triggerToast(
        d.auditLogged === false
          ? `Safety message deleted (audit log failed: ${d.auditError || "unknown error"})`
          : "Safety message deleted",
      );
    } catch (err: any) {
      triggerToast(`Delete failed: ${err.message}`);
    }
  };

  // Navigation handlers
  const goTab = (tab: string) => {
    if (tab === "turret-esc" && !profile.is_technician) {
      triggerToast("Only technicians can access the Turret ESC checklist");
      setIsSidebarOpen(false);
      return;
    }

    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const openParkingLevel = (lvl: string) => {
    setSelectedLevel(lvl);
    setSelectedLot(null);
    setSelectedLotVehicle(null);
    goTab("parking");
  };

  // Helpers
  const formatTimeAgo = (iso: string) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const formatLocalTime = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (isoA: string, isoB: string) => {
    const ms = new Date(isoB).getTime() - new Date(isoA).getTime();
    if (ms < 0) return "—";
    const totalMin = Math.floor(ms / 60000);
    const days = Math.floor(totalMin / 1440);
    const hrs = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(
    (v) =>
      (v.plate || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.driver || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.variant || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDriveouts = driveoutRecords.filter(
    (r) =>
      (r.plate || "")
        .toLowerCase()
        .includes(driveoutSearchQuery.toLowerCase()) ||
      (r.driver || "")
        .toLowerCase()
        .includes(driveoutSearchQuery.toLowerCase()) ||
      (r.variant || "")
        .toLowerCase()
        .includes(driveoutSearchQuery.toLowerCase()),
  );
  const adminSearch = adminUserSearch.toLowerCase();
  const filteredAdminUsers = adminUsers.filter(
    (user) =>
      (user.name || "").toLowerCase().includes(adminSearch) ||
      (user.rank || "").toLowerCase().includes(adminSearch) ||
      (user.unit || user.depot || "").toLowerCase().includes(adminSearch) ||
      (user.phone || "").toLowerCase().includes(adminSearch),
  );
  const hasAdminUserChanges = adminUsers.some(
    (user) =>
      adminDraftAdmins[user.id] !== undefined &&
      adminDraftAdmins[user.id] !== user.is_admin,
  );

  // SVG dynamic layout helpers
  const drawLotRectJSX = (
    level: string,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    occupiedMap: Record<string, any>,
  ) => {
    const veh = occupiedMap[label];
    const isOccupied = !!veh;
    const isSelected = selectedLevel === level && selectedLot === label;

    const fill = isSelected ? "#FFF3CD" : isOccupied ? "#C8DFB0" : "#FFFFFF";
    const stroke = isSelected ? "#D4860A" : isOccupied ? "#5C7A3E" : "#C8CDB8";
    const textColor = isSelected
      ? "#9c6200"
      : isOccupied
        ? "#3A5A20"
        : "#6B7560";

    return (
      <g
        key={label}
        className="cursor-pointer select-none"
        onClick={() => handleLotClick(label, veh || null)}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={3}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
          className="transition-colors duration-150"
        />
        <text
          x={x + w / 2}
          y={y + h / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8.5"
          fontFamily="Inter,sans-serif"
          fontWeight={isOccupied ? "700" : "500"}
          fill={textColor}
        >
          {label}
        </text>
      </g>
    );
  };

  const drawRoomRectJSX = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fill = "#EEF0E8",
    textColor = "#5A6050",
  ) => {
    const lines = label.split("\n");
    const lineH = 9;
    const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2;

    return (
      <g key={label}>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={4}
          fill={fill}
          stroke="#B8BEB0"
          strokeWidth="1.2"
        />
        {lines.map((line, i) => (
          <text
            key={i}
            x={x + w / 2}
            y={startY + i * lineH}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7.5"
            fontFamily="Inter,sans-serif"
            fontWeight="600"
            fill={textColor}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  const drawDrivewayLabelJSX = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    vertical = false,
  ) => (
    <text
      key={key}
      x={x + w / 2}
      y={y + h / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="7.5"
      fontFamily="Inter,sans-serif"
      fill="#A0A89A"
      letterSpacing="1"
      transform={vertical ? `rotate(-90,${x + w / 2},${y + h / 2})` : undefined}
    >
      DRIVEWAY
    </text>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans flex flex-col antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-zinc-900 text-white px-4 py-2 text-sm shadow-lg font-medium transition animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 rounded-lg">
          <button
            type="button"
            onClick={() => goTab("home")}
            className="rounded-lg transition hover:opacity-80 focus:outline-none focus:ring-3 focus:ring-red-600/15"
            aria-label="Go to home page"
          >
            <Image
              src="/unit-logo.jpeg"
              alt="Parking unit logo"
              width={40}
              height={40}
              className="size-10 rounded-md object-cover border border-zinc-200"
              priority
            />
          </button>
          <div>
            <p className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">
              FleetOps
            </p>
            {profile.is_admin && facilities.length > 0 ? (
              <select
                value={activeFacility}
                onChange={(e) => setActiveFacility(e.target.value)}
                aria-label="Switch depot"
                className="-ml-1 rounded-md border-none bg-transparent px-1 text-lg font-bold tracking-tight outline-none transition hover:bg-zinc-50 focus:ring-3 focus:ring-red-600/15"
              >
                {facilities.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <h1
                onClick={() => goTab("home")}
                className="cursor-pointer text-lg font-bold tracking-tight"
              >
                {activeFacilityName}
              </h1>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="hover:bg-zinc-100"
          >
            <Menu className="size-5" />
          </Button>
          <div
            onClick={() => goTab("profile")}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-red-100 border border-red-200 font-semibold text-red-700 text-sm hover:bg-red-200 transition"
          >
            {(profile.name || "U")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      </header>

      {/* Sidebar navigation */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className="w-72 bg-white h-full border-r border-zinc-200 p-6 flex flex-col justify-between shadow-xl animate-in slide-in-from-left duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">FleetOps</h2>
                  <p className="text-xs text-zinc-500">{activeFacilityName} Carpark</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-full size-8"
                >
                  <span className="font-bold text-lg">×</span>
                </Button>
              </div>

              <nav className="space-y-1.5">
                {[
                  {
                    id: "home",
                    label: "Home",
                    icon: <CarFront className="size-4" />,
                  },
                  {
                    id: "search",
                    label: "Vehicles",
                    icon: <Search className="size-4" />,
                  },
                  {
                    id: "parking",
                    label: "Parking Overview",
                    icon: <MapPin className="size-4" />,
                  },
                  // Turret ESC Checklist tab — temporarily disabled.
                  // Change `false &&` back to `profile.is_technician` to
                  // restore this nav item.
                  ...(false && profile.is_technician
                    ? [
                        {
                          id: "turret-esc",
                          label: "Turret ESC Checklist",
                          icon: <Wrench className="size-4" />,
                        },
                      ]
                    : []),
                  {
                    id: "driveout-history",
                    label: "Drive-Out History",
                    icon: <Clock className="size-4" />,
                  },
                  {
                    id: "profile",
                    label: "Profile",
                    icon: <User className="size-4" />,
                  },
                  ...(profile.is_admin
                    ? [
                        {
                          id: "admin",
                          label: "Admin",
                          icon: <ShieldCheck className="size-4" />,
                        },
                      ]
                    : []),
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition",
                      activeTab === item.id
                        ? "bg-red-50 text-red-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-red-100 border border-red-200 font-semibold text-red-700 text-sm">
                  {(profile.name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-bold truncate leading-none mb-1">
                    {profile.name}
                    <UnverifiedDot isVerified={profile.is_verified} />
                  </p>
                  <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    {profile.is_admin
                      ? "Admin"
                      : profile.is_technician
                        ? "Technician"
                        : "Combatant"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-zinc-600 hover:bg-red-50 hover:text-red-700 border-zinc-200"
                onClick={auth.logout}
              >
                <LogOut className="size-4 mr-2" />
                Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Tab Contents */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-20">
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Unverified account notice */}
            {isUnverified && (
              <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-zinc-700 font-bold text-xs uppercase tracking-wider">
                  <User className="size-4" />
                  Pending Verification
                </div>
                <p className="text-zinc-600 text-sm font-medium">
                  Your account hasn't been verified by an admin yet. You can
                  look around, but you won't be able to check vehicles
                  in/out or edit records until you're verified.
                </p>
              </div>
            )}

            {/* Safety card of the day */}
            <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="size-4" />
                Safety Message of the Day
              </div>
              <p className="text-zinc-800 text-sm sm:text-base font-medium leading-relaxed italic">
                "{safetyMessage}"
              </p>
              <p className="text-zinc-500 text-[11px] font-medium">
                {safetyDate}
              </p>
            </div>

            {/* Fire Extinguisher Expiry Alerts */}
            {fireExtAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-200/70 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                  <Flame className="size-4" />
                  Fire Extinguisher{fireExtAlerts.length > 1 ? "s" : ""} Needing
                  Attention
                </div>
                <div className="space-y-1.5">
                  {fireExtAlerts.map(({ vehicle, daysLeft }) => (
                    <div
                      key={vehicle.id}
                      onClick={() => handleOpenVehicle(vehicle)}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/70 border border-red-100 px-3 py-2 cursor-pointer hover:bg-white transition"
                    >
                      <span className="text-sm font-bold text-zinc-800">
                        {formatPlateDisplay(vehicle.plate)}{" "}
                        <span className="font-medium text-zinc-500">
                          ({vehicle.variant})
                        </span>
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold shrink-0",
                          (daysLeft ?? 0) < 0
                            ? "text-red-700"
                            : "text-amber-700",
                        )}
                      >
                        {(daysLeft ?? 0) < 0
                          ? `Expired ${Math.abs(daysLeft ?? 0)}d ago`
                          : `Expires in ${daysLeft}d`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal ORD Reminder */}
            {myOrdReminder !== null && (
              <div
                className={cn(
                  "rounded-xl p-4 sm:p-5 shadow-xs space-y-1 border",
                  myOrdReminder === 0
                    ? "bg-red-50 border-red-200/70"
                    : "bg-amber-50 border-amber-200/70",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 font-bold text-xs uppercase tracking-wider",
                    myOrdReminder === 0 ? "text-red-800" : "text-amber-800",
                  )}
                >
                  <User className="size-4" />
                  ORD Reminder
                </div>
                <p className="text-zinc-800 text-sm font-medium">
                  {profile.name}, {profileUnit || "No unit"} due to ORD{" "}
                  {myOrdReminder === 0
                    ? "today"
                    : `within ${ORD_WARNING_DAYS} days`}
                  .
                </p>
              </div>
            )}

            {/* Admin: ORD Reminders for all users */}
            {profile.is_admin && ordAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <User className="size-4" />
                  ORD Reminders
                </div>
                <div className="space-y-1.5">
                  {ordAlerts.map(({ user, daysLeft }) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                        daysLeft === 0
                          ? "bg-red-50 border-red-200"
                          : "bg-white/70 border-amber-100",
                      )}
                    >
                      <span className="text-sm font-medium text-zinc-800">
                        {user.name}, {user.unit || user.depot || "No unit"}{" "}
                        due to ORD{" "}
                        {daysLeft === 0
                          ? "today"
                          : `within ${ORD_WARNING_DAYS} days`}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold shrink-0",
                          daysLeft === 0 ? "text-red-700" : "text-amber-700",
                        )}
                      >
                        {daysLeft === 0
                          ? "Remove from database"
                          : `${daysLeft}d left`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-500 tracking-wider uppercase">
                Quick Actions
              </h2>
              <Button
                type="button"
                onClick={() => guardVerifiedAction(openCheckinModal)}
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

            {/* Active Totals Counter Card */}
            {isLoadingDashboard ? (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
                  {parkingLevels.map((level) => (
                    <Skeleton
                      key={level.id}
                      className="h-16 w-full sm:w-24 rounded-lg"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-1">
                  <div className="text-5xl font-black tracking-tight text-red-600">
                    {vehicles.length}
                  </div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    Vehicles currently parked in {activeFacilityName}
                  </p>
                </div>

                {/* Levels chips */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
                  {parkingLevels.map((level) => {
                    const c = counts[level.id] || 0;
                    const levelTotal =
                      level.totalLots ?? getLevelLots(level).length;
                    const occupancyClasses = getLotOccupancyClasses(
                      c,
                      levelTotal,
                    );
                    return (
                      <div
                        key={level.id}
                        onClick={() => openParkingLevel(level.id)}
                        className={cn(
                          "cursor-pointer border rounded-lg p-3 w-full sm:w-24 text-center transition-colors shadow-xs",
                          occupancyClasses.box ||
                            "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
                        )}
                      >
                        <div className="text-lg font-black text-zinc-800">
                          {c}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">
                          {level.icon || level.id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recently Checked In List */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-zinc-500 tracking-wider uppercase">
                Recently Checked In
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {isLoadingDashboard ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-4"
                    >
                      <Skeleton className="size-10 rounded-lg shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                ) : recentVehicles.length > 0 ? (
                  recentVehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => handleOpenVehicle(v)}
                      className="cursor-pointer bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xs p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-zinc-100 text-zinc-600 rounded-lg flex items-center justify-center">
                          <CarFront className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">
                            {formatPlateDisplay(v.plate)}
                          </div>
                          <p className="text-xs text-zinc-500 font-medium">
                            {v.variant} &nbsp;·&nbsp; {v.level} · Lot {v.lot}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-red-600 font-semibold">
                          {formatTimeAgo(v.check_in)}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          {v.driver || "—"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-sm py-4 text-center col-span-full font-medium">
                    No active vehicles checked in yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH VEHICLES */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicle plate, variant or driver..."
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 bg-white text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 shadow-xs"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {isLoadingDashboard ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
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
                filteredVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleOpenVehicle(v)}
                    className="cursor-pointer bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xs p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-zinc-100 text-zinc-600 rounded-lg flex items-center justify-center">
                        <CarFront className="size-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{formatPlateDisplay(v.plate)}</div>
                        <p className="text-xs text-zinc-500 font-medium">
                          {v.variant} &nbsp;·&nbsp; {v.level} · Lot {v.lot}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-red-600 font-semibold">
                        {formatTimeAgo(v.check_in)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                        {v.driver || "—"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm py-8 text-center col-span-full font-medium">
                  No active vehicles found matching search.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PARKING OVERVIEW & MAPS */}
        {activeTab === "parking" && (
          <div className="space-y-6">
            {/* Level picking grid */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
              {parkingLevels.map((level) => {
                const occ = counts[level.id] || 0;
                const levelTotal = level.totalLots ?? getLevelLots(level).length;
                const occupancyClasses = getLotOccupancyClasses(occ, levelTotal);
                return (
                  <div
                    key={level.id}
                    onClick={() => openParkingLevel(level.id)}
                    className={cn(
                      "cursor-pointer border p-3 w-full sm:w-36 rounded-xl flex items-center gap-3 shadow-xs transition-all",
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
                        {occ}/{levelTotal}{" "}
                        lots
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive SVG Layout */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
                <div>
                  <h3 className="font-bold text-zinc-800">
                    Parking Map —{" "}
                    {selectedLevelConfig?.label ?? "Not configured"}
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

              {/* Scrollable Map Area */}
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
                                  style={{
                                    gridRow: `span ${cell.rowSpan ?? 1}`,
                                  }}
                                  className="flex w-8 flex-col items-center justify-center rounded-md border border-sky-200 bg-sky-50 px-0.5 text-center text-[8px] font-extrabold leading-tight text-sky-800"
                                >
                                  {cell.label.split("\n").map((line) => (
                                    <span key={line}>{line}</span>
                                  ))}
                                </div>
                              );
                            }

                            const lot = cell.id;
                            const occ = occupiedLotsMap(selectedLevel);
                            const vehicle = occ[normalizeParkingValue(lot)];
                            return (
                              <button
                                key={cellKey}
                                type="button"
                                onClick={() => handleLotClick(lot, vehicle)}
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

              {/* Lot occupancy detail card */}
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
                          {selectedLotVehicle.variant || "—"}
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
                        onClick={() => handleOpenVehicle(selectedLotVehicle)}
                        className="bg-red-600 hover:bg-red-700 h-8 text-xs font-semibold px-4 shrink-0"
                      >
                        View details
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full py-4 text-center text-sm font-semibold text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg animate-in fade-in duration-100">
                      Lot{" "}
                      <span className="text-zinc-700 font-bold">
                        {selectedLot}
                      </span>{" "}
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
        )}

        {/* TAB 4: TURRET CHECKLIST — temporarily disabled.
            Change `false &&` back to `activeTab === "turret-esc" &&` to
            restore this tab. */}
        {false && activeTab === "turret-esc" && profile.is_technician && (
          <form
            onSubmit={handleChecklistSubmit}
            className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold">Turret ESC Checklist</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Submit a new diagnostic audit log for checked-in platforms
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Select Platform
                <RequiredMark />
              </label>
              <select
                value={escVehicleId}
                onChange={(e) => setEscVehicleId(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
              >
                <option value="">-- Choose a vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} ({v.variant})
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist Checkboxes */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-700">
                Subsystem checks
              </label>
              <div className="grid grid-cols-2 gap-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                {Object.keys(escChecks).map((chkKey) => {
                  const label = chkKey
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");

                  return (
                    <label
                      key={chkKey}
                      className="flex items-center gap-2 text-sm text-zinc-700 font-medium select-none cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={escChecks[chkKey]}
                        onChange={(e) =>
                          setEscChecks({
                            ...escChecks,
                            [chkKey]: e.target.checked,
                          })
                        }
                        className="size-4 rounded border-zinc-300 text-red-600 focus:ring-red-600/20 accent-red-700"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Integer checks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">
                  SCU (Integer)
                </label>
                <input
                  type="number"
                  min="0"
                  value={escScu}
                  onChange={(e) => setEscScu(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">
                  DCU (Integer)
                </label>
                <input
                  type="number"
                  min="0"
                  value={escDcu}
                  onChange={(e) => setEscDcu(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Fault List
              </label>
              <textarea
                value={escFaultList}
                onChange={(e) => setEscFaultList(e.target.value)}
                placeholder="Any errors or faults detected..."
                className="w-full min-h-[70px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Audit Notes
              </label>
              <textarea
                value={escNotes}
                onChange={(e) => setEscNotes(e.target.value)}
                placeholder="Diagnostic audit notes..."
                className="w-full min-h-[70px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 h-10 font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Checklist"}
            </Button>
          </form>
        )}

        {/* TAB 5: DRIVE-OUT HISTORY */}
        {activeTab === "driveout-history" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-zinc-400" />
              <input
                type="text"
                value={driveoutSearchQuery}
                onChange={(e) => setDriveoutSearchQuery(e.target.value)}
                placeholder="Search plate or driver..."
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 bg-white text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!filteredDriveouts.length}
                onClick={() => exportDriveoutHistoryCSV(filteredDriveouts)}
                className="h-8 gap-1.5 text-xs"
              >
                <FileText className="size-3.5" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!filteredDriveouts.length}
                onClick={() => exportDriveoutHistoryPDF(filteredDriveouts)}
                className="h-8 gap-1.5 text-xs"
              >
                <FileText className="size-3.5" />
                Export PDF
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {filteredDriveouts.length > 0 ? (
                filteredDriveouts.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleOpenDriveoutDetail(r)}
                    className="cursor-pointer bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xs p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{formatPlateDisplay(r.plate)}</div>
                        <p className="text-xs text-zinc-500 font-medium">
                          {r.variant} &nbsp;·&nbsp; {r.level} · Lot {r.lot}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-red-600 font-semibold">
                        OUT {r.check_out ? formatTimeAgo(r.check_out) : "—"}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                        {r.driver || "—"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm py-8 text-center col-span-full font-medium">
                  No drive-out logs found matching search.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-bold">My Profile</h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Manage your personal account details
                </p>
              </div>
              {!isEditingProfile ? (
                <Button
                  onClick={() => {
                    setPeName(profile.name || "");
                    setPePhone(profile.phone || "");
                    setPeUnit(profile.unit || profile.depot || "");
                    setPeFacility(profile.facility_code || "");
                    setPeRank(profile.rank || "");
                    setPeOrdDate(profile.ord_date?.slice(0, 10) || "");
                    setPeIsTechnician(profile.is_technician === true);
                    setIsEditingProfile(true);
                  }}
                  variant="outline"
                  className="h-9 px-3 text-xs"
                >
                  <Edit2 className="size-3.5 mr-1" />
                  Edit Profile
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col items-center py-4 bg-zinc-50/50 rounded-xl border border-zinc-100 space-y-2">
              <div className="flex size-16 items-center justify-center rounded-full bg-red-100 border-2 border-red-200 font-bold text-red-700 text-xl shadow-xs">
                {(profile.name || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1.5 text-base font-extrabold text-zinc-900">
                  {profile.name}
                  <UnverifiedDot isVerified={profile.is_verified} />
                </p>
                <span className="inline-block bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">
                  {profile.rank || "REC"}
                </span>
              </div>
            </div>

            {!isEditingProfile ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Phone</span>
                  <span className="font-semibold">{profile.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Unit</span>
                  <span className="font-semibold">
                    {profile.unit || profile.depot || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Role</span>
                  <span className="font-bold text-red-700 capitalize">
                    {profile.is_admin
                      ? "Admin"
                      : profile.is_technician
                        ? "Technician"
                        : "Combatant"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">ORD Date</span>
                  <span className="font-semibold">
                    {profile.ord_date
                      ? format(new Date(profile.ord_date), "dd MMM yyyy")
                      : "—"}
                  </span>
                </div>

                <Button
                  onClick={auth.logout}
                  className="w-full bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 font-bold border border-red-100"
                >
                  <LogOut className="size-4 mr-2" />
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={peName}
                    onChange={(e) => setPeName(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Phone
                    <RequiredMark />
                  </label>
                  <input
                    type="tel"
                    value={pePhone}
                    onChange={(e) => setPePhone(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">
                      Depot
                      <RequiredMark />
                    </label>
                    <Select value={peFacility} onValueChange={setPeFacility}>
                      <SelectTrigger className="w-full h-10 bg-white border-zinc-200 focus:border-red-600 focus:ring-3 focus:ring-red-600/15 justify-between">
                        <SelectValue placeholder="Select depot" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-zinc-200 shadow-md rounded-md">
                        {facilities.map((f) => (
                          <SelectItem
                            key={f.code}
                            value={f.code}
                            className="cursor-pointer"
                          >
                            {f.name} ({f.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">
                      Unit
                      <RequiredMark />
                    </label>
                    <input
                      type="text"
                      value={peUnit}
                      onChange={(e) => setPeUnit(e.target.value)}
                      placeholder="e.g. Alpha Coy"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">
                      Rank
                      <RequiredMark />
                    </label>
                    <Select value={peRank} onValueChange={setPeRank}>
                      <SelectTrigger className="w-full h-10 bg-white border-zinc-200 focus:border-red-600 focus:ring-3 focus:ring-red-600/15 justify-between">
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white border border-zinc-200 shadow-md rounded-md">
                        {RANK_CATEGORIES.map((category) => (
                          <SelectGroup key={category.label}>
                            <SelectLabel className="px-2 py-1 text-xs font-semibold text-zinc-500 bg-zinc-50/50">
                              {category.label}
                            </SelectLabel>
                            {category.ranks.map((rankOption) => (
                              <SelectItem
                                key={rankOption}
                                value={rankOption}
                                className="cursor-pointer"
                              >
                                {rankOption}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">
                      ORD date
                      <RequiredMark />
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-10 w-full justify-between rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal hover:bg-zinc-50 focus:border-red-600 focus:ring-3 focus:ring-red-600/15",
                            !peOrdDate && "text-muted-foreground",
                          )}
                        >
                          <span>
                            {profileOrdDate
                              ? format(profileOrdDate, "dd MMM yyyy")
                              : "Select date"}
                          </span>
                          <Calendar
                            className="size-4 text-zinc-400"
                            aria-hidden="true"
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-white border border-zinc-200 shadow-md rounded-md"
                        align="start"
                      >
                        <DatePickerCalendar
                          mode="single"
                          selected={profileOrdDate}
                          captionLayout="dropdown"
                          navLayout="after"
                          startMonth={profileOrdCalendarStart}
                          endMonth={profileOrdCalendarEnd}
                          onSelect={(date) => {
                            setPeOrdDate(date ? toDateInputValue(date) : "");
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm">
                  <span className="font-medium">Technician</span>
                  <input
                    className="size-4 accent-red-700"
                    type="checkbox"
                    checked={peIsTechnician}
                    onChange={(event) =>
                      setPeIsTechnician(event.target.checked)
                    }
                  />
                </label>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: ADMIN */}
        {activeTab === "admin" && profile.is_admin && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold">Admin</h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    Manage users and scheduled safety messages.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-sm font-semibold">
                  {[
                    { id: "users", label: "Users" },
                    { id: "safety", label: "Safety" },
                    { id: "activity", label: "Activity" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setAdminActiveTab(
                          tab.id as "users" | "safety" | "activity",
                        )
                      }
                      className={cn(
                        "rounded-md px-4 py-2 transition",
                        adminActiveTab === tab.id
                          ? "bg-white text-red-700 shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {adminActiveTab === "users" && (
                <div className="space-y-4 border-t border-zinc-100 pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="search"
                      value={adminUserSearch}
                      onChange={(e) => setAdminUserSearch(e.target.value)}
                      placeholder="Search users by name, rank, unit or phone"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 sm:max-w-sm"
                    />
                    <div className="flex items-center gap-2">
                      {hasAdminUserChanges && (
                        <span className="text-xs font-semibold text-amber-700">
                          Unsaved changes
                        </span>
                      )}
                      <Button
                        type="button"
                        onClick={handleSaveAdminUsers}
                        disabled={!hasAdminUserChanges || isSavingAdminUsers}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isSavingAdminUsers ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>

                  {isLoadingAdmin ? (
                    <p className="py-6 text-center text-sm text-zinc-500">
                      Loading admin data...
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-zinc-200">
                      <div className="grid grid-cols-[1.5fr_auto_1fr_auto] gap-3 bg-zinc-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <span>User</span>
                        <span>Verified</span>
                        <span>Role</span>
                        <span className="text-right">Admin</span>
                      </div>
                      {filteredAdminUsers.map((user) => (
                        <div
                          key={user.id}
                          className="grid grid-cols-[1.5fr_auto_1fr_auto] items-center gap-3 border-t border-zinc-100 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-sm font-bold text-zinc-900">
                              <UnverifiedDot isVerified={user.is_verified} />
                              {user.rank ? `${user.rank} ` : ""}
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {user.phone || "No phone"} ·{" "}
                              {user.unit || user.depot || "No unit"}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            aria-label={`Mark ${user.name} as verified`}
                            className="size-4 accent-emerald-600"
                            checked={user.is_verified === true}
                            onChange={(e) =>
                              handleToggleUserVerified(
                                user.id,
                                e.target.checked,
                              )
                            }
                          />
                          <span className="text-xs font-semibold text-zinc-600">
                            {user.is_technician ? "Technician" : "Combatant"}
                          </span>
                          <input
                            type="checkbox"
                            aria-label={`Set admin access for ${user.name}`}
                            className="ml-auto size-4 accent-red-700"
                            checked={adminDraftAdmins[user.id] === true}
                            disabled={user.id === profile.id}
                            onChange={(e) =>
                              setAdminDraftAdmins((draft) => ({
                                ...draft,
                                [user.id]: e.target.checked,
                              }))
                            }
                          />
                        </div>
                      ))}
                      {!filteredAdminUsers.length && (
                        <p className="border-t border-zinc-100 py-6 text-center text-sm text-zinc-500">
                          No users found.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {adminActiveTab === "safety" && (
                <div className="grid gap-6 border-t border-zinc-100 pt-4 lg:grid-cols-2">
                  <form
                    onSubmit={handleCreateSafetyMessage}
                    className="space-y-3"
                  >
                    <label className="text-sm font-semibold text-zinc-700">
                      Safety message
                      <RequiredMark />
                    </label>
                    <textarea
                      value={newSafetyMessage}
                      onChange={(e) => setNewSafetyMessage(e.target.value)}
                      required
                      className="min-h-20 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500">
                          Starts
                        </label>
                        <input
                          type="datetime-local"
                          value={newSafetyStartsAt}
                          onChange={(e) => setNewSafetyStartsAt(e.target.value)}
                          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500">
                          Ends
                        </label>
                        <input
                          type="datetime-local"
                          value={newSafetyEndsAt}
                          onChange={(e) => setNewSafetyEndsAt(e.target.value)}
                          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 sm:w-fit"
                    >
                      <Plus className="size-4 mr-1" />
                      Add message
                    </Button>
                  </form>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                      Safety Schedule
                    </h4>
                    {adminSafetyMessages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg border border-zinc-100 p-3 space-y-2"
                      >
                        <p className="text-sm font-medium text-zinc-800">
                          {message.message}
                        </p>

                        {editingSafetyMessageId === message.id ? (
                          <div className="space-y-2 rounded-md bg-zinc-50 p-2">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-500">
                                  Starts
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editSafetyStartsAt}
                                  onChange={(e) =>
                                    setEditSafetyStartsAt(e.target.value)
                                  }
                                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-red-600"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-zinc-500">
                                  Ends
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editSafetyEndsAt}
                                  onChange={(e) =>
                                    setEditSafetyEndsAt(e.target.value)
                                  }
                                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-red-600"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() =>
                                  handleSaveRescheduleSafetyMessage(message.id)
                                }
                                className="h-8 flex-1 bg-red-600 text-xs hover:bg-red-700"
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={cancelRescheduleSafetyMessage}
                                className="h-8 flex-1 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] font-semibold text-zinc-500">
                              {message.starts_at
                                ? format(
                                    new Date(message.starts_at),
                                    "dd MMM yyyy HH:mm",
                                  )
                                : "Always on"}{" "}
                              to{" "}
                              {message.ends_at
                                ? format(
                                    new Date(message.ends_at),
                                    "dd MMM yyyy HH:mm",
                                  )
                                : "no end"}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  startRescheduleSafetyMessage(message)
                                }
                                className="h-7 gap-1 px-2 text-[11px]"
                              >
                                <Edit2 className="size-3" />
                                Reschedule
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  handleDeleteSafetyMessage(message.id)
                                }
                                className="h-7 gap-1 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="size-3" />
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {!adminSafetyMessages.length && (
                      <p className="py-6 text-center text-sm text-zinc-500">
                        No safety messages added yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {adminActiveTab === "activity" && (
                <div className="space-y-2 border-t border-zinc-100 pt-4">
                  <p className="text-xs text-zinc-500 font-medium">
                    Recent admin actions — verifying users, granting or
                    revoking admin access, and managing safety messages.
                  </p>
                  <div className="overflow-hidden rounded-lg border border-zinc-200">
                    {auditLogEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 border-t border-zinc-100 px-3 py-2.5 text-sm first:border-t-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-800">
                            <span className="font-bold">
                              {entry.actor_name || "Unknown admin"}
                            </span>{" "}
                            {AUDIT_ACTION_LABELS[entry.action] ||
                              entry.action}
                            {entry.target_label ? (
                              <>
                                {" "}
                                <span className="font-semibold">
                                  {entry.target_label}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-400 font-medium">
                          {format(new Date(entry.created_at), "dd MMM HH:mm")}
                        </span>
                      </div>
                    ))}
                    {!auditLogEntries.length && (
                      <p className="py-6 text-center text-sm text-zinc-500">
                        No admin activity recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: ACTIVE VEHICLE DETAILS VIEW */}
        {activeTab === "detail" && selectedVehicle && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("search")}
                className="h-8 px-2 font-semibold text-xs"
              >
                <ArrowLeft className="size-4 mr-1" />
                Back to search
              </Button>
              <span className="inline-block bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {selectedVehicle.level} · Lot {selectedVehicle.lot}
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {formatPlateDisplay(selectedVehicle.plate)}
              </h2>
              <p className="text-sm text-zinc-500 font-semibold mt-1">
                {selectedVehicle.variant}
              </p>
              <p className="text-[11px] text-zinc-400 font-medium mt-1">
                Checked in:{" "}
                {selectedVehicle.check_in
                  ? formatLocalTime(selectedVehicle.check_in)
                  : "—"}
              </p>
            </div>

            {/* Driver Card */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Last Operator
              </h3>
              <div className="border border-zinc-200 rounded-xl p-4 flex items-center gap-4 bg-zinc-50/25">
                <div className="flex size-11 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-700 text-sm">
                  {(selectedVehicle.driver || "UN")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-zinc-900">
                    {selectedVehicle.driver}
                  </p>
                  <p className="text-xs text-zinc-500 font-semibold">
                    {selectedVehicle.driver_unit ||
                      selectedVehicle.driver_depot}
                  </p>
                  {selectedVehicle.driver_phone && (
                    <a
                      target="_blank"
                      href={`https://wa.me/+65${selectedVehicle.driver_phone}`}
                      className="text-xs text-red-600 font-bold mt-1 inline-block hover:underline"
                    >
                      {selectedVehicle.driver_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stat Readings */}
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
                    {selectedVehicle.odometer !== null
                      ? Number(selectedVehicle.odometer).toLocaleString()
                      : "—"}{" "}
                    <span className="text-xs font-normal text-zinc-500">
                      km
                    </span>
                  </div>
                </div>
                <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-zinc-400 font-bold uppercase">
                    Engine Hours
                  </div>
                  <div className="text-xl font-extrabold text-zinc-800 mt-1">
                    {selectedVehicle.engine_hours || "—"}{" "}
                    <span className="text-xs font-normal text-zinc-500">
                      hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Readings */}
            <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/25">
              <div className="flex items-center justify-between text-xs border-b border-zinc-100 pb-2">
                <span className="font-bold text-zinc-600">
                  Starter Battery (24V)
                </span>
                <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
                  {selectedVehicle.starter_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedVehicle.starter_pct || 0}%
                  <PercentDot pct={selectedVehicle.starter_pct} />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-600">
                  Auxiliary Battery (24V)
                </span>
                <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
                  {selectedVehicle.aux_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedVehicle.aux_pct || 0}%
                  <PercentDot pct={selectedVehicle.aux_pct} />
                </span>
              </div>
            </div>

            {/* Fuel gauge */}
            <div className="border border-zinc-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span className="font-bold">Fuel Level</span>
                <span className="font-semibold">
                  {selectedVehicle.fuel_l !== null
                    ? `${selectedVehicle.fuel_l}L`
                    : "—"}{" "}
                  remaining
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "text-2xl font-black shrink-0",
                    selectedVehicle.fuel_pct > 50
                      ? "text-emerald-600"
                      : selectedVehicle.fuel_pct > 20
                        ? "text-amber-500"
                        : "text-red-600",
                  )}
                >
                  {selectedVehicle.fuel_pct || 0}%
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        selectedVehicle.fuel_pct > 50
                          ? "bg-emerald-500"
                          : selectedVehicle.fuel_pct > 20
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                      style={{ width: `${selectedVehicle.fuel_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fire Extinguisher Card */}
            {(() => {
              const fs = getFireExtStatus(selectedVehicle.fire_ext_expiry);
              return (
                <div
                  className={cn(
                    "border rounded-xl p-4 flex items-center gap-4 shadow-2xs",
                    fs.bg,
                  )}
                >
                  <div className="text-3xl select-none leading-none shrink-0">
                    🧯
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                      Fire Extinguisher
                    </p>
                    <p className="font-bold text-sm text-zinc-800">
                      Expiry:{" "}
                      {selectedVehicle.fire_ext_expiry
                        ? format(
                            new Date(
                              selectedVehicle.fire_ext_expiry + "T00:00:00",
                            ),
                            "dd MMM yyyy",
                          )
                        : "Not recorded"}
                    </p>
                    <p className={cn("text-xs mt-1", fs.color)}>{fs.label}</p>
                  </div>
                </div>
              );
            })()}

            {/* Latest Turret ESC Section — temporarily disabled.
                Change `false &&` back to `profile.is_technician &&` to
                restore this section. */}
            {false && profile.is_technician && (
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
                      &nbsp;·&nbsp; {formatLocalTime(latestEsc.created_at)}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                      {[
                        ["ICS", latestEsc.ics],
                        ["GSU", latestEsc.gsu],
                        ["WIM", latestEsc.wim],
                        ["Trav Actuator", latestEsc.trav_actuator],
                        ["Elev Actuator", latestEsc.elev_actuator],
                        ["GCU", latestEsc.gcu],
                        ["MDCU", latestEsc.mdcu],
                        ["PSU", latestEsc.psu],
                        ["Gun Gyro", latestEsc.gun_gyro],
                        ["Conv Ass", latestEsc.conv_ass],
                        ["Boost Box Ass", latestEsc.boost_box_ass],
                        ["Slip Ring", latestEsc.slip_ring],
                        ["Turr E-stop", latestEsc.turr_estop],
                        ["Upplink Echute", latestEsc.upplink_echute],
                        ["Upplink Splate", latestEsc.upplink_splate],
                        ["Lowlink Splate", latestEsc.lowlink_splate],
                        ["Lowlink Echute", latestEsc.lowlink_echute],
                        ["Uppflex Chute", latestEsc.uppflex_chute],
                        ["Lowflex Chute", latestEsc.lowflex_chute],
                        ["LWS Comp", latestEsc.lws_comp],
                      ].map(([lbl, val]) => (
                        <div
                          key={lbl as string}
                          className="flex justify-between items-center py-1 border-b border-zinc-100/50"
                        >
                          <span className="text-zinc-500 font-medium">
                            {lbl}
                          </span>
                          {val === null || val === undefined ? (
                            <span className="text-zinc-400">—</span>
                          ) : val ? (
                            <span className="text-emerald-600 font-extrabold">
                              ✓
                            </span>
                          ) : (
                            <span className="text-red-600 font-extrabold">
                              ✗
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {latestEsc.scu !== null && (
                      <div className="text-xs font-semibold text-zinc-700 mt-2">
                        SCU: {latestEsc.scu} &nbsp;·&nbsp; DCU: {latestEsc.dcu}
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

            {/* Description/Faults notes */}
            {selectedVehicle.notes && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Description / Faults
                </h3>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {selectedVehicle.notes}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <Button
                onClick={() => guardVerifiedAction(handleOpenUpdate)}
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
              {/* Edit Turret ESC button — temporarily disabled along with
                  the rest of the Turret ESC feature (see other `false &&`
                  guards for this feature throughout the file). Change
                  `false &&` back to `profile.is_technician &&` to restore. */}
              {false && profile.is_technician && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditTurretEsc}
                  className="w-full text-zinc-700 hover:bg-zinc-50 h-10 font-bold border-zinc-200"
                >
                  <Wrench className="size-4 mr-2" />
                  Edit Turret ESC
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab("history");
                }}
                className="w-full text-zinc-700 hover:bg-zinc-50 h-10 font-bold border-zinc-200"
              >
                <History className="size-4 mr-2" />
                View History Logs
              </Button>
              <Button
                onClick={() =>
                  guardVerifiedAction(() => setIsConfirmingDriveout(true))
                }
                className={cn(
                  "w-full h-10 font-bold",
                  isUnverified
                    ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                    : "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-100",
                )}
              >
                <LogOut className="size-4 mr-2" />
                Drive Out / Move Off
              </Button>
            </div>
          </div>
        )}

        {/* TAB 8: VEHICLE HISTORICAL LOGS */}
        {activeTab === "history" && selectedVehicle && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("detail")}
                className="h-8 px-2 font-semibold text-xs"
              >
                <ArrowLeft className="size-4 mr-1" />
                Back to detail
              </Button>
              <h3 className="text-sm font-black text-zinc-800">
                {formatPlateDisplay(selectedVehicle.plate)} History Log
              </h3>
            </div>

            <div className="space-y-4">
              {historyRecords.length > 0 ? (
                historyRecords.map((r, i) => (
                  <div
                    key={r.id || i}
                    className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/25"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold border-b border-zinc-100 pb-2">
                      <span className="text-zinc-800">
                        {r.created_at ? formatLocalTime(r.created_at) : "—"}
                      </span>
                      <span className="text-zinc-500">
                        Updated by: {r.driver || "—"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div>
                        Odometer:{" "}
                        {r.odometer != null
                          ? `${Number(r.odometer).toLocaleString()} km`
                          : "—"}
                      </div>
                      <div>Engine Hours: {r.engine_hours || "—"} hrs</div>
                      <div>
                        Starter Battery: {r.starter_v || "--"}V ·{" "}
                        {r.starter_pct || 0}%
                      </div>
                      <div>
                        Aux Battery: {r.aux_v || "--"}V · {r.aux_pct || 0}%
                      </div>
                      <div>
                        Fuel Level: {r.fuel_pct || 0}% · {r.fuel_l || "—"}L
                      </div>
                      {r.fire_ext_expiry && (
                        <div className="col-span-2 text-zinc-500 font-semibold mt-1">
                          🧯 Ext. Expiry:{" "}
                          {format(
                            new Date(r.fire_ext_expiry + "T00:00:00"),
                            "dd MMM yyyy",
                          )}
                        </div>
                      )}
                    </div>

                    {r.notes && (
                      <p className="text-xs italic text-zinc-500 border-t border-zinc-100 pt-2 mt-2">
                        {r.notes}
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
        )}

        {/* TAB 9: CHECKED OUT VEHICLE DETAIL VIEW */}
        {activeTab === "driveout-detail" && selectedDriveout && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("driveout-history")}
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
                {formatPlateDisplay(selectedDriveout.plate)}
              </h2>
              <p className="text-sm text-zinc-500 font-semibold mt-1">
                {selectedDriveout.variant}
              </p>
            </div>

            {/* Timing Box */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/25 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    Checked In
                  </span>
                  {selectedDriveout.check_in
                    ? formatLocalTime(selectedDriveout.check_in)
                    : "—"}
                </div>
                <div>
                  <span className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">
                    Checked Out
                  </span>
                  {selectedDriveout.check_out
                    ? formatLocalTime(selectedDriveout.check_out)
                    : "—"}
                </div>
              </div>
              {selectedDriveout.check_in && selectedDriveout.check_out && (
                <div className="border-t border-zinc-100 pt-3 text-xs text-zinc-500 font-medium">
                  Duration:{" "}
                  <strong className="text-zinc-800">
                    {getDuration(
                      selectedDriveout.check_in,
                      selectedDriveout.check_out,
                    )}
                  </strong>
                  &nbsp;·&nbsp; Parked at{" "}
                  <strong className="text-zinc-800">
                    {selectedDriveout.level} – Lot {selectedDriveout.lot}
                  </strong>
                </div>
              )}
            </div>

            {/* Driver Card */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Checked Out By
              </h3>
              <div className="border border-zinc-200 rounded-xl p-4 flex items-center gap-4 bg-zinc-50/25">
                <div className="flex size-11 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-700 text-sm">
                  {(selectedDriveout.driver || "UN")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-zinc-900">
                    {selectedDriveout.driver}
                  </p>
                  <p className="text-xs text-zinc-500 font-semibold">
                    {selectedDriveout.driver_unit ||
                      selectedDriveout.driver_depot}
                  </p>
                  {selectedDriveout.driver_phone && (
                    <a
                      target="_blank"
                      href={`https://wa.me/+65${selectedDriveout.driver_phone}`}
                      className="text-xs text-red-600 font-bold mt-1 inline-block hover:underline"
                    >
                      {selectedDriveout.driver_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
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
                    {selectedDriveout.odometer !== null
                      ? Number(selectedDriveout.odometer).toLocaleString()
                      : "—"}{" "}
                    <span className="text-xs font-normal text-zinc-500">
                      km
                    </span>
                  </div>
                </div>
                <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-zinc-400 font-bold uppercase">
                    Engine Hours
                  </div>
                  <div className="text-xl font-extrabold text-zinc-800 mt-1">
                    {selectedDriveout.engine_hours || "—"}{" "}
                    <span className="text-xs font-normal text-zinc-500">
                      hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Readings */}
            <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/25 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="font-bold text-zinc-600">Starter Battery</span>
                <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
                  {selectedDriveout.starter_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedDriveout.starter_pct || 0}%
                  <PercentDot pct={selectedDriveout.starter_pct} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-600">Aux Battery</span>
                <span className="flex items-center gap-1.5 font-extrabold text-zinc-800">
                  {selectedDriveout.aux_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedDriveout.aux_pct || 0}%
                  <PercentDot pct={selectedDriveout.aux_pct} />
                </span>
              </div>
            </div>

            {/* Fuel gauge */}
            <div className="border border-zinc-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span className="font-bold">Fuel Level</span>
                <span className="font-semibold">
                  {selectedDriveout.fuel_l !== null
                    ? `${selectedDriveout.fuel_l}L`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "text-2xl font-black shrink-0",
                    selectedDriveout.fuel_pct > 50
                      ? "text-emerald-600"
                      : selectedDriveout.fuel_pct > 20
                        ? "text-amber-500"
                        : "text-red-600",
                  )}
                >
                  {selectedDriveout.fuel_pct || 0}%
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        selectedDriveout.fuel_pct > 50
                          ? "bg-emerald-500"
                          : selectedDriveout.fuel_pct > 20
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                      style={{ width: `${selectedDriveout.fuel_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedDriveout.notes && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Notes at Check-Out
                </h3>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs font-medium text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {selectedDriveout.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation for mobile screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 py-2 flex items-center justify-around shadow-lg">
        {[
          { id: "home", label: "Home", icon: <CarFront className="size-5" /> },
          {
            id: "search",
            label: "Vehicles",
            icon: <Search className="size-5" />,
          },
          {
            id: "parking",
            label: "Parking",
            icon: <MapPin className="size-5" />,
          },
          {
            id: "profile",
            label: "Profile",
            icon: <User className="size-5" />,
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-bold transition uppercase tracking-wider w-16",
              activeTab === item.id ||
                (item.id === "search" && activeTab === "detail") ||
                (item.id === "search" && activeTab === "history") ||
                (item.id === "parking" && activeTab === "parking-level")
                ? "text-red-600"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* CHECK-IN DIALOG DIALOG OVERLAY */}
      {isCheckingIn && (
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
                  onClick={() => setIsCheckingIn(false)}
                  className="rounded-full size-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto px-6 flex-1 space-y-4">
              <form onSubmit={handleCheckinSubmit} className="space-y-4">
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
                      onChange={(e) =>
                        setCiPlate(
                          e.target.value
                            .replace(/[^\d()]/g, "")
                            .slice(0, PLATE_MASK_ENABLED ? PLATE_MAX_DIGITS + 4 : undefined),
                        )
                      }
                      placeholder="e.g. 087"
                      inputMode="text"
                      maxLength={PLATE_MASK_ENABLED ? PLATE_MAX_DIGITS + 4 : undefined}
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
                      onChange={(e) => setCiVariant(e.target.value)}
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
                      onChange={(e) => {
                        setCiLevel(e.target.value);
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
                      onChange={(e) => setCiLot(e.target.value)}
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
                      onChange={(e) => setCiOdometer(e.target.value)}
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
                      onChange={(e) => setCiEngineHours(e.target.value)}
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
                      onChange={(e) => setCiBattStarterV(e.target.value)}
                      placeholder="Volts (e.g. 24.0)"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={ciBattStarterPct}
                      onChange={(e) => setCiBattStarterPct(e.target.value)}
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
                      onChange={(e) => setCiBattAuxV(e.target.value)}
                      placeholder="Volts (e.g. 24.0)"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={ciBattAuxPct}
                      onChange={(e) => setCiBattAuxPct(e.target.value)}
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
                        onChange={(e) => setCiFuelL(e.target.value)}
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
                        onChange={(e) => setCiFuelPct(e.target.value)}
                        placeholder="e.g. 100"
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    🧯 Fire Extinguisher Expiry Date
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
                    onChange={(e) => setCiNotes(e.target.value)}
                    placeholder="Any notes on arrival..."
                    className="w-full min-h-[60px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-zinc-100 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCheckingIn(false)}
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
      )}

      {/* UPDATE DIALOG OVERLAY */}
      {isUpdating && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <Card className="w-full max-w-lg rounded-xl border-zinc-200 shadow-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Update Vehicle</CardTitle>
                  <CardDescription>
                    Edit details for {formatPlateDisplay(selectedVehicle.plate)}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsUpdating(false)}
                  className="rounded-full size-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6 flex-1 space-y-4">
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                {formError && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Vehicle Plate
                    </label>
                    <input
                      type="text"
                      value={formatPlateDisplay(selectedVehicle.plate)}
                      disabled
                      className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Variant / Model
                    </label>
                    <input
                      type="text"
                      value={upVariant}
                      onChange={(e) => setUpVariant(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={upDriver}
                    onChange={(e) => setUpDriver(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Driver Phone
                    </label>
                    <input
                      type="tel"
                      value={upDriverPhone}
                      onChange={(e) => setUpDriverPhone(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Driver Unit
                    </label>
                    <input
                      type="text"
                      value={upDriverUnit}
                      onChange={(e) => setUpDriverUnit(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Level
                    </label>
                    <input
                      type="text"
                      value={selectedVehicle.level}
                      disabled
                      className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Lot No.
                      <RequiredMark />
                    </label>
                    <select
                      value={upLot}
                      onChange={(e) => setUpLot(e.target.value)}
                      required
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    >
                      <option value="" disabled>
                        Select lot
                      </option>
                      {updateLevelLots.map((lot) => {
                        const occupiedVehicle =
                          updateOccupiedLots[normalizeParkingValue(lot)];
                        const isCurrentVehicle =
                          occupiedVehicle?.id === selectedVehicle.id;

                        return (
                          <option
                            key={lot}
                            value={lot}
                            disabled={
                              Boolean(occupiedVehicle) && !isCurrentVehicle
                            }
                          >
                            {lot}
                            {occupiedVehicle && !isCurrentVehicle
                              ? " (occupied)"
                              : ""}
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
                      value={upOdometer}
                      onChange={(e) => setUpOdometer(e.target.value)}
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
                      value={upEngineHours}
                      onChange={(e) => setUpEngineHours(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3 space-y-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                    Starter Battery (24V)
                    <RequiredMark />
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={upBattStarterV}
                      onChange={(e) => setUpBattStarterV(e.target.value)}
                      placeholder="Volts"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={upBattStarterPct}
                      onChange={(e) => setUpBattStarterPct(e.target.value)}
                      placeholder="Percentage %"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                    Auxiliary Battery (24V)
                    <RequiredMark />
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={upBattAuxV}
                      onChange={(e) => setUpBattAuxV(e.target.value)}
                      placeholder="Volts"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={upBattAuxPct}
                      onChange={(e) => setUpBattAuxPct(e.target.value)}
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
                        value={upFuelL}
                        onChange={(e) => setUpFuelL(e.target.value)}
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
                        value={upFuelPct}
                        onChange={(e) => setUpFuelPct(e.target.value)}
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    🧯 Fire Extinguisher Expiry Date
                    <RequiredMark />
                  </label>
                  <FireExpiryPicker
                    value={upFireExpiry}
                    onChange={setUpFireExpiry}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Notes / Faults
                  </label>
                  <textarea
                    value={upNotes}
                    onChange={(e) => setUpNotes(e.target.value)}
                    className="w-full min-h-[60px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-zinc-100 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpdating(false)}
                    className="flex-1 h-10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 h-10 font-bold text-white"
                  >
                    {isSubmitting ? "Updating..." : "Update Vehicle"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DRIVE OUT CONFIRM OVERLAY */}
      {isConfirmingDriveout && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm rounded-xl border-zinc-200 shadow-xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600 font-bold flex items-center gap-2">
                <Trash2 className="size-5" />
                Confirm Drive-Out
              </CardTitle>
              <CardDescription>
                Frees the parking lot code and marks the checkout record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-zinc-700">
                Are you sure you want to log checkout for{" "}
                <span className="font-extrabold text-zinc-950">
                  {formatPlateDisplay(selectedVehicle.plate)}
                </span>
                ?
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmingDriveout(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDriveoutConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                >
                  {isSubmitting ? "Processing..." : "Yes, Drive Out"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
