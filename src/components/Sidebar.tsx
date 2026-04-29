"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  TrendingUp,
  Bell,
  Menu,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/congress", label: "Filings", icon: Landmark },
  { href: "/movers", label: "Market Movers", icon: TrendingUp },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

function NavContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
        <img src="/logo.svg" alt="Congress Tracker" className="h-8 w-8" />
        <h1 className="text-lg font-bold tracking-tight">Congress Tracker</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Data: Yahoo Finance + House Clerk
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div onClick={() => setOpen(false)}>
              <NavContent pathname={pathname} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold text-sm">Congress Tracker</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-card">
        <NavContent pathname={pathname} />
      </aside>
    </>
  );
}
