# MVP 0.2 Final Review

Status: final gate passed  
Stand: 2026-05-03

## Gate

`MVP_0.2_done: true`

Begründung: MVP 0.2 erfüllt den freigegebenen privaten Human-vs-Human-Multiplayer-Scope über die bestehende MVP-0.1-Engine. Alle Must-Anforderungen aus `docs/derived/MVP_0.2_REQUIREMENTS.md` sind umgesetzt oder explizit in Tests/Smokes abgedeckt. Der Kartenpool bleibt unverändert, offizielle Assets werden nicht verwendet, und es gibt keine öffentlichen Plattformfunktionen.

## Finaler Implementierungsumfang

- Private Match-Erstellung mit Host-Seite `runner`, `corp` oder `random`.
- Join-Link mit geheimem Token; Tokens werden nur gehasht gespeichert.
- Session- und Reconnect-Token pro Seite.
- REST-API für Create, Join-Info, Join, Reconnect und Bootstrap.
- WebSocket-Protokoll für Join, Actions, Undo, Status, EventLog und Match-Ende.
- Per-Match-Lock, StateVersion-Prüfung und IdempotencyKey-Replay.
- Serverseitige Engine-Autorität über `applyAction`.
- Side-gefilterte PlayerViews, LegalActions, EventTails, Fehler und Undo-Payloads.
- Reconnect in Action Phase, Access und Encounter.
- Undo Request/Accept/Decline mit Hidden-Info-Barriere.
- Storage-Port mit In-Memory- und JSON-File-Adapter.
- Multiplayer-Replay gegen finalen StateHash.
- Next.js-Weboberfläche für Host/Join, Join-Link, Actions, Verbindungsstatus und Undo.

## Hardening-Ergebnisse

- Snapshot-Semantik bereinigt: Action-Snapshots liegen in `stateSnapshots`, echte Undo-Anfragen in `undoSnapshots`.
- WebSocket-Reconnect-Ersetzung gehärtet: Das Close-Event einer ersetzten Verbindung kann die neue Verbindung nicht mehr als offline markieren.
- REST-Settings-Härtung: `agendaPointsToWin` wird nur als Zahl aus HTTP-Requests übernommen.
- Browser-Client bleibt ohne `@netrunner/engine`, `@netrunner/server` und `GameState`-Import.
- Runner-Payload-Smoke bestätigt keinen Leak versteckter Corp-Agenda-Titel.

## Finale Checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- `corepack pnpm --filter @netrunner/server test`: pass, 7 Multiplayer-Tests.
- Multiplayer-Server-Health: pass auf `http://127.0.0.1:8787/health`.
- REST/WebSocket-Smoke: pass für Create, Join, Host/Runner-WebSocket, Corp mandatory action und Runner-Leak-Scan.
- Next-Web-Smoke: pass auf `http://127.0.0.1:3000`.

## Bekannte Grenzen

- JSON-File-Storage ist für den privaten lokalen Stand ausreichend; SQLite bleibt bevorzugtes späteres Härtungsziel.
- Lokaler Betrieb ist auf `localhost` ausgelegt. Außerhalb davon sind HTTPS/WSS und sorgsamer Token-Umgang Pflicht.
- Kein Matchmaking, kein Accountsystem, kein öffentlicher Lobby-Browser, kein Deckbuilder, kein Chat und kein breiter Kartenpool.
- Die MVP-0.1-KI-Demo-API bleibt als lokale Demo-Kompatibilität erhalten, ist aber nicht der MVP-0.2-Hauptpfad.
