import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — HashLab" },
      { name: "description", content: "Educational guide to cryptographic hash functions MD5, SHA-1 and SHA-256: how they work, their strengths and known weaknesses." },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <Layout>
      <article className="prose prose-invert max-w-3xl mx-auto">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-mono mb-2">Education</div>
          <h1 className="text-4xl font-bold tracking-tight">Hashing 101 — MD5, SHA-1 & SHA-256</h1>
          <p className="text-muted-foreground mt-3">
            Everything you need to know to discuss hashing algorithms confidently in your cryptography exam.
          </p>
        </header>

        <Section title="What is hashing?">
          <p>
            A <strong>cryptographic hash function</strong> is a deterministic algorithm that maps an input of arbitrary length
            to a fixed-size output called a <em>digest</em>. Good hash functions are:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong>Deterministic</strong> — the same input always produces the same hash.</li>
            <li><strong>Pre-image resistant</strong> — given a hash, you can't recover the input.</li>
            <li><strong>Second pre-image resistant</strong> — given one input, you can't find another with the same hash.</li>
            <li><strong>Collision resistant</strong> — you can't find <em>any</em> two distinct inputs with the same hash.</li>
            <li><strong>Avalanche</strong> — a tiny change in input flips ~50% of output bits.</li>
          </ul>
        </Section>

        <Section title="MD5 (Message-Digest 5)">
          <p>Designed by Ron Rivest in 1991. Produces a 128-bit (32-hex) digest using 64 rounds over 512-bit blocks.</p>
          <Pros>
            <li>Very fast, tiny code, available everywhere.</li>
            <li>Still acceptable for non-security uses (file deduplication, ETags, checksums against accidental corruption).</li>
          </Pros>
          <Cons>
            <li><strong>Broken</strong>. Wang et al. (2004) demonstrated practical collisions in seconds.</li>
            <li>Used to forge a rogue Certificate Authority in 2008 (Sotirov et al.).</li>
            <li>Must never be used for digital signatures, password storage, or any integrity check against an active attacker.</li>
          </Cons>
        </Section>

        <Section title="SHA-1 (Secure Hash Algorithm 1)">
          <p>Published by NSA/NIST in 1995. Produces a 160-bit (40-hex) digest, similar Merkle–Damgård structure to MD5 but with 80 rounds.</p>
          <Pros>
            <li>Faster than SHA-256, hardware support widely available.</li>
            <li>Still used for Git object IDs (which are not security-critical) and HMAC-SHA1 in some legacy protocols.</li>
          </Pros>
          <Cons>
            <li><strong>Broken</strong>. The <em>SHAttered</em> attack (2017) produced two PDF files with the same SHA-1.</li>
            <li>Chosen-prefix collisions practical since 2020 for ~$45k of cloud compute.</li>
            <li>Deprecated by NIST (2011), browsers, and TLS since 2017.</li>
          </Cons>
        </Section>

        <Section title="SHA-256 (SHA-2 family)">
          <p>Part of the SHA-2 family (NIST, 2001). Produces a 256-bit (64-hex) digest with 64 rounds over 512-bit blocks. Different internal structure to SHA-1 — not vulnerable to the same attacks.</p>
          <Pros>
            <li><strong>No known practical collisions</strong> after 20+ years of cryptanalysis.</li>
            <li>Industry standard: TLS certificates, Bitcoin/blockchain, code signing, JWTs (HS256/RS256), file integrity.</li>
            <li>Hardware-accelerated (Intel SHA-NI, ARMv8 crypto extensions) — gap with SHA-1 has narrowed.</li>
          </Pros>
          <Cons>
            <li>Slower than MD5/SHA-1 in pure software.</li>
            <li>Larger digest size (64 hex chars) — not always convenient for human display.</li>
            <li>Not suitable as a <em>password</em> hash by itself — use Argon2, scrypt or bcrypt instead.</li>
          </Cons>
        </Section>

        <Section title="Why MD5 and SHA-1 are considered insecure today">
          <p>
            Both were designed when collision attacks weren't considered feasible. Cryptanalysis advanced faster than expected,
            exploiting flaws in their compression functions. Today, attackers can craft two different documents (PDFs, certificates, executables)
            with the <em>same</em> MD5 or SHA-1 hash, allowing them to swap content after a signature is produced.
          </p>
          <p>
            Modern guidance (NIST SP 800-131A) bans MD5 and SHA-1 from all cryptographic uses. They remain acceptable
            only as <em>non-cryptographic</em> checksums.
          </p>
        </Section>

        <Section title="Why SHA-256 is still trusted in 2026">
          <p>
            SHA-256 uses a different design (SHA-2 family) with twice the digest size, a more complex message schedule
            and round function, and no known structural weaknesses. Even with the speedup from quantum computers
            (Grover's algorithm halves the effective bit-strength), SHA-256 still offers ~128-bit security — equivalent
            to AES-128 — which is comfortable for current threat models. SHA-3 (Keccak) and BLAKE3 are newer alternatives but
            SHA-256 remains the default for interoperability.
          </p>
        </Section>

        <Section title="Quick reference table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono border border-border rounded-md">
              <thead className="bg-secondary/60 text-left">
                <tr><th className="p-3">Algorithm</th><th>Output</th><th>Year</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr className="border-t border-border"><td className="p-3">MD5</td><td>128 bit / 32 hex</td><td>1991</td><td className="text-destructive">Broken</td></tr>
                <tr className="border-t border-border"><td className="p-3">SHA-1</td><td>160 bit / 40 hex</td><td>1995</td><td className="text-warning">Broken</td></tr>
                <tr className="border-t border-border"><td className="p-3">SHA-256</td><td>256 bit / 64 hex</td><td>2001</td><td className="text-[oklch(0.85_0.2_145)]">Secure</td></tr>
              </tbody>
            </table>
          </div>
        </Section>
      </article>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card p-6 mb-6">
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
function Pros({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[oklch(0.85_0.2_145)] mt-3 mb-1">Advantages</div>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">{children}</ul>
    </div>
  );
}
function Cons({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-destructive mt-3 mb-1">Weaknesses</div>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">{children}</ul>
    </div>
  );
}
