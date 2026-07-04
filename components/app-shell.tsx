import Link from "next/link";
import {
  CalendarSearch,
  Database,
  GitBranch,
  Home,
  ListMusic,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/ui";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/trips", label: "Trip Scan", icon: CalendarSearch },
  { href: "/matches", label: "Matches", icon: ListMusic },
];

export function AppShell({
  children,
  userName,
  authConfigured,
  databaseConfigured,
}: {
  children: React.ReactNode;
  userName?: string | null;
  authConfigured: boolean;
  databaseConfigured: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#171717]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#d7dce2] bg-[#111827] text-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid size-9 place-items-center rounded-md bg-[#0f766e]">
            <Database className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold">Concert Matchmaker</div>
            <div className="text-xs text-white/60">Self-hosted scan hub</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-white/78 hover:bg-white/10 hover:text-white"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[#d7dce2] bg-white/92 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <div className="text-sm font-semibold lg:hidden">Concert Matchmaker</div>
              <div className="text-xs text-[#667085]">
                {databaseConfigured ? "Database ready" : "Database not configured"} ·{" "}
                {authConfigured ? "GitHub auth ready" : "GitHub auth not configured"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userName ? (
                <span className="rounded-md border border-[#d7dce2] bg-white px-3 py-2 text-sm">
                  {userName}
                </span>
              ) : authConfigured ? (
                <Link
                  href="/api/auth/signin/github"
                  className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-[#111827] px-3 text-sm font-medium text-white"
                >
                  <GitBranch className="size-4" aria-hidden="true" />
                  Sign in
                </Link>
              ) : (
                <span className="rounded-md border border-[#d7dce2] bg-white px-3 py-2 text-sm text-[#667085]">
                  Auth setup needed
                </span>
              )}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-[#eef1f4] px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm",
                  "text-[#344054] hover:bg-[#eef1f4]",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
