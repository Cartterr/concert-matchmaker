import { AppShell } from "@/components/app-shell";
import { ImportForm } from "@/components/import-form";
import { LockedPanel } from "@/components/locked-panel";
import { SetupPanel } from "@/components/setup-panel";
import { prisma } from "@/lib/db";
import { getPageAccess } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const access = await getPageAccess();
  let catalogs: Array<{
    id: string;
    name: string;
    source: string;
    createdAt: Date;
    _count: { artists: number };
  }> = [];
  let error: string | undefined;

  if (access.canRead) {
    try {
      catalogs = await prisma.artistCatalog.findMany({
        include: { _count: { select: { artists: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Database query failed.";
    }
  }

  return (
    <AppShell
      userName={access.userName}
      authConfigured={access.authConfigured}
      databaseConfigured={access.databaseConfigured}
    >
      {!access.canRead ? (
        <LockedPanel
          authConfigured={access.authConfigured}
          databaseConfigured={access.databaseConfigured}
        />
      ) : error ? (
        <SetupPanel
          authConfigured={access.authConfigured}
          databaseConfigured={access.databaseConfigured}
          error={error}
        />
      ) : null}

      {access.canRead ? (
        <>
          <div className="mt-6">
            <ImportForm />
          </div>

          <section className="mt-6 rounded-lg border border-border bg-panel">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Recent catalogs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Artists</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {catalogs.map((catalog) => (
                    <tr key={catalog.id}>
                      <td className="px-4 py-3 font-medium">{catalog.name}</td>
                      <td className="px-4 py-3">{catalog.source}</td>
                      <td className="px-4 py-3">{catalog._count.artists}</td>
                      <td className="px-4 py-3">
                        {catalog.createdAt.toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  ))}
                  {catalogs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                        No catalogs imported yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
