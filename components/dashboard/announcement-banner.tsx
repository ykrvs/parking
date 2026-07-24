"use client";

import { ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnnouncementRecord } from "@/lib/dashboard/dashboard-data";

type AnnouncementBannerProps = {
  announcement: AnnouncementRecord;
  onDismiss: (announcementId: string) => void;
};

export function AnnouncementBanner({
  announcement,
  onDismiss,
}: AnnouncementBannerProps) {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {announcement.title && (
            <h3 className="text-sm font-black text-sky-950">
              {announcement.title}
            </h3>
          )}
          <p className="mt-1 text-sm font-medium leading-relaxed text-sky-900">
            {announcement.message}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDismiss(announcement.id)}
          aria-label="Close announcement"
          className="size-8 shrink-0 text-sky-700 hover:bg-sky-100 hover:text-sky-900"
        >
          <X className="size-4" />
        </Button>
      </div>
      {announcement.link_url && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.open(announcement.link_url || "", "_blank", "noopener,noreferrer")
            }
            className="h-8 border-sky-200 bg-white text-xs font-bold text-sky-800 hover:bg-sky-100 hover:text-sky-900"
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            {announcement.button_label || "Open link"}
          </Button>
        </div>
      )}
    </div>
  );
}
