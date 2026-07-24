"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnnouncementRecord } from "@/lib/dashboard/dashboard-data";

export type AnnouncementDraft = {
  title: string;
  message: string;
  linkUrl: string;
  buttonLabel: string;
  startsAt: string;
  endsAt: string;
  targetRole: AnnouncementRecord["target_role"];
  isActive: boolean;
};

type AdminAnnouncementsTabProps = {
  announcements: AnnouncementRecord[];
  isSaving: boolean;
  onCreate: (draft: AnnouncementDraft) => Promise<void>;
  onDelete: (announcementId: string) => Promise<void>;
  onToggleActive: (
    announcementId: string,
    isActive: boolean,
  ) => Promise<void>;
};

const blankDraft: AnnouncementDraft = {
  title: "",
  message: "",
  linkUrl: "",
  buttonLabel: "Open Form",
  startsAt: "",
  endsAt: "",
  targetRole: "all",
  isActive: true,
};

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function AdminAnnouncementsTab({
  announcements,
  isSaving,
  onCreate,
  onDelete,
  onToggleActive,
}: AdminAnnouncementsTabProps) {
  const [draft, setDraft] = useState<AnnouncementDraft>(blankDraft);

  const updateDraft = <K extends keyof AnnouncementDraft>(
    key: K,
    value: AnnouncementDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onCreate(draft);
    setDraft(blankDraft);
  };

  return (
    <div className="grid gap-6 border-t border-zinc-100 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-zinc-700">
            Title optional
          </label>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => updateDraft("title", event.target.value)}
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-zinc-700">Message</label>
          <textarea
            required
            value={draft.message}
            onChange={(event) => updateDraft("message", event.target.value)}
            className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-700">Links</label>
            <input
              type="url"
              value={draft.linkUrl}
              onChange={(event) => updateDraft("linkUrl", event.target.value)}
              placeholder="https://forms.office.com/..."
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-700">
              Button label
            </label>
            <input
              type="text"
              value={draft.buttonLabel}
              onChange={(event) =>
                updateDraft("buttonLabel", event.target.value)
              }
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-700">
              Date from
            </label>
            <input
              type="date"
              value={draft.startsAt}
              onChange={(event) => updateDraft("startsAt", event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-700">
              Date to
            </label>
            <input
              type="date"
              value={draft.endsAt}
              onChange={(event) => updateDraft("endsAt", event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-700">
              Target role
            </label>
            <Select
              value={draft.targetRole}
              onValueChange={(value) =>
                updateDraft(
                  "targetRole",
                  value as AnnouncementDraft["targetRole"],
                )
              }
            >
              <SelectTrigger className="h-10 w-full bg-white border-zinc-200 focus:border-red-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-200 shadow-md rounded-md">
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="admins">Admins only</SelectItem>
                <SelectItem value="drivers">Drivers only</SelectItem>
                <SelectItem value="technicians">Technicians only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="mt-6 flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => updateDraft("isActive", event.target.checked)}
              className="size-4 accent-sky-700"
            />
            Active
          </label>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="w-full bg-sky-700 hover:bg-sky-800 sm:w-fit"
        >
          <Plus className="size-4 mr-1" />
          {isSaving ? "Uploading..." : "Upload"}
        </Button>
      </form>

      <div className="space-y-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
          Announcement Schedule
        </h4>
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="space-y-3 rounded-lg border border-zinc-100 p-3"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900">
                    {announcement.title || "Untitled announcement"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-700">
                    {announcement.message}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase text-sky-700">
                  {announcement.target_role}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-zinc-500">
                {toDateInputValue(announcement.starts_at) || "Always"} to{" "}
                {toDateInputValue(announcement.ends_at) || "no end"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onToggleActive(announcement.id, !announcement.is_active)
                }
                className="h-7 px-2 text-[11px]"
              >
                {announcement.is_active ? "Turn off" : "Turn on"}
              </Button>
              {announcement.link_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      announcement.link_url || "",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="h-7 gap-1 px-2 text-[11px]"
                >
                  <ExternalLink className="size-3" />
                  Open
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onDelete(announcement.id)}
                className="h-7 gap-1 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
            </div>
          </div>
        ))}

        {!announcements.length && (
          <p className="py-6 text-center text-sm text-zinc-500">
            No announcements added yet.
          </p>
        )}
      </div>
    </div>
  );
}
