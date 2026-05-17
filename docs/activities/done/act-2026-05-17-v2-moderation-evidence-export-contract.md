---
activityId: act-2026-05-17-v2-moderation-evidence-export-contract
status: done
kind: architecture
area: docs
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
releaseTarget: V2.6
blockedBy: []
resultArtifacts:
  - docs/derived/V2_6_MODERATION_EVIDENCE_EXPORT_CONTRACT.md
checks:
  - "rg -n \"Evidence-Export|FullState|privatePayload|AIInput|DecisionDebug|local_analysis|Public Replay|Account-Datenexport\" docs/derived/V2_6_MODERATION_EVIDENCE_EXPORT_CONTRACT.md docs/activities/done/act-2026-05-17-v2-moderation-evidence-export-contract.md"
  - "rg -n \"exportReplay|local_analysis|privatePayload|stateHash|tokenHash|aiDecisionDebug\" apps/server/src/multiplayer.ts"
  - "git diff --check"
---

# V2.6 Evidence-Export-Vertrag schneiden

## Ziel

Vor einem Evidence-Export soll exakt festgelegt werden, welche Moderationsdaten exportierbar sind, welche redigiert werden und welche immer ausgeschlossen bleiben.

## Kontext und Quellen

- `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`
- Bestehender side-sicherer Replay-Export in `apps/server/src/multiplayer.ts`

## Scope

- Exportierbare Datenklassen festlegen: Reporttext, Chat-Evidence, public-safe Replay-Auszug, StateHash-Integritätsdaten, Audit-Zusammenfassung.
- Exportverbote festlegen: FullState, `privatePayload`, verdeckte Karten, gegnerische Decklisten, Token/Hashes, `AIInput`, `DecisionDebug`.
- Ablauf, Downloadfenster, Auditpflicht und Retention für Evidence-Exports skizzieren.
- Tests oder Review-Checks für Exportpayloads benennen.

## Nicht im Scope

- Keine Export-Implementierung.
- Keine Moderationskonsole.
- Keine Public-Replay-Freigabe.
- Keine Rechtsberatung.

## Akzeptanzkriterien

- [x] Exportdaten und Exportverbote sind tabellarisch dokumentiert.
- [x] Evidence-Export ist von Public Replay und Account-Datenexport getrennt.
- [x] Hidden-Info- und Decklisten-Verbot ist explizit.
- [x] Audit- und Retention-Anforderungen sind sichtbar.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Kann später in Implementierungs- und Testpakete zerlegt werden.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/V2_6_MODERATION_EVIDENCE_EXPORT_CONTRACT.md` definiert exportierbare Evidence-Datenklassen, harte Exportverbote, die Trennung zu V2.0 Account-Datenexport und V2.8 Public Replay sowie Ablauf, Downloadfenster, Auditpflicht, Retention und Review-Checks für spätere Implementierungsslices.

Kein Export-Code, keine Moderationskonsole und keine Public-Replay-Freigabe wurden umgesetzt. Restrisiko: Retention-Zahlen bleiben Alpha-Defaults und müssen vor Implementierung als Produkt-/Betriebsentscheidung bestätigt werden.
