---
activityId: act-2026-05-17-v2-account-session-auth-contract
status: done
kind: architecture
area: server
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-0-auth-privacy-cloud-decks/account-session-auth-contract.md
  - docs/activities/inbox/act-2026-05-17-v2-account-session-foundation.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - Quellenprüfung gegen V2_0_AUTH_PRIVACY_DECISION_SPIKE.md, Multiplayer-Service, Web-Session-Recovery und Internet-Hardening
  - git diff --check
---

# V2.0 Account-/Session-/Passkey-Vertrag spezifizieren

## Ziel

Vor Auth-Code soll ein enger Account- und Session-Vertrag entstehen: geschlossene private Accounts, Passkey-first Auth, serverseitige Account-Session-Revocation, Cookie-/CSRF-/Origin-Grenzen und klare Trennung zu Match-Tokens.

## Kontext und Quellen

- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/auth-privacy-decision-spike.md`
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

- [x] Es gibt ein versioniertes Vertragsartefakt für Account-, Credential- und Session-Modell.
- [x] Cookie-/CSRF-/Origin-Strategie ist konkret oder als Blocker benannt.
- [x] Passkey/WebAuthn-Teststrategie ist konkret oder als Blocker benannt.
- [x] Match-Tokens bleiben als per-match Capabilities getrennt.
- [x] Revocation-Fälle sind als Tests oder Testmatrix benannt.
- [x] KI-Input und DecisionDebug bleiben ausdrücklich accountfrei.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Dieses Paket ist der fachliche Freeze vor einem möglichen `v2-account-session-foundation`-Implementierungsslice.

## Ergebnisnotiz

Erledigt. `docs/releases/v2/v2-0-auth-privacy-cloud-decks/account-session-auth-contract.md` friert den V2.0-Account-/Session-/Passkey-Vertrag ein: Account-, Credential-, Account-Session- und Invite-Modelle, `ng_account_session` als `HttpOnly Secure` Cookie-Ziel, Same-Site-/Reverse-Proxy-Blocker, CSRF über `X-NETGRID-CSRF`, Passkey/WebAuthn-Challenge-Regeln, Revocation-Fälle und eine 18-Punkte-Testmatrix.

Match-Join-/Session-/Reconnect-Tokens bleiben per-match Capabilities; ein Account allein darf keine PlayerActions ausführen. Lokaler Gast-/Privatmodus bleibt erhalten, und Account-IDs dürfen nicht in Gegnerpayloads, PlayerViews, PublicEvents, `AIInput` oder `DecisionDebug` erscheinen. Der vorbereitete Foundation-Slice `act-2026-05-17-v2-account-session-foundation` verweist nun auf den Vertrag und hat keinen aktiven Blocker mehr. Verifikation: Quellenprüfung und `git diff --check`.
