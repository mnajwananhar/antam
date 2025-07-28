"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { roleUtils } from "@/lib/utils";
import type { Session } from "next-auth";

interface HeaderProps {
  session: Session | null;
  onToggleSidebar?: () => void;
}

export function Header({ session, onToggleSidebar }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  };

  const getUserRoleColor = (role: string) => {
    const roleColors = {
      ADMIN: "destructive",
      PLANNER: "default", // Changed from success to default (kuning theme)
      INPUTTER: "warning",
      VIEWER: "secondary",
    };
    return roleColors[role as keyof typeof roleColors] || "secondary";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Logo and hamburger menu */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">{APP_CONFIG.NAME}</h1>
              <p className="text-xs text-muted-foreground">
                {APP_CONFIG.DESCRIPTION}
              </p>
            </div>
          </div>
        </div>

        {/* Right side - User menu */}
        {session?.user ? (
          <div className="flex items-center gap-4 ml-auto">
            {/* User info - visible on desktop, positioned to the right */}
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-sm font-medium text-foreground">
                {session.user.username}
              </span>
              <div className="flex items-center gap-2 justify-end">
                <Badge
                  variant={
                    getUserRoleColor(session.user.role) as
                      | "default"
                      | "secondary"
                      | "destructive"
                      | "outline"
                  }
                  className="text-xs"
                >
                  {roleUtils.getRoleDisplayName(session.user.role)}
                </Badge>
                {session.user.departmentName && (
                  <span className="text-xs text-muted-foreground">
                    {session.user.departmentName}
                  </span>
                )}
              </div>
            </div>

            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-full hover:bg-accent"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {session.user.username}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge
                        variant={
                          getUserRoleColor(session.user.role) as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                        className="text-xs"
                      >
                        {roleUtils.getRoleDisplayName(session.user.role)}
                      </Badge>
                      {session.user.departmentName && (
                        <span className="text-xs text-muted-foreground">
                          {session.user.departmentName}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
