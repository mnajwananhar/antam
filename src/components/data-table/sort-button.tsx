import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortButtonProps {
  children: React.ReactNode;
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: "asc" | "desc";
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  className?: string;
  disabled?: boolean;
}

export function SortButton({
  children,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = "",
  disabled = false,
}: SortButtonProps): React.JSX.Element {
  const isActive = currentSortBy === sortKey;
  
  const handleClick = (): void => {
    if (isActive) {
      // Toggle sort order if already sorting by this column
      const newOrder = currentSortOrder === "asc" ? "desc" : "asc";
      onSort(sortKey, newOrder);
    } else {
      // Start with desc for new columns
      onSort(sortKey, "desc");
    }
  };

  const getSortIcon = (): React.JSX.Element => {
    if (!isActive) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    
    return currentSortOrder === "asc" ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={`h-8 px-2 flex items-center gap-2 ${
        isActive ? "bg-muted" : ""
      } ${className}`}
    >
      {children}
      {getSortIcon()}
    </Button>
  );
}
