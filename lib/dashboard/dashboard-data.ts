import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import defaultParkingConfig from "@/lib/parking-config.json";

export const SAFETY_MESSAGES = [
  "Safety and quality go hand in hand.",
  "Don't put your life on the line, think safety.",
  "Think safe together, be safe forever.",
  "Open the door to safety: awareness is the key.",
  "Work together... work safely.",
  "Safety is not automatic, think about it.",
  "The safe way is the only way.",
];

export const PLATE_MASK_ENABLED = true;
export const PLATE_MAX_DIGITS = 3;

export const VEHICLE_VARIANT_OPTIONS = ["HFV", "HARV", "2BT", "B", "BN"];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.verify": "verified",
  "user.unverify": "marked unverified",
  "user.admin.grant": "granted admin access to",
  "user.admin.revoke": "revoked admin access from",
  "user.remove": "removed",
  "user.remove.ord_expired": "auto-removed due to ORD > 5 days",
  "safety_message.create": "created safety message:",
  "safety_message.update": "rescheduled safety message:",
  "safety_message.delete": "deleted safety message",
  "announcement.create": "created announcement:",
  "announcement.update": "updated announcement:",
  "announcement.delete": "deleted announcement",
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

export type AnnouncementRecord = {
  id: string;
  title: string | null;
  message: string;
  link_url: string | null;
  button_label: string | null;
  target_role: "all" | "admins" | "drivers" | "technicians";
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  facility_code: string | null;
  created_by: string | null;
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
  _auditLogged?: boolean;
  _auditError?: string | null;
};

export type UserRemovalNotice = {
  id: string;
  user_id: string;
  user_name: string | null;
  reason: string | null;
  removed_by_name: string | null;
  action: string;
  created_at: string;
};

export type DashboardUserProfile = AdminUserRecord & {
  depot?: string | null;
};

export type DashboardVehicle = {
  id: string;
  plate?: string | null;
  facility_code?: string | null;
  vehicle_unit?: string | null;
  variant?: string | null;
  driver_id?: string | null;
  driver?: string | null;
  driver_phone?: string | null;
  driver_unit?: string | null;
  driver_depot?: string | null;
  level?: string | null;
  lot?: string | null;
  odometer?: number | string | null;
  engine_hours?: number | string | null;
  starter_v?: number | string | null;
  starter_pct?: number | null;
  aux_v?: number | string | null;
  aux_pct?: number | null;
  fuel_l?: number | string | null;
  fuel_pct?: number | null;
  fire_ext_expiry?: string | null;
  is_vor?: boolean | null;
  next_servicing?: string | null;
  last_serviced?: string | null;
  notes?: string | null;
  check_in?: string | null;
  created_at?: string | null;
};

export type DriveoutRecord = DashboardVehicle & {
  vehicle_id?: string | null;
  check_out?: string | null;
};

type TurretEscCheckValue = boolean | null | undefined;

export type TurretEscLogRecord = {
  id?: string;
  vehicle_id?: string | null;
  plate?: string | null;
  created_at?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  user_name?: string | null;
  scu?: number | string | null;
  dcu?: number | string | null;
  fault_list?: string | null;
  notes?: string | null;
  ics?: TurretEscCheckValue;
  gsu?: TurretEscCheckValue;
  wim?: TurretEscCheckValue;
  trav_actuator?: TurretEscCheckValue;
  elev_actuator?: TurretEscCheckValue;
  gcu?: TurretEscCheckValue;
  mdcu?: TurretEscCheckValue;
  psu?: TurretEscCheckValue;
  gun_gyro?: TurretEscCheckValue;
  conv_ass?: TurretEscCheckValue;
  boost_box_ass?: TurretEscCheckValue;
  slip_ring?: TurretEscCheckValue;
  turr_estop?: TurretEscCheckValue;
  upplink_echute?: TurretEscCheckValue;
  upplink_splate?: TurretEscCheckValue;
  lowlink_splate?: TurretEscCheckValue;
  lowlink_echute?: TurretEscCheckValue;
  uppflex_chute?: TurretEscCheckValue;
  lowflex_chute?: TurretEscCheckValue;
  lws_comp?: TurretEscCheckValue;
  [key: string]: string | number | boolean | null | undefined;
};

export type VehicleUnitOption = {
  id: string;
  name: string;
};

type DashboardRecord = Record<string, unknown>;
type ExportVehicle = DashboardVehicle;

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
  { key: "vehicle_unit", label: "Vehicle Unit" },
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
  { key: "is_vor", label: "VOR Status" },
  { key: "next_servicing", label: "Next Servicing" },
  { key: "last_serviced", label: "Last Serviced" },
  { key: "notes", label: "Notes" },
] as const;

