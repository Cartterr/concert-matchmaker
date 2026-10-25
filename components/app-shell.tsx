import { GitBranch, LogOut } from "lucide-react";
import { signIn, signOut } from "@/auth";
import { NavLinks } from "@/components/nav-links";
import { cn } from "@/lib/ui";

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
    <div className="relative z-10 min-h-screen text-foreground">
      <a
        href="#main-content"
        className="focus-ring fixed left-4 top-4 z-50 -translate-y-20 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="eq" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              Concert Matchmaker
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              signal scanner
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLinks />
        </nav>

        <div className="space-y-2.5 border-t border-border px-5 py-4">
          <SystemStatus ok={databaseConfigured} label="database" />
          <SystemStatus ok={authConfigured} label="github auth" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="eq lg:hidden" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight lg:hidden">
                  Concert Matchmaker
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint lg:hidden">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "status-dot size-1.5",
                        databaseConfigured ? "bg-accent" : "bg-danger",
                      )}
                    />
                    db
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "status-dot size-1.5",
                        authConfigured ? "bg-accent" : "bg-danger",
                      )}
                    />
                    auth
                  </span>
                </div>
                <div className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-faint lg:block">
                  event-first scan · chicago sc26 · nov 15—20
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userName ? (
                <>
                  <span className="rounded-md border border-border bg-panel px-3 py-2 font-mono text-xs text-muted-foreground">
                    <span className="text-accent">@</span> {userName}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button
                      type="submit"
                      className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-border bg-panel transition-colors hover:border-border-strong hover:bg-muted"
                      title="Sign out"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      <span className="sr-only">Sign out</span>
                    </button>
                  </form>
                </>
              ) : authConfigured ? (
                <form
                  action={async () => {
                    "use server";
                    await signIn("github");
                  }}
                >
                  <button type="submit" className="btn btn-accent h-9">
                    <GitBranch className="size-4" aria-hidden="true" />
                    Sign in
                  </button>
                </form>
              ) : (
                <span className="rounded-md border border-border bg-panel px-3 py-2 font-mono text-xs text-muted-foreground">
                  auth setup needed
                </span>
              )}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            <NavLinks mobile />
          </nav>
        </header>
        <main
          id="main-content"
          className="rise mx-auto max-w-7xl px-4 py-6 sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function SystemStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      <span
        className={cn(
          "status-dot",
          ok ? "status-dot--pulse bg-accent" : "bg-danger",
        )}
      />
      {label}
      <span className={cn("ml-auto", ok ? "text-accent" : "text-danger")}>
        {ok ? "ok" : "off"}
      </span>
    </div>
  );
}
