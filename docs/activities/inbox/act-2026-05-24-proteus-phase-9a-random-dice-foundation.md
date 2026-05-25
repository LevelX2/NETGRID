---
activityId: act-2026-05-24-proteus-phase-9a-random-dice-foundation
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
releaseTarget: Proteus Phase 9a
blockedBy:
  - act-2026-05-24-proteus-phase-8f-random-bad-publicity-virus-longtail
resultArtifacts: []
checks: []
---

# Proteus Phase 9a: Random/Dice Foundation

## Ziel

`Roadblock`, `Executive Boot Camp`, `Lisa Blight` und `Forward's Legacy` mit generischen Würfel-/Random-Resolvern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9a Random/Dice Foundation`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/releases/proteus/variable-ice-contract.md` für `Roadblock`.

## Zielkarten

- `onr_proteus_035_roadblock` Roadblock
- `onr_proteus_058_executive-boot-camp` Executive Boot Camp
- `onr_proteus_063_lisa-blight` Lisa Blight
- `onr_proteus_087_forwards-legacy` Forward's Legacy

## Scope

- Generische Würfel-/Random-Bausteine mit Seed, `randomCounter` und `RandomDrawRecords`.
- Öffentliche Ergebnisprojektion ohne Seed-, Kandidaten- oder Hidden-Zone-Leaks.
- Replay-/StateHash-Stabilität für alle Random-Pfade.

## Nicht im Scope

- Keine Action-Economy-Slices 9b.
- Keine Hidden-Zone-Search-Slices 9c.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Random-Ergebnisse werden ausschließlich über Seed, `randomCounter` und `RandomDrawRecords` erzeugt.
- [ ] PublicPayloads enthalten keine Seeds, privaten Kandidatenlisten oder Hidden-Zone-Informationen.
- [ ] LegalAction-Projektion und `applyAction`-Revalidierung decken Seite, Timing, Kosten, Ziele und Choices ab.
- [ ] Wrong-Side-, stale-action-, RandomDrawRecords-, Replay-/StateHash- und Redaction-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
