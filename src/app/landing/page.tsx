"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Landmark,
  TrendingUp,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Lock,
  Database,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@supabase/supabase-js";

interface TickerItem {
  ticker: string;
  changePercent: number;
  type: "gainer" | "loser";
}

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [stats, setStats] = useState({ trades: 0, movers: 0 });

  // Fetch live data for the ticker
  useEffect(() => {
    async function loadData() {
      try {
        const [gainersRes, losersRes, tradesRes] = await Promise.all([
          fetch("/api/movers?type=gainer"),
          fetch("/api/movers?type=loser"),
          fetch("/api/trades?limit=1"),
        ]);
        const gainers = await gainersRes.json();
        const losers = await losersRes.json();
        const trades = await tradesRes.json();

        const tickerItems: TickerItem[] = [
          ...(gainers.movers ?? []).slice(0, 5).map((m: { ticker: string; changePercent: number }) => ({
            ticker: m.ticker,
            changePercent: m.changePercent,
            type: "gainer" as const,
          })),
          ...(losers.movers ?? []).slice(0, 5).map((m: { ticker: string; changePercent: number }) => ({
            ticker: m.ticker,
            changePercent: m.changePercent,
            type: "loser" as const,
          })),
        ];
        setTicker(tickerItems);
        setStats({
          trades: trades.total ?? 0,
          movers: (gainers.movers?.length ?? 0) + (losers.movers?.length ?? 0),
        });
      } catch {
        // silent fail — ticker is decorative
      }
    }
    loadData();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
      );

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentifizierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
        <div
          className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[120px] animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Live Ticker Bar */}
      {ticker.length > 0 && (
        <div className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap py-2.5">
            {[...ticker, ...ticker].map((item, i) => (
              <div key={i} className="mx-6 flex items-center gap-2 text-sm">
                <span className="font-mono font-semibold text-neutral-300">{item.ticker}</span>
                <span
                  className={`flex items-center gap-0.5 font-mono ${
                    item.type === "gainer" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {item.type === "gainer" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {item.changePercent.toFixed(2)}%
                </span>
                <span className="text-neutral-700">·</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-8 pb-24">
        {/* Nav */}
        <nav className="mb-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Congress Tracker" className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">Congress Tracker</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </div>
        </nav>

        {/* Hero */}
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Left: Headline */}
          <div className="space-y-8 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-400">
              <Sparkles className="h-3 w-3" />
              Real-time congressional disclosures
            </div>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Track what
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Congress buys.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-neutral-400">
              Echtzeit-Einblicke in die Finanztransaktionen von US-Politikern. Plus
              Market Movers, KI-gestützte Analysen und Telegram-Alerts — alles in
              einem Dashboard.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 pt-2">
              <div>
                <div className="text-3xl font-semibold tabular-nums">
                  {stats.trades > 0 ? stats.trades.toLocaleString() : "—"}
                </div>
                <div className="text-sm text-neutral-500">Filings tracked</div>
              </div>
              <div className="h-12 w-px self-center bg-white/10" />
              <div>
                <div className="text-3xl font-semibold tabular-nums">
                  {stats.movers > 0 ? stats.movers : "—"}
                </div>
                <div className="text-sm text-neutral-500">Live movers</div>
              </div>
              <div className="h-12 w-px self-center bg-white/10" />
              <div>
                <div className="text-3xl font-semibold tabular-nums">5m</div>
                <div className="text-sm text-neutral-500">Update cycle</div>
              </div>
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/40 via-cyan-500/20 to-transparent opacity-50 blur-xl" />

              <div className="relative rounded-2xl border border-white/10 bg-neutral-900/60 p-8 backdrop-blur-xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {isLogin ? "Willkommen zurück" : "Account erstellen"}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    {isLogin
                      ? "Logge dich ein um auf dein Dashboard zuzugreifen"
                      : "Erstelle deinen kostenlosen Account in Sekunden"}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-neutral-300">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="deine@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-medium text-neutral-300">
                      Passwort
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="group relative h-11 w-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          {isLogin ? "Einloggen" : "Account erstellen"}
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </span>
                  </Button>
                </form>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-neutral-600">oder</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="mt-4 w-full text-center text-sm text-neutral-400 transition-colors hover:text-emerald-400"
                >
                  {isLogin ? "Noch kein Account? Registrieren" : "Bereits Account? Einloggen"}
                </button>

                <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-600">
                  <Lock className="h-3 w-3" />
                  Verschlüsselt mit Supabase Auth
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bento Grid */}
        <div className="mt-32">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Alles was du brauchst.
              <span className="text-neutral-500"> Nichts was du nicht brauchst.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
            {/* Large feature: Filings */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 p-8 backdrop-blur-sm transition-all hover:border-emerald-500/30 md:col-span-3 md:row-span-2">
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <Landmark className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Official PTR Filings
                </h3>
                <p className="mt-3 text-neutral-400">
                  Direkter Zugriff auf alle Periodic Transaction Reports vom House Clerk.
                  Keine Mittelsmänner, keine veralteten Daten.
                </p>
                <div className="mt-auto flex items-center gap-2 pt-8 text-sm text-emerald-400">
                  <Database className="h-4 w-4" />
                  <span className="font-mono">disclosures-clerk.house.gov</span>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20" />
            </div>

            {/* Market Movers */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30 md:col-span-3">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">Live Market Movers</h3>
              <p className="mt-1.5 text-sm text-neutral-400">
                Top Gainers und Losers in Echtzeit, alle 5 Minuten aktualisiert.
              </p>
            </div>

            {/* Telegram Alerts */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 p-6 backdrop-blur-sm transition-all hover:border-violet-500/30 md:col-span-3">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20">
                <Bell className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold">Smart Alerts</h3>
              <p className="mt-1.5 text-sm text-neutral-400">
                Custom Regeln + Telegram Notifications. Verpasse nichts Wichtiges.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="mt-24 rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-2 text-neutral-400">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Daten von Yahoo Finance · House Clerk · EODHD</span>
            </div>
            <div className="flex items-center gap-6 text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                RLS-protected
              </span>
              <span>·</span>
              <span>No tracking</span>
              <span>·</span>
              <span>Open data</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center gap-4 border-t border-white/5 pt-8 text-center md:flex-row md:justify-between">
          <p className="text-xs text-neutral-600">
            © 2026 Congress Tracker · For informational purposes only · No financial advice
          </p>
          <a
            href="https://adaptifylabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-emerald-400"
          >
            <span>Built by</span>
            <span className="font-semibold text-neutral-300 transition-colors group-hover:text-emerald-400">
              Adaptify Labs
            </span>
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </footer>
      </div>
    </div>
  );
}
