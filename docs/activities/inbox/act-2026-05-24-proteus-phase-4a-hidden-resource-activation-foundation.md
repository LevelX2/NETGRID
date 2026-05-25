---
activityId: act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 4a
blockedBy:
  - act-2026-05-24-proteus-phase-4-hidden-runner-resources
resultArtifacts: []
checks: []
---

# Proteus Phase 4a: Hidden Resource Activation Foundation

## Ziel

Die generische Aktivierungsgrundlage für verdeckte Runner-Resources schaffen, ohne bereits konkrete Proteus-Zielkarten zu promoten.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4a Hidden Resource Activation Foundation`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/activities/done/act-2026-05-17-proteus-hidden-resource-foundation-slice.md`.
- Bestehende Hidden-Resource-View- und Trash-Foundation im Engine-Code.

## Zielkarten

Keine Zielkartenpromotion in diesem Slice.

## Scope

- Verdeckte Runner-Resource-Aktivierung als generische CardImplementation-/Ability-Familie vorbereiten.
- Reveal-and-trash-Kosten atomar und replay-stabil modellieren.
- Private Runner-LegalActions für verdeckte Resource-Quellen bereitstellen.
- Korp-Views, PublicEvents, Undo-Preview, Reconnect und AIInput gegen nicht aktivierte Hidden-Info-Leaks absichern.
- Timingfenster für die Folgefamilien Trace, Damage, Access und Kosten so schneiden, dass 4b bis 4e keine kartenindividuellen Runtime-Branches brauchen.

## Nicht im Scope

- Keine Promotion der Karten aus 4b bis 4e.
- Keine neuen UI-, Server-, Catalog- oder KI-Abfragen auf Proteus-Kartennamen oder `onr_proteus_*`-IDs.
- Keine Erweiterung der Hidden-Resource-Regeln ohne nachweislichen Folge-Slice-Bedarf.

## Akzeptanzkriterien

- [ ] Hidden-Resource-Aktivierungen werden nur aus Runner-privaten LegalActions erzeugt.
- [ ] `applyAction` revalidiert Seite, stateVersion, Timingfenster, Quelle, Reveal-Zustand, Kosten und Choice-Daten.
- [ ] Reveal-and-trash erfolgt atomar, deterministisch und StateHash-relevant.
- [ ] Nicht aktivierte Hidden Resources bleiben in Korp-PlayerViews, PublicEvents, Reconnect, Undo-Preview, Logs und AIInput redigiert.
- [ ] Fokussierte Wrong-Side-, stale-action-, Kosten-, Choice-, Hidden-Info- und Replay-/StateHash-Tests decken die Foundation ab.

## Umsetzungshinweise

- Vor Umsetzung prüfen, welche Teile der früheren Hidden-Resource-Foundation bereits Slot-Installation, Redaction und Korp-Trash abdecken.
- 4a darf nicht erneut nur verdeckte Slot-Installation beweisen; der Mehrwert ist die generische Aktivierungs- und Reveal-and-trash-Familie.
- 4b bis 4e bleiben blockiert, bis diese Aktivierungsgrundlage vorhanden oder präzise blockiert ist.

## Ergebnisnotiz

Noch offen.
