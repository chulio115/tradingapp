import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { fetchHouseFilings } from "../src/lib/congress-scraper";

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key);
}

async function main() {
  const supabase = createSupabaseClient();
  const filings = await fetchHouseFilings();

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const filing of filings) {
    try {
      const { data: existing } = await supabase
        .from("CongressTrade")
        .select("id")
        .eq("politician", filing.politician)
        .eq("ticker", `PTR-${filing.docId}`)
        .eq("transactionDate", new Date(filing.filingDate).toISOString())
        .eq("transactionType", "Periodic Transaction Report")
        .single();

      const record = {
        id: randomUUID(),
        chamber: filing.chamber,
        politician: filing.politician,
        party: "Unknown",
        state: filing.state,
        ticker: `PTR-${filing.docId}`,
        companyName: `Filing ${filing.docId}`,
        transactionType: "Periodic Transaction Report",
        amount: "See PDF",
        transactionDate: new Date(filing.filingDate).toISOString(),
        filingDate: new Date(filing.filingDate).toISOString(),
        assetType: filing.pdfUrl,
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from("CongressTrade")
          .update(record)
          .eq("id", existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("CongressTrade")
          .insert(record);
        error = insertError;
      }

      if (error) throw error;
      inserted++;
    } catch (error) {
      skipped++;
      errors.push(`${filing.docId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(JSON.stringify({ success: true, inserted, skipped, total: filings.length, errors: errors.slice(0, 10) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
