# Congress Tracker Roadmap

## Product Vision

Congress Tracker soll kein statisches Tabellen-Dashboard sein, sondern ein taeglich nutzbares Research- und Signal-Tool fuer:

- aktuelle Market Movers mit nachvollziehbaren Gruenden
- echte Congressional Transactions aus offiziellen Filings
- Politiker-Performance und auffaellige Best Moves
- Alerts und Daily Briefings fuer relevante Signale

Alle Umsetzungen priorisieren kostenlose, offizielle oder frei zugaengliche Datenquellen. Kostenpflichtige Anbieter werden nur vorgeschlagen, wenn die kostenlose Alternative fachlich deutlich schlechter ist.

## Current State

### Implemented

- Next.js App Router Dashboard mit Auth
- Supabase PostgreSQL + RLS
- Prisma fuer Cron Writes
- Supabase REST fuer Reads
- House Clerk Filing-Metadaten Import
- Yahoo Finance Quotes, historische Preise und Trending Symbols
- EODHD News/Sentiment Integration
- Telegram Alerts
- PWA/Landing Page

### Key Gaps

- Keine automatische Cron-Ausfuehrung in der Deployment-Konfiguration
- Market Movers API zeigt ohne Datum alte Top-Werte aus der DB
- Congressional Daten enthalten aktuell nur Filing/PDF-Metadaten, keine echten Transaktionen
- Market Movers erklaeren nicht prominent, warum eine Aktie steigt/faellt
- Keine Politiker-Performance, keine Best-Moves-Auswertung
- Keine taegliche Research-Zusammenfassung

## Free Data Strategy

### Market Data

1. Yahoo Finance Chart API fuer Quotes und Historical Prices
2. Yahoo Finance Trending als kostenlose Basis
3. Optional zusaetzliche kostenlose Scrapes als Fallback:
   - Nasdaq most active/gainers/losers Seiten
   - StockAnalysis market movers Seiten
   - MarketWatch movers Seiten

### News and Reasons

1. EODHD News/Sentiment, solange free quota reicht
2. Yahoo/finance article endpoints nur falls stabil nutzbar
3. SEC/issuer press releases als spaeterer kostenloser Zusatz
4. AI-Zusammenfassung nur gecached und optional, damit keine laufenden Kosten entstehen

### Free Signal Scoring

Market-Mover Signale werden zunaechst regelbasiert und kostenlos bewertet:

- Tagesveraenderung in Prozent
- Volume Spike gegen 30-Tage-Durchschnitt
- News-Katalysatoren aus Titel/Summary
- Sentiment-Staerke
- Risiko-Keywords wie Offering, Dilution, Delisting, Bankruptcy
- Preis-/Volatilitaetsrisiko bei sehr guenstigen Aktien

Signal-Kategorien:

- `Watchlist Signal`: Katalysator + Momentum + ausreichend Score
- `Nur mit Vorsicht`: starke Bewegung, aber Risiko oder unklarer Katalysator
- `Wahrscheinlich Noise`: keine klare Story, wenig Volumen-/News-Kontext

### Congress Data

1. House Clerk XML/PDF als offizielle Quelle
2. PDF-Text-Extraktion lokal/serverseitig mit kostenlosen Libraries
3. Manuelle Fallback-Regeln fuer problematische PDF-Layouts
4. Senate eFD Quelle spaeter als Erweiterung

### Congress Large Buy Definition

Bis echte PDF-Transaktionen extrahiert sind, koennen nur Filing-Metadaten angezeigt werden. Nach Phase 3 gelten als relevante/groessere Kaeufe:

- Transaction Type enthaelt Purchase/Buy
- Amount Range ab `$50,001 - $100,000` oder hoeher
- Mehrere Kaeufe desselben Tickers innerhalb kurzer Zeit
- Kauf in Sektoren mit aktuellen Market-Mover/News-Katalysatoren
- Politiker mit positiver historischer 30/90/180-Tage Performance

## Phase 1 — Data Freshness Foundation

Goal: Die App zeigt keine alten Werte mehr als aktuelle Daten.

### Tasks

- [ ] GitHub Actions Cron fuer kostenlose geplante Ausfuehrung einrichten
- [ ] Cron ruft geschuetzte Endpoints mit `CRON_SECRET` auf
- [ ] Market Movers mehrmals taeglich aktualisieren
- [ ] Congress Filings taeglich aktualisieren
- [ ] Alerts regelmaessig pruefen
- [ ] `/api/movers` defaultet auf den neuesten vorhandenen Handelstag
- [ ] API Response erweitert um `asOf`, `latestAvailableDate`, `isStale`
- [ ] Movers UI zeigt Datenstand und Stale-Warnung
- [ ] Optionaler Admin Refresh Button triggert serverseitig `fetch-movers`

