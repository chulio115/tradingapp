"use client";

import { useState } from "react";
import { Landmark, TrendingUp, Bell, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Integrate Supabase Auth
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/app";
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Congress Tracker" className="h-8 w-8" />
            <span className="text-2xl font-bold text-white">Congress Tracker</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Congressional Trades &
                <span className="text-emerald-500"> Market Movers</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-xl">
                Verfolge die Finanztransaktionen von US-Politikern und bleibe über
                die wichtigsten Marktveränderungen informiert – in Echtzeit.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-3 gap-6 pt-8">
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
                  <Landmark className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-white">Official Data</h3>
                <p className="text-sm text-slate-400">House Clerk PTR Filings</p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-white">Market Movers</h3>
                <p className="text-sm text-slate-400">Yahoo Finance Trending</p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
                  <Bell className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-white">Alerts</h3>
                <p className="text-sm text-slate-400">Telegram Notifications</p>
              </div>
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl text-white text-center">
                  {isLogin ? "Willkommen zurück" : "Account erstellen"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="deine@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Lädt..." : isLogin ? "Einloggen" : "Registrieren"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-emerald-500 hover:text-emerald-400"
                  >
                    {isLogin ? "Noch kein Account? Registrieren" : "Bereits Account? Einloggen"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800/50 w-fit">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">Offizielle Daten</h3>
            <p className="text-slate-400">
              Alle Congressional Trades stammen vom offiziellen House Clerk –
              keine Daten von Drittanbietern.
            </p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800/50 w-fit">
              <Zap className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">Echtzeit-Alerts</h3>
            <p className="text-slate-400">
              Erhalte sofortige Benachrichtigungen über Telegram wenn neue
              Trades deine Kriterien erfüllen.
            </p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800/50 w-fit">
              <Globe className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">Kostenlos</h3>
            <p className="text-slate-400">
              Alle Datenquellen sind kostenlos – keine API-Keys, keine
              Bezahlschranken.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
          <p>
            Data: Yahoo Finance + House Clerk · No financial advice · For informational purposes only
          </p>
        </footer>
      </div>
    </div>
  );
}
