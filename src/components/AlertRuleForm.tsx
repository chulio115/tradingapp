"use client";

import { useState } from "react";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { AlertRule } from "@/types";

interface AlertRuleFormProps {
  rules: AlertRule[];
  onRulesChange: (rules: AlertRule[]) => void;
}

export default function AlertRuleForm({
  rules,
  onRulesChange,
}: AlertRuleFormProps) {
  const [creating, setCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    type: "congress_trade" as AlertRule["type"],
    channel: "telegram" as AlertRule["channel"],
    minAmount: "",
    transactionType: "",
    politicians: "",
    tickers: "",
    minChangePercent: "",
    direction: "both" as "up" | "down" | "both",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      let conditions: Record<string, unknown> = {};

      if (newRule.type === "congress_trade") {
        conditions = {
          ...(newRule.minAmount && { minAmount: newRule.minAmount }),
          ...(newRule.transactionType && {
            transactionType: newRule.transactionType,
          }),
          ...(newRule.politicians && {
            politicians: newRule.politicians
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean),
          }),
        };
      } else if (newRule.type === "market_mover") {
        conditions = {
          ...(newRule.minChangePercent && {
            minChangePercent: parseFloat(newRule.minChangePercent),
          }),
          direction: newRule.direction,
        };
      } else if (newRule.type === "ticker_watch") {
        conditions = {
          tickers: newRule.tickers
            .split(",")
            .map((t) => t.trim().toUpperCase())
            .filter(Boolean),
        };
      }

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRule.name,
          type: newRule.type,
          channel: newRule.channel,
          conditions: JSON.stringify(conditions),
        }),
      });

      if (!res.ok) throw new Error("Failed to create alert");
      const created = await res.json();
      onRulesChange([created, ...rules]);
      setCreating(false);
      setNewRule({
        name: "",
        type: "congress_trade",
        channel: "telegram",
        minAmount: "",
        transactionType: "",
        politicians: "",
        tickers: "",
        minChangePercent: "",
        direction: "both",
      });
    } catch (error) {
      console.error("Failed to create alert:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/alerts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      if (!res.ok) throw new Error("Failed to toggle alert");
      onRulesChange(
        rules.map((r) => (r.id === id ? { ...r, active } : r))
      );
    } catch (error) {
      console.error("Failed to toggle alert:", error);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete alert");
      onRulesChange(rules.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const typeLabels: Record<string, string> = {
    congress_trade: "Congress Trade",
    market_mover: "Market Mover",
    ticker_watch: "Ticker Watch",
  };

  return (
    <div className="space-y-4">
      {/* Existing Rules */}
      {rules.map((rule) => (
        <Card key={rule.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {rule.active ? (
                  <Bell className="h-4 w-4 text-emerald-500" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[rule.type] ?? rule.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rule.channel}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.active}
                  onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRule(rule.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Create New Rule */}
      {creating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Neue Alert-Regel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newRule.name}
                onChange={(e) =>
                  setNewRule({ ...newRule, name: e.target.value })
                }
                placeholder="z.B. Pelosi Trades"
              />
            </div>
            <div>
              <Label>Typ</Label>
              <div className="flex gap-2 mt-1">
                {(["congress_trade", "market_mover", "ticker_watch"] as const).map(
                  (type) => (
                    <Button
                      key={type}
                      variant={newRule.type === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewRule({ ...newRule, type })}
                    >
                      {typeLabels[type]}
                    </Button>
                  )
                )}
              </div>
            </div>

            {newRule.type === "congress_trade" && (
              <>
                <div>
                  <Label htmlFor="minAmount">Minimum Amount</Label>
                  <Input
                    id="minAmount"
                    value={newRule.minAmount}
                    onChange={(e) =>
                      setNewRule({ ...newRule, minAmount: e.target.value })
                    }
                    placeholder="z.B. $100,001 - $250,000"
                  />
                </div>
                <div>
                  <Label htmlFor="politicians">Politiker (kommagetrennt)</Label>
                  <Input
                    id="politicians"
                    value={newRule.politicians}
                    onChange={(e) =>
                      setNewRule({ ...newRule, politicians: e.target.value })
                    }
                    placeholder="z.B. Nancy Pelosi, Dan Crenshaw"
                  />
                </div>
              </>
            )}

            {newRule.type === "market_mover" && (
              <>
                <div>
                  <Label htmlFor="minChange">Min. Veraenderung (%)</Label>
                  <Input
                    id="minChange"
                    type="number"
                    value={newRule.minChangePercent}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        minChangePercent: e.target.value,
                      })
                    }
                    placeholder="z.B. 15"
                  />
                </div>
                <div>
                  <Label>Richtung</Label>
                  <div className="flex gap-2 mt-1">
                    {(["both", "up", "down"] as const).map((dir) => (
                      <Button
                        key={dir}
                        variant={
                          newRule.direction === dir ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setNewRule({ ...newRule, direction: dir })
                        }
                      >
                        {dir === "both"
                          ? "Beide"
                          : dir === "up"
                            ? "Nur Gainer"
                            : "Nur Loser"}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {newRule.type === "ticker_watch" && (
              <div>
                <Label htmlFor="tickers">Ticker (kommagetrennt)</Label>
                <Input
                  id="tickers"
                  value={newRule.tickers}
                  onChange={(e) =>
                    setNewRule({ ...newRule, tickers: e.target.value })
                  }
                  placeholder="z.B. AAPL, MSFT, NVDA"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!newRule.name || saving}>
                {saving ? "Speichern..." : "Erstellen"}
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setCreating(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Neue Alert-Regel
        </Button>
      )}
    </div>
  );
}
