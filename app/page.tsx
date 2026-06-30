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
  LogIn,
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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Static Data
const SAFETY_MESSAGES = [
  "Always check your mirrors before reversing. A moment of caution prevents a lifetime of regret.",
  "Keep walkways clear at all times. Pedestrians share this space — give them room.",
  "Do not exceed 10 km/h on all levels. Speed limits exist for your safety and others'.",
  "Report any oil spills or wet floors immediately to prevent slips and falls.",
  "Ensure your vehicle is in park with the handbrake engaged before leaving it.",
  "Never leave engines running in enclosed spaces. Carbon monoxide is invisible and deadly.",
  "Wear your high-visibility vest when working in the car park outside your vehicle.",
];

type ParkingLevelConfig = {
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

type ParkingLayoutColumn =
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

type ParkingLayoutCell =
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

type SafetyMessageRecord = {
  id: string;
  message: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

type AdminUserRecord = {
  id: string;
  rank: string | null;
  name: string;
  is_admin: boolean;
  is_technician: boolean;
  ord_date: string | null;
  phone: string | null;
  unit: string | null;
  depot?: string | null;
};

const DEFAULT_PARKING_LEVELS: ParkingLevelConfig[] = [
  {
    id: "level-1",
    label: "Level 1",
    desc: "Block 210 level 1 bay layout.",
    icon: "L1",
    layout: {
      columns: [
        {
          type: "lots",
          id: "a",
          lots: [
            "A15",
            "A14",
            "A13",
            "A12",
            "A11",
            "A10",
            "A9",
            "A8",
            "A7",
            "A6",
            "A5",
            "A4",
            "A3",
            "A2",
            "A1",
          ],
        },
        {
          type: "lots",
          id: "b",
          lots: [
            "B15",
            "B14",
            "B13",
            "B12",
            "B11",
            "B10",
            "B9",
            "B8",
            "B7",
            "B6",
            "B5",
            "B4",
            "B3",
            "B2",
            "B1",
          ],
        },
        {
          type: "lots",
          id: "c",
          lots: [
            "C15",
            "C14",
            "C13",
            "C12",
            "C11",
            "C10",
            "C9",
            "C8",
            "C7",
            "C6",
            "C5",
            "C4",
            "C3",
            "C2",
            "C1",
          ],
        },
        { type: "driveway", id: "driveway-west", label: "DRIVEWAY" },
        {
          type: "lots",
          id: "d",
          lots: [
            "D15",
            "D14",
            "D13",
            "D12",
            "D11",
            "D10",
            "D9",
            "D8",
            "D7",
            "D6",
            "D5",
            "D4",
            "D3",
            "D2",
            "D1",
          ],
        },
        {
          type: "lots",
          id: "e",
          lots: [
            "E15",
            "E14",
            "E13",
            "E12",
            "E11",
            "E10",
            "E9",
            "E8",
            "E7",
            "E6",
            "E5",
            "E4",
            "E3",
            "E2",
            "E1",
          ],
        },
        { type: "driveway", id: "driveway-east", label: "DRIVEWAY" },
        {
          type: "lots",
          id: "f",
          lots: ["F9", "F8", "F7", "F6", "F5", "F4", "F3", "F2", "F1"],
        },
      ],
    },
  },
  {
    id: "level-2",
    label: "Level 2",
    desc: "Block 210 level 2 bay layout with training and store areas.",
    icon: "L2",
    layout: {
      columns: [
        {
          type: "lots",
          id: "a",
          lots: [
            "A15",
            "A14",
            "A13",
            "A12",
            "A11",
            "A10",
            "A9",
            "A8",
            "A7",
            "A6",
            "A5",
            "A4",
            "A3",
            "A2",
            "A1",
          ],
        },
        { type: "driveway", id: "driveway-a-b", label: "DRIVEWAY" },
        {
          type: "lots",
          id: "b",
          lots: [
            "B15",
            "B14",
            "B13",
            "B12",
            "B11",
            "B10",
            "B9",
            "B8",
            "B7",
            "B6",
            "B5",
            "B4",
            "B3",
            "B2",
            "B1",
          ],
        },
        {
          type: "lots",
          id: "c",
          lots: [
            "C15",
            "C14",
            "C13",
            "C12",
            "C11",
            "C10",
            "C9",
            "C8",
            "C7",
            "C6",
            "C5",
            "C4",
            "C3",
            "C2",
            "C1",
          ],
        },
        { type: "driveway", id: "driveway-c-d", label: "DRIVEWAY" },
        {
          type: "lots",
          id: "d",
          lots: [
            "D15",
            "D14",
            "D13",
            "D12",
            "D11",
            "D10",
            "D9",
            "D8",
            "D7",
            "D6",
            "D5",
            "D4",
            "D3",
            "D2",
            "D1",
          ],
        },
        {
          type: "lots",
          id: "e",
          lots: [
            "E15",
            "E14",
            "E13",
            "E12",
            "E11",
            "E10",
            "E9",
            "E8",
            "E7",
            "E6",
            "E5",
            "E4",
            "E3",
            "E2",
            "E1",
          ],
        },
        { type: "driveway", id: "driveway-e-f", label: "DRIVEWAY" },
        {
          type: "mixed",
          id: "f-and-areas",
          cells: [
            { type: "lot", id: "F6" },
            { type: "lot", id: "F5" },
            { type: "lot", id: "F4" },
            { type: "lot", id: "F3" },
            { type: "lot", id: "F2" },
            { type: "lot", id: "F1" },
            {
              type: "area",
              id: "gunnery-training",
              label: "GUNNERY\nTRAINING",
              rowSpan: 4,
            },
            {
              type: "area",
              id: "peta-store",
              label: "PETA\nSTORE",
              rowSpan: 5,
            },
          ],
        },
      ],
    },
  },
  {
    id: "level-3",
    label: "Level 3",
    desc: "Default parking layout. Replace in Supabase when the real lots are confirmed.",
    icon: "L3",
    lots: ["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B2", "B3", "B4", "B5", "B6"],
  },
];

function getLevelLots(level?: ParkingLevelConfig) {
  if (!level) return [];

  if (level.layout?.columns?.length) {
    return level.layout.columns.flatMap((column) =>
      column.type === "lots"
        ? column.lots
        : column.type === "mixed"
          ? column.cells
              .filter((cell) => cell.type === "lot")
              .map((cell) => cell.id)
          : [],
    );
  }

  return level.lots ?? [];
}

function normalizeParkingValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getLevelAliases(level?: ParkingLevelConfig) {
  if (!level) return new Set<string>();

  return new Set(
    [level.id, level.label, level.icon]
      .filter(Boolean)
      .map((value) => normalizeParkingValue(value)),
  );
}

function vehicleMatchesLevel(vehicle: any, level?: ParkingLevelConfig) {
  return getLevelAliases(level).has(normalizeParkingValue(vehicle?.level));
}

const RANK_OPTIONS = [
  "REC",
  "PTE",
  "LCP",
  "CPL",
  "CFC",
  "SCT",
  "3SG",
  "2SG",
  "1SG",
  "SSG",
  "MSG",
  "3WO",
  "2WO",
  "1WO",
  "MWO",
  "SWO",
  "CWO",
  "2LT",
  "LTA",
  "CPT",
  "MAJ",
  "LTC",
  "SLTC",
  "COL",
  "BG",
];

function LoginGate({
  isLoading,
  onLogin,
}: {
  isLoading: boolean;
  onLogin: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
      <Card className="w-full max-w-sm rounded-lg border-zinc-200 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-600 text-white">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Sign in to Parking</CardTitle>
            <CardDescription>
              Use Singpass once to continue to the parking dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="h-11 w-full bg-red-600 hover:bg-red-700"
            onClick={onLogin}
            disabled={isLoading}
          >
            <LogIn className="size-4" aria-hidden="true" />
            {isLoading ? "Checking login..." : "Sign in with Singpass"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function Home() {
  const auth = useAuth();
  const router = useRouter();

  // App States
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [parkingLevels, setParkingLevels] =
    useState<ParkingLevelConfig[]>(DEFAULT_PARKING_LEVELS);
  const [isLoadingParkingConfig, setIsLoadingParkingConfig] = useState(false);
  const [safetyMessages, setSafetyMessages] = useState<SafetyMessageRecord[]>([]);
  const [safetyIndex, setSafetyIndex] = useState(0);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminSafetyMessages, setAdminSafetyMessages] = useState<
    SafetyMessageRecord[]
  >([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

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
  const [peRank, setPeRank] = useState<string>("");
  const [peOrdDate, setPeOrdDate] = useState<string>("");
  const [peIsTechnician, setPeIsTechnician] = useState<boolean>(false);
  const [newSafetyMessage, setNewSafetyMessage] = useState("");
  const [newSafetyStartsAt, setNewSafetyStartsAt] = useState("");
  const [newSafetyEndsAt, setNewSafetyEndsAt] = useState("");

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

        setProfile(data.profile);

        // Sync rank to local storage if different or missing
        if (data.profile?.rank && auth.rank !== data.profile.rank) {
          auth.setRank(data.profile.rank);
        }
      } catch (profileError) {
        if (!controller.signal.aborted) {
          console.error("[profile] Failed to check registration", profileError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingProfile(false);
        }
      }
    }

    void checkRegistration();

    return () => controller.abort();
  }, [auth.isAuthenticated, auth.openid, router]);

  // Load Vehicles & dashboard metrics
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/vehicles");
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
      const response = await fetch("/api/history?check_out=notnull");
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
      const response = await fetch("/api/config/parking");
      if (!response.ok) throw new Error("Config request failed");

      const data = (await response.json()) as {
        config?: { levels?: ParkingLevelConfig[] } | null;
      };
      const levels = data.config?.levels?.length
        ? data.config.levels
        : DEFAULT_PARKING_LEVELS;

      setParkingLevels(levels);
      if (levels.length > 0 && !levels.some((level) => level.id === selectedLevel)) {
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
      const response = await fetch("/api/safety-messages");
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
      const [usersResponse, safetyResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/safety-messages?all=true"),
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
    } catch (err) {
      console.error("Failed to load admin data:", err);
      triggerToast("Could not load admin data");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && profile) {
      fetchDashboardData();
      fetchParkingConfig();
      fetchSafetyMessages();
    }
  }, [auth.isAuthenticated, profile]);

  useEffect(() => {
    if (activeTab === "driveout-history") {
      fetchDriveoutHistory();
    }
    if (activeTab === "admin") {
      fetchAdminData();
    }
  }, [activeTab]);

  useEffect(() => {
    const activeCount =
      safetyMessages.length > 0 ? safetyMessages.length : SAFETY_MESSAGES.length;

    if (activeCount <= 1) return;

    const interval = window.setInterval(() => {
      setSafetyIndex((index) => (index + 1) % activeCount);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [safetyMessages.length]);

  if (auth.isLoading || !auth.isAuthenticated) {
    return <LoginGate isLoading={auth.isLoading} onLogin={auth.login} />;
  }

  if (isCheckingProfile || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12">
        <p className="text-sm text-zinc-500 font-medium">Checking profile...</p>
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
    parkingLevels.find((level) => level.id === selectedLevel) ?? parkingLevels[0];
  const selectedLevelLots = getLevelLots(selectedLevelConfig);
  const profileUnit = profile?.unit || profile?.depot || "";

  // Handle open vehicle details
  const handleOpenVehicle = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setSelectedDriveout(null);
    setLatestEsc(null);
    setHistoryRecords([]);

    if (profile.is_technician) {
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
      const res = await fetch(`/api/history?vehicle_id=${vehicle.id}`);
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
          normalizeParkingValue(parkingLevel.id) === normalizeParkingValue(level),
      );
    const map: Record<string, any> = {};
    vehicles
      .filter((v) => vehicleMatchesLevel(v, levelConfig))
      .forEach((v) => {
        map[normalizeParkingValue(v.lot)] = v;
      });
    return map;
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

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      plate: ciPlate,
      variant: ciVariant,
      driver: ciDriver || profile.name,
      driver_phone: ciDriverPhone || profile.phone,
      driver_unit: ciDriverUnit || profileUnit,
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
    };

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Check-in failed");

      triggerToast(
        `✓ ${ciPlate.toUpperCase()} checked in → ${ciLevel} Lot ${ciLot}`,
      );
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
      setCiBattStarterV("");
      setCiBattStarterPct("");
      setCiBattAuxV("");
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
        plate: selectedVehicle.plate,
        variant: upVariant || selectedVehicle.variant,
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
        `/api/history?vehicle_id=${selectedVehicle.id}`,
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
          plate: selectedVehicle.plate,
          variant: selectedVehicle.variant,
          level: selectedVehicle.level,
          lot: selectedVehicle.lot,
          check_in: selectedVehicle.check_in,
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

      triggerToast(`✓ ${selectedVehicle.plate} driven out`);
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

    setIsSubmitting(true);
    const payload = {
      vehicle_id: escVehicleId,
      plate: matchedVeh.plate,
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
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save profile failed");

      setProfile(d.profile);
      setIsEditingProfile(false);
      triggerToast("✓ Profile saved");
    } catch (err: any) {
      triggerToast(`⚠ Profile update failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdmin = async (targetId: string, isAdmin: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId, isAdmin }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Admin update failed");

      setAdminUsers((users) =>
        users.map((user) => (user.id === targetId ? d.user : user)),
      );
      triggerToast("Admin access updated");
    } catch (err: any) {
      triggerToast(`Admin update failed: ${err.message}`);
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
          startsAt: newSafetyStartsAt || null,
          endsAt: newSafetyEndsAt || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Safety message save failed");

      setNewSafetyMessage("");
      setNewSafetyStartsAt("");
      setNewSafetyEndsAt("");
      await fetchSafetyMessages();
      await fetchAdminData();
      triggerToast("Safety message scheduled");
    } catch (err: any) {
      triggerToast(`Safety message failed: ${err.message}`);
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

  // Fire Extinguisher Status calculation
  const getFireExtStatus = (dateStr: string | null) => {
    if (!dateStr)
      return { label: "Unknown", color: "text-zinc-500", bg: "bg-zinc-100/50" };
    const days = Math.floor(
      (new Date(dateStr + "T00:00:00").getTime() -
        new Date().setHours(0, 0, 0, 0)) /
        86400000,
    );
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
        <div className="flex items-center gap-3">
          <Image
            src="/unit-logo.jpeg"
            alt="Parking unit logo"
            width={40}
            height={40}
            className="size-10 rounded-md object-cover border border-zinc-200"
            priority
          />
          <div>
            <p className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">
              FleetOps
            </p>
            <h1 className="text-lg font-bold tracking-tight">Block 210</h1>
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
                  <p className="text-xs text-zinc-500">Block 210 Carpark</p>
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
                  ...(profile.is_technician
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
                  <p className="text-sm font-bold truncate leading-none mb-1">
                    {profile.name}
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

            {/* Quick Actions Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-500 tracking-wider uppercase">
                Quick Actions
              </h2>
              <Button
                type="button"
                onClick={() => setIsCheckingIn(true)}
                className="bg-red-600 hover:bg-red-700 h-9 text-sm"
              >
                <Plus className="size-4 mr-1.5" />
                Log Vehicle In
              </Button>
            </div>

            {/* Active Totals Counter Card */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="text-5xl font-black tracking-tight text-red-600">
                  {vehicles.length}
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  Vehicles currently parked in Block 210
                </p>
              </div>

              {/* Levels chips */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
                {parkingLevels.map((level) => {
                  const c = counts[level.id] || 0;
                  return (
                    <div
                      key={level.id}
                      onClick={() => openParkingLevel(level.id)}
                      className="cursor-pointer border border-zinc-200 rounded-lg p-3 w-full sm:w-24 text-center hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-xs"
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

            {/* Recently Checked In List */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-zinc-500 tracking-wider uppercase">
                Recently Checked In
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {recentVehicles.length > 0 ? (
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
                            {v.plate}
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
                placeholder="Search licence plate, variant or driver..."
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 bg-white text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 shadow-xs"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {filteredVehicles.length > 0 ? (
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
                        <div className="font-bold text-zinc-900">{v.plate}</div>
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
                return (
                  <div
                    key={level.id}
                    onClick={() => openParkingLevel(level.id)}
                    className={cn(
                      "cursor-pointer border p-3 w-full sm:w-36 rounded-xl flex items-center gap-3 shadow-xs transition-all",
                      selectedLevel === level.id
                        ? "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-600/10"
                        : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50",
                    )}
                  >
                    <div className="size-9 bg-zinc-100 rounded-lg flex items-center justify-center text-sm font-semibold select-none">
                      {level.icon || level.id}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs tracking-tight text-zinc-800 leading-tight">
                        {level.label}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                        {occ}/{level.totalLots ?? getLevelLots(level).length} lots
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive SVG Layout */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="font-bold text-zinc-800">
                    Parking Map — {selectedLevelConfig?.label ?? "Not configured"}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {selectedLevelConfig?.desc ?? "Load layout configuration from Supabase."}
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
              <div className="mx-auto w-full max-w-[300px] overflow-x-auto select-none bg-zinc-50 border border-zinc-100 rounded-lg p-2 flex justify-center">
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
                className="mt-2 min-h-20 flex items-center justify-center"
              >
                {selectedLot ? (
                  selectedLotVehicle ? (
                    <div className="w-full bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-150">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg text-zinc-900">
                            {selectedLotVehicle.plate}
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
                          &nbsp;·&nbsp; {selectedLotVehicle.driver_unit || selectedLotVehicle.driver_depot}
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

        {/* TAB 4: TURRET CHECKLIST */}
        {activeTab === "turret-esc" && profile.is_technician && (
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
                        <div className="font-bold text-zinc-900">{r.plate}</div>
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
                <p className="text-base font-extrabold text-zinc-900">
                  {profile.name}
                </p>
                <span className="inline-block bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1">
                  {profile.rank || "REC"}
                </span>
              </div>
            </div>

            {!isEditingProfile ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Email</span>
                  <span className="font-semibold">{profile.id || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Phone</span>
                  <span className="font-semibold">{profile.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                  <span className="text-zinc-500 font-medium">Unit</span>
                  <span className="font-semibold">{profile.unit || profile.depot || "—"}</span>
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
                  </label>
                  <input
                    type="tel"
                    value={pePhone}
                    onChange={(e) => setPePhone(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={peUnit}
                    onChange={(e) => setPeUnit(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">
                      Rank
                    </label>
                    <select
                      value={peRank}
                      onChange={(e) => setPeRank(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                    >
                      <option value="">Select rank</option>
                      {RANK_OPTIONS.map((rankOption) => (
                        <option key={rankOption} value={rankOption}>
                          {rankOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">
                      ORD date
                    </label>
                    <input
                      type="date"
                      value={peOrdDate}
                      onChange={(e) => setPeOrdDate(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                    />
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
              <div>
                <h3 className="text-lg font-bold">Admin</h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Manage admin access and scheduled safety messages.
                </p>
              </div>

              <form
                onSubmit={handleCreateSafetyMessage}
                className="grid gap-3 border-t border-zinc-100 pt-4"
              >
                <label className="text-sm font-semibold text-zinc-700">
                  Safety message
                </label>
                <textarea
                  value={newSafetyMessage}
                  onChange={(e) => setNewSafetyMessage(e.target.value)}
                  required
                  className="min-h-20 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
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
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Users
                </h4>
                {isLoadingAdmin ? (
                  <p className="py-6 text-center text-sm text-zinc-500">
                    Loading admin data...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {adminUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900">
                            {user.rank ? `${user.rank} ` : ""}
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {user.unit || user.depot || "No unit"} ·{" "}
                            {user.is_technician ? "Technician" : "Combatant"}
                          </p>
                        </div>
                        <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-zinc-600">
                          Admin
                          <input
                            type="checkbox"
                            className="size-4 accent-red-700"
                            checked={user.is_admin}
                            disabled={user.id === profile.id}
                            onChange={(e) =>
                              handleToggleAdmin(user.id, e.target.checked)
                            }
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Safety Schedule
                </h4>
                <div className="space-y-2">
                  {adminSafetyMessages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-lg border border-zinc-100 p-3"
                    >
                      <p className="text-sm font-medium text-zinc-800">
                        {message.message}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                        {message.starts_at
                          ? format(new Date(message.starts_at), "dd MMM yyyy HH:mm")
                          : "Always on"}{" "}
                        to{" "}
                        {message.ends_at
                          ? format(new Date(message.ends_at), "dd MMM yyyy HH:mm")
                          : "no end"}
                      </p>
                    </div>
                  ))}
                  {!adminSafetyMessages.length && (
                    <p className="py-6 text-center text-sm text-zinc-500">
                      No safety messages added yet.
                    </p>
                  )}
                </div>
              </div>
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
                {selectedVehicle.plate}
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
                Last Driver
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
                    {selectedVehicle.driver_unit || selectedVehicle.driver_depot}
                  </p>
                  {selectedVehicle.driver_phone && (
                    <a
                      href={`tel:${selectedVehicle.driver_phone}`}
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
                <span className="font-extrabold text-zinc-800">
                  {selectedVehicle.starter_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedVehicle.starter_pct || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-600">
                  Auxiliary Battery (24V)
                </span>
                <span className="font-extrabold text-zinc-800">
                  {selectedVehicle.aux_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedVehicle.aux_pct || 0}%
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

            {/* Latest Turret ESC Section */}
            {profile.is_technician && (
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
                        <span className="text-zinc-500 font-medium">{lbl}</span>
                        {val === null || val === undefined ? (
                          <span className="text-zinc-400">—</span>
                        ) : val ? (
                          <span className="text-emerald-600 font-extrabold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-red-600 font-extrabold">✗</span>
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
                onClick={handleOpenUpdate}
                className="w-full bg-red-600 hover:bg-red-700 h-10 font-bold"
              >
                <Edit2 className="size-4 mr-2" />
                Update Vehicle Record
              </Button>
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
                onClick={() => setIsConfirmingDriveout(true)}
                className="w-full bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-100 h-10 font-bold"
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
                {selectedVehicle.plate} History Log
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
                {selectedDriveout.plate}
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
                    {selectedDriveout.driver_unit || selectedDriveout.driver_depot}
                  </p>
                  {selectedDriveout.driver_phone && (
                    <a
                      href={`tel:${selectedDriveout.driver_phone}`}
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
                <span className="font-extrabold text-zinc-800">
                  {selectedDriveout.starter_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedDriveout.starter_pct || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-600">Aux Battery</span>
                <span className="font-extrabold text-zinc-800">
                  {selectedDriveout.aux_v || "--"}V &nbsp;·&nbsp;{" "}
                  {selectedDriveout.aux_pct || 0}%
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
                    Record a vehicle parking at Block 210
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
            <CardContent className="overflow-y-auto p-6 flex-1 space-y-4">
              <form onSubmit={handleCheckinSubmit} className="space-y-4">
                {formError && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Licence Plate
                    </label>
                    <input
                      type="text"
                      value={ciPlate}
                      onChange={(e) => setCiPlate(e.target.value)}
                      placeholder="e.g. MID87XXX"
                      required
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Variant / Model
                    </label>
                    <input
                      type="text"
                      value={ciVariant}
                      onChange={(e) => setCiVariant(e.target.value)}
                      placeholder="e.g. Hunter RCV"
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
                    value={ciDriver}
                    onChange={(e) => setCiDriver(e.target.value)}
                    placeholder="Full name"
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
                      value={ciDriverPhone}
                      onChange={(e) => setCiDriverPhone(e.target.value)}
                      placeholder="+65 9XXX XXXX"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Driver Unit
                    </label>
                    <input
                      type="text"
                      value={ciDriverUnit}
                      onChange={(e) => setCiDriverUnit(e.target.value)}
                      placeholder="e.g. 11FMD"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Level
                    </label>
                    <select
                      value={ciLevel}
                      onChange={(e) => setCiLevel(e.target.value)}
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
                    </label>
                    <input
                      type="text"
                      value={ciLot}
                      onChange={(e) => setCiLot(e.target.value)}
                      placeholder="e.g. A5"
                      required
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Odometer (km)
                    </label>
                    <input
                      type="number"
                      value={ciOdometer}
                      onChange={(e) => setCiOdometer(e.target.value)}
                      placeholder="e.g. 50000"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Engine Hours
                    </label>
                    <input
                      type="number"
                      step="0.1"
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
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.1"
                      value={ciBattStarterV}
                      onChange={(e) => setCiBattStarterV(e.target.value)}
                      placeholder="Volts (e.g. 24.0)"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
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
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.1"
                      value={ciBattAuxV}
                      onChange={(e) => setCiBattAuxV(e.target.value)}
                      placeholder="Volts (e.g. 24.0)"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
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
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Litres (L)
                      </label>
                      <input
                        type="number"
                        value={ciFuelL}
                        onChange={(e) => setCiFuelL(e.target.value)}
                        placeholder="e.g. 1140"
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
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
                  </label>
                  <input
                    type="date"
                    value={ciFireExpiry}
                    onChange={(e) => setCiFireExpiry(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
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
                    Edit details for {selectedVehicle.plate}
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
                      Licence Plate
                    </label>
                    <input
                      type="text"
                      value={selectedVehicle.plate}
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
                    </label>
                    <input
                      type="text"
                      value={upLot}
                      onChange={(e) => setUpLot(e.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Odometer (km)
                    </label>
                    <input
                      type="number"
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
                      step="0.1"
                      value={upBattStarterV}
                      onChange={(e) => setUpBattStarterV(e.target.value)}
                      placeholder="Volts"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
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
                      step="0.1"
                      value={upBattAuxV}
                      onChange={(e) => setUpBattAuxV(e.target.value)}
                      placeholder="Volts"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
                    />
                    <input
                      type="number"
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
                  <input
                    type="date"
                    value={upFireExpiry}
                    onChange={(e) => setUpFireExpiry(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
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
                  {selectedVehicle.plate}
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



