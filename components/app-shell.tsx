import { Database, GitBranch, LogOut } from "lucide-react";
import { signIn, signOut } from "@/auth";
import { NavLinks } from "@/components/nav-links";

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
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="focus-ring fixed left-4 top-4 z-50 -translate-y-20 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-sidebar text-sidebar-foreground lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid size-9 place-items-center rounded-md bg-accent text-accent-foreground">
            <Database className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold">Concert Matchmaker</div>
            <div className="text-xs text-white/60">Self-hosted scan hub</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          <NavLinks />
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-panel/92 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <div className="text-sm font-semibold lg:hidden">Concert Matchmaker</div>
              <div className="text-xs text-muted-foreground">
                {databaseConfigured ? "Database ready" : "Database not configured"} ·{" "}
                {authConfigured ? "GitHub auth ready" : "GitHub auth not configured"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userName ? (
                <>
                  <span className="rounded-md border border-border bg-panel px-3 py-2 text-sm">
                    {userName}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button
                      type="submit"
                      className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-border bg-panel hover:bg-muted"
                      title="Sign out"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
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
                  <button
                    type="submit"
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-sidebar px-3 text-sm font-medium text-sidebar-foreground"
                  >
                    <GitBranch className="size-4" aria-hidden="true" />
                    Sign in
                  </button>
                </form>
              ) : (
                <span className="rounded-md border border-border bg-panel px-3 py-2 text-sm text-muted-foreground">
                  Auth setup needed
                </span>
              )}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            <NavLinks mobile />
          </nav>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
