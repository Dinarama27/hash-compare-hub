import type { Algo } from "@/lib/hashing";
import { ALGO_META } from "@/lib/hashing";

export function HashResultCard({
  algo,
  hash,
  ms,
  fastest,
  slowest,
}: {
  algo: Algo;
  hash: string;
  ms: number;
  fastest?: boolean;
  slowest?: boolean;
}) {
  const meta = ALGO_META[algo];
  const badgeClass =
    algo === "MD5" ? "algo-md5" : algo === "SHA-1" ? "algo-sha1" : "algo-sha256";
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className={`algo-badge ${badgeClass}`}>{algo}</span>
        <div className="flex gap-2">
          {fastest && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full bg-success/15 text-[oklch(0.85_0.2_145)] border border-success/40">
              Fastest
            </span>
          )}
          {slowest && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full bg-destructive/15 text-destructive border border-destructive/40">
              Slowest
            </span>
          )}
        </div>
      </div>
      <div className="hash-pill">{hash}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Length" value={`${hash.length} hex`} />
        <Stat label="Bits" value={`${meta.bits}`} />
        <Stat label="Time" value={`${ms.toFixed(3)} ms`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded-md px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-foreground">{value}</div>
    </div>
  );
}
