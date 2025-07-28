"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} onToggleSidebar={handleToggleSidebar} />

      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16">
          <Sidebar session={session} />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={handleCloseSidebar}
            />
            <aside className="fixed top-16 bottom-0 left-0 z-50 w-64">
              <Sidebar
                session={session}
                onClose={handleCloseSidebar}
                className="border-r"
              />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1",
            "md:ml-64", // Add left margin on desktop to account for fixed sidebar
            className
          )}
        >
          {className?.includes("!p-0") ? (
            children
          ) : (
            <div className="container mx-auto px-4 pb-8">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
