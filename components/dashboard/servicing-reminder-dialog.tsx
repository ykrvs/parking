"use client";

import { type DashboardVehicle, formatPlateDisplay } from "@/lib/dashboard/dashboard-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ServicingReminderDialogProps = {
  isFollowUpOpen: boolean;
  isSubmitting: boolean;
  vehicle: DashboardVehicle;
  onChooseAnotherDate: (vehicle: DashboardVehicle) => void;
  onClose: () => void;
  onConfirmDone: () => void;
  onFollowUpOpenChange: (isOpen: boolean) => void;
};

export function ServicingReminderDialog({
  isFollowUpOpen,
  isSubmitting,
  vehicle,
  onChooseAnotherDate,
  onClose,
  onConfirmDone,
  onFollowUpOpenChange,
}: ServicingReminderDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-sm rounded-xl border-amber-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardHeader>
          <CardTitle className="text-lg text-amber-700 font-bold">
            Servicing Reminder
          </CardTitle>
          <CardDescription>
            {formatPlateDisplay(vehicle.plate)} is due for servicing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFollowUpOpen ? (
            <>
              <p className="text-sm font-medium text-zinc-700">
                Has servicing been done on this vehicle yet?
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={onConfirmDone}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onFollowUpOpenChange(true)}
                  className="flex-1"
                >
                  No
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700">Not yet.</p>
              <div className="grid gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Not yet
                </Button>
                <Button
                  type="button"
                  onClick={() => onChooseAnotherDate(vehicle)}
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
  );
}
