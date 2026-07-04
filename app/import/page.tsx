import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { ImportForm } from "@/components/import-form";
import { SetupPanel } from "@/components/setup-panel";
import { prisma } from "@/lib/db";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const authConfigured = isAuthConfigured();
  const databaseConfigured = isDatabaseConfigured();
  const session =
    authConfigured && databaseConfigured ? await auth().catch(() => null) : null;

  let catalogs: Array<{
    id: string;
    name: string;
    source: string;
    createdAt: Date;
    _count: { artists: number };
  }> = [];
  let error: string | undefined;

  if (databaseConfigured) {
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
      userName={session?.user?.name ?? session?.user?.email}
      authConfigured={authConfigured}
      databaseConfigured={databaseConfigured}
    >
      {!authConfigured || !databaseConfigured || error ? (
        <SetupPanel
          authConfigured={authConfigured}
          databaseConfigured={databaseConfigured}
          error={error}
        />
      ) : null}

      <div className="mt-6">
        <ImportForm />
      </div>

      <section className="mt-6 rounded-lg border border-[#d7dce2] bg-white">
        <div className="border-b border-[#eef1f4] px-5 py-4">
          <h2 className="text-base font-semibold">Recent catalogs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#eef1f4] text-sm">
            <thead className="bg-[#f8fafc] text-left text-xs uppercase tracking-[0.08em] text-[#667085]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Artists</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f4]">
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
                  <td className="px-4 py-6 text-[#667085]" colSpan={4}>
                    No catalogs imported yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
