---
activityId: act-2026-05-24-proteus-phase-9e-rule-blocked-preflight
status: resolved-by-done-activity
kind: research
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: false
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-29
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 9e
proReferences:
  - PRO019
blockedBy: []
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-9e-rule-blocked-preflight.md
  - docs/activities/done/act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities.md
  - docs/releases/proteus/README.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
checks:
  - rg Ice and Data Special Report / Cost 3 (0) in local source, import, card data and Proteus release docs
  - node JSON parse data/manifests/proteus-card-support.json
  - git diff --check
---

# Proteus Phase 9e: Rule-Blocked Preflight

## Ziel

`Ice and Data Special Report` fachlich klären, bevor ein Runtime-Slice entschieden wird.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9e Rule-Blocked Preflight`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- Lokale Kartenquelle mit Kostenangabe `Cost 3 (0)`.

## Zielkarte

- `onr_proteus_111_ice-and-data-special-report` Ice and Data Special Report

## Scope

- Regel-/Quellenklärung der Kostenangabe `Cost 3 (0)`.
- Entscheidung, ob Hidden-Zone-Search, expose/reveal, alternative Kosten oder ein anderer Resolver betroffen ist.
- Dokumentierter Blocker oder dokumentierte Freigabe für einen späteren Implementierungsslice.

## Nicht im Scope

- Keine Runtime-Umsetzung ohne dokumentierte Kostenentscheidung.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [x] Quellenlage und Kosteninterpretation sind dokumentiert.
- [x] Falls blockiert, ist der Blocker präzise im Activity-/Release-Kontext festgehalten.
- [ ] Falls freigegeben, existiert ein enger Umsetzungsschnitt mit klaren Akzeptanzkriterien.
- [x] Manifest-/Release-Status bleiben konsistent.

## Quellenlage und Blocker

Die lokale Primärquelle `docs/source/Proteusspoiler.txt` führt `Ice and Data Special Report` mit Text `Expose up to five cards installed in or on a single data fort.` und Kostenzeile `Cost: 3 (0)`. Der Proteus-Import hat diese Kostenangabe bewusst nicht als eindeutigen numerischen Play-Cost übernommen: `data/cards/proteus-cards.json` und `data/card-import/proteus-card-basis-2026-05-17.json` führen `numeric.cost: null` für `onr_proteus_111_ice-and-data-special-report`.

Damit ist nicht belastbar entschieden, ob die Karte als Prep/Event mit Kosten 3, mit alternativer Klammerkosten-Semantik `0`, mit einem Druck-/Quellenartefakt oder mit einem anderen Zusatzkosten-/Timingmodell umzusetzen ist. Der eigentliche Effekt wäre wahrscheinlich ein vorhandener oder enger `expose_installed_cards`-Resolver für bis zu fünf Karten in oder auf einem einzelnen Data Fort. Ohne Kostenentscheidung wäre aber bereits die LegalAction-Projektion falsch: `runner_prep_play` müsste Kosten, Timing und Revalidierung kennen, bevor eine CardImplementation sicher freigegeben werden kann.

Blocker: Es braucht eine dokumentierte Quellen-/Regelentscheidung zur Kostenangabe `3 (0)`. Bis dahin bleibt `onr_proteus_111_ice-and-data-special-report` `blocked`, nicht `implemented`, nicht `engine_supported`, nicht `playable`, nicht `human_playable`, nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`.

## Ergebnisnotiz

Blockiert am 2026-05-24; durch PRO019 am 2026-05-29 als Statusreferenz aufgelöst.

PRO019 dokumentiert und implementiert die lokale Regelentscheidung: `Ice and Data Special Report` hat Play-Cost 3; die Klammerangabe `(0)` wird als Quellen-/Druckartefakt behandelt und nicht als alternativer Kostenpfad. Der Effekt nutzt eine runnerprivate Expose-Choice für bis zu fünf installierte Korp-Karten in oder auf einem einzelnen Data Fort. Die Karte hat eine konkrete CardImplementation-Datei, Registry-/Manifest-/Coverage-Parität und fokussierte LegalAction-/applyAction-/Replay-Abdeckung. Keine Decklegalität, Formatlegalität oder AI-Freigabe.
