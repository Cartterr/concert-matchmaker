"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarSearch,
  Home,
  ListMusic,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui";

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/trips", label: "Trip Scan", icon: CalendarSearch },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/matches", label: "Matches", icon: ListMusic },
];

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item, index) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring relative inline-flex items-center gap-2.5 rounded-md text-sm transition-all duration-150",
              mobile
                ? "h-9 shrink-0 px-3"
                : "h-10 w-full px-3 text-sidebar-foreground/70",
              active
                ? mobile
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "bg-accent/10 font-semibold text-accent"
                : mobile
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                  : "hover:bg-muted hover:text-foreground",
            )}
          >
            {active && !mobile ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
              />
            ) : null}
            {!mobile ? (
              <span
                aria-hidden="true"
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  active ? "text-accent/70" : "text-faint",
                )}
              >
                0{index + 1}
              </span>
            ) : null}
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
