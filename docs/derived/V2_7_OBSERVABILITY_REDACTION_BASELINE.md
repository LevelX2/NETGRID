# V2.7 Observability Redaction Baseline

Stand: 2026-05-17
Status: Baseline-Check implementiert
Zielrelease: V2.7 Observability/Scale

## Ausgangslage

V1.0.9 und Backend 0.5 liefern bereits private Health-, Rate-Limit- und Maintenance-Flächen. V2.7 braucht vor Public-/Account-Ausbau eine engere Baseline, damit Logs, Diagnoseausgaben und spätere Metriklabels keine Tokens, Hidden-Info, Decklisten oder KI-Debugdaten aufnehmen.

## Umgesetzt

- `apps/server/src/internet-hardening.ts`
  - `OBSERVABILITY_ALLOWED_TECHNICAL_LABELS` definiert erlaubte technische Labels wie `rulesBaseline`, `cardPoolVersion`, `formatProfileId`, `aiVersion`, `rateLimitCategory` und `errorCode`.
  - `findObservabilityRedactionViolations` erkennt verbotene Muster für Roh-Tokens, Token-Hashes, private Deckdaten, Hidden-Info, AI-Debug und lokale Pfade.
  - `redactSensitiveText` redigiert zusätzlich Account-Session-Cookies, Account-/Invite-/Recovery-Tokenfelder, `sessionTokenHash`, `deckHash`, `AIInput`, `DecisionDebug`, FullState-Felder, `cloudDeckId` und lokale Pfade.
- `apps/server/src/observability-redaction.test.ts`
  - prüft Bad-Samples mit Sessionwerten, `ng_account_session`, Token-Hashes, Deckhash, Kartenliste, Hidden-Info, `AIInput`, `DecisionDebug` und lokalem Pfad.
  - prüft Safe-Samples mit erlaubten technischen Labels.
  - prüft, dass `redactedHealth` und `redactSensitiveText` innerhalb der Baseline bleiben.

## Erlaubte Labels

Erlaubt für spätere Logs/Metriken sind nur technische, account- und decklistenfreie Labels, insbesondere:

- Release, Profil, Status, Modus, Error-Code.
- RulesBaseline, Cardpool-Version, Formatprofil.
- AI-Version oder AI-Profilkennung ohne `AIInput` oder `DecisionDebug`.
- Rate-Limit-Kategorie, Eventfamilie, Latenzbucket, Region-Code.

## Verbotene Felder

Verboten in Logs, Diagnoseausgaben, Health-Payloads und Metriklabels:

- `sessionToken`, `reconnectToken`, `joinToken`, `ng_account_session`, Account-Session-, Invite- und Recovery-Rohwerte.
- `tokenHash`, `sessionTokenHash`, `inviteTokenHash`, `sha256:*`.
- Decklisten, `deckHash`, `cloudDeckId`, `privateDeckSnapshots`, `cards`.
- `privatePayload`, `cardInstances`, FullState, Hidden Cards.
- `AIInput`, `DecisionDebug`, `aiDecisionDebug`, Belief State.
- lokale Dateipfade.

## Grenzen

Dieser Slice führt keine Observability-Plattform, keine Metrics-Infrastruktur, kein Tracing und kein Public Deployment ein. Der neue Check ist eine Baseline für spätere Tests und Review-Gates. Bestehende private Health-/Maintenance-Flächen bleiben private Betriebsflächen und sind keine Public-Observability-Freigabe.

## Verifikation

- `corepack pnpm --filter @netgrid/server test -- observability-redaction.test.ts`
- `corepack pnpm --filter @netgrid/server typecheck`
- `git diff --check`
