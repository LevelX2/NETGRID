# V1.0.7 Implementation Review - Browser-E2E und Visual QA

Stand: 2026-05-06
Status: implemented

## Ergebnis

V1.0.7 ist als reproduzierbarer Browser-E2E-/Visual-QA-Gate umgesetzt. Der Gate nutzt Playwright, startet Web und Multiplayer-Server lokal auf freien Ports, isoliert die Match-Runtime in einem temporären `tmp/e2e-runtime-*`-Ordner und führt die V1.x-Browserflows in echten Chromium-Kontexten aus.

Der lokale Gate-Befehl ist:

```txt
corepack pnpm e2e
```

Alternativ ist dasselbe Ziel über `corepack pnpm test:e2e` erreichbar.

## Umgesetzte Struktur

- `playwright.config.ts`: Playwright-Konfiguration mit Chromium-Projekt, `tests/e2e`, `test-results/e2e`, HTML-Report und Trace/Screenshot/Video bei Fehlschlag.
- `scripts/run-e2e.mjs`: Harness für dynamische Ports, Web-/Server-Start, Health-Wait, isolierte Matchdatei und Prozess-Cleanup.
- `tests/e2e/netgrid-v1-0-7.spec.ts`: V1.0.7-Flow-Gate.
- `tests/e2e/helpers/match-flow.ts`: gekapselte Matchstart-, Join-, Ready-, Board-, Card-Display- und Screenshot-Hilfen.
- `tests/e2e/helpers/leak-scan.ts`: DOM-, Storage- und WebSocket-Payload-Leak-Scans.
- `tests/e2e/helpers/viewports.ts`: Desktop 1280x720, Tablet 1024x768, Schmal 390x844.

## Produktänderungen

- Der Server akzeptiert für Testläufe `NETGRID_MATCH_STORAGE_PATH`; ohne diese Variable bleibt der normale Pfad `data/runtime/multiplayer/matches.json` unverändert.
- Die Weboberfläche hat stabile `data-testid`-Hooks für bestehende UI-Ziele erhalten.
- Der Start-/Boardbereich blendet sichtbare Deckhashes nicht mehr im DOM ein; Decknamen und der Hinweis `Deck geprüft` bleiben als side-sichere UI-Information erhalten.
- Installierte Corp-Karten zeigen für die eigene Corp-Seite wieder side-sichere `Ungerezzt`-/`Gerezzt`-Statusmarken, damit das V1.0.5-Boardziel im Browser-Gate prüfbar bleibt.
- Zwei schmale Layoutprobleme wurden im Rahmen der QA behoben: das Hauptlayout stapelt bei mittlerer Breite zuverlässig, und Card-Tooltips bleiben im schmalen Viewport innerhalb des Bildschirms.

Keine neuen Karten, Mechaniken, offiziellen Assets, Replay-/StateHash-/Randomness-Verträge, Accounts, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier- oder Chat-Funktionen wurden ergänzt.

## Flow-Abdeckung

- Human-vs-KI Desktop: Matchstart, aktives Board, KI-Takt, Einzelschritt, menschliche Aktion, KI-Schritt, Gegner-Cue, Aktionen, Credits, Kostenchips, Card-Display-Modi.
- Human-vs-Human Desktop: zwei getrennte Browser-Kontexte, Host, Join-Link, Joiner-Deckauswahl, Ready-Lobby, Countdown, aktives Spiel.
- Lifecycle/Reconnect Desktop: Cancel, Recreate, Joiner-Leave, Fortsetzen/Wieder verbinden, Reload-Reconnect, Forfeit und lokale Sitzung verwerfen.
- Tablet: aktives Board, direkte Server-Run-Action, Run-Ziel, RunTimeline, Card-Display und Layoutscan.
- Schmaler Viewport: Textfit, Action-Buttons, Cue-Bereich, RunTimeline, Card Preview, Card-Display und Layoutscan.
- Hidden Info: Corp installiert verdeckte Karte, Runner sieht nur `Verdeckte Karte`; DOM/Storage/Payload werden gegen Titel-, Token-, Deck- und Bildpfad-Leaks geprüft.
- Runtime-Isolation: der E2E-Speicherpfad ist temporär und nicht die normale lokale Runtime-Datei.

## Leak-Scan-Abdeckung

DOM und LocalStorage werden unter anderem gegen diese Muster geprüft:

- `sessionToken`, `reconnectToken`, `joinToken`, `hostSessionToken`, `hostReconnectToken`
- `privatePayload`, `cardInstances`, `decklist`, `deckHash`, `cardDefinitionId`
- `/api/card-images/back_`
- konkrete verdeckte Kartentitel aus dem Hidden-Info-Test

WebSocket-Empfangspayloads werden gegen Token-, Private-Payload-, CardInstances-, Decklist- und Card-Back-Muster geprüft. `deckHash` bleibt in einzelnen side-sicheren Serverpayloads noch Vertragsbestandteil, wird aber nicht mehr im DOM/Storage sichtbar gemacht.

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V1_0_7_REQUIREMENTS.md` sind abgedeckt:

- V107-MUST-001 bis V107-MUST-003: Gate-Befehl, Playwright-Struktur, kontrollierter Start und Runtime-Isolation.
- V107-MUST-004 bis V107-MUST-006: Human-vs-KI, Human-vs-Human und Lifecycle/Reconnect.
- V107-MUST-007 bis V107-MUST-010: Board-/Run-/Card-Display-Ansichten und Desktop-/Tablet-/Schmalviewport.
- V107-MUST-011: Screenshot-Artefakte pro relevantem Flow; Trace/Video bei Fehlschlag.
- V107-MUST-012 bis V107-MUST-013: Hidden-Info-, Token-, Storage-, DOM- und Payload-Leak-Scans.
- V107-MUST-014 bis V107-MUST-016: keine Engine-Regelautorität im Client, keine Scope-Erweiterung, aktuelle UI-Details nur als QA-Ziele.

## Restpunkte

Kein blockernder Restpunkt für V1.0.7. Pixelgenaue Golden-Diffs bleiben bewusst außerhalb von V1.0.7.
