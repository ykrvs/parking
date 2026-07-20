"use client";

/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Download,
  Edit2,
  FileText,
  IdCard,
  LogOut,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";

import { ActiveVehicleDetail } from "@/components/dashboard/active-vehicle-detail";
import { AppShellNavigation } from "@/components/dashboard/app-shell-navigation";
import { BosReadingsTab } from "@/components/dashboard/bos-readings-tab";
import { CheckedOutVehicleDetail } from "@/components/dashboard/checked-out-vehicle-detail";
import { CheckInDialog } from "@/components/dashboard/check-in-dialog";
import { FireExpiryPicker } from "@/components/dashboard/fire-expiry-picker";
import { HomeTab } from "@/components/dashboard/home-tab";
import { LoginGate } from "@/components/dashboard/login-gate";
import { ParkingTab } from "@/components/dashboard/parking-tab";
import { ReminderTray } from "@/components/dashboard/reminder-tray";
import { RequiredMark } from "@/components/dashboard/required-mark";
import { SearchVehiclesTab } from "@/components/dashboard/search-vehicles-tab";
import { VehicleHistoryTab } from "@/components/dashboard/vehicle-history-tab";
import { UnverifiedDot } from "@/components/dashboard/status-indicators";
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
  RANK_CATEGORIES,
  RANK_OPTIONS,
  SAFETY_MESSAGES,
  exportAdminActionsCSV,
  exportAdminActionsPDF,
  exportBosReadingsCSV,
  exportBosReadingsPDF,
  exportDriveoutHistoryCSV,
  exportDriveoutHistoryPDF,
  exportParkingLayoutCSV,
  exportParkingLayoutPDF,
  formatPlateDisplay,
  getLevelLots,
  localInputToUtcIso,
  normalizeParkingValue,
  parseDateInput,
  toDateInputValue,
  utcIsoToLocalInput,
  vehicleMatchesLevel,
  type AdminUserRecord,
  type AuditLogEntry,
  type DashboardUserProfile,
  type DashboardVehicle,
  type DriveoutRecord,
  type ParkingLevelConfig,
  type SafetyMessageRecord,
  type TurretEscLogRecord,
  type VehicleUnitOption,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

