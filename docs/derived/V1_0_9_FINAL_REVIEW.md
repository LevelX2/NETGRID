# V1.0.9 Final Review - Private Internet Hardening

Stand: 2026-05-07
Status: done

## Gate-Ergebnis

V1.0.9 ist implementiert und lokal verifiziert. Alle Pflicht-Gates sind am 2026-05-07 bestanden.

`V1_0_9_implemented: true`

`V1_0_9_verified: true`

`V1_0_9_done: true`

## Umgesetzter Scope

- `local` und `private_internet` als getrennte Deployment-Profile.
- Private-Internet-Startblocker für fehlende Base-URLs, unsichere HTTP-URLs, fehlende Allowed Origins, Wildcards und lokalen Default-Salt.
- REST-CORS mit expliziter Origin-Allowlist statt `*`.
- WebSocket-Origin-Prüfung vor `join_match`.
- Deterministische Rate-Limits für sensible REST-Flows und WebSocket-Join/Handshake.
- Redaction für Tokens, TokenHashes, Join-URLs und Hidden-Info-Feldnamen in Health, Fehlern, Logs und E2E-Ausgaben.
- Sichere Health-Basissignale ohne private Matchdaten.
- Nicht verfügbare ungeschützte Diagnosefläche mit stabilem Code `diagnostics_unavailable`.
- Internet-nahe E2E-Konfiguration mit expliziten Origins/Base-URLs und SQLite-Isolation.

## Gate-Plan

| Gate | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netrunner/server test` | pass, 49 Tests |
| `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts` | pass, 13 Tests |
| `corepack pnpm e2e` | pass, 7 Browser-E2E-Tests |
| `corepack pnpm lint` | pass |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm test` | pass, Workspace-Tests plus Root-Specs |
| `corepack pnpm build` | pass, bekannte Turbopack-NFT-Warnung in `apps/web/next.config.ts` |
| `git diff --check` | pass, nur Zeilenende-Hinweise für Windows-Arbeitskopie |

## Internet-/Proxy-Smoke

Automatisierter äquivalenter Smoke:

- Server-Contract-Tests prüfen private HTTPS-Base-URLs, explizite Allowed Origins, REST-Origin-Negativfall, WebSocket-Origin-Negativfall, Rate-Limit und Redaction.
- `corepack pnpm e2e` läuft internetnah mit expliziter Web-Origin, Server-Base-URL, SQLite-Isolation und Health-/Payload-Leak-Scan.

Manueller echter LAN-/VPS-HTTPS-Smoke wurde in dieser lokalen Arbeitsumgebung nicht ausgeführt. Der Release enthält dafür die Betriebsgrenze: TLS/WSS wird über einen privaten Reverse Proxy oder äquivalenten HTTPS/WSS-Pfad terminiert; vor realem Betrieb sind `/health`, Lobby-Erstellung, Join, Ready/Start, Reconnect, Lifecycle-Kommando und Log-/Health-/Payload-Redaction auf dem Zielsystem zu prüfen.

## Redaction-Befund

Die automatisierten Tests prüfen, dass Origin-, Rate-Limit-, Health-, WebSocket- und E2E-Flächen keine `sessionToken`, `reconnectToken`, `joinToken`, `tokenHash`, SHA-256-TokenHashes, `privateDeckSnapshots`, `privatePayload`, `cardInstances` oder `decklist` ausgeben.

## Scope-Abgleich

Keine Accounts, Public Discovery, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier-, Chat-, Moderations-, Postgres-, Karten-, Mechanik-, Replay-, StateHash-, Randomness- oder Engine-Autoritätsänderungen wurden eingeführt.

## Bekannte Grenzen

- TLS/WSS ist ein Betriebsvertrag hinter Reverse Proxy; die lokale Node-App bleibt HTTP-fähig für `local` und E2E.
- In-Memory-Rate-Limits sind private Abuse-Bremsen und werden bei Prozessneustart zurückgesetzt.
- Query-Token-Pfade bleiben für bestehende private Links kompatibel, werden aber nicht als bevorzugter neuer Secret-Transport betrachtet.
- Echte VPS-/LAN-Prüfung bleibt ein Zielsystem-Smoke und ist vor produktivem privaten Internetbetrieb durchzuführen.
