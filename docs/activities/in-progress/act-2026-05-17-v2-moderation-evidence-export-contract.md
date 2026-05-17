---
activityId: act-2026-05-17-v2-moderation-evidence-export-contract
status: in-progress
kind: architecture
area: docs
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-3
releaseTarget: V2.6
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Exportdaten und Exportverbote sind tabellarisch dokumentiert.
- [ ] Evidence-Export ist von Public Replay und Account-Datenexport getrennt.
- [ ] Hidden-Info- und Decklisten-Verbot ist explizit.
- [ ] Audit- und Retention-Anforderungen sind sichtbar.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Kann später in Implementierungs- und Testpakete zerlegt werden.

## Ergebnisnotiz

Noch offen.