const BOS_EXPORT_COLUMNS = [
  { key: "plate", label: "Vehicle Plate" },
  { key: "vehicle_unit", label: "Vehicle Unit" },
  { key: "variant", label: "Variant" },
  { key: "level", label: "Level" },
  { key: "lot", label: "Lot" },
  { key: "odometer", label: "Odometer" },
  { key: "engine_hours", label: "Engine Hours" },
  { key: "starter_v", label: "Starter V" },
  { key: "starter_pct", label: "Starter %" },
  { key: "aux_v", label: "Aux V" },
  { key: "aux_pct", label: "Aux %" },
  { key: "fuel_l", label: "Fuel L" },
  { key: "fuel_pct", label: "Fuel %" },
  { key: "fire_ext_expiry", label: "Fire Ext Expiry" },
  { key: "is_vor", label: "VOR Status" },
  { key: "next_servicing", label: "Next Servicing" },
  { key: "last_serviced", label: "Last Serviced" },
  { key: "notes", label: "Notes" },
] as const;

const ADMIN_ACTION_EXPORT_COLUMNS = [
  { key: "created_at", label: "Date" },
  { key: "actor_name", label: "Admin" },
  { key: "action", label: "Action" },
  { key: "target_label", label: "Target" },
  { key: "details", label: "Details" },
] as const;

function historyExportRow(record: DashboardRecord): string[] {
  return HISTORY_EXPORT_COLUMNS.map(({ key }) => {
    const value = record[key];
    if (value === null || value === undefined) return "";
    if (key === "plate") return formatPlateDisplay(String(value));
    if (key === "check_in" || key === "check_out") {
      return format(new Date(String(value)), "dd MMM yyyy HH:mm");
    }
    if (key === "is_vor") return value ? "VOR" : "Operational";
    if (key === "next_servicing" || key === "last_serviced") {
      return format(new Date(String(value) + "T00:00:00"), "dd MMM yyyy");
    }
    return String(value);
  });
}

function bosExportRow(record: DashboardRecord): string[] {
  return BOS_EXPORT_COLUMNS.map(({ key }) => {
    const value = record[key];
    if (value === null || value === undefined || value === "") return "-";
    if (key === "plate") return formatPlateDisplay(String(value));
    if (key === "is_vor") return value ? "VOR" : "Operational";
    if (
      key === "fire_ext_expiry" ||
      key === "next_servicing" ||
      key === "last_serviced"
    ) {
      return format(new Date(String(value) + "T00:00:00"), "dd MMM yyyy");
    }
    return String(value);
  });
}

