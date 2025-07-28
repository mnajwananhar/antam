"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Bell,
  ClipboardList,
  Users,
  ChevronDown,
  ChevronRight,
  Settings,
  BarChart3,
  FileText,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { roleUtils } from "@/lib/utils";
import type { Session } from "next-auth";

interface SidebarProps {
  session: Session | null;
  className?: string;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  badge?: string | number;
  roles?: string[];
  departmentSpecific?: boolean;
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Input Data",
    href: "/input",
    icon: Database,
    children: [
      {
        title: "Pusat Data Departemen",
        href: "/input",
        icon: Database,
      },
    ],
  },
  {
    title: "Notifikasi",
    href: "/notifikasi",
    icon: Bell,
    badge: "New",
  },
  {
    title: "Order List",
    href: "/order-list",
    icon: ClipboardList,
  },
  {
    title: "Laporan",
    icon: FileText,
    children: [
      {
        title: "Laporan Operasional",
        href: "/laporan/operasional",
        icon: BarChart3,
      },
      {
        title: "Laporan Maintenance",
        href: "/laporan/maintenance",
        icon: Wrench,
      },
      {
        title: "Laporan Safety",
        href: "/laporan/safety",
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: "Manajemen Pengguna",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ session, className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isItemVisible = (item: NavItem): boolean => {
    if (!session?.user) return false;

    // Check role-based access
    if (item.roles && !item.roles.includes(session.user.role)) {
      return false;
    }

    return true;
  };

  const isItemActive = (href?: string): boolean => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    if (!isItemVisible(item)) return null;

    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isItemActive(item.href);

    if (hasChildren) {
      return (
        <div key={item.title}>
          <Button
            variant="ghost"
            className={cn(
              "justify-start text-left font-normal my-1 rounded-lg w-full",
              "hover:bg-accent/50 transition-all duration-200",
              level === 0 ? "h-10 mx-2" : "h-8 text-sm ml-4 mr-2",
              isActive && "bg-accent text-accent-foreground"
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <item.icon
              className={cn("h-4 w-4 flex-shrink-0", level === 0 ? "mr-3" : "mr-2")}
            />
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                {item.badge}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0 ml-1" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0 ml-1" />
            )}
          </Button>

          {isExpanded && item.children && (
            <div className="mt-2 space-y-1">
              {item.children.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Fixed: Removed asChild and wrapped Button with Link instead
    return (
      <Link 
        key={item.title}
        href={item.href || "#"}
        onClick={handleItemClick}
      >
        <Button
          variant="ghost"
          className={cn(
            "justify-start text-left font-normal my-1 rounded-lg w-full",
            "hover:bg-accent/50 transition-all duration-200",
            level === 0 ? "h-10 mx-2" : "h-8 text-sm ml-4 mr-2",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <item.icon className={cn("h-4 w-4 flex-shrink-0", level === 0 ? "mr-3" : "mr-2")} />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <div className={cn("sidebar-container flex h-full flex-col bg-background overflow-hidden", className)}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <div className="space-y-0 px-2">
          {navigationItems.map((item) => renderNavItem(item))}
        </div>
      </div>

      {/* User info section at bottom */}
      {session?.user && (
        <div className="border-t p-4 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
              {session.user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate">
                {session.user.username}
              </p>
              <div className="flex items-center gap-1 overflow-hidden">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {roleUtils.getRoleDisplayName(session.user.role)}
                </Badge>
                {session.user.departmentName && (
                  <span className="text-xs text-muted-foreground truncate flex-shrink">
                    {session.user.departmentName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
