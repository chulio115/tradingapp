"use client";

import { useState, useEffect } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AlertRuleForm from "@/components/AlertRuleForm";
import type { AlertRule } from "@/types";

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Benachrichtigungen bei signifikanten Trades & Bewegungen
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRules}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Alerts werden per Telegram gesendet. Stelle sicher, dass{" "}
          <code className="bg-muted px-1 rounded">TELEGRAM_BOT_TOKEN</code> und{" "}
          <code className="bg-muted px-1 rounded">TELEGRAM_CHAT_ID</code>{" "}
          konfiguriert sind.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <AlertRuleForm rules={rules} onRulesChange={setRules} />
      )}
    </div>
  );
}
