import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HealthResult = {
  ok: boolean;
  message: string;
  checkedAt: string;
};

async function checkDatabase(): Promise<HealthResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      message: "Database connection is healthy",
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    return {
      ok: false,
      message,
      checkedAt: new Date().toISOString(),
    };
  }
}

export default async function HealthPage() {
  const health = await checkDatabase();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Health Check</h1>
      <p className="mt-2 text-sm text-slate-600">Route ini untuk cek koneksi database dari server.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              health.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {health.ok ? "OK" : "ERROR"}
          </span>
          <p className="text-sm font-medium text-slate-800">{health.message}</p>
        </div>

        <p className="mt-3 text-xs text-slate-500">Checked at: {health.checkedAt}</p>
      </div>
    </main>
  );
}
