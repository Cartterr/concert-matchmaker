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
          <div className="mt-2">
            <p className="kicker">{"// catalog intake"}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Import</h1>
          </div>

          <div className="mt-5">
            <ImportForm />
          </div>

          <section className="panel mt-6 overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <p className="microlabel">history</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight">
                Recent catalogs
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="table-head">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Source
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Artists
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {catalogs.map((catalog) => (
                    <tr
                      key={catalog.id}
                      className="transition-colors hover:bg-panel-raised"
                    >
                      <td className="px-4 py-3 font-semibold">{catalog.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {catalog.source}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-accent">
                        {catalog._count.artists.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
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
