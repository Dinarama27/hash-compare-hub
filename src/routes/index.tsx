import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { ALGOS, ALGO_META, type Algo } from "@/lib/hashing";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — HashLab" },
      { name: "description", content: "Session statistics and visual comparison of MD5, SHA-1 and SHA-256 results." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const records = useStore((s) => s.records);
  const totalHashes = records.length * ALGOS.length;
  const fileCount = records.filter((r) => r.source === "file").length;

  // Average ms per algo
  const avgMs: Record<Algo, number> = { MD5: 0, "SHA-1": 0, "SHA-256": 0 };
  if (records.length) {
    for (const a of ALGOS) {
      avgMs[a] = records.reduce((s, r) => s + r.results[a].ms, 0) / records.length;
    }
  }

  // Most used algo (tie all when no records)
  const mostUsed: Algo = records.length
    ? (Object.entries(avgMs).sort((a, b) => b[1] - a[1])[0][0] as Algo)
    : "SHA-256";

  const chartCommon = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#cbd5e1" } },
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
    },
  };

  return (
    <Layout>
      <section className="space-y-2 mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-mono">Welcome to HashLab</div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
          Compare <span className="text-primary">MD5</span>, <span className="text-warning">SHA-1</span> and{" "}
          <span className="text-accent">SHA-256</span> — speed, security & collisions.
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          A cryptography lab built for the course. Hash text and files, benchmark performance,
          run collision experiments on thousands of inputs, and learn why MD5/SHA-1 are deprecated.
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Link to="/text" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium glow-primary hover:opacity-90">
            Hash text →
          </Link>
          <Link to="/files" className="px-5 py-2.5 rounded-lg border border-border hover:bg-secondary">
            Hash a file
          </Link>
          <Link to="/collisions" className="px-5 py-2.5 rounded-lg border border-border hover:bg-secondary">
            Run collision lab
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Inputs hashed" value={records.length} />
        <StatCard label="Total hashes" value={totalHashes} hint="3 per input" />
        <StatCard label="Files analyzed" value={fileCount} />
        <StatCard label="Top algorithm" value={mostUsed} mono />
      </section>

      <section className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-1">Average execution time</h3>
          <p className="text-xs text-muted-foreground mb-4">Mean ms per algorithm across this session.</p>
          <div className="h-64">
            <Bar
              data={{
                labels: ALGOS,
                datasets: [{
                  label: "Avg ms",
                  data: ALGOS.map((a) => Number(avgMs[a].toFixed(4))),
                  backgroundColor: ALGOS.map((a) => ALGO_META[a].color),
                  borderRadius: 8,
                }],
              }}
              options={chartCommon}
            />
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-1">Security level (relative)</h3>
          <p className="text-xs text-muted-foreground mb-4">Heuristic 0–10 score based on modern cryptanalysis.</p>
          <div className="h-64">
            <Bar
              data={{
                labels: ALGOS,
                datasets: [{
                  label: "Security score",
                  data: ALGOS.map((a) => ALGO_META[a].security),
                  backgroundColor: ALGOS.map((a) => ALGO_META[a].color),
                  borderRadius: 8,
                }],
              }}
              options={{ ...chartCommon, scales: { ...chartCommon.scales, y: { ...chartCommon.scales.y, max: 10 } } }}
            />
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-1">Hash length (bits)</h3>
          <p className="text-xs text-muted-foreground mb-4">Output size determines collision resistance ceiling.</p>
          <div className="h-64">
            <Bar
              data={{
                labels: ALGOS,
                datasets: [{
                  label: "Bits",
                  data: ALGOS.map((a) => ALGO_META[a].bits),
                  backgroundColor: ALGOS.map((a) => ALGO_META[a].color),
                  borderRadius: 8,
                }],
              }}
              options={chartCommon}
            />
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-1">Inputs by source</h3>
          <p className="text-xs text-muted-foreground mb-4">Text inputs vs uploaded files in this session.</p>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={{
                labels: ["Text", "Files"],
                datasets: [{
                  data: [records.length - fileCount, fileCount],
                  backgroundColor: ["#22d3ee", "#4ade80"],
                  borderColor: "transparent",
                }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#cbd5e1" } } } }}
            />
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h3 className="font-semibold mb-4">Recent hashes</h3>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hashes yet. Try the Text or File hashing tools.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">Source</th><th>Label</th><th>SHA-256 preview</th><th className="text-right">MD5 ms</th><th className="text-right">SHA-1 ms</th><th className="text-right">SHA-256 ms</th></tr>
              </thead>
              <tbody>
                {records.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 capitalize">{r.source}</td>
                    <td className="font-mono truncate max-w-[200px]">{r.label}</td>
                    <td className="font-mono text-xs text-muted-foreground">{r.results["SHA-256"].hash.slice(0, 24)}…</td>
                    <td className="text-right font-mono">{r.results.MD5.ms.toFixed(3)}</td>
                    <td className="text-right font-mono">{r.results["SHA-1"].ms.toFixed(3)}</td>
                    <td className="text-right font-mono">{r.results["SHA-256"].ms.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}

function StatCard({ label, value, hint, mono }: { label: string; value: string | number; hint?: string; mono?: boolean }) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${mono ? "font-mono text-primary" : ""}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
