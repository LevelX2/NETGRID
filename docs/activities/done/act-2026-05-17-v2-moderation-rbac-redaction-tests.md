---
activityId: act-2026-05-17-v2-moderation-rbac-redaction-tests
status: done
kind: test
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.6
blockedBy: []
resultArtifacts:
  - apps/server/src/moderation-rbac.ts
  - apps/server/src/moderation-rbac.test.ts
  - docs/derived/V2_6_MODERATION_RBAC_REDACTION_TEST_MATRIX.md
checks:
  - corepack pnpm --filter @netgrid/server test -- moderation-rbac.test.ts
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
---

# V2.6 Moderations-RBAC- und Redaction-Tests vorbereiten

## Ziel

Für spätere Moderationsslices soll eine fokussierte RBAC-/Redaction-Testbasis entstehen, die Rollenrechte und verbotene Datenklassen vor Implementierung einer Moderationskonsole absichert.

## Kontext und Quellen

- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

## Scope

- Testmatrix für Admin, Moderator, Support/Read-only, Reporter und System definieren.
- Verbotene Muster prüfen: Tokens, Token-Hashes, FullState, `privatePayload`, `cardInstances`, gegnerische Decklisten, `AIInput`, `DecisionDebug`, lokale Pfade.
- Erlaubte Evidence-Metadaten und public-safe Replay-Projektionen abgrenzen.
- Entscheiden, ob zunächst Doku-Testmatrix oder ein kleiner Server-Unit-Test-Harness sinnvoll ist.

## Nicht im Scope

- Keine Moderationskonsole.
- Keine Report-/Sanktions-Endpunkte.
- Keine Hidden-Info-Freigabe.
- Keine Änderung an Engine, Replay, StateHash oder KI.

## Akzeptanzkriterien

- [x] Rollen- und Datenklassenfälle sind testbar beschrieben.
- [x] Verbotene Datenmuster sind als Assertions oder Checkkonzept erfasst.
- [x] Break-Glass-Fälle bleiben getrennt von Standard-Moderatorzugriff.
- [x] Bestehende private Replay- und Wartungsflächen werden nicht als Public-Moderation gleichgesetzt.

## Umsetzungshinweise

- Primärer Folgeagent: `test-quality-agent`.
- Startpunkt ist ein schmaler Test-/Checkentwurf, kein breiter Moderationsbau.

## Ergebnisnotiz

Abgeschlossen. `apps/server/src/moderation-rbac.ts` legt eine testbare RBAC-Matrix mit Rollen, Datenklassen und Zugriffsstufen an. `apps/server/src/moderation-rbac.test.ts` prüft vollständige Matrixabdeckung, Standardzugriffsverbote für Hidden-Match-Daten und AI-Debug, Break-Glass-Trennung, public-safe Evidence und verbotene Evidence-Muster. Keine Moderationskonsole, keine Report-/Sanktions-API und keine Hidden-Info-Freigabe.
