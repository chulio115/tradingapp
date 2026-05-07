# Congress Tracker

Congress Tracker ist ein privates Research- und Signal-Dashboard fuer Congressional Filings, Market Movers, News/Sentiment und Telegram Alerts.

## Vision

Die App soll taeglich nutzbare Finanzsignale liefern:

- aktuelle Gewinner und Verlierer am Markt
- erklaerbare Gruende fuer starke Kursbewegungen
- echte Congressional Transactions aus offiziellen Filings
- Politiker-Performance und Best Moves
- Telegram Alerts und Daily Briefings

Die Roadmap steht in [`ROADMAP.md`](./ROADMAP.md).

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL + Auth + RLS
- Prisma fuer serverseitige Cron-Writes
- Supabase REST fuer API-Reads
- Yahoo Finance als kostenlose Market-Data-Basis
- House Clerk Filings als offizielle Congress-Quelle
- EODHD fuer News/Sentiment
- Telegram Bot fuer Alerts
- Netlify Deployment

## Datenquellen

### Kostenlos / bevorzugt

- House Clerk Financial Disclosure XML/PDF
- Yahoo Finance Chart API
- Yahoo Finance Trending API
- EODHD News/Sentiment Free Tier
- GitHub Actions Cron fuer geplante Jobs

### Prinzip

Kostenpflichtige Datenanbieter werden nur genutzt oder empfohlen, wenn kostenlose Quellen fachlich nicht ausreichen.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

App lokal oeffnen:

```txt
http://localhost:3000
```

## Environment Variables

Die App benoetigt serverseitige Secrets. Keine Secrets im Code committen.

```bash
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EODHD_API_KEY=
CRON_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Optional:

```bash
ANTHROPIC_API_KEY=
```

AI-Funktionen muessen gecached und sparsam genutzt werden.

## Datenpipeline

### Cron Endpoints

- `POST /api/cron/fetch-movers`
- `POST /api/cron/fetch-trades`
- `POST /api/cron/check-alerts`

Alle Cron Endpoints sind mit `x-cron-secret` geschuetzt.

### GitHub Actions Cron

Die kostenlose Cron-Ausfuehrung liegt in `.github/workflows/cron.yml`.

Im GitHub Repository muessen gesetzt sein:

- Repository Secret `CRON_SECRET` = gleicher Wert wie in Netlify
- Repository Variable `APP_BASE_URL` = `https://financemarket.netlify.app`

Der Workflow kann auch manuell ueber `workflow_dispatch` gestartet werden.

### Architektur

- Prisma schreibt serverseitig direkt in Supabase PostgreSQL
- Supabase REST liest Daten fuer API Routes
- RLS ist aktiviert; anon/authenticated Rollen duerfen aktuell nur lesen
- Mutationen laufen nicht direkt aus dem Browser

## Deployment

Production:

```txt
https://financemarket.netlify.app
```

Build testen:

```bash
npm run build
```

Deploy erfolgt ueber Netlify.

## Roadmap Kurzfassung

1. Datenfrische stabilisieren
2. Market Mover Insights bauen
3. Echte Congressional Transactions aus PDFs extrahieren
4. Politician Performance und Best Moves entwickeln
5. Daily Briefing und Telegram Digest bauen

Details: [`ROADMAP.md`](./ROADMAP.md)
