---
activityId: act-2026-08-22-run-start-credit-source-constant-name
status: inbox
kind: cleanup
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Run-Start-Credit-Quellenkonstante präzise benennen

## Ziel

Die irreführende Konstante `TAG_HANDSIZE_ASSET_SOURCE` so umbenennen, dass ihr
tatsächlicher Vertrag – Creditverlust beim Run-Start – aus Name und
Verdrahtung erkennbar ist.

## Kontext und Quellen

- Regel-Engine-Review Batch 4 vom 2026-08-22.
- `packages/engine/src/mechanics/global-modifiers.ts`
- Die Konstante ist über mehrere Bootstrap-Schichten verdrahtet; ein
  Regelfehler wurde nicht festgestellt.
- Aktivierungsauslöser: nächste Änderung am betroffenen Run-Start-Modifier oder
  ein gezielter technischer Cleanup-Schnitt.

## Scope

- Alle Definitionen, Imports, Ports und Tests der Konstante erfassen.
- Eine fachlich präzise englische Benennung wählen und atomar umstellen.
- Sicherstellen, dass nur das Symbol, nicht Capability-Key, ActionId, Payload
  oder Kartenwirkung geändert wird.

## Nicht im Scope

- Änderung des Creditverlusts, Timings oder der Kartenbindung.
- Allgemeine Umbenennung weiterer Modifier-Symbole.
- Kompatibilitätsalias für das interne V0-Symbol.

## Akzeptanzkriterien

- [ ] Der neue Name beschreibt die Run-Start-Creditverlust-Semantik.
- [ ] Alle Compile-Time-Verbraucher sind atomar umgestellt.
- [ ] Keine persistierte oder öffentliche Kennung wurde verändert.
- [ ] Fokussierte Modifier-/Run-Start-Tests und erforderliche Typechecks sind
      grün.

## Umsetzungshinweise

- Vor der Umsetzung prüfen, ob der aktuelle Code die Konstante noch in
  derselben Bedeutung verwendet.
- Reiner technischer Refactor; kein zusätzlicher Verhaltenstest ohne
  Erkenntnisfrage.

## Ergebnisnotiz

Noch offen.