function adminActionExportRow(entry: AuditLogEntry): string[] {
  return ADMIN_ACTION_EXPORT_COLUMNS.map(({ key }) => {
    const value = entry[key];
    if (key === "created_at") {
      return format(new Date(entry.created_at), "dd MMM yyyy HH:mm");
    }
    if (key === "action") {
      return AUDIT_ACTION_LABELS[entry.action] || entry.action;
    }
    if (key === "details") {
      return value ? JSON.stringify(value) : "";
    }
    return value === null || value === undefined ? "" : String(value);
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

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

function exportTablePDF({
  filename,
  title,
  head,
  body,
  orientation = "landscape",
}: {
  filename: string;
  title: string;
  head: string[];
  body: string[][];
  orientation?: "portrait" | "landscape";
}) {
  const doc = new jsPDF({ orientation });
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.text(`Generated ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 20);

  autoTable(doc, {
    startY: 26,
    head: [head],
    body,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: 10, right: 10 },
  });

  doc.save(filename);
}

export function exportDriveoutHistoryCSV(records: DashboardRecord[]) {
  const header = HISTORY_EXPORT_COLUMNS.map((c) => c.label);
  const rows = records.map(historyExportRow);
  downloadCSV(`trackr-drive-out-history-${format(new Date(), "yyyy-MM-dd")}.csv`, [
    header,
    ...rows,
  ]);
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

export function exportBosReadingsCSV(records: DashboardRecord[]) {
  downloadCSV(`trackr-bos-readings-${format(new Date(), "yyyy-MM-dd")}.csv`, [
    BOS_EXPORT_COLUMNS.map((column) => column.label),
    ...records.map(bosExportRow),
  ]);
}

export function exportBosReadingsPDF(records: DashboardRecord[]) {
  exportTablePDF({
    filename: `trackr-bos-readings-${format(new Date(), "yyyy-MM-dd")}.pdf`,
    title: "Trackr - BOS Readings",
    head: BOS_EXPORT_COLUMNS.map((column) => column.label),
    body: records.map(bosExportRow),
  });
}

export function exportAdminActionsCSV(records: AuditLogEntry[]) {
  downloadCSV(`trackr-admin-actions-${format(new Date(), "yyyy-MM-dd")}.csv`, [
    ADMIN_ACTION_EXPORT_COLUMNS.map((column) => column.label),
    ...records.map(adminActionExportRow),
  ]);
}

export function exportAdminActionsPDF(records: AuditLogEntry[]) {
  exportTablePDF({
    filename: `trackr-admin-actions-${format(new Date(), "yyyy-MM-dd")}.pdf`,
    title: "Trackr - Admin Actions",
    head: ADMIN_ACTION_EXPORT_COLUMNS.map((column) => column.label),
    body: records.map(adminActionExportRow),
  });
}

function parkingCellLabel(
  lot: string,
  vehicle: ExportVehicle | undefined,
  includeVehicleDetails = true,
) {
  if (!vehicle) return `${lot}\nEmpty`;

  const parts = [lot, formatPlateDisplay(vehicle.plate)];
  if (vehicle.is_vor) parts.push("VOR");
  if (includeVehicleDetails) {
    if (vehicle.vehicle_unit) parts.push(vehicle.vehicle_unit);
    if (vehicle.variant) parts.push(vehicle.variant);
  }

  return parts.join("\n");
}

function buildParkingLevelRows(
  level: ParkingLevelConfig,
  vehicles: ExportVehicle[],
) {
  const occupiedLots = vehicles
    .filter((vehicle) => vehicleMatchesLevel(vehicle, level))
    .reduce<Record<string, ExportVehicle | undefined>>((map, vehicle) => {
      map[normalizeParkingValue(vehicle.lot)] = vehicle;
      return map;
    }, {});
  const columns = level.layout?.columns?.length
    ? level.layout.columns
    : [{ type: "lots" as const, id: "default", lots: getLevelLots(level) }];
  const columnRows = columns.map((column) => {
    if (column.type === "driveway") return [column.label || "DRIVEWAY"];
    if (column.type === "spacer") return [""];

    const cells =
      column.type === "mixed"
        ? column.cells
        : column.lots.map((lot) => ({ type: "lot" as const, id: lot }));

    return cells.map((cell) => {
      if (cell.type === "area") return cell.label.replace(/\n/g, " ");
      return parkingCellLabel(cell.id, occupiedLots[normalizeParkingValue(cell.id)]);
    });
  });
  const maxRows = Math.max(1, ...columnRows.map((rows) => rows.length));

  return Array.from({ length: maxRows }, (_, rowIndex) =>
    columnRows.map((rows) => rows[rowIndex] ?? ""),
  );
}

function buildParkingExportSections(
  levels: ParkingLevelConfig[],
  vehicles: ExportVehicle[],
) {
  return levels.map((level) => ({
    level,
    rows: buildParkingLevelRows(level, vehicles),
  }));
}

export function exportParkingLayoutCSV(
  levels: ParkingLevelConfig[],
  vehicles: ExportVehicle[],
) {
  const rows: string[][] = [];
  buildParkingExportSections(levels, vehicles).forEach(({ level, rows: levelRows }) => {
    if (rows.length) rows.push([]);
    rows.push([level.label]);
    rows.push(...levelRows);
  });

  downloadCSV(`trackr-parking-layout-${format(new Date(), "yyyy-MM-dd")}.csv`, rows);
}

export function exportParkingLayoutPDF(
  levels: ParkingLevelConfig[],
  vehicles: ExportVehicle[],
) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Trackr - Parking Layout", 14, 14);
  doc.setFontSize(9);
  doc.text(`Generated ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 20);

  let startY = 28;
  buildParkingExportSections(levels, vehicles).forEach(({ level, rows }) => {
    doc.setFontSize(11);
    doc.text(level.label, 14, startY);
    autoTable(doc, {
      startY: startY + 3,
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: "center",
        valign: "middle",
        minCellHeight: 12,
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        const text = Array.isArray(data.cell.raw)
          ? data.cell.raw.join(" ")
          : String(data.cell.raw ?? "");
        if (text.includes("\nEmpty")) {
          data.cell.styles.textColor = [113, 113, 122];
        } else if (text && text !== "DRIVEWAY") {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [20, 83, 45];
        }
      },
    });
    startY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!
          .finalY + 10
      : startY + 40;

    if (startY > 180) {
      doc.addPage();
      startY = 18;
    }
  });

  doc.save(`trackr-parking-layout-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
