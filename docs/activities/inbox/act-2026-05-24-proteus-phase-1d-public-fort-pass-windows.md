---
activityId: act-2026-05-24-proteus-phase-1d-public-fort-pass-windows
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 1d
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts: []
checks: []
---

# Proteus Phase 1d: Public Fort Pass Windows

## Ziel

Die öffentlichen Fort-Pass-Interaktionen von `Lesley Major` und `Rasmin Bridger` als kleine generische Run-Window-Familie schneiden.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarten

- `onr_proteus_062_lesley-major` Lesley Major
- `onr_proteus_070_rasmin-bridger` Rasmin Bridger

## Benötigte Funktionsbausteine

- Install-Capability `install_only_inside_subsidiary_data_fort` für `Lesley Major`.
- Fort-bound source scoping:
  - Die Quelle wirkt nur auf das Fort, in dem sie installiert ist.
  - Quelle muss aktiv, gerezzed und im passenden Root liegen.
- Pass-ICE timing windows:
  - `Lesley Major`: Korp-Fenster, nachdem Runner das letzte ICE dieses Forts passiert hat.
  - `Rasmin Bridger`: Runner-Entscheidung nach jedem passierten ICE dieses Forts.
- Target binding für `Lesley Major`:
  - Ziel ist eine installierte Karte in diesem Fort, die Advancement Counter erhalten darf.
  - Kosten `[5]`, Wirkung zwei Advancement Counter, Limit einmal pro Run.
- Forced pay-or-end-run für `Rasmin Bridger`:
  - Runner zahlt `[1]` oder der Run endet.
  - Bei ungenügenden Credits muss der End-run-Pfad deterministisch sein.
- PublicEvents und LegalActions mit öffentlichen Fort-/ICE-Positionslabels, ohne verdeckte Kartennamen.

## Nicht im Scope

- Keine Fort-Reorder- oder HQ/R&D-Kartenbewegung.
- Keine Access-Count-Änderung.
- Keine Hidden-Info-Choices.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Beide Zielkarten haben per-card CardImplementation-Dateien.
- [ ] Pass-Fenster erscheinen nur im korrekten Run-Kontext und am korrekten Fort.
- [ ] Kosten, Ziel und once-per-run-Limit werden in `applyAction` revalidiert.
- [ ] PublicEvents leaken keine unrezzed Kartenidentitäten.
- [ ] Replay/StateHash deckt die Pass-Fenster ab.

## Umsetzungshinweise

- Falls die bestehende `fortRunWindows`-Familie erweitert wird, die neuen Kinds generisch nach Timing und Wirkung benennen, nicht nach Proteus-Karten.
- Die beiden Karten nicht mit Hidden-Fort-Manipulation bündeln.

## Ergebnisnotiz

Noch offen.
