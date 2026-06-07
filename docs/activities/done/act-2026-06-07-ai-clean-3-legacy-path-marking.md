---
activityId: act-2026-06-07-ai-clean-3-legacy-path-marking
status: done
kind: cleanup
area: ai
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget: ai-clean-legacy-runtime-cleanup
blockedBy:
  - act-2026-06-07-ai-clean-1-legacy-inventory
resultArtifacts:
  - docs/reviews/ai/ai-clean-3-legacy-path-marking-2026-06-07.md
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Legacy fallback V1.4.0 plan-based Corp AI|bounded legacy Corp plan weight"
  - corepack pnpm exec prettier --check docs/reviews/ai/ai-clean-3-legacy-path-marking-2026-06-07.md docs/activities/done/act-2026-06-07-ai-clean-3-legacy-path-marking.md
  - git diff --check -- packages/ai/src/runner-plans.ts packages/ai/src/corp-plans.ts packages/ai/src/deck-doctrine.ts packages/ai/src/index.test.ts docs/reviews/ai/ai-clean-3-legacy-path-marking-2026-06-07.md docs/activities/done/act-2026-06-07-ai-clean-3-legacy-path-marking.md docs/activities/inbox/act-2026-06-07-ai-clean-3-legacy-path-marking.md
---

# AI-CLEAN-3: Verbleibende Legacy-/Diagnosepfade eindeutig markieren

## Ziel

KI-Pfade, die nach AI-CLEAN-1 bewusst bleiben, sollen im Code, in Debug-Ausgaben und in nahen Tests eindeutig als `diagnosticOnly`, `legacyFallback`, `testFixtureOnly` oder vergleichbar erkennbar sein, damit sie nicht mehr mit der live entscheidenden Semantic-/TacticalGoal-Schicht verwechselt werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-07: AI-Cleanup in kleine Activity-Pakete schneiden.
- Vorgeschaltetes Paket: `act-2026-06-07-ai-clean-1-legacy-inventory`.
- Erwartetes Review-Artefakt: `docs/reviews/ai/ai-clean-1-legacy-ai-code-inventory-2026-06-07.md`.
- Bekannte Nähe: diagnostische Deckprofile, Deckeditor-Analyseausgabe, Benchmark-Snapshots, Golden-Deck-Fixtures, KnownRemote/KnownCentral-Payoff-Tests und Fallbacks für noch nicht abgedeckte Corp-/ICE-/Agenda-Planung.

## Scope

- Pfade aus AI-CLEAN-1 mit Klassifikation `diagnostic_only`, `fallback_only`, `test_only` oder `keep_but_rename` prüfen und klar benennen.
- Irreführende Debug-Bezeichnungen korrigieren, etwa wenn alte PlanWeights oder Profile wie live wirksame Runtime-Pläne wirken, aber `plannerEffect: none` oder nur Diagnosefunktion haben.
- Kleine Typ-/Feld-/Kommentar-/Testnamen ergänzen oder anpassen, wenn dadurch die Rolle eindeutig wird.
- Falls UI-/Debug-Ausgaben betroffen sind, sicherstellen, dass sichtbare Beschriftungen nicht suggerieren, ein diagnostisches Profil steuere direkt die Action-Auswahl.

## Nicht im Scope

- Keine Entfernung von Code, der bereits in AI-CLEAN-2 behandelt werden soll.
- Keine neue KI-Logik, keine neue Scoring-Kalibrierung und keine neue Plannerwirkung.
- Keine Änderung an Engine, `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Grenzen.
- Keine breite UI-Umgestaltung; nur klare Benennung und kleine Debug-/Diagnose-Korrekturen.
- Keine neuen Strategy-IDs, Taktiksignale oder Kartensemantikänderungen.

## Akzeptanzkriterien

- [ ] Alle in AI-CLEAN-1 als verbleibend, aber potenziell missverständlich markierten Pfade tragen eindeutige technische Benennung oder nahe Dokumentation.
- [ ] Debug-/Viewer-Felder unterscheiden live wirksame Runtime-Intent-/TacticalGoal-Daten von diagnostischen Profilen, Legacy-Fallbacks und Testfixtures.
- [ ] Alte PlanWeights oder Doctrine-Profile werden nicht als aktuelle fachliche Wahrheit dargestellt, wenn sie nur Diagnose, Fallback oder Fixture sind.
- [ ] Tests oder Snapshots, die bewusst Legacy-/Diagnoseverhalten prüfen, benennen diesen Zweck ausdrücklich.
- [ ] Keine öffentliche Debug-Ausgabe leakt vollständige eigene Deckliste, Deckreihenfolge, private Snapshot-ID oder gegnerische Hidden-Info.
- [ ] Relevante `@netgrid/ai`- und gegebenenfalls `@netgrid/web`-Checks sowie `git diff --check` sind ausgeführt oder begründet ausgelassen.

## Umsetzungshinweise

- Mögliche Benennungen: `diagnosticOnly`, `legacyFallback`, `testFixtureOnly`, `plannerEffect: "none"`, `deprecatedButKeptUntilCorpPlanUpgrade`.
- Nicht nur Kommentare setzen, wenn ein Feldname oder eine UI-/Debug-Beschriftung aktiv missverständlich ist.
- Falls größere Umbenennungen nötig würden, das Paket klein halten und weitere Follow-up-Activities anlegen.

## Ergebnisnotiz

Legacy-/Diagnosemarkierung ergänzt: Runner- und Corp-Planerexports sind jetzt als Legacy-Fallback-Planer kommentiert, Doctrine-PlanWeights sind als Legacy-Fallback-Weights markiert, und nahe Tests benennen den V1.4.0-Corp-Planer sowie Doctrine-PlanWeights als Legacy-Fallback-Kontext. Zusätzliches Review-Artefakt erstellt. Keine neue KI-Logik, keine Score-Kalibrierung, keine Debug-Payload-Erweiterung und keine Hidden-Info-/Engine-Grenzänderung. Prettier für die berührten Legacy-Code-Dateien wurde bewusst nicht als Paketcheck verwendet, weil diese Dateien bereits vor diesem Paket whole-file-Formatdrift aufweisen; geprüft wurden Typecheck, gezielte Tests, Markdown-Prettier und `git diff --check`.
