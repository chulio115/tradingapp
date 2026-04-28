import * as cheerio from "cheerio";

// House Financial Disclosures — official XML from the House Clerk
// This ZIP is updated daily and contains ALL filings for the current year.
// FilingType "P" = Periodic Transaction Report (the ones with stock trades)
const HOUSE_FD_ZIP_URL = "https://disclosures-clerk.house.gov/public_disc/financial-pdfs";
const HOUSE_PTR_BASE = "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs";

export interface CongressFiling {
  politician: string;
  chamber: "house";
  state: string | null;
  filingType: string;
  filingDate: string;
  year: number;
  docId: string;
  pdfUrl: string;
}

/**
 * Fetches the House Clerk Financial Disclosures XML for the given year.
 * Parses the XML and returns Periodic Transaction Reports (FilingType=P).
 */
export async function fetchHouseFilings(year?: number): Promise<CongressFiling[]> {
  const y = year ?? new Date().getFullYear();

  try {
    // Download the ZIP containing XML + TXT
    const zipUrl = `${HOUSE_FD_ZIP_URL}/${y}FD.zip`;
    const res = await fetch(zipUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CongressTracker/1.0)" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`House Clerk ZIP returned ${res.status}`);
      return [];
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // The ZIP contains {year}FD.xml — we need to parse it
    // Since we can't easily unzip in serverless, fetch the XML directly instead
    const xmlUrl = `${HOUSE_FD_ZIP_URL}/${y}FD.xml`;
    const xmlRes = await fetch(xmlUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CongressTracker/1.0)" },
      next: { revalidate: 0 },
    });

    if (!xmlRes.ok) {
      console.warn(`Direct XML fetch failed (${xmlRes.status}), trying to parse ZIP`);
      return parseHouseXmlFromBuffer(buffer, y);
    }

    const xmlText = await xmlRes.text();
    return parseHouseXml(xmlText, y);
  } catch (error) {
    console.error("Failed to fetch House filings:", error);
    return [];
  }
}

function parseHouseXml(xml: string, year: number): CongressFiling[] {
  const $ = cheerio.load(xml, { xml: true });
  const filings: CongressFiling[] = [];

  $("Member").each((_, el) => {
    const filingType = $(el).find("FilingType").text().trim();

    // Only Periodic Transaction Reports have stock trades
    if (filingType !== "P") return;

    const last = $(el).find("Last").text().trim();
    const first = $(el).find("First").text().trim();
    const prefix = $(el).find("Prefix").text().trim();
    const stateDst = $(el).find("StateDst").text().trim();
    const filingDate = $(el).find("FilingDate").text().trim();
    const docId = $(el).find("DocID").text().trim();

    const politician = prefix
      ? `${prefix} ${first} ${last}`
      : `${first} ${last}`;

    // Extract state from StateDst (e.g. "GA12" → "GA")
    const stateMatch = stateDst.match(/^([A-Z]{2})/);
    const state = stateMatch ? stateMatch[1] : null;

    filings.push({
      politician: politician.trim(),
      chamber: "house",
      state,
      filingType,
      filingDate,
      year,
      docId,
      pdfUrl: `${HOUSE_PTR_BASE}/${year}/${docId}.pdf`,
    });
  });

  // Sort by filing date, newest first
  filings.sort((a, b) =>
    new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
  );

  return filings;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseHouseXmlFromBuffer(_buffer: Buffer, _year: number): CongressFiling[] {
  // ZIP parsing would require additional library (jszip)
  // For now, return empty — the direct XML fetch should work
  console.warn("ZIP parsing not implemented, use direct XML endpoint");
  return [];
}
