# V1.0.9 Implementation Review - Private Internet Hardening

Stand: 2026-05-07
Status: implemented

## Ergebnis

V1.0.9 ist als schmaler Private-Internet-Härtungsrelease umgesetzt. Die neuen Gates sitzen vor der bestehenden REST-/WebSocket-Schicht und ändern keine Engine-, Karten-, Replay-, StateHash-, Randomness- oder AI-Regelverträge.

## Umgesetzter Scope

- Deployment-Profile `local` und `private_internet` mit Validierung von Web-/Server-Base-URLs, Allowed Origins, Rate-Limit-Profil und Token-Salt.
- `private_internet` blockiert fehlende Base-URLs, unsichere `http://`-Base-URLs, fehlende oder Wildcard-Origin-Allowlists und den lokalen Default-Salt.
- REST-CORS nutzt eine explizite Origin-Allowlist und gibt keine `*`-Origin mehr aus.
- REST-Anfragen mit unbekannter Origin werden side-sicher mit `origin_not_allowed` abgelehnt.
- WebSocket-Handshakes prüfen dieselbe Origin-Allowlist vor `join_match`; unbekannte Origins erhalten keine Match-, Lobby- oder Bootstrap-Payload.
- Deterministische Fixed-Window-Rate-Limits für Match-Erstellung, Token-Probes, Lifecycle-Kommandos, AI-/Simulation-Flows, WebSocket-Handshake und WebSocket-Join.
- Rate-Limit-Fehler verwenden den stabilen Code `rate_limited` und enthalten keine Tokens, TokenHashes, Decklisten, Match-Interna oder Hidden Info.
- `/health` liefert nur redaktionierte Basissignale: Service, Release, Profil, Realtime-Bereitschaft und redaktionierte Storage-Signale.
- `/ops/diagnostics` bleibt ohne Schutzentscheidung nicht verfügbar und antwortet redaktioniert mit `diagnostics_unavailable`.
- Redaction-Helfer für Join-URLs, Token-/Hash-Muster und Hidden-Info-Felder wurden ergänzt und in Tests/E2E-Logausgabe verwendet.
- `.env.example` dokumentiert die V1.0.9-Variablen ohne echte Secrets.
- Die sichtbare Web-App-Statuszeile wurde auf `V1.0.9` gesetzt und im Visibility-Contract abgesichert.
- `corepack pnpm e2e` startet den Server mit expliziter lokaler Origin-Allowlist, Base-URLs, SQLite-Isolation und redaktionierter Ausgabe.

## Geänderte Dateien

- `.env.example`
- `apps/server/src/http-server.ts`
- `apps/server/src/index.ts`
- `apps/server/src/internet-hardening.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/web/app/page.tsx`
- `scripts/run-e2e.mjs`
- `tests/e2e/netgrid-v1-0-7.spec.ts`
- `tests/e2e/helpers/match-flow.ts`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/V1_0_9_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_9_FINAL_REVIEW.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

## Testabdeckung

- Deployment-Profil- und HTTPS/WSS-Konfiguration: Server-Contract-Tests in `apps/server/src/multiplayer.test.ts`.
- REST-Origin-Allowlist, Preflight und Origin-Negativtest: Server-Contract-Tests.
- WebSocket-Origin-Allow und -Deny vor Bootstrap: Server-Contract-Tests.
- REST- und WebSocket-Rate-Limits: deterministische Server-Contract-Tests mit Testprofil und eigener Clock-unabhängiger Fixed-Window-Struktur.
- Token-/Hash-/Join-URL-/Hidden-Info-Redaction: Server-Contract-Tests, Health-Test, E2E-Health-Leak-Scan und E2E-Log-Redaction.
- Health/Ops-Signale: Server-Contract-Tests und E2E-Health-Check.
- Internet-nahe E2E-Konfiguration: `scripts/run-e2e.mjs` setzt explizite Base-URLs, Allowed Origin und SQLite-Isolation.

## Scope-Abgleich

V1.0.9 führt keine Accounts, öffentliche Lobby, Public Discovery, Matchmaking, Rankings, Turniere, öffentlichen Chat, Moderation, Postgres-Pfade, neuen Karten, neuen Mechaniken, offiziellen Assets, Replay-/StateHash-/Randomness-Änderungen oder Engine-Autoritätsänderungen ein.

## Grenzen

- TLS wird weiterhin bevorzugt durch einen privaten Reverse Proxy terminiert; die Node-App implementiert keine eigene TLS-Terminierung.
- Forwarded-Headers werden nur bei `NETGRID_TRUST_PROXY_HEADERS=true` vertraut.
- Rate-Limits sind bewusst einfache In-Memory-Missbrauchsbremsen für privaten Betrieb, keine Public-Scale-Abuse-Plattform.
- Query-Token-Kompatibilität für bestehende Join-/Bootstrap-Flows bleibt erhalten, wird aber redaktioniert; session-sensitive REST-Kommandos bevorzugen weiterhin `Authorization: Bearer`.
