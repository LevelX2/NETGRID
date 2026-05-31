# NETGRID

NETGRID ist eine private, lokale Webapplikation für regelgeführte NETGRID-Partien. Das Projekt ist eine Version-0-/Vor-Produktionsumgebung ohne öffentlichen Produktivbetrieb und ohne stabile Zusage für Datenformate, Replays oder lokale Laufzeitdaten.

Die Rules Engine ist die einzige Regelautorität. UI, Server, menschliche Spieler und KI reichen nur `PlayerActions` ein, die aus `LegalActions` abgeleitet wurden; `applyAction` validiert Timing, Seite, `actionId`, `stateVersion`, Kosten, Ziele und Choices erneut. Verdeckte Kartendaten dürfen nicht in PlayerViews, KI-Eingaben, WebSocket-Payloads, Reconnects, Replays, Logs oder Client-Fehler leaken. Replay, StateHash und deterministische Zufallsaufzeichnungen sind zentrale Projektverträge.

## Aktueller Funktionsumfang

- Human-vs-KI-Partien in beiden Seitenrollen.
- Human-vs-Human-Partien über privaten Link mit lokalem Multiplayer-Backend.
- KI-vs-KI- und Simulationspfade für lokale Analyse und Regressionen.
- Lokale Karten-, Deck- und Matchstart-Verwaltung mit serverseitiger Deck-/Format-Revalidierung.
- Private Replays, Chronik- und Analyseansichten im Rahmen der aktuellen Hidden-Info-Gates.
- Kartenpool-Auswahl beim Matchstart: `Nur Originalset` oder `Originalset & Protheus`.

Der aktuelle private Originalset-Stand ist deck-/formatvalidiert nach den freigegebenen lokalen Gates. Protheus ist als privater Human-vs-Human-Playtest-Kartenpool auswählbar; KI-Unterstützung bleibt dafür geschlossen, solange separate AI-Hints, Szenarien und Smokes fehlen.

## Bewusste Grenzen

- Keine öffentliche Plattform, kein öffentlicher Produktivbetrieb.
- Kein freigegebenes öffentliches Matchmaking, Ranking, Turnier- oder Public-Lobby-Feature.
- Keine offiziellen Artworks, Card Frames, Card Backs, Logos oder externen Kartendatenbank-Abhängigkeiten ohne separates Asset-/Rechts-Gate.
- Private Laufzeitdaten, lokale SQLite-Dateien, Caches, Logs, lokale Assets und Secrets bleiben lokal und werden nicht versioniert.
- Account-, Cloud-Deck-, Moderations- und Public-Replay-Themen sind nur in engen Gate-/Planungsschnitten vorhanden, nicht als öffentliche Produktfläche.

## Technischer Rahmen

- Node 24 LTS
- pnpm Workspaces über Corepack
- TypeScript
- Vitest
- Next.js/React für die Weboberfläche
- lokaler Server mit SQLite-Storage für private Multiplayer-Matches

## Lokaler Start

Abhängigkeiten installieren:

```powershell
corepack pnpm install
```

Normaler lokaler Betrieb startet über das Projekt-Startscript:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-netgrid.ps1
```

Das Script startet Backend und Webclient im passenden LAN-/Local-Modus, ermittelt die LAN-IP und setzt die zusammengehörigen URLs, Origins und Umgebungsvariablen, unter anderem `NETGRID_PUBLIC_HOST`, `NETGRID_WEB_BASE_URL`, `NETGRID_SERVER_BASE_URL`, `NETGRID_ALLOWED_ORIGINS` und `NEXT_PUBLIC_NETGRID_SERVER_URL`.

Standard-Ports:

- Weboberfläche: `http://127.0.0.1:3100` beziehungsweise die vom Script geöffnete LAN-URL.
- Server/Health: `http://127.0.0.1:8787/health` beziehungsweise die LAN-URL auf Port `8787`.

Direkte Dev-Starts mit `corepack pnpm --filter @netgrid/server dev`, `tsx` oder `next dev` sind nur Diagnose- oder isolierte Testpfade. Für den normalen lokalen Betrieb gilt wieder der Script-Startpfad, damit LAN-IP, Web-/Server-URLs und Origin-Allowlist konsistent bleiben.

## Konfiguration und Daten

`.env.example` dokumentiert die wichtigsten lokalen Variablen. Das Startscript setzt die für den normalen lokalen Betrieb relevanten Werte selbst; lokale Overrides und Secrets gehören nicht in versionierte Dateien.

Laufzeitdaten liegen lokal, typischerweise unter `data/runtime/` und für Multiplayer standardmäßig in `data/runtime/multiplayer/netgrid.sqlite`. Persönliche Decks können lokal über die Deckbibliothek verwaltet werden.

## Übliche Checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm e2e
corepack pnpm check:ai-approval-consistency
```

Für engere Änderungen sind paketbezogene Checks üblich, zum Beispiel:

```powershell
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm --filter @netgrid/web test
```
