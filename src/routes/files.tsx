import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { HashResultCard } from "@/components/HashResultCard";
import { ALGOS, hashAllBuffer, type Algo } from "@/lib/hashing";
import { store } from "@/lib/store";
import { Bar } from "react-chartjs-2";

const ALLOWED = [".txt", ".pdf", ".docx", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "File Hashing — HashLab" },
      { name: "description", content: "Upload a file and instantly hash it with MD5, SHA-1 and SHA-256 to verify integrity." },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Record<Algo, { hash: string; ms: number }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pick(f: File | null) {
    setError(null);
    setResults(null);
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError(`File type ${ext} not allowed. Allowed: ${ALLOWED.join(", ")}`);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB.`);
      return;
    }
    setFile(f);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const r = await hashAllBuffer(buf);
      setResults(r);
      store.add({
        id: crypto.randomUUID(),
        source: "file",
        label: file.name,
        size: file.size,
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
        <h1 className="text-3xl font-bold">File Hashing</h1>
        <p className="text-muted-foreground mt-1">Upload .txt, .pdf, .docx, .jpg or .png up to 25 MB.</p>
      </header>

      <div
        className="glass-card p-8 mb-8 text-center cursor-pointer border-dashed hover:border-primary/60 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0] ?? null); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        <div className="text-5xl mb-3">📄</div>
        <div className="font-medium">Click or drop a file here</div>
        <div className="text-xs text-muted-foreground mt-1">Max 25 MB · {ALLOWED.join(" · ")}</div>
      </div>

      {error && <div className="text-sm text-destructive mb-4">{error}</div>}

      {file && (
        <div className="glass-card p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-sm">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
            </div>
          </div>
          <button
            onClick={run}
            disabled={busy}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium glow-primary disabled:opacity-50"
          >{busy ? "Hashing…" : "Compute hashes"}</button>
        </div>
      )}

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
            <h3 className="font-semibold mb-4">Execution time (ms)</h3>
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
