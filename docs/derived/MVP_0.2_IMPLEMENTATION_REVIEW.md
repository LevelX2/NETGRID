# MVP 0.2 Implementation Review

Status: implementation complete, hardening candidate  
Stand: 2026-05-03

## Gate

`ready_for_hardening: true`

Begründung: Der private Human-vs-Human-Multiplayer ist innerhalb des freigegebenen MVP-0.2-Scopes umgesetzt. Der Kartenpool bleibt unverändert auf `cardImplementationVersion: 0.1.0`, die Engine bleibt einzige Regelautorität, Actions laufen serverseitig durch `applyAction`, und Browser-Clients erhalten nur side-gefilterte PlayerViews und Protokollnachrichten.

## Implementierter Scope

- REST: Match erstellen, Join-Info, Join, Reconnect, Bootstrap.
- WebSocket: `join_match`, `submit_action`, `request_undo`, `accept_undo`, `decline_undo`, `ping`.
- Storage-Port mit In-Memory- und JSON-File-Adapter.
- Hash-only Tokenpersistenz für Join-, Session- und Reconnect-Tokens.
- MatchStatus und MatchVersion mit monotonen Updates.
- Eine aktive Session pro Seite; Reconnect rotiert Session- und Reconnect-Token.
- Serverseitige Action-Pipeline mit Sessionprüfung, Statusprüfung, StateVersion, IdempotencyKey, per-Match-Lock und Engine-Legalität.
- Side-gefilterte Payloads für Bootstrap, WebSocket-Updates, EventTail, Fehler und Undo.
- Undo Request/Accept/Decline mit Hidden-Info-Barriere.
- Multiplayer-Replay über den gespeicherten EventLog.
- Next.js-UI für Host, Join-Link, Join, WebSocket-Spiel, Connection-Banner, Actions und Undo-Prompts.

## Checks

- `corepack pnpm --filter @netrunner/server test`: pass, 7 Multiplayer-Tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass nach Aktualisierung des Visibility-Vertrags.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.
- Multiplayer-Server-Smoke: `http://127.0.0.1:8787/health` pass.
- REST/WebSocket-Smoke: create, join, host WebSocket, runner WebSocket, Corp mandatory action, Runner-Payload ohne versteckte `Simple Agenda`.
- Next-Web-Smoke: `http://127.0.0.1:3000` HTTP 200.

## Annahmen

- JSON-File-Storage ist für den ersten privaten MVP-0.2-Stand zulässig; SQLite bleibt späteres Härtungsziel.
- Der lokale Dev-Server läuft standardmäßig auf `127.0.0.1:8787`; die Weboberfläche nutzt `NEXT_PUBLIC_NETRUNNER_SERVER_URL` oder diesen Default.
- HTTPS/WSS ist außerhalb von localhost Betriebsanforderung, aber nicht lokale MVP-Pflicht.

## Risiken Für Phase 3

- UI-Smoke ist technisch per HTTP/REST/WebSocket geprüft, aber noch nicht screenshot-basiert.
- JSON-Storage ist bewusst einfach und muss bei längerer Nutzung mit Backup-/Rotation-Hinweisen betrieben werden.
- Die alte MVP-0.1-KI-Demo-API bleibt für lokalen Demo-Erhalt im Code, ist aber nicht mehr die Hauptoberfläche.
