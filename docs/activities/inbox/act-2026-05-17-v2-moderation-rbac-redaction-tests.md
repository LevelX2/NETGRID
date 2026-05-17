---
activityId: act-2026-05-17-v2-moderation-rbac-redaction-tests
status: inbox
kind: test
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: V2.6
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Rollen- und Datenklassenfälle sind testbar beschrieben.
- [ ] Verbotene Datenmuster sind als Assertions oder Checkkonzept erfasst.
- [ ] Break-Glass-Fälle bleiben getrennt von Standard-Moderatorzugriff.
- [ ] Bestehende private Replay- und Wartungsflächen werden nicht als Public-Moderation gleichgesetzt.

## Umsetzungshinweise

- Primärer Folgeagent: `test-quality-agent`.
- Startpunkt ist ein schmaler Test-/Checkentwurf, kein breiter Moderationsbau.

## Ergebnisnotiz

Noch offen.
