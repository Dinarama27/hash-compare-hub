import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { HashResultCard } from "@/components/HashResultCard";
import { ALGOS, hashAll, type Algo } from "@/lib/hashing";
import { store } from "@/lib/store";
import { Bar } from "react-chartjs-2";

export const Route = createFileRoute("/text")({
  head: () => ({
    meta: [
      { title: "Text Hashing — HashLab" },
      { name: "description", content: "Hash arbitrary text with MD5, SHA-1 and SHA-256 and compare execution time." },
    ],
  }),
  component: TextPage,
});

function TextPage() {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [results, setResults] = useState<Record<Algo, { hash: string; ms: number }> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    if (text.length === 0) { setError("Please enter some text."); return; }
    if (text.length > 1_000_000) { setError("Text too large (max 1,000,000 characters)."); return; }
    setBusy(true);
    try {
      const r = await hashAll(text);
      setResults(r);
      store.add({
        id: crypto.randomUUID(),
        source: "text",
        label: text.length > 40 ? text.slice(0, 40) + "…" : text,
        size: new Blob([text]).size,
        results: r,
        createdAt: Date.now(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hashing failed");
    } finally {
      setBusy(false);
    }
  }

  const fastest = results ? ALGOS.reduce((a, b) => (results[a].ms < results[b].ms ? a : b)) : null;
  const slowest = results ? ALGOS.reduce((a, b) => (results[a].ms > results[b].ms ? a : b)) : null;

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Text Hashing</h1>
        <p className="text-muted-foreground mt-1">Enter any text — we generate MD5, SHA-1 and SHA-256 in your browser.</p>
      </header>

      <div className="glass-card p-5 space-y-4 mb-8">
        <label className="block text-sm font-medium">Input text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={1_000_000}
          className="w-full bg-input rounded-md p-3 font-mono text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="Type or paste text to hash…"
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground font-mono">
            {text.length.toLocaleString()} chars · {new Blob([text]).size.toLocaleString()} bytes
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setText(""); setResults(null); setError(null); }}
              className="px-4 py-2 rounded-md border border-border text-sm hover:bg-secondary"
            >Clear</button>
            <button
              onClick={run}
              disabled={busy}
              className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium glow-primary disabled:opacity-50"
            >{busy ? "Hashing…" : "Generate hashes"}</button>
          </div>
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>

      {results && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {ALGOS.map((a) => (
              <HashResultCard
                key={a}
                algo={a}
                hash={results[a].hash}
                ms={results[a].ms}
                fastest={a === fastest}
                slowest={a === slowest}
              />
            ))}
          </div>
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Execution time comparison</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: ALGOS,
                  datasets: [{
                    label: "ms",
                    data: ALGOS.map((a) => Number(results[a].ms.toFixed(4))),
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
                    y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
                  },
                }}
              />
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
