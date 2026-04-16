interface TelegramResponse {
  ok: boolean;
  description?: string;
}

export async function sendTelegramMessage(
  message: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram credentials not configured, skipping notification");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const data: TelegramResponse = await res.json();

    if (!data.ok) {
      console.error("Telegram API error:", data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

export function formatCongressTradeAlert(trade: {
  politician: string;
  party: string;
  ticker: string;
  transactionType: string;
  amount: string;
  chamber: string;
}): string {
  const emoji = trade.transactionType.toLowerCase().includes("purchase")
    ? "🟢"
    : "🔴";
  const chamberLabel = trade.chamber === "senate" ? "Senate" : "House";

  return (
    `${emoji} <b>Congressional Trade Alert</b>\n\n` +
    `<b>${trade.politician}</b> (${trade.party}) - ${chamberLabel}\n` +
    `${trade.transactionType}: <b>${trade.ticker}</b>\n` +
    `Amount: ${trade.amount}`
  );
}

export function formatMoverAlert(mover: {
  ticker: string;
  companyName: string;
  changePercent: number;
  type: string;
}): string {
  const emoji = mover.type === "gainer" ? "📈" : "📉";
  const direction = mover.type === "gainer" ? "+" : "";

  return (
    `${emoji} <b>Market Mover Alert</b>\n\n` +
    `<b>${mover.ticker}</b> - ${mover.companyName}\n` +
    `Change: ${direction}${mover.changePercent.toFixed(2)}%`
  );
}
