---
activityId: act-2026-08-23-scored-agenda-flow-owner-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Scored-Agenda-Flow nach Ownern prüfen

## Ziel

Prüfen, ob Score-Orchestrierung und Registry-/Direkteffekt-Dispatch in
`scored-agenda-flow.ts` getrennt werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Im aktuellen Review wurde kein fachlicher Doppelauszahlungsfehler belegt.
- Aktivierungsauslöser: nächste neue Score-Time-Fortsetzung oder Änderung an
  Registry- und Direkteffekt-Dispatch im selben Paket.

## Scope

- Score-Sequenz, Registry-Dispatch und direkte Effekte abgrenzen.
- Bindung von Source-Agenda, Score Area und Fortsetzung dokumentieren.
- Bei positivem Ergebnis kleine Migrationspakete anlegen.

## Nicht im Scope

- Änderung von Agenda-Punkten, Score-Kosten oder Kartenfähigkeiten.
- Neuer paralleler Score-Controller.

## Akzeptanzkriterien

- [ ] Die Score-Orchestrierung bleibt alleiniger Owner der Reihenfolge.
- [ ] Source-, Score-Area-, Choice- und Replay-Bindungen bleiben fail-closed.
- [ ] Registry- und Direkteffektpfade duplizieren keine Fachentscheidung.

## Ergebnisnotiz

Noch offen.
