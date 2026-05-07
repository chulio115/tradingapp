import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { getTrendingStocks, type YahooMover } from "../src/lib/yahoo";

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key);
}

async function main() {
  const supabase = createSupabaseClient();
  const movers = await getTrendingStocks();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  const validMovers = movers.filter((m) => {
    const valid =
      m.symbol &&
      m.name &&
      Number.isFinite(m.price) &&
      Number.isFinite(m.change) &&
      Number.isFinite(m.changePercent);

    if (!valid) {
      skipped++;
      errors.push(`Invalid mover data for ${m.symbol || "unknown"}`);
    }

    return valid;
  });

  const gainers = validMovers
    .filter((m) => m.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent);
  const losers = validMovers
    .filter((m) => m.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent);

  async function upsertMover(mover: YahooMover, type: "gainer" | "loser") {
    try {
      const { data: existing } = await supabase
        .from("MarketMover")
        .select("id")
        .eq("date", today.toISOString())
        .eq("ticker", mover.symbol)
        .eq("type", type)
        .single();

      const record = {
        id: randomUUID(),
        date: today.toISOString(),
        ticker: mover.symbol,
        companyName: mover.name,
        price: mover.price,
        change: mover.change,
        changePercent: mover.changePercent,
        volume: Number.isFinite(mover.volume) ? Math.trunc(mover.volume) : null,
        type,
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from("MarketMover")
          .update(record)
          .eq("id", existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("MarketMover")
          .insert(record);
        error = insertError;
      }

      if (error) throw error;
      inserted++;
    } catch (error) {
      skipped++;
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      errors.push(`${mover.symbol} (${type}): ${errorMsg}`);
    }
  }

  for (const mover of gainers.slice(0, 10)) await upsertMover(mover, "gainer");
  for (const mover of losers.slice(0, 10)) await upsertMover(mover, "loser");

  const result = {
    success: true,
    inserted,
    skipped,
    gainersCount: gainers.length,
    losersCount: losers.length,
    errors: errors.slice(0, 10),
  };
  console.log(JSON.stringify(result, null, 2));

  if (inserted === 0 && errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
