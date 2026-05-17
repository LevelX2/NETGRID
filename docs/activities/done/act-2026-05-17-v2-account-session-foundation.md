---
activityId: act-2026-05-17-v2-account-session-foundation
status: done
kind: feature
area: server
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts:
  - apps/server/src/account-session.ts
  - apps/server/src/account-session.test.ts
  - docs/derived/V2_0_ACCOUNT_SESSION_FOUNDATION_IMPLEMENTATION_REVIEW.md
checks:
  - corepack pnpm --filter @netgrid/server test -- account-session.test.ts
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
---

# V2.0 Account-Session-Foundation implementieren

## Ziel

Nach Vertragsfreeze soll ein kleiner, nicht-öffentlicher Foundation-Slice für Accountdatenspeicherung und Account-Session-Revocation entstehen, ohne bestehende Match-Tokens, Engine oder KI zu verändern.

## Kontext und Quellen

- `docs/derived/V2_0_AUTH_PRIVACY_DECISION_SPIKE.md`
- `docs/derived/V2_0_ACCOUNT_SESSION_AUTH_CONTRACT.md`

## Scope

- Account-/Credential-/Account-Session-Speicherstruktur nach Vertrag anlegen.
- Account-Session-Token nur gehasht persistieren.
- Revocation für einzelne Account-Session und alle Account-Sessions eines Accounts umsetzen.
- Minimal-API nur für lokale/private Alpha-Verwaltung, sofern im Vertrag freigegeben.
- Tests für Token-Hashing, Revocation, Redaction und Nicht-Kopplung an Match-State ergänzen.

## Nicht im Scope

- Keine öffentliche Registrierung.
- Keine OAuth-/Provider-Integration.
- Keine Cloud-Decks.
- Keine Public-Lobby, Freunde, Chat, Rankings, Turniere oder Moderation.
- Keine Accountdaten in `GameState`, `PlayerView`, `PublicEvent`, `AIInput`, `DecisionDebug`, Replay-StateHash oder LegalActions.

## Akzeptanzkriterien

- [x] Account-Session-Token werden nie im Klartext persistiert oder geloggt.
- [x] Revocation einzelner und aller Account-Sessions ist getestet.
- [x] Bestehende Match-Join-/Session-/Reconnect-Flows bleiben regressionsfrei.
- [x] Browser-/REST-/WebSocket-/Log-Leak-Scan enthält keine Account-Session-Rohwerte.
- [x] Keine Engine-, Replay-, StateHash-, RulesBaseline- oder KI-Vertragsänderung.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Erst starten, wenn der Account-/Session-/Passkey-Vertrag abgeschlossen ist.

## Ergebnisnotiz

Abgeschlossen. `apps/server/src/account-session.ts` ergänzt eine isolierte Account-Session-Schicht mit Account-/Credential-/Session-Records, In-Memory- und SQLite-Storage, HMAC-gehashten Account-Session-Tokens, Authentifizierung, Self-Views ohne `sessionTokenHash`, einzelne Revocation und Revoke-all. `apps/server/src/account-session.test.ts` prüft Hash-Persistenz, Redaction, Revocation und die Trennung zu Match-Capabilities. Keine Account-API, keine WebAuthn-/Invite-Implementierung und keine Kopplung an Match-State, Engine, Replay, StateHash, LegalActions, `AIInput` oder `DecisionDebug`.
