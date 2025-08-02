"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  max?: string; // For compatibility with max date
}

/**
 * @deprecated Use CustomCalendar instead
 */
export function DatePicker({
  value,
  placeholder = "Pilih tanggal...",
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {value ? format(value, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-background border-border shadow-lg"
        align="start"
      >
        {/* 
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
          className="bg-background"
        />
        */}
        <div className="p-4 text-center text-muted-foreground">
          <p>This component is deprecated.</p>
          <p>Use CustomCalendar instead.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
