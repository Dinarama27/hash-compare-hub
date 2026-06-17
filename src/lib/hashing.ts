import SparkMD5 from "spark-md5";

export type Algo = "MD5" | "SHA-1" | "SHA-256";
export const ALGOS: Algo[] = ["MD5", "SHA-1", "SHA-256"];

export const ALGO_META: Record<Algo, { bits: number; hexLen: number; security: number; color: string }> = {
  MD5: { bits: 128, hexLen: 32, security: 1, color: "#f87171" },
  "SHA-1": { bits: 160, hexLen: 40, security: 3, color: "#fbbf24" },
  "SHA-256": { bits: 256, hexLen: 64, security: 9, color: "#4ade80" },
};

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

export async function hashString(algo: Algo, text: string): Promise<{ hash: string; ms: number }> {
  const data = new TextEncoder().encode(text);
  const t0 = performance.now();
  let hash: string;
  if (algo === "MD5") {
    hash = SparkMD5.ArrayBuffer.hash(data.buffer as ArrayBuffer);
  } else {
    const digest = await crypto.subtle.digest(algo, data);
    hash = bufToHex(digest);
  }
  const ms = performance.now() - t0;
  return { hash, ms };
}

export async function hashBuffer(algo: Algo, buf: ArrayBuffer): Promise<{ hash: string; ms: number }> {
  const t0 = performance.now();
  let hash: string;
  if (algo === "MD5") {
    hash = SparkMD5.ArrayBuffer.hash(buf);
  } else {
    const digest = await crypto.subtle.digest(algo, buf);
    hash = bufToHex(digest);
  }
  const ms = performance.now() - t0;
  return { hash, ms };
}

export async function hashAll(text: string) {
  const entries = await Promise.all(
    ALGOS.map(async (a) => [a, await hashString(a, text)] as const)
  );
  return Object.fromEntries(entries) as Record<Algo, { hash: string; ms: number }>;
}

export async function hashAllBuffer(buf: ArrayBuffer) {
  const entries = await Promise.all(
    ALGOS.map(async (a) => [a, await hashBuffer(a, buf)] as const)
  );
  return Object.fromEntries(entries) as Record<Algo, { hash: string; ms: number }>;
}
