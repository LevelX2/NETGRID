---
activityId: act-2026-08-22-encounter-nontrace-effect-family-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Effektfamilien, Fortsetzungsowner und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Encounter-Nontrace-Effektfamilien modularisieren

## Ziel

Prüfen, ob `encounter-printed-nontrace-effects.ts` entlang seiner fachlichen
Effektfamilien geteilt werden sollte, während der Encounter-Controller und die
Subroutine-Fortsetzung eindeutig bleiben.

## Kontext und Quellen

- Regel-Engine-Review Batch 4 vom 2026-08-22.
- `packages/engine/src/game/run/encounter-printed-nontrace-effects.ts`
- Vorgeschlagene natürliche Familien: Deflection, Trash/Payment, Run-Locks und
  Reveal/Reorder.
- Aktivierungsauslöser: nächste neue Nontrace-Familie, erneuter
  Fortsetzungsfehler oder eine Änderung über mehrere dieser Gruppen.

## Scope

- Controller-, Host- und Resolververantwortung der aktuellen Datei erfassen.
- Fachliche Familien und ihre gemeinsamen Fortsetzungsdaten abgrenzen.
- Einen Migrationsschnitt entwerfen, der Suspendierung und
  `resolvedSubroutineIndexes` zentral hält.
- Bei positiver Entscheidung Folgepakete pro Familie anlegen.

## Nicht im Scope

- Änderung von Kartenregeln oder Subroutine-Reihenfolge.
- Neuer paralleler Encounter-Controller.
- Gleichzeitiger Umbau von Trace- oder Random-Damage-Pfaden.

## Akzeptanzkriterien

- [ ] Jede bestehende Nontrace-Familie besitzt genau einen fachlichen Owner.
- [ ] Suspendierung, Fortsetzung, Action-Bindung und Replaydeterminismus bleiben
      zentrale Invarianten.
- [ ] Eine Teilung ist mit aktuellem Importgraph und Struktur-Gate bewertet.
- [ ] Empfohlene Umsetzung ist in kleine familienbezogene Pakete geschnitten.

## Umsetzungshinweise

- Exakte vorhandene Subroutine-IDs und Attributionen dürfen durch reine
  Modulverschiebung nicht verändert werden.
- Keine neue Fallback- oder Catch-and-continue-Schicht einführen.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Deflection, Program-Trash/Payment,
Run-Locks und Reveal/Reorder sind erkennbare Familien, verwenden aber bewusst
denselben Encounter-Host und die zentrale Suspendierungs-/Fortsetzungsbindung
einschließlich `resolvedSubroutineIndexes`. Seit Anlage des Pakets gab es keine
neue Nontrace-Familie, keinen erneuten Fortsetzungsfehler und keine Änderung
über mehrere Gruppen. Eine reine Dateiteilung würde die kritische
Continuation-Grenze vervielfachen. Keine Folge-Activity; beim Trigger zuerst
familienweise extrahierbare Pure-Effect-Helfer von der zentralen Fortsetzung
abgrenzen.
