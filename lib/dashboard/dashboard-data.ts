import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import defaultParkingConfig from "@/lib/parking-config.json";

export const SAFETY_MESSAGES = [
  "Always check your mirrors before reversing. A moment of caution prevents a lifetime of regret.",
  "Keep walkways clear at all times. Pedestrians share this space - give them room.",
  "Do not exceed 10 km/h on all levels. Speed limits exist for your safety and others'.",
  "Report any oil spills or wet floors immediately to prevent slips and falls.",
  "Ensure your vehicle is in park with the handbrake engaged before leaving it.",
  "Never leave engines running in enclosed spaces. Carbon monoxide is invisible and deadly.",
  "Wear your high-visibility vest when working in the car park outside your vehicle.",
];

export const PLATE_MASK_ENABLED = true;
export const PLATE_MAX_DIGITS = 3;

export const VEHICLE_VARIANT_OPTIONS = ["HFV", "HARV", "2BT", "B", "BN"];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.verify": "verified",
  "user.unverify": "marked unverified",
  "user.admin.grant": "granted admin access to",
  "user.admin.revoke": "revoked admin access from",
  "safety_message.create": "created safety message:",
  "safety_message.update": "rescheduled safety message:",
  "safety_message.delete": "deleted safety message",
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

export type SafetyMessageRecord = {
  id: string;
  message: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type AuditLogEntry = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_id: string | null;
  target_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type AdminUserRecord = {
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
};

type DashboardRecord = Record<string, unknown>;

export const DEFAULT_PARKING_LEVELS =
  defaultParkingConfig.levels as ParkingLevelConfig[];

export const RANK_OPTIONS = [
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

export const RANK_CATEGORIES = [
  {
    label: "Enlisted",
    ranks: ["REC", "PTE", "LCP", "CPL", "CFC"],
  },
  {
    label: "Specialists",
    ranks: ["3SG", "2SG", "1SG", "SSG", "MSG", "SCT"],
  },
  {
    label: "Warrant Officers",
    ranks: ["3WO", "2WO", "1WO", "MWO", "SWO", "CWO"],
  },
  {
    label: "Officers",
    ranks: [
      "2LT",
      "LTA",
      "CPT",
      "MAJ",
      "LTC",
      "SLTC",
      "COL",
      "BG",
      "GEN",
      "ADM",
      "OCT",
    ],
  },
  {
    label: "Military Experts",
    ranks: [
      "ME1T",
      "ME1",
      "ME2",
      "ME3",
      "ME4T",
      "ME4A",
      "ME4",
      "ME5",
      "ME6",
      "ME7",
      "ME8",
    ],
  },
];

export function formatPlateDisplay(plate?: string | null): string {
  if (!plate) return "-";
  if (!PLATE_MASK_ENABLED) return plate;

  const facilityPrefixMatch = plate.match(/^[A-Za-z0-9]+-(.+)$/);
  if (facilityPrefixMatch) return facilityPrefixMatch[1];
  return plate.replace(/^MID/i, "");
}

export function localInputToUtcIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function utcIsoToLocalInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function percentIndicatorColor(pct: number | null | undefined): string {
  const value = pct ?? 0;
  if (value > 50) return "bg-emerald-500";
  if (value > 20) return "bg-amber-500";
  return "bg-red-500";
}

export function getLotOccupancyClasses(occupied: number, total: number) {
  if (!total) return { box: "", text: "" };
  const pct = (occupied / total) * 100;
  if (pct >= 90) {
    return { box: "bg-red-50 border-red-300", text: "text-red-700" };
  }
  if (pct >= 75) {
    return { box: "bg-amber-50 border-amber-300", text: "text-amber-700" };
  }
  if (pct >= 50) {
    return { box: "bg-emerald-50 border-emerald-300", text: "text-emerald-700" };
  }
  return { box: "", text: "" };
}

export function parseDateInput(dateStr: string) {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;

  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getLevelLots(level?: ParkingLevelConfig) {
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

export function normalizeParkingValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function getLevelAliases(level?: ParkingLevelConfig) {
  if (!level) return new Set<string>();

  return new Set(
    [level.id, level.label, level.icon]
      .filter(Boolean)
      .map((value) => normalizeParkingValue(value)),
  );
}

export function vehicleMatchesLevel(
  vehicle: { level?: unknown } | null | undefined,
  level?: ParkingLevelConfig,
) {
  return getLevelAliases(level).has(normalizeParkingValue(vehicle?.level));
}

const HISTORY_EXPORT_COLUMNS = [
  { key: "plate", label: "Vehicle Plate" },
  { key: "variant", label: "Variant" },
  { key: "level", label: "Level" },
  { key: "lot", label: "Lot" },
  { key: "driver", label: "Driver" },
  { key: "driver_unit", label: "Unit" },
  { key: "check_in", label: "Check In" },
  { key: "check_out", label: "Check Out" },
  { key: "odometer", label: "Odometer" },
  { key: "engine_hours", label: "Engine Hours" },
  { key: "starter_v", label: "Starter V" },
  { key: "starter_pct", label: "Starter %" },
  { key: "aux_v", label: "Aux V" },
  { key: "aux_pct", label: "Aux %" },
  { key: "fuel_l", label: "Fuel L" },
  { key: "fuel_pct", label: "Fuel %" },
  { key: "fire_ext_expiry", label: "Fire Ext Expiry" },
  { key: "notes", label: "Notes" },
] as const;

function historyExportRow(record: DashboardRecord): string[] {
  return HISTORY_EXPORT_COLUMNS.map(({ key }) => {
    const value = record[key];
    if (value === null || value === undefined) return "";
    if (key === "plate") return formatPlateDisplay(String(value));
    if (key === "check_in" || key === "check_out") {
      return format(new Date(String(value)), "dd MMM yyyy HH:mm");
    }
    return String(value);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportDriveoutHistoryCSV(records: DashboardRecord[]) {
  const header = HISTORY_EXPORT_COLUMNS.map((c) => c.label);
  const rows = records.map(historyExportRow);
  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `trackr-drive-out-history-${format(new Date(), "yyyy-MM-dd")}.csv`);
}

export function exportDriveoutHistoryPDF(records: DashboardRecord[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Trackr - Drive-out History", 14, 14);
  doc.setFontSize(9);
  doc.text(`Generated ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 20);

  autoTable(doc, {
    startY: 26,
    head: [HISTORY_EXPORT_COLUMNS.map((c) => c.label)],
    body: records.map(historyExportRow),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`trackr-drive-out-history-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
