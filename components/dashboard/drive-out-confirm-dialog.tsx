"use client";

import { Trash2 } from "lucide-react";

import { type DashboardVehicle, formatPlateDisplay } from "@/lib/dashboard/dashboard-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DriveOutConfirmDialogProps = {
  isSubmitting: boolean;
  vehicle: DashboardVehicle;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DriveOutConfirmDialog({
  isSubmitting,
  vehicle,
  onCancel,
  onConfirm,
}: DriveOutConfirmDialogProps) {
  return (
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
              {formatPlateDisplay(vehicle.plate)}
            </span>
            ,{" "}
            <span className="font-extrabold text-zinc-950">
              {vehicle.variant || "-"}
            </span>
            ?
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
            >
              {isSubmitting ? "Processing..." : "Yes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