export default function Home() {
  const auth = useAuth();
  const router = useRouter();
  const isTurretEscEnabled = Boolean(false);

  // App States
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DashboardUserProfile | null>(null);
  const [isVerificationPending, setIsVerificationPending] =
    useState<boolean>(false);
  // The depot whose data is currently shown. Regular users are always
  // locked to their own depot; admins can switch this via the header
  // dropdown to view/manage a different depot's operational data.
  const [activeFacility, setActiveFacility] = useState<string>("");
  const [facilities, setFacilities] = useState<{ code: string; name: string }[]>(
    [],
  );
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
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<DashboardVehicle[]>([]);
  const [driveoutRecords, setDriveoutRecords] = useState<DriveoutRecord[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<VehicleUnitOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<DashboardVehicle | null>(null);
  const [selectedDriveout, setSelectedDriveout] =
    useState<DriveoutRecord | null>(null);

  // Checklist Logs and history records
  const [latestEsc, setLatestEsc] = useState<TurretEscLogRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<DriveoutRecord[]>([]);

  // Interactive parking states
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [selectedLotVehicle, setSelectedLotVehicle] =
    useState<DashboardVehicle | null>(null);

  // Forms and Modals state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchVehicleUnit, setSearchVehicleUnit] = useState<string>("all");
  const [driveoutSearchQuery, setDriveoutSearchQuery] = useState<string>("");
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isConfirmingDriveout, setIsConfirmingDriveout] =
    useState<boolean>(false);
  const [servicingPromptVehicle, setServicingPromptVehicle] =
    useState<DashboardVehicle | null>(null);
  const [isServicingFollowUpOpen, setIsServicingFollowUpOpen] =
    useState(false);

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
  const [ciIsVor, setCiIsVor] = useState(false);
  const [ciVehicleUnit, setCiVehicleUnit] = useState("");
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
  const [ciNextServicing, setCiNextServicing] = useState("");
  const [ciNotes, setCiNotes] = useState("");

  // Update input states
  const [upVariant, setUpVariant] = useState("");
  const [upIsVor, setUpIsVor] = useState(false);
  const [upVehicleUnit, setUpVehicleUnit] = useState("");
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
  const [upNextServicing, setUpNextServicing] = useState("");
  const [upLastServiced, setUpLastServiced] = useState("");
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

  fetch(`/api/vehicle-units?facility=${encodeURIComponent(activeFacility)}`)
    .then((res) => (res.ok ? res.json() : null))
    .then(
      (
        data: {
          vehicleUnits?: { id: string; name: string }[];
          error?: string;
        } | null,
      ) => {
        setVehicleUnits(data?.vehicleUnits || []);
        if (data?.error) {
          console.error("Failed to load vehicle units:", data.error);
        }
      },
    )
    .catch((err) => {
      console.error("Failed to load vehicle units:", err);
      setVehicleUnits([]);
    });

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

        <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          For verification matters, please contact your Depot's Assigned Trackr
          Admin. Else, contact Yu Ke at{" "}
          <a href="tel:+6583999122" className="font-bold underline">
            +65-8399 9122
          </a>
          .
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
  const getFireExtDaysLeft = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return Math.floor(
      (new Date(dateStr + "T00:00:00").getTime() -
        new Date().setHours(0, 0, 0, 0)) /
        86400000,
    );
  };

  const getFireExtStatus = (dateStr?: string | null) => {
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

  const vehicleUnitLabel = (vehicle: { vehicle_unit?: string | null }) =>
    vehicle.vehicle_unit || "No vehicle unit";

  const getDateDaysLeft = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return Math.floor(
      (new Date(dateStr + "T00:00:00").getTime() -
        new Date().setHours(0, 0, 0, 0)) /
        86400000,
    );
  };

  const isServicingDue = (vehicle: { next_servicing?: string | null }) => {
    const daysLeft = getDateDaysLeft(vehicle.next_servicing);
    return daysLeft !== null && daysLeft <= 0;
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

  const SERVICING_WARNING_DAYS = 14;
  const servicingAlerts = vehicles
    .map((v) => ({ vehicle: v, daysLeft: getDateDaysLeft(v.next_servicing) }))
    .filter(
      (entry) =>
        entry.daysLeft !== null && entry.daysLeft <= SERVICING_WARNING_DAYS,
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
  const visibleOrdAlerts = profile.is_admin ? ordAlerts : [];

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
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

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
  const handleOpenVehicle = async (vehicle: DashboardVehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedDriveout(null);
    setLatestEsc(null);
    setHistoryRecords([]);

    // Turret ESC feature temporarily disabled. Flip this condition back to
    // `profile?.is_technician` to restore fetching the latest Turret ESC
    // checklist when a vehicle is opened.
    if (isTurretEscEnabled && profile?.is_technician) {
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
    if (isServicingDue(vehicle)) {
      setServicingPromptVehicle(vehicle);
      setIsServicingFollowUpOpen(false);
    }
  };

  // Open checked out vehicle details
  const handleOpenDriveoutDetail = (record: DriveoutRecord) => {
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
    const map: Record<string, DashboardVehicle> = {};
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
    ? occupiedLotsMap(selectedVehicle.level ?? "")
    : {};

  const openCheckinModal = () => {
    if (!profile) return;
    setCiDriver(profile.name || "");
    setCiDriverPhone(profile.phone || "");
    setCiDriverUnit(profileUnit);
    setCiBattStarterV("24");
    setCiBattAuxV("24");
    setFormError(null);
    setIsCheckingIn(true);
  };

  const handleLotClick = (
    lotId: string,
    occupiedVeh?: DashboardVehicle | null,
  ) => {
    setSelectedLot(lotId);
    setSelectedLotVehicle(occupiedVeh ?? null);
  };

  // Submit check-in handler
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciPlate || !ciLevel || !ciLot) {
      setFormError("Plate, Level and Lot are required");
      return;
    }
    if (vehicleUnits.length > 0 && !ciVehicleUnit) {
      setFormError("Vehicle unit is required");
      return;
    }
    if (!/^\d{1,3}(\(\d{1,2}\))?$/.test(ciPlate)) {
      setFormError(
        "Vehicle plate must be up to 3 digits, optionally followed by a bracketed number, e.g. 675(1)",
      );
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      plate: ciPlate,
      variant: ciVariant,
      is_vor: ciIsVor,
      vehicle_unit: ciVehicleUnit || null,
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
      next_servicing: ciNextServicing || null,
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
      setCiIsVor(false);
      setCiVehicleUnit("");
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
      setCiNextServicing("");
      setCiNotes("");

      fetchDashboardData();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err) || "Failed to submit check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Update Modal and populate states
  const handleOpenUpdate = (vehicleOverride?: DashboardVehicle) => {
    const v = vehicleOverride || selectedVehicle;
    if (!v) return;
    setSelectedVehicle(v);
    setUpVariant(v.variant || "");
    setUpIsVor(v.is_vor === true);
    setUpVehicleUnit(v.vehicle_unit || "");
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
    setUpNextServicing(v.next_servicing || "");
    setUpLastServiced(v.last_serviced || "");
    setUpNotes(v.notes || "");
    setIsUpdating(true);
  };

  // Submit update handler
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      variant: upVariant || null,
      is_vor: upIsVor,
      vehicle_unit: upVehicleUnit || null,
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
      next_servicing: upNextServicing || null,
      last_serviced: upLastServiced || null,
      notes: upNotes || null,
      historyRow: {
        vehicle_id: selectedVehicle.id,
        variant: upVariant || selectedVehicle.variant,
        is_vor: upIsVor,
        vehicle_unit: upVehicleUnit || selectedVehicle.vehicle_unit || null,
        driver_id: selectedVehicle.driver_id || null,
        driver: upDriver || selectedVehicle.driver,
        driver_phone: upDriverPhone || selectedVehicle.driver_phone,
        driver_unit:
          upDriverUnit ||
          selectedVehicle.driver_unit ||
          selectedVehicle.driver_depot,
        lot: upLot || selectedVehicle.lot,
        level: selectedVehicle.level,
        odometer: upOdometer ? parseFloat(upOdometer) : null,
        engine_hours: upEngineHours ? parseFloat(upEngineHours) : null,
        starter_v: upBattStarterV ? parseFloat(upBattStarterV) : null,
        starter_pct: upBattStarterPct
          ? parseInt(upBattStarterPct, 10)
          : null,
        aux_v: upBattAuxV ? parseFloat(upBattAuxV) : null,
        aux_pct: upBattAuxPct ? parseInt(upBattAuxPct, 10) : null,
        fuel_l: upFuelL ? parseFloat(upFuelL) : null,
        fuel_pct: upFuelPct ? parseInt(upFuelPct, 10) : null,
        fire_ext_expiry: upFireExpiry || null,
        next_servicing: upNextServicing || null,
        last_serviced: upLastServiced || null,
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
    } catch (err: unknown) {
      setFormError(getErrorMessage(err) || "Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServicingDoneConfirm = async () => {
    if (!servicingPromptVehicle) return;

    const vehicle = servicingPromptVehicle;
    const servicedDate = format(new Date(), "yyyy-MM-dd");

    setIsSubmitting(true);
    try {
      const payload = {
        next_servicing: null,
        last_serviced: servicedDate,
        historyRow: {
          vehicle_id: vehicle.id,
          variant: vehicle.variant,
          is_vor: vehicle.is_vor === true,
          vehicle_unit: vehicle.vehicle_unit || null,
          driver_id: vehicle.driver_id || null,
          driver: vehicle.driver,
          driver_phone: vehicle.driver_phone,
          driver_unit: vehicle.driver_unit || vehicle.driver_depot,
          lot: vehicle.lot,
          level: vehicle.level,
          odometer: vehicle.odometer,
          engine_hours: vehicle.engine_hours,
          starter_v: vehicle.starter_v,
          starter_pct: vehicle.starter_pct,
          aux_v: vehicle.aux_v,
          aux_pct: vehicle.aux_pct,
          fuel_l: vehicle.fuel_l,
          fuel_pct: vehicle.fuel_pct,
          fire_ext_expiry: vehicle.fire_ext_expiry,
          next_servicing: null,
          last_serviced: servicedDate,
          notes: vehicle.notes,
        },
      };

      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Servicing update failed");

      const updatedVehicle = { ...vehicle, ...d.vehicle };
      setServicingPromptVehicle(null);
      setIsServicingFollowUpOpen(false);
      setSelectedVehicle((current) =>
        current?.id === vehicle.id ? { ...current, ...updatedVehicle } : current,
      );
      triggerToast("Servicing record updated");
      fetchDashboardData();
    } catch (err: unknown) {
      triggerToast(`Servicing update failed: ${getErrorMessage(err)}`);
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
          vehicle_unit: selectedVehicle.vehicle_unit || null,
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
          is_vor: selectedVehicle.is_vor === true,
          next_servicing: selectedVehicle.next_servicing || null,
          last_serviced: selectedVehicle.last_serviced || null,
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

      triggerToast(`${formatPlateDisplay(selectedVehicle.plate)} driven out`);
      setIsConfirmingDriveout(false);
      setSelectedVehicle(null);
      setActiveTab("search");
      fetchDashboardData();
    } catch (err: unknown) {
      triggerToast(`Check-out failed: ${getErrorMessage(err)}`);
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
    } catch (err: unknown) {
      triggerToast(`Failed to submit: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTurretEsc = () => {
    if (!selectedVehicle || !profile?.is_technician) return;

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
    setEscFaultList(latestEsc?.fault_list ?? "");
    setEscNotes(latestEsc?.notes ?? "");
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
      // If a non-admin just switched their own depot, follow them there -
      // otherwise they'd keep viewing the old depot's data until reload.
      // (Admins keep whatever depot they've toggled to in the header.)
      if (!profile?.is_admin && d.profile?.facility_code) {
        setActiveFacility(d.profile.facility_code);
      }
      setIsEditingProfile(false);
      triggerToast("Profile saved");
    } catch (err: unknown) {
      triggerToast(`Profile update failed: ${getErrorMessage(err)}`);
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
        (user) => user._auditLogged === false,
      );
      triggerToast(
        auditFailure
          ? `Admin changes saved (audit log failed: ${auditFailure._auditError || "unknown error"})`
          : "Admin changes saved",
      );
    } catch (err: unknown) {
      triggerToast(`Admin update failed: ${getErrorMessage(err)}`);
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
    } catch (err: unknown) {
      // Roll back on failure.
      setAdminUsers((users) =>
        users.map((user) =>
          user.id === userId ? { ...user, is_verified: !isVerified } : user,
        ),
      );
      triggerToast(`Verification update failed: ${getErrorMessage(err)}`);
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
    } catch (err: unknown) {
      triggerToast(`Safety message failed: ${getErrorMessage(err)}`);
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
    } catch (err: unknown) {
      triggerToast(`Reschedule failed: ${getErrorMessage(err)}`);
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
    } catch (err: unknown) {
      triggerToast(`Delete failed: ${getErrorMessage(err)}`);
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
  const formatTimeAgo = (iso?: string | null) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const formatLocalTime = (iso?: string | null) => {
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
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      (v.plate || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.driver || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vehicle_unit || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (v.variant || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit =
      searchVehicleUnit === "all" || v.vehicle_unit === searchVehicleUnit;

    return matchesSearch && matchesUnit;
  });

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

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans flex flex-col antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-zinc-900 text-white px-4 py-2 text-sm shadow-lg font-medium transition animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      <AppShellNavigation
        activeFacility={activeFacility}
        activeFacilityName={activeFacilityName}
        activeTab={activeTab}
        facilities={facilities}
        headerAccessory={
          <ReminderTray
            fireExtAlerts={fireExtAlerts}
            myOrdReminder={myOrdReminder}
            ordAlerts={visibleOrdAlerts}
            ordWarningDays={ORD_WARNING_DAYS}
            profileName={profile.name}
            profileUnit={profileUnit}
            servicingAlerts={servicingAlerts}
            onOpenVehicle={handleOpenVehicle}
            vehicleUnitLabel={vehicleUnitLabel}
          />
        }
        isSidebarOpen={isSidebarOpen}
        profile={profile}
        goTab={goTab}
        onLogoClick={() => {
          goTab("home");
          router.refresh();
          if (activeFacility) {
            fetchDashboardData();
            fetchParkingConfig();
            fetchSafetyMessages();
          }
        }}
        logout={auth.logout}
        setActiveFacility={setActiveFacility}
        setActiveTab={setActiveTab}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Tab Contents */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-20">
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <HomeTab
            activeFacilityName={activeFacilityName}
            counts={counts}
            isLoading={isLoadingDashboard}
            isUnverified={isUnverified}
            parkingLevels={parkingLevels}
            recentVehicles={recentVehicles}
            safetyDate={safetyDate}
            safetyMessage={safetyMessage}
            vehicleCount={vehicles.length}
            formatTimeAgo={formatTimeAgo}
            isServicingDue={isServicingDue}
            onLogVehicleIn={() => guardVerifiedAction(openCheckinModal)}
            onOpenParkingLevel={openParkingLevel}
            onOpenVehicle={handleOpenVehicle}
            vehicleUnitLabel={vehicleUnitLabel}
          />
        )}

        {/* TAB 2: SEARCH VEHICLES */}
        {activeTab === "search" && (
          <SearchVehiclesTab
            filteredVehicles={filteredVehicles}
            isLoading={isLoadingDashboard}
            searchQuery={searchQuery}
            searchVehicleUnit={searchVehicleUnit}
            vehicleUnits={vehicleUnits}
            formatTimeAgo={formatTimeAgo}
            isServicingDue={isServicingDue}
            onOpenVehicle={handleOpenVehicle}
            onSearchQueryChange={setSearchQuery}
            onSearchVehicleUnitChange={setSearchVehicleUnit}
            vehicleUnitLabel={vehicleUnitLabel}
          />
        )}

        {/* TAB 3: BOS READINGS */}
        {activeTab === "bos" && (
          <BosReadingsTab
            activeFacilityName={activeFacilityName}
            isLoading={isLoadingDashboard}
            isUnverified={isUnverified}
            vehicles={vehicles}
            getFireExtStatus={getFireExtStatus}
            isServicingDue={isServicingDue}
            onLogVehicleIn={() => guardVerifiedAction(openCheckinModal)}
            onExportCsv={exportBosReadingsCSV}
            onExportPdf={exportBosReadingsPDF}
            onOpenVehicle={handleOpenVehicle}
            onUpdateVehicle={(vehicle) =>
              guardVerifiedAction(() => handleOpenUpdate(vehicle))
            }
          />
        )}

        {/* TAB 3: PARKING OVERVIEW & MAPS */}
        {activeTab === "parking" && (
          <ParkingTab
            counts={counts}
            isLoadingParkingConfig={isLoadingParkingConfig}
            parkingLevels={parkingLevels}
            selectedLevel={selectedLevel}
            selectedLevelConfig={selectedLevelConfig}
            selectedLevelLots={selectedLevelLots}
            selectedLot={selectedLot}
            selectedLotVehicle={selectedLotVehicle}
            occupiedLotsMap={occupiedLotsMap}
            onExportCsv={() => exportParkingLayoutCSV(parkingLevels, vehicles)}
            onExportPdf={() => exportParkingLayoutPDF(parkingLevels, vehicles)}
            onLotClick={handleLotClick}
            onOpenParkingLevel={openParkingLevel}
            onOpenVehicle={handleOpenVehicle}
            vehicleUnitLabel={vehicleUnitLabel}
          />
        )}

        {/* TAB 4: TURRET CHECKLIST - temporarily disabled.
            Change `isTurretEscEnabled` to true and restore the tab trigger to
            restore this tab. */}
        {isTurretEscEnabled &&
          activeTab === "turret-esc" &&
          profile?.is_technician && (
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
                  <span className="text-zinc-500 font-medium">Platoon</span>
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
                      Platoon
                      <RequiredMark />
                    </label>
                    <input
                      type="text"
                      value={peUnit}
                      onChange={(e) => setPeUnit(e.target.value)}
                      placeholder="e.g. Platoon 1"
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-zinc-500 font-medium">
                      Recent admin actions - verifying users, granting or
                      revoking admin access, and managing safety messages.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!auditLogEntries.length}
                        onClick={() => exportAdminActionsCSV(auditLogEntries)}
                        className="h-8 text-xs font-bold"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        CSV
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!auditLogEntries.length}
                        onClick={() => exportAdminActionsPDF(auditLogEntries)}
                        className="h-8 text-xs font-bold"
                      >
                        <FileText className="size-3.5 mr-1.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
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
          <ActiveVehicleDetail
            canDriveOut={!isUnverified}
            isTurretEscEnabled={isTurretEscEnabled}
            isTechnician={!!profile?.is_technician}
            isUnverified={isUnverified}
            latestEsc={latestEsc}
            vehicle={selectedVehicle}
            formatLocalTime={formatLocalTime}
            getFireExtStatus={getFireExtStatus}
            onBack={() => setActiveTab("search")}
            onDriveOut={() =>
              guardVerifiedAction(() => {
                setIsConfirmingDriveout(true);
              })
            }
            onEditTurretEsc={handleEditTurretEsc}
            onOpenHistory={() => setActiveTab("history")}
            onUpdateVehicle={() => guardVerifiedAction(handleOpenUpdate)}
            vehicleUnitLabel={vehicleUnitLabel}
          />
        )}

        {/* TAB 8: VEHICLE HISTORICAL LOGS */}
        {activeTab === "history" && selectedVehicle && (
          <VehicleHistoryTab
            historyRecords={historyRecords}
            vehicle={selectedVehicle}
            formatLocalTime={formatLocalTime}
            onBack={() => setActiveTab("detail")}
          />
        )}

        {/* TAB 9: CHECKED OUT VEHICLE DETAIL VIEW */}
        {activeTab === "driveout-detail" && selectedDriveout && (
          <CheckedOutVehicleDetail
            record={selectedDriveout}
            formatLocalTime={formatLocalTime}
            getDuration={getDuration}
            onBack={() => setActiveTab("driveout-history")}
          />
        )}
      </main>

      {isCheckingIn && (
        <CheckInDialog
          activeFacilityName={activeFacilityName}
          ciBattAuxPct={ciBattAuxPct}
          ciBattAuxV={ciBattAuxV}
          ciBattStarterPct={ciBattStarterPct}
          ciBattStarterV={ciBattStarterV}
          ciDriver={ciDriver}
          ciDriverPhone={ciDriverPhone}
          ciDriverUnit={ciDriverUnit}
          ciEngineHours={ciEngineHours}
          ciFireExpiry={ciFireExpiry}
          ciFuelL={ciFuelL}
          ciFuelPct={ciFuelPct}
          ciIsVor={ciIsVor}
          ciLevel={ciLevel}
          ciLevelLots={ciLevelLots}
          ciLot={ciLot}
          ciNextServicing={ciNextServicing}
          ciNotes={ciNotes}
          ciOccupiedLots={ciOccupiedLots}
          ciOdometer={ciOdometer}
          ciPlate={ciPlate}
          ciVariant={ciVariant}
          ciVehicleUnit={ciVehicleUnit}
          formError={formError}
          isSubmitting={isSubmitting}
          parkingLevels={parkingLevels}
          vehicleUnits={vehicleUnits}
          onClose={() => setIsCheckingIn(false)}
          onSubmit={handleCheckinSubmit}
          setCiBattAuxPct={setCiBattAuxPct}
          setCiBattAuxV={setCiBattAuxV}
          setCiBattStarterPct={setCiBattStarterPct}
          setCiBattStarterV={setCiBattStarterV}
          setCiEngineHours={setCiEngineHours}
          setCiFireExpiry={setCiFireExpiry}
          setCiFuelL={setCiFuelL}
          setCiFuelPct={setCiFuelPct}
          setCiIsVor={setCiIsVor}
          setCiLevel={setCiLevel}
          setCiLot={setCiLot}
          setCiNextServicing={setCiNextServicing}
          setCiNotes={setCiNotes}
          setCiOdometer={setCiOdometer}
          setCiPlate={setCiPlate}
          setCiVariant={setCiVariant}
          setCiVehicleUnit={setCiVehicleUnit}
        />
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

                <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={upIsVor}
                    onChange={(e) => setUpIsVor(e.target.checked)}
                    className="size-4 accent-red-700"
                  />
                  Vehicle is VOR
                </label>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Vehicle Unit
                  </label>
                  <select
                    value={upVehicleUnit}
                    onChange={(e) => setUpVehicleUnit(e.target.value)}
                    disabled={vehicleUnits.length === 0}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                  >
                    <option value="">
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
                      value={selectedVehicle.level ?? ""}
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
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={upOdometer}
                      onChange={(e) => setUpOdometer(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Engine Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={upEngineHours}
                      onChange={(e) => setUpEngineHours(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3 space-y-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                    Starter Battery (24V)
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={upBattStarterV}
                      onChange={(e) => setUpBattStarterV(e.target.value)}
                      placeholder="Volts"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
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
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={upBattAuxV}
                      onChange={(e) => setUpBattAuxV(e.target.value)}
                      placeholder="Volts"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
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
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Litres (L)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={upFuelL}
                        onChange={(e) => setUpFuelL(e.target.value)}
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
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
                  </label>
                  <FireExpiryPicker
                    value={upFireExpiry}
                    onChange={setUpFireExpiry}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Next Servicing
                    </label>
                    <input
                      type="date"
                      value={upNextServicing}
                      onChange={(e) => setUpNextServicing(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Last Serviced
                    </label>
                    <input
                      type="date"
                      value={upLastServiced}
                      onChange={(e) => setUpLastServiced(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
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

      {servicingPromptVehicle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm rounded-xl border-amber-200 shadow-xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-lg text-amber-700 font-bold">
                Servicing Reminder
              </CardTitle>
              <CardDescription>
                {formatPlateDisplay(servicingPromptVehicle.plate)} is due for
                servicing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isServicingFollowUpOpen ? (
                <>
                  <p className="text-sm font-medium text-zinc-700">
                    Has servicing been done on this vehicle yet?
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={handleServicingDoneConfirm}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsServicingFollowUpOpen(true)}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-700">
                    Not yet.
                  </p>
                  <div className="grid gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setServicingPromptVehicle(null);
                        setIsServicingFollowUpOpen(false);
                      }}
                      className="w-full"
                    >
                      Not yet
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        const vehicle = servicingPromptVehicle;
                        setServicingPromptVehicle(null);
                        setIsServicingFollowUpOpen(false);
                        handleOpenUpdate(vehicle);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Choose another servicing date
                    </Button>
                  </div>
                </>
              )}
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
                Confirm Move Out
              </CardTitle>
              <CardDescription>
                Frees the parking lot code and marks the checkout record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-zinc-700">
                Do you want to move{" "}
                <span className="font-extrabold text-zinc-950">
                  {formatPlateDisplay(selectedVehicle.plate)}
                </span>
                ,{" "}
                <span className="font-extrabold text-zinc-950">
                  {selectedVehicle.variant || "-"}
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
                  {isSubmitting ? "Processing..." : "Yes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
