"use client";

import { Bell, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnnouncementRecord } from "@/lib/dashboard/dashboard-data";

type NotificationsTabProps = {
  announcements: AnnouncementRecord[];
  onDelete: (announcementId: string) => void;
  onRestore: (announcementId: string) => void;
};

function formatAnnouncementWindow(announcement: AnnouncementRecord) {
  const start = announcement.starts_at
    ? new Date(announcement.starts_at).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Always";
  const end = announcement.ends_at
    ? new Date(announcement.ends_at).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "no end date";

  return `${start} to ${end}`;
}

export function NotificationsTab({
  announcements,
  onDelete,
  onRestore,
}: NotificationsTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
          Notifications
        </h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">
          View announcements you have received on this device.
        </p>
      </div>

      <div className="grid gap-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
                  <Bell className="size-3.5" />
                  Announcement
                </div>
                {announcement.title && (
                  <h3 className="mt-2 text-base font-black text-zinc-900">
                    {announcement.title}
                  </h3>
                )}
                <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-700">
                  {announcement.message}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-zinc-400">
                  {formatAnnouncementWindow(announcement)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(announcement.id)}
                aria-label="Delete notification from this device"
                className="size-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onRestore(announcement.id)}
                className="h-8 text-xs font-bold"
              >
                Expand on Home
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
                  className="h-8 border-sky-200 bg-sky-50 text-xs font-bold text-sky-800 hover:bg-sky-100 hover:text-sky-900"
                >
                  <ExternalLink className="mr-1.5 size-3.5" />
                  {announcement.button_label || "Open link"}
                </Button>
              )}
            </div>
          </div>
        ))}

        {!announcements.length && (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-white py-8 text-center text-sm font-medium text-zinc-500">
            No notifications on this device.
          </p>
        )}
      </div>
    </div>
  );
}
