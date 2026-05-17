---
activityId: act-2026-05-17-proteus-visible-baseline-card-slice
status: in_progress
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-release-slicing-plan
resultArtifacts: []
checks: []
---

# Proteus Visible-Baseline-Kartenslice vorbereiten

## Ziel

Der erste Proteus-Kartenslice soll eine kleine sichtbare Baseline aus `covered`- und sehr einfachen `resolver`-Karten umsetzen, ohne Hidden-, Random-, Variable-, Purge-, Bad-Publicity- oder Proteus-Gesamtfreigabe.

## Kontext und Quellen

- `docs/derived/PROTEUS_RELEASE_SLICING_PLAN.md`
- `docs/derived/PROTEUS_MECHANICS_COVERAGE_ANALYSIS.md`
- `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- `docs/derived/PROTEUS_SPOILER_IMPORT_REPORT.md`

## Scope

- Einen kleinen Kandidatensatz aus sichtbaren, niedrig riskanten Proteus-Karten auswählen.
- Bevorzugte Startkandidaten aus `covered`: einfache ICE, Corp-Upgrades, einfache Operationen, `Disintegrator`, `Streetware Distributor`.
- Optional einzelne einfache `resolver`-Karten nur nach lokalem Kartenvertrag aufnehmen.
- Runtime-Resolver, Manifest, Mechanics-Coverage, Szenario-Smokes und Web-Catalog-Guard für genau diese Karten pflegen.
- Hidden-Info-, LegalAction-, Replay-, StateHash-, stale-action- und illegal-action-Gates nachweisen.

## Nicht im Scope

- Keine Hidden Resources.
- Keine variable Rez-ICE.
- Keine Bad-Publicity-7+-Karten.
- Keine Virus-/Antibody-/Purge-Karten.
- Keine Random-/Würfelkarten.
- Keine `Ice and Data Special Report`-Klärung.
- Keine Proteus-Deckgesamtfreigabe und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Der Kandidatensatz ist klein und enthält keine Karte mit offenem Vertiefungs- oder Quellenblocker.
- [ ] Jede freigegebene Karte hat Runtime-Resolver, Manifest-/Coverage-Eintrag und Szenarioabdeckung.
- [ ] Proteus bleibt außerhalb des Kandidatensatzes blockiert und nicht decklegal.
- [ ] `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- [ ] Visibility, Replay, StateHash, stale-action und illegal-action sind getestet.
- [ ] AI-Support bleibt separat und wird nicht automatisch aus Human-Spielbarkeit abgeleitet.

## Umsetzungshinweise

- Primärer Agent: `release-implementation-agent`.
- Keine Karte aus `deepen` oder `blocked` aufnehmen.
- Bei jedem Zweifel Karte zurückstellen und ein kleineres Folgepaket schneiden.

## Ergebnisnotiz

Noch offen.
