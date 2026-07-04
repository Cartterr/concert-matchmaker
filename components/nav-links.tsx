"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  { href: "/matches", label: "Matches", icon: ListMusic },
];

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex items-center gap-2 rounded-md text-sm transition-colors",
              mobile
                ? "h-9 shrink-0 px-3"
                : "h-10 w-full px-3 text-sidebar-foreground/78",
              active
                ? mobile
                  ? "bg-accent text-accent-foreground"
                  : "bg-white/10 text-white"
                : mobile
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                  : "hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
