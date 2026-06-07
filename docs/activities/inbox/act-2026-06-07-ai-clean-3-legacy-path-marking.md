---
activityId: act-2026-06-07-ai-clean-3-legacy-path-marking
status: inbox
kind: cleanup
area: ai
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget: ai-clean-legacy-runtime-cleanup
blockedBy:
  - act-2026-06-07-ai-clean-1-legacy-inventory
resultArtifacts: []
checks: []
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

Noch offen.
