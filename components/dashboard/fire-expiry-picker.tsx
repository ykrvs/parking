"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDateInput(dateStr: string) {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;

  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

type FireExpiryPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function FireExpiryPicker({ value, onChange }: FireExpiryPickerProps) {
  const selectedDate = parseDateInput(value);
  const currentYear = new Date().getFullYear();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal hover:bg-zinc-50 focus:border-red-600 focus:ring-3 focus:ring-red-600/15",
            !value && "text-muted-foreground",
          )}
        >
          <span>
            {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date"}
          </span>
          <Calendar className="size-4 text-zinc-400" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-white border border-zinc-200 shadow-md rounded-md"
        align="start"
      >
        <DatePickerCalendar
          mode="single"
          selected={selectedDate}
          captionLayout="dropdown"
          navLayout="after"
          startMonth={new Date(currentYear - 1, 0)}
          endMonth={new Date(currentYear + 20, 11)}
          onSelect={(date) => {
            onChange(date ? toDateInputValue(date) : "");
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
