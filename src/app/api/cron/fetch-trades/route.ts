import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fetchHouseFilings } from "@/lib/congress-scraper";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filings = await fetchHouseFilings();

    let inserted = 0;
    let skipped = 0;

    for (const filing of filings) {
      try {
        // Store as a CongressTrade with filing metadata
        // Since the XML only has filing info (not individual transactions),
        // we store one record per filing with a link to the PDF
        await prisma.congressTrade.upsert({
          where: {
            politician_ticker_transactionDate_transactionType: {
              politician: filing.politician,
              ticker: `PTR-${filing.docId}`,
              transactionDate: new Date(filing.filingDate),
              transactionType: "Periodic Transaction Report",
            },
          },
          update: {},
          create: {
            chamber: filing.chamber,
            politician: filing.politician,
            party: "Unknown",
            state: filing.state,
            ticker: `PTR-${filing.docId}`,
            companyName: `Filing ${filing.docId}`,
            transactionType: "Periodic Transaction Report",
            amount: "See PDF",
            transactionDate: new Date(filing.filingDate),
            filingDate: new Date(filing.filingDate),
            assetType: filing.pdfUrl,
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      inserted,
      skipped,
      total: filings.length,
    });
  } catch (error) {
    console.error("Cron fetch-trades failed:", error);
    return Response.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}
