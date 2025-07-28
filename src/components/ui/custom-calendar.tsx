"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  format,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomCalendarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  max?: string;
  min?: string;
}

// Helper function to get current date in Indonesia timezone
const getCurrentDateIndonesia = () => {
  // Use Intl.DateTimeFormat to get accurate Indonesia timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(
    parts.find((part) => part.type === "year")?.value || ""
  );
  const month =
    parseInt(parts.find((part) => part.type === "month")?.value || "") - 1; // Month is 0-indexed
  const day = parseInt(parts.find((part) => part.type === "day")?.value || "");

  return new Date(year, month, day);
};

// Helper function to check if date is today in Indonesia timezone
const isTodayIndonesia = (date: Date) => {
  const today = getCurrentDateIndonesia();
  const dateYear = date.getFullYear();
  const dateMonth = date.getMonth();
  const dateDay = date.getDate();

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  return (
    dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDay
  );
};

export function CustomCalendar({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  disabled = false,
  className,
  max,
  min,
}: CustomCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(getCurrentDateIndonesia());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseISO(value) : null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for proper grid display
  const startPadding = monthStart.getDay();
  const paddingDays = Array.from({ length: startPadding }, (_, i) =>
    subDays(monthStart, startPadding - i)
  );

  const endPadding = 6 - monthEnd.getDay();
  const endPaddingDays = Array.from({ length: endPadding }, (_, i) =>
    addDays(monthEnd, i + 1)
  );

  const allDays = [...paddingDays, ...calendarDays, ...endPaddingDays];

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");

    // Check max/min constraints
    if (max && dateString > max) return;
    if (min && dateString < min) return;

    setSelectedDate(date);
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth(subDays(monthStart, 1));
    } else {
      setCurrentMonth(addDays(monthEnd, 1));
    }
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return "";
    return format(selectedDate, "dd/MM/yyyy", { locale: id });
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={formatDisplayValue()}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "cursor-pointer pr-10",
            disabled && "cursor-not-allowed",
            className
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        >
          <Calendar
            className="h-4 w-4"
            style={{ color: "var(--color-primary)" }}
          />
        </Button>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div
          className="absolute top-full left-0 z-50 mt-2 w-80 rounded-lg border shadow-2xl animate-in fade-in-0 zoom-in-95"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* Calendar Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{
              backgroundColor: "var(--color-muted)",
              borderBottomColor: "var(--color-border)",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange("prev")}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3
              className="font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </h3>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleMonthChange("next")}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Body */}
          <div className="p-4" style={{ backgroundColor: "var(--color-card)" }}>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((date, index) => {
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const isToday_ = isTodayIndonesia(date);
                const dateString = format(date, "yyyy-MM-dd");
                const isDisabled =
                  (max && dateString > max) ||
                  (min && dateString < min) ||
                  !isCurrentMonth;

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm font-medium transition-all",
                      "hover:bg-opacity-70 focus:outline-none focus:ring-2",
                      isDisabled &&
                        "cursor-not-allowed opacity-30 hover:bg-transparent"
                    )}
                    style={{
                      color: isCurrentMonth
                        ? "var(--color-foreground)"
                        : "var(--color-muted-foreground)",
                      backgroundColor: isSelected
                        ? "var(--color-primary)"
                        : isToday_ && !isSelected
                        ? "var(--color-accent)"
                        : "transparent",
                      borderColor:
                        isToday_ && !isSelected
                          ? "var(--color-primary)"
                          : "transparent",
                      borderWidth: isToday_ && !isSelected ? "1px" : "0",
                      fontWeight: isSelected || isToday_ ? "bold" : "normal",
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !isSelected) {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-accent)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled && !isSelected && !isToday_) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {format(date, "d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="border-t px-4 py-3"
            style={{
              backgroundColor: "var(--color-muted)",
              borderTopColor: "var(--color-border)",
            }}
          >
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(getCurrentDateIndonesia())}
                className="text-xs"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                }}
              >
                Hari Ini
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs ml-auto"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
