---
activityId: act-2026-05-17-v2-account-session-auth-contract
status: inbox
kind: architecture
area: server
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts: []
checks: []
---

# V2.0 Account-/Session-/Passkey-Vertrag spezifizieren

## Ziel

Vor Auth-Code soll ein enger Account- und Session-Vertrag entstehen: geschlossene private Accounts, Passkey-first Auth, serverseitige Account-Session-Revocation, Cookie-/CSRF-/Origin-Grenzen und klare Trennung zu Match-Tokens.

## Kontext und Quellen

- `docs/derived/V2_0_AUTH_PRIVACY_DECISION_SPIKE.md`
- Bestehende Match-Tokens in `apps/server/src/multiplayer.ts`
- Browser-Recovery in `apps/web/app/session-recovery.ts`
- Internet-Hardening in `apps/server/src/internet-hardening.ts`

## Scope

- Account-, Credential-, Account-Session- und Invite-/Recovery-Datenmodell als Vertrag festlegen.
- Entscheiden, wie `HttpOnly Secure` Account-Session-Cookies im aktuellen Web/API-Deployment funktionieren sollen.
- Passkey/WebAuthn-RP-ID-, HTTPS- und Testanforderungen dokumentieren.
- Revocation-Regeln festlegen: einzelnes Gerät, alle Geräte, Account deaktiviert, Account gelöscht.
- Trennung zwischen Account-Session und bestehenden Match-Join-/Session-/Reconnect-Tokens testenbar formulieren.
- CSRF-/Origin- und Rate-Limit-Testmatrix für Account-Endpunkte skizzieren.

## Nicht im Scope

- Keine Auth-Implementierung.
- Keine Cloud-Deck-Implementierung.
- Keine öffentliche Registrierung, OAuth-Provider, Passwortdatenbank oder Public-Lobby.
- Keine Änderung an Engine, LegalActions, PlayerViews, Replay, StateHash oder KI.

## Akzeptanzkriterien

- [ ] Es gibt ein versioniertes Vertragsartefakt für Account-, Credential- und Session-Modell.
- [ ] Cookie-/CSRF-/Origin-Strategie ist konkret oder als Blocker benannt.
- [ ] Passkey/WebAuthn-Teststrategie ist konkret oder als Blocker benannt.
- [ ] Match-Tokens bleiben als per-match Capabilities getrennt.
- [ ] Revocation-Fälle sind als Tests oder Testmatrix benannt.
- [ ] KI-Input und DecisionDebug bleiben ausdrücklich accountfrei.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Dieses Paket ist der fachliche Freeze vor einem möglichen `v2-account-session-foundation`-Implementierungsslice.

## Ergebnisnotiz

Noch offen.
