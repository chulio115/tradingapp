"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// Routes that should NOT show the sidebar (full-bleed pages)
const PUBLIC_ROUTES = ["/landing", "/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // Public pages: render children directly, full width, no sidebar
  if (isPublic) {
    return <>{children}</>;
  }

  // App pages: render with sidebar + content padding
  return (
    <>
      <Sidebar />
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </>
  );
}
