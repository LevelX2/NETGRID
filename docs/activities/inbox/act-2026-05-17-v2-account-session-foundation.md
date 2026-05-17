---
activityId: act-2026-05-17-v2-account-session-foundation
status: inbox
kind: feature
area: server
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Account-Session-Token werden nie im Klartext persistiert oder geloggt.
- [ ] Revocation einzelner und aller Account-Sessions ist getestet.
- [ ] Bestehende Match-Join-/Session-/Reconnect-Flows bleiben regressionsfrei.
- [ ] Browser-/REST-/WebSocket-/Log-Leak-Scan enthält keine Account-Session-Rohwerte.
- [ ] Keine Engine-, Replay-, StateHash-, RulesBaseline- oder KI-Vertragsänderung.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Erst starten, wenn der Account-/Session-/Passkey-Vertrag abgeschlossen ist.

## Ergebnisnotiz

Noch offen.
