# V2.0 Account-Session-Foundation Implementation Review

Stand: 2026-05-17
Status: implemented
Zielrelease: V2.0 Closed Accounts Alpha

## Umgesetzter Scope

Der Slice ergänzt eine isolierte Account-Session-Schicht im Serverpaket, ohne Match-Token, Engine, Replay, StateHash oder KI zu verändern.

- `apps/server/src/account-session.ts`
  - definiert `AccountRecord`, `AccountCredentialRecord` und `AccountSessionRecord`.
  - ergänzt `AccountStorage` als schmale Storage-Schnittstelle.
  - ergänzt `InMemoryAccountStorage` für Tests und lokale Service-Nutzung.
  - ergänzt `SqliteAccountStorage` mit Tabellen `accounts`, `account_credentials` und `account_sessions`.
  - speichert Account-Session-Tokens ausschließlich als HMAC-SHA256-Hash mit `sha256:`-Prefix.
  - erzeugt Account-Sessions, authentifiziert per Roh-Token gegen Hash, aktualisiert `lastSeenAt`, und widerruft einzelne oder alle Sessions eines Accounts.
  - gibt Self-Views ohne `sessionTokenHash` zurück.
- `apps/server/src/account-session.test.ts`
  - prüft SQLite-Persistenz ohne Roh-Token.
  - prüft redigierte Self-Views.
  - prüft Revocation für einzelne Session und alle Sessions eines Accounts.
  - prüft, dass ein Account-Session-Rohwert keine Match-Session-Capability ist und nicht in Match-Fehlerpayloads oder Side-Payloads auftaucht.
- `apps/server/src/index.ts`
  - exportiert die neue Account-Session-Schicht.

## Bewusst deferred

- Keine öffentliche Registrierung.
- Keine OAuth- oder Passwortdatenbank.
- Keine Passkey-/WebAuthn-Implementierung.
- Keine Invite-/Recovery-Flows.
- Keine REST-, Browser- oder WebSocket-Account-API.
- Keine Account-ID in `MatchRecord`, `GameState`, `PlayerView`, `PublicEvent`, `AIInput`, `DecisionDebug`, Replay-StateHash oder LegalActions.
- Keine Cloud-Decks, Public Lobby, Freunde, Chat, Rankings, Turniere oder Moderation.

## Akzeptanzabgleich

| Kriterium | Ergebnis |
| --- | --- |
| Account-Session-Token werden nie im Klartext persistiert oder geloggt | erfüllt für die neue Storage-Schicht; Tests prüfen SQLite-Rohdaten und Fehler-/Self-Views. Es gibt keine neue Logging-Stelle. |
| Revocation einzelner und aller Account-Sessions ist getestet | erfüllt in `account-session.test.ts`. |
| Bestehende Match-Join-/Session-/Reconnect-Flows bleiben regressionsfrei | `@netgrid/server`-Testlauf bleibt grün; Account-Session-Token wird als Match-Session abgelehnt. |
| Browser-/REST-/WebSocket-/Log-Leak-Scan enthält keine Account-Session-Rohwerte | es gibt noch keine Account-REST-/WS-API; der Test prüft die bestehenden Match-Payloads und Fehlerpayloads gegen Account-Session-Rohwerte. |
| Keine Engine-, Replay-, StateHash-, RulesBaseline- oder KI-Vertragsänderung | erfüllt; es wurden nur Server-Account-Schicht, Export und Tests ergänzt. |

## Verifikation

- `corepack pnpm --filter @netgrid/server test -- account-session.test.ts`
- `corepack pnpm --filter @netgrid/server typecheck`
- `git diff --check`

## Ergebnis

Der Foundation-Slice ist für lokale/private Alpha-Verwaltung als Server-Basis vorhanden. Er startet noch keine Account-API und aktiviert keine Public-Funktion. Der nächste fachliche Schnitt bleibt Datenschutz/Export/Löschung oder ein expliziter Account-API-/Passkey-Slice mit CSRF-, Origin- und Same-Site-Gate.
