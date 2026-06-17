import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ALGOS, hashString, type Algo } from "@/lib/hashing";
import { Bar } from "react-chartjs-2";

export const Route = createFileRoute("/collisions")({
  head: () => ({
    meta: [
      { title: "Collision Lab — HashLab" },
      { name: "description", content: "Generate thousands of random inputs and detect truncated-hash collisions across MD5, SHA-1 and SHA-256." },
    ],
  }),
  component: CollisionsPage,
});

type Result = {
  algo: Algo;
  total: number;
  unique: number;
  collisions: number;
  pct: number;
  totalMs: number;
  examples: { a: string; b: string; hash: string }[];
};

function rand(len: number) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function CollisionsPage() {
  const [count, setCount] = useState(2000);
  const [truncateBits, setTruncateBits] = useState(24);
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    if (count < 100 || count > 20000) {
      setError("Sample size must be between 100 and 20,000.");
      return;
    }
    setBusy(true);
    setResults(null);
    try {
      const inputs: string[] = [];
      for (let i = 0; i < count; i++) inputs.push(rand(12) + i);

      const out: Result[] = [];
      const hexChars = Math.max(2, Math.ceil(truncateBits / 4));

      for (const algo of ALGOS) {
        const seen = new Map<string, string>();
        const examples: { a: string; b: string; hash: string }[] = [];
        let collisions = 0;
        const t0 = performance.now();
        for (const inp of inputs) {
          const { hash } = await hashString(algo, inp);
          const trunc = hash.slice(0, hexChars);
          const prev = seen.get(trunc);
          if (prev !== undefined) {
            collisions++;
            if (examples.length < 3) examples.push({ a: prev, b: inp, hash: trunc });
          } else {
            seen.set(trunc, inp);
          }
        }
        const totalMs = performance.now() - t0;
        out.push({
          algo,
          total: count,
          unique: seen.size,
          collisions,
          pct: (collisions / count) * 100,
          totalMs,
          examples,
        });
      }
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Experiment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Collision Lab</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          A <strong>collision</strong> happens when two different inputs produce the same hash output.
          Real MD5/SHA-1 collisions take massive compute, but we can demonstrate the{" "}
          <em>birthday paradox</em> by truncating each hash to a small number of bits and counting matches
          across thousands of random inputs.
        </p>
      </header>

      <div className="glass-card p-5 mb-8 grid md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Sample size</label>
          <input
            type="number" min={100} max={20000} step={100}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            className="w-full bg-input rounded-md p-2.5 font-mono border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Truncate to bits ({truncateBits})
          </label>
          <input
            type="range" min={8} max={40} step={4}
            value={truncateBits}
            onChange={(e) => setTruncateBits(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">
            Expected collisions ≈ N²/(2·2^bits) = {((count * count) / (2 * 2 ** truncateBits)).toFixed(1)}
          </div>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium glow-primary disabled:opacity-50"
        >{busy ? "Running experiment…" : "Run experiment"}</button>
      </div>

      {error && <div className="text-sm text-destructive mb-4">{error}</div>}

      {results && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {results.map((r) => (
              <div key={r.algo} className="glass-card p-5 space-y-3">
                <div className={`algo-badge ${r.algo === "MD5" ? "algo-md5" : r.algo === "SHA-1" ? "algo-sha1" : "algo-sha256"}`}>{r.algo}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Inputs" value={r.total.toLocaleString()} />
                  <Stat label="Unique" value={r.unique.toLocaleString()} />
                  <Stat label="Collisions" value={r.collisions.toLocaleString()} highlight={r.collisions > 0} />
                  <Stat label="Rate" value={`${r.pct.toFixed(3)}%`} />
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Total time: {r.totalMs.toFixed(1)} ms
                </div>
                {r.examples.length > 0 && (
                  <div className="text-xs space-y-1">
                    <div className="uppercase tracking-wider text-muted-foreground">Sample collision</div>
                    <div className="font-mono text-[11px] bg-secondary/40 p-2 rounded">
                      <div><span className="text-muted-foreground">a:</span> {r.examples[0].a}</div>
                      <div><span className="text-muted-foreground">b:</span> {r.examples[0].b}</div>
                      <div className="text-primary">→ {r.examples[0].hash}…</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Collisions found per algorithm</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: results.map((r) => r.algo),
                  datasets: [{
                    label: "Collisions",
                    data: results.map((r) => r.collisions),
                    backgroundColor: ["#f87171", "#fbbf24", "#4ade80"],
                    borderRadius: 8,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
                    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" }, beginAtZero: true },
                  },
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Note: collision counts are roughly equal across algorithms here because we artificially truncate to {truncateBits} bits.
              The full hashes (128/160/256 bits) are computationally infeasible to collide at random — the lesson is the <em>birthday bound</em>:
              N² / 2·2^bits.
            </p>
          </div>
        </>
      )}
    </Layout>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-secondary/40 rounded-md px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono ${highlight ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