### Acceptance Criteria

- Keine alten Extremwerte erscheinen als aktuelle Movers, wenn neuere Daten vorhanden sind
- UI zeigt klar den Datenstand
- Cron laeuft automatisch ohne bezahlte Dienste
- Manuelle Refreshs sind nachvollziehbar und sicher

## Phase 2 — Market Mover Intelligence

Goal: Bei jedem grossen Gewinner/Verlierer sieht man direkt, warum er sich bewegt.

### Tasks

- [ ] Research-Endpoint um `moverInsight` erweitern
- [ ] News und Sentiment fuer Top Movers cachen
- [ ] Detail Drawer/Card fuer Movers modernisieren
- [ ] Top News, Chart, Sentiment, Volume und Kurzfazit anzeigen
- [ ] Heuristische Gratis-Reason Engine bauen:
  - Earnings
  - FDA/clinical trial
  - analyst upgrade/downgrade
  - offering/dilution
  - merger/acquisition
  - crypto/commodity correlation
  - no clear catalyst
- [ ] Optional AI-Fazit nur gecached und nur bei Bedarf generieren
- [x] Erste kostenlose Signalbox mit Score, Katalysatoren, Risiko-Flags und Handlungshinweis

### Acceptance Criteria

- Klick auf Mover beantwortet: Warum steigt/faellt diese Aktie heute?
- Keine unnötigen API-Kosten durch unkontrollierte AI Calls
- Fallback funktioniert ohne AI-Key

## Phase 3 — Real Congressional Transaction Extraction

Goal: Aus PDF-Filings echte einzelne Trades extrahieren.

### Tasks

- [ ] Datenmodell trennen: `CongressFiling` und `CongressTransaction`
- [ ] Migration fuer neue Tabellen erstellen
- [ ] PDF Download + Text Extraction implementieren
- [ ] Parser fuer House PTR Tabellen bauen
- [ ] Ticker/Asset Name normalisieren
- [ ] Transaction Type, Amount Range, Owner, Date extrahieren
- [ ] PDF-Parsing Fehler speichern und sichtbar machen
- [ ] Import idempotent machen

### Acceptance Criteria

- App zeigt echte Ticker/Buy/Sell/Amounts statt `PTR-*` und `See PDF`
- PDF Link bleibt als Quelle erhalten
- Fehlerhafte PDFs brechen den Cron nicht ab

## Phase 4 — Congress Best Moves and Politician Scoring

Goal: Aus Congressional Transactions echte Signale ableiten.

### Tasks

- [ ] Performance nach 7/30/90/180 Tagen berechnen
- [ ] Politician Profile Page bauen
- [ ] Best Moves Leaderboard bauen
- [ ] Signal Score entwickeln:
  - historische Win Rate
  - Amount Range
  - Trade Recency
  - Sector Cluster
  - Repeat Buys/Sells
  - Post-trade Performance
- [ ] Watchlist fuer Politiker und Ticker
- [ ] Telegram Alerts fuer High Signal Trades

### Acceptance Criteria

- Nutzer sieht, welche Politiker historisch gute/schlechte Trades hatten
- Neue Trades werden in Kontext gesetzt
- Best Moves sind erklaerbar und quellenbasiert

## Phase 5 — Daily Briefing Product

Goal: Taeglicher Research-Mehrwert in einer kompakten Ansicht.

### Tasks

- [ ] Neue `/briefing` Seite
- [ ] Daily Market Summary generieren
- [ ] Top 5 Gainers/Losers mit Gruenden
- [ ] Neue Congressional Transactions mit Signal Score
- [ ] Unusual Volume und News Clusters
- [ ] Telegram Daily Digest
- [ ] Briefing archivieren

### Acceptance Criteria

- Jeden Tag gibt es eine kompakte, aktuelle Zusammenfassung
- Briefing ist ohne manuelle Recherche nuetzlich
- Telegram Digest funktioniert automatisch

## Implementation Principles

- Kleine, testbare Schritte
- Nach jeder Phase Build + Smoke Test
- Keine Secrets im Code
- Kostenlose Loesungen zuerst
- Datenstand und Quellen immer transparent anzeigen
- Fehler sichtbar machen statt still verschlucken
- Keine AI-Kosten ohne Caching und expliziten Nutzen

## Immediate Sprint

1. GitHub Actions Cron einrichten
2. `/api/movers` latest-date Verhalten fixen
3. UI Datenstand/Stale-Badge anzeigen
4. Market-Mover Detailkarte aufwerten
5. Danach PDF-Parser MVP planen und implementieren
