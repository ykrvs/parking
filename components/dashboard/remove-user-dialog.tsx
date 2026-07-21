"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminUserRecord } from "@/lib/dashboard/dashboard-data";

type RemoveUserDialogProps = {
  user: AdminUserRecord;
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onSend: () => void;
};

export function RemoveUserDialog({
  user,
  reason,
  isSubmitting,
  onReasonChange,
  onCancel,
  onSend,
}: RemoveUserDialogProps) {
  const userContext = user.is_verified
    ? `${user.name}, ${user.facility_code || "No depot"}, ${
        user.unit || user.depot || "No platoon"
      }`
    : "UNVERIFIED user";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-xl border-zinc-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">
            Reason to remove {userContext}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Optional reason for the user"
            className="min-h-28 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSend}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
