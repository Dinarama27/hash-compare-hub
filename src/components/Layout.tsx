import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/text", label: "Text Hashing" },
  { to: "/files", label: "File Hashing" },
  { to: "/collisions", label: "Collision Lab" },
  { to: "/learn", label: "Learn" },
];

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-mono font-bold text-primary-foreground glow-primary">
              #
            </div>
            <div>
              <div className="font-mono font-bold tracking-tight">HashLab</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Hashing Algorithm Comparator
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                activeProps={{ className: "px-3 py-2 rounded-md text-foreground bg-secondary" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="md:hidden border-t border-border flex overflow-x-auto text-xs">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-4 py-2 whitespace-nowrap text-muted-foreground"
              activeProps={{ className: "px-4 py-2 whitespace-nowrap text-primary border-b-2 border-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10">{children ?? <Outlet />}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        HashLab — Cryptography coursework · MD5 · SHA-1 · SHA-256
      </footer>
    </div>
  );
}
