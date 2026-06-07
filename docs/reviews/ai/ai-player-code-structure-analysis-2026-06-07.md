# AI-Spieler-Code Struktur- und Wartbarkeitsanalyse

Datum: 2026-06-07  
Status: Architektur-Review, reine Analyse  
Primärer Agent: `architecture-review-agent`  
Scope: `packages/ai`, AI-Livepfad im Server, AI-nahe Tests und aktuelle AI-Review-Dokumentation

## Kurzfazit

Der AI-Spieler-Code ist fachlich deutlich modularer als ein reiner Monolith. Es gibt bereits getrennte Module für AI-Input-DTO, Belief State, Action-Semantik, Tactical Plans, Deck Capabilities, Runner-Strategic-Intent, Run-Target-Evaluation, Hint-Ontology, Diagnose-Reports und Legacy-Planer.

Trotzdem ist die Architektur noch nicht sauber im Dateisystem und in den zentralen Entrypoints aufgetrennt. `packages/ai/src/index.ts` ist mit rund 30.966 Zeilen weiterhin der zentrale Restmonolith. Die Datei bündelt Package-Barrel, Live-Entrypoints, Semantic Runtime, Legacy-Fallback, Baseline-Heuristik, Simulation, Benchmarking, Metrikaggregation und zahlreiche Spezialdiagnosen. `packages/ai/src/index.test.ts` ist mit rund 24.582 Zeilen und 437 Testfällen der entsprechende Testmonolith.

Der aktuelle Stand ist eine Übergangsarchitektur: Semantic Runtime entscheidet im Default-Livepfad, Legacy-Baseline und alte Runner-/Corp-Planer bleiben bewusst als Notaus, Fallback, Referenz und Regressionstestfläche erhalten. Löschen ist derzeit nicht sinnvoll; Markierung, klare Modulgrenzen und schrittweises Herauslösen aus `index.ts` sind die nächsten sinnvollen Wartbarkeitsschritte.

## Quellen und Prüfumfang

Gelesene Projekt- und Architekturquellen:

- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/architecture/ai/README.md`
- `docs/reviews/ai/current-ai-logic-documentation-2026-05-22.md`
- `docs/reviews/ai/semantic-ai-runtime-cutover-2026-06-04.md`
- `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md`
- `docs/reviews/ai/ai-strat-runner-intent-goals-final-report-2026-06-07.md`
- `docs/reviews/ai/ai-clean-1-legacy-ai-code-inventory-2026-06-07.md`
- `docs/reviews/ai/ai-clean-3-legacy-path-marking-2026-06-07.md`

Geprüfte Codebereiche:

- `packages/ai/src/*.ts`
- `packages/ai/src/*.test.ts`
- `apps/server/src/multiplayer.ts`
- `packages/shared/src/index.ts`
- AI-nahe Web-/Maintenance-Fundstellen wurden nur zur Grenzprüfung erwähnt, nicht vollständig reviewt.

Arbeitsbaumhinweis: Zum Analysezeitpunkt lagen bereits lokale Änderungen in `apps/web/app/chronicle.ts`, `apps/web/app/chronicle.test.ts`, `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`, `packages/ai/src/tactical-plans.ts` und `packages/ai/src/tactical-plans.test.ts` vor. Diese Analyse bewertet den sichtbaren Workspace-Stand und nimmt keine Ursache für diese Änderungen an.

## Aktueller Livepfad

Der produktive private Multiplayer-Pfad bleibt regelkonform:

1. `apps/server/src/multiplayer.ts:runAiStep` bestimmt die aktive KI-Seite.
2. Der Server liest aktuelle `LegalActions`.
3. `buildAiDecisionInput` baut aus `GameState`, `PlayerView`, `LegalActions`, side-sicheren Events und optional eigenem Decksnapshot den AI-Input.
4. `chooseAiAction` routet auf Runner oder Corp.
5. `chooseRunnerAction` und `chooseCorpAction` berechnen zuerst Baseline/Legacy-Referenz und delegieren danach an die Semantic Runtime.
6. Die gewählte `actionId` wird erneut gegen aktuelle `LegalActions` geprüft.
7. `applyAction` bleibt finale Regelautorität.

Bewertung: Die zentrale NETGRID-Regel bleibt gewahrt. Die KI erzeugt keine Legalität, liest nicht den FullState als Entscheidungsinput und umgeht `applyAction` nicht. Das Architekturproblem liegt nicht in der Regelautorität, sondern in der Größe und Vermischung der AI-internen Zuständigkeiten.

## Package-Aufbau

`packages/ai/src` ist derzeit flach organisiert:

| Kategorie | Anzahl |
| --- | ---: |
| Source-Dateien ohne Tests | 29 |
| Testdateien | 48 |
| Unterordner | 0 |

Die flache Struktur ist für schnelle `rg`-Suche bequem, verliert aber bei der aktuellen Größe fachliche Grenzen. Es gibt keine sichtbaren Unterbereiche wie `runtime/`, `legacy/`, `semantics/`, `plans/`, `memory/`, `simulation/`, `diagnostics/` oder `test-fixtures/`.

## Größte Source-Dateien

| Datei | Zeilen ca. | Rolle | Bewertung |
| --- | ---: | --- | --- |
| `packages/ai/src/index.ts` | 30.966 | Package-Barrel, Live-Runtime, Legacy-Fallback, Baseline, Simulation, Benchmark, Metriken | zentraler Restmonolith |
| `packages/ai/src/corp-plans.ts` | 8.617 | Legacy-Corp-Planer, Planbewertung, Remote-/Score-/ICE-Portfolio-Diagnostik | groß, aber fachlich zusammenhängend |
| `packages/ai/src/runner-plans.ts` | 8.462 | Legacy-Runner-Planer, Run-/Rig-/Economy-/Remote-Contest-Bewertung | groß, aber fachlich zusammenhängend |
| `packages/ai/src/semantic-ai-production-readiness.ts` | 3.484 | META-/Readiness-Reports | Diagnose-/Review-Schicht |
| `packages/ai/src/tactical-plans.ts` | 3.246 | aktive TacticalPlan-Schicht, PlanMemory, Mapping auf LegalActions | runtime-aktiv, sinnvoll eigenes Modul |
| `packages/ai/src/semantic-ai-core-meta.ts` | 2.686 | META-/Core-Reports | Diagnose-/Review-Schicht |
| `packages/ai/src/controlled-shadow-mode.ts` | 2.360 | Shadow-Harness und Reports | Diagnose-/Shadow-Schicht |
| `packages/ai/src/belief-state.ts` | 1.487 | side-sicherer Belief State, Known-Position-/HQ-/R&D-/Remote-Memory | gutes eigenes Modul |
| `packages/ai/src/action-semantic-candidate.ts` | 1.394 | read-only Projektion von LegalActions in semantische Kandidaten | gutes eigenes Modul |
| `packages/ai/src/deck-doctrine-strategy.ts` | 1.327 | diagnostisches Deckstrategieprofil | Diagnose-/Viewer-Schicht |

## Modulübersicht nach funktionaler Bedeutung

| Funktion | Module | Status |
| --- | --- | --- |
| AI-Package-Entrypoint und Liveentscheidung | `index.ts` | runtime-aktiv, zu breit |
| AI-Input-Projektion und Hidden-Info-Allowlist | `input-dto.ts`, `assertAiInputIsSideSafe` in `index.ts` | zentraler Safety-Baustein, bewusst positiv allowlistend |
| Semantic Runtime | überwiegend `index.ts` | runtime-aktiv, sollte mittelfristig eigenes Modul werden |
| Action-Semantik-Brücke | `action-semantic-candidate.ts` | sinnvoll getrennt und testbar |
| Tactical Plans und PlanMemory | `tactical-plans.ts` | runtime-aktiv, bereits gutes Zielmodul |
| Runner-Strategie/-Ziele | `runner-strategic-intent.ts`, `runner-run-target-evaluation.ts`, `runner-tactical-goals.ts`, `runner-hand-development.ts` | gute neue Modulschicht |
| Deckfähigkeiten | `deck-capabilities.ts` | sinnvoll getrennt, runtime-aktiv über Semantic Runtime |
| Belief/Opponent Memory | `belief-state.ts`, `known-remote-access-payoff.ts`, `known-central-access-payoff.ts` | fachlich sinnvoll getrennt |
| Sichtbare Runanalyse | `visible-run-analysis.ts` | gutes Spezialmodul |
| AI-Hints und Ontologie | `ai-hints.ts`, `hint-ontology.ts`, `hint-ontology-doctrine.ts`, `breaker-ontology-consumer.ts`, `remote-role-ontology-consumer.ts`, `tag-punish-ontology-consumer.ts` | gemischt aus Runtime-Hints und Diagnose-/Consumer-Logik |
| Legacy-Planer | `corp-plans.ts`, `runner-plans.ts` | fallback-/notausrelevant, nicht löschen |
| Simulation und Benchmark | große Teile von `index.ts` | fachlich eigener Bereich, aktuell im Monolith |
| META-/Shadow-/Readiness-Diagnostik | `controlled-shadow-mode.ts`, `shadow-readiness-expansion.ts`, `shadow-scoring-diagnostics.ts`, `semantic-ai-core-meta.ts`, `semantic-ai-production-readiness.ts`, `action-doctrine-goal-diagnostics.ts` | gut als Reports getrennt, aber flach |

## Monolith-Bewertung

### `index.ts`

`index.ts` ist nicht nur ein Export-Barrel. Es enthält mehrere eigentlich getrennte Verantwortlichkeiten:

- Package-Exports und Typweiterleitungen.
- AI-Inputbau über `buildAiDecisionInput`.
- Seitenwahl über `selectAiDecisionSideForState`.
- Live-Entrypoints `chooseAiAction`, `chooseCorpAction`, `chooseRunnerAction`.
- Semantic Runtime einschließlich PlanMapping, PlanMemory, DecisionDebug und Scope-Scoring.
- Legacy-Baseline-Scorer `scoreActions`, `scoreRunnerAction`, `scoreCorpAction`.
- Choice-Auswahl für Mulligan, Discard, Search, Trace, Hidden-Zone- und Spezialfälle.
- Simulationen, Soak, Benchmarkprofile, Deckadapter, Metrikaggregation und Reportformatierung.
- Viele konkrete Metrik-/Diagnose-Helfer, teilweise mit Zugriff auf `GameState` für Simulationen.

Risiko:

- Änderungen an Live-Runtime, Tests, Simulation und Diagnostik kollidieren in derselben Datei.
- Kleine AI-Fixes erhöhen die Wahrscheinlichkeit unbeabsichtigter Seiteneffekte.
- Die Grenze zwischen runtime-aktiv, legacy-fallback, simulation-only und diagnostic-only ist im Code schwerer lesbar als in den Review-Dokumenten.

### `corp-plans.ts` und `runner-plans.ts`

Diese Dateien sind ebenfalls groß, aber stärker fachlich gebündelt. Sie sind nach AI-CLEAN-1/AI-CLEAN-3 bewusst Legacy-Fallback-Planer, nicht primäre Semantic-Runtime-Autorität. Ihr Problem ist weniger Monolithie, sondern Benennung und Erwartungsmanagement: Neue Leser können sie für die aktive Zielarchitektur halten, obwohl sie heute Fallback, Notaus und Testfläche sind.

### `tactical-plans.ts`

`tactical-plans.ts` ist groß, aber fachlich klarer. Es enthält die aktive Planmodellschicht, Planbewertung, PlanMemory und Mapping zurück auf `ActionSemanticCandidate`/`LegalActions`. Das Modul ist ein guter Kandidat für weitere interne Unterteilung, aber kein akuter Monolith-Risikotreiber.

## Testaufbau

Aktueller Testzuschnitt in `packages/ai/src`:

| Datei | Zeilen ca. | Testfälle ca. | Bewertung |
| --- | ---: | ---: | --- |
| `index.test.ts` | 24.582 | 437 | größter Testmonolith |
| `tactical-plans.test.ts` | 1.555 | 29 | gut fokussierte Planmodelltests |
| `semantic-ai-production-readiness.test.ts` | 1.259 | 46 | Readiness-/META-Tests |
| `semantic-ai-runtime-cutover.test.ts` | 1.036 | 20 | fokussierter Runtime-Cutover-Test |
| `controlled-shadow-mode.test.ts` | 732 | 40 | fokussierter Shadow-Vertrag |
| `semantic-ai-core-meta.test.ts` | 656 | 24 | fokussierter META-Test |
| `action-semantic-candidate.test.ts` | 645 | 8 | fokussierte Action-Semantik-Tests |
| `runner-golden-deck-debug.test.ts` | 579 | 9 | fokussierter Golden-Deck-Test, aktuell rot |

### `index.test.ts`

Die Datei bündelt historisch gewachsene Testbereiche:

- MVP-0.3-AI-Controller-Vertrag.
- Runner-AI-Baseline.
- Corp-AI-Baseline.
- Legacy-V1.4.0-Corp-Planer.
- V1.4.1-Runner-Planer.
- V1.4.2-Belief-State und Opponent-Model.
- V1.4.3-Simulation, Selfplay und Exploit-Regression.
- AI-Simulation-Harness.
- MVP-0.9-Stärkere-AI.

Bewertung: Die Datei ist als Sicherheitsnetz wertvoll, aber als Wartungseinheit zu groß. Sie sollte nicht sofort mechanisch zerlegt werden, aber neue Regressionen sollten nicht weiter in `index.test.ts` landen, wenn sie klar einem Zielmodul zugeordnet werden können.

### Dedizierte Tests

Es gibt bereits sinnvolle dedizierte Tests für neue Module:

- `action-semantic-candidate.test.ts`
- `deck-capabilities.test.ts`
- `runner-run-target-evaluation.test.ts`
- `runner-hand-development.test.ts`
- `runner-strategic-intent.test.ts`
- `runner-tactical-goals.test.ts`
- `semantic-ai-runtime-cutover.test.ts`
- `tactical-plans.test.ts`

Bewertung: Das spricht gegen die These eines vollständigen Testmonolithen. Der Testaufbau ist gemischt: neue Schichten sind gut fokussiert, alte Live-/Regressionstests bleiben massiv zentralisiert.

## Aktuelle Verifikation

Ausgeführt am 2026-06-07:

```text
corepack pnpm --filter @netgrid/ai typecheck
```

Ergebnis: grün.

```text
corepack pnpm --filter @netgrid/ai test
```

Ergebnis:

- 48 Testdateien ausgeführt.
- 47 Testdateien bestanden.
- 1 Testdatei fehlgeschlagen.
- 916 Tests insgesamt.
- 914 bestanden.
- 2 fehlgeschlagen.

Fehlgeschlagene Tests:

1. `packages/ai/src/runner-golden-deck-debug.test.ts`
   - Test: `exposes redacted Runner hand-development and creditbase debugfacts`
   - Erwartet: `install-access-card`
   - Erhalten: `run-hq`

2. `packages/ai/src/runner-golden-deck-debug.test.ts`
   - Test: `chooses economy at low credits when no high payoff exists`
   - Erwartet: `gain-credit`
   - Erhalten: `run-hq`

Einordnung: Das ist kein Strukturproblem allein, sondern ein aktueller Bewertungs-/Prioritätskonflikt im Runner-Semantic-/TacticalPlan-Pfad oder in den Testfixtures. Vor größeren Refactorings sollte dieser rote Zustand entweder behoben oder bewusst als erwartete geänderte Entscheidung neu bewertet werden.

## Findings

### Hoch: Zentraler AI-Restmonolith

Betroffen: `packages/ai/src/index.ts`

Risiko: Live-Entscheidung, Legacy-Fallback, Simulation, Benchmark und Diagnose sind in einer Datei gekoppelt. Das erschwert gezielte Änderungen, Review, Testselektion und spätere Entfernung von Legacy-Anteilen.

Empfehlung: `index.ts` als Export-/Facade-Datei zurückbauen. Erste Extraktionsziele:

- `runtime/ai-decision-input.ts`
- `runtime/choose-ai-action.ts`
- `runtime/semantic-runtime.ts`
- `legacy/legacy-baseline.ts`
- `simulation/simulation-harness.ts`
- `simulation/simulation-metrics.ts`
- `simulation/benchmark-reports.ts`

### Hoch: Zentraler Testmonolith

Betroffen: `packages/ai/src/index.test.ts`

Risiko: Die Datei ist schwer zu navigieren, langsam zu verstehen und als Regressionsempfänger überlastet. Neue Tests landen leicht im großen Bestand, auch wenn es passendere Moduldateien gibt.

Empfehlung: Keine Big-Bang-Aufteilung. Stattdessen bei künftigen Änderungen neue Tests direkt an Zielmodule hängen und alte Blöcke schrittweise in Dateien wie diese migrieren:

- `ai-controller-contract.test.ts`
- `legacy-baseline.test.ts`
- `semantic-runtime.test.ts`
- `belief-state-runtime.test.ts`
- `simulation-harness.test.ts`
- `runner-regressions.test.ts`
- `corp-regressions.test.ts`

### Hoch: Aktueller AI-Testlauf rot

Betroffen: `packages/ai/src/runner-golden-deck-debug.test.ts`

Risiko: Der rote Stand blockiert saubere Refactoring-Arbeit, weil nicht klar ist, ob spätere Strukturänderungen echte Regressionen einführen oder bestehende Erwartungsdrift fortschreiben.

Empfehlung: Vor Strukturarbeit die zwei Golden-Deck-Fails klären. Beide Fälle sollten als kleine fachliche Entscheidung behandelt werden: Ist `run-hq` inzwischen korrekt, oder muss Setup/Economy wieder stärker priorisiert werden?

### Mittel: Runtime-, Legacy- und Diagnosegrenzen sind im Code weniger klar als in der Dokumentation

Betroffen: `index.ts`, `runner-plans.ts`, `corp-plans.ts`, `deck-doctrine.ts`

Risiko: Neue Arbeit kann versehentlich Legacy-Pfade erweitern, obwohl die aktive Zielarchitektur Semantic Runtime plus TacticalPlans ist.

Empfehlung: AI-CLEAN-3 fortführen, aber nicht breit umbenennen. Kommentare und Dateinamen sollten die Rollen klar machen: `legacy`, `fallback`, `diagnostic_only`, `runtime_active`.

### Mittel: Flache Ordnerstruktur skaliert schlecht

Betroffen: `packages/ai/src`

Risiko: Fachlich getrennte Module stehen nebeneinander, wodurch Review-Kontext und Ownership verschwimmen.

Empfehlung: Bei der nächsten strukturellen Änderung Unterordner einführen. Nicht alles sofort verschieben; zuerst neue Module in Zielordner legen und bestehende Imports stabil halten.

### Niedrig bis Mittel: Simulation und Benchmarking hängen zu stark am Live-Entrypoint

Betroffen: `index.ts`

Risiko: Simulation braucht teilweise andere Daten und Metriken als Live-Runtime. Diese Vermischung erhöht die Dateigröße und erschwert Safety-Review, weil Simulation bewusst mit `GameState` arbeitet, während der Live-Input side-sicher bleiben muss.

Empfehlung: Simulation und Benchmarking als eigene Schicht auslagern. Live-Runtime sollte nur `AiDecisionInput -> AiDecision` verantworten.

## Empfohlene nächste Schritte

### Schritt 1: Teststatus stabilisieren

Ziel: `@netgrid/ai test` wieder grün bekommen.

Fokus:

- `runner-golden-deck-debug.test.ts`
- Entscheidung `run-hq` vs. `install-access-card`
- Entscheidung `run-hq` vs. `gain-credit`

Akzeptanz:

- `corepack pnpm --filter @netgrid/ai test` grün.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.

### Schritt 2: Extraktionsschnitt ohne Logikänderung

Ziel: `index.ts` verkleinern, ohne Verhalten zu ändern.

Empfohlener erster Schnitt:

- `buildAiDecisionInput`, `selectAiDecisionSideForState`, Side-Safety-Helfer nach `runtime/ai-decision-input.ts`.
- `chooseAiAction`, `chooseRunnerAction`, `chooseCorpAction` nach `runtime/choose-ai-action.ts`.
- Semantic-Runtime-Helfer nach `runtime/semantic-runtime.ts`.
- `index.ts` re-exportiert nur noch.

Akzeptanz:

- Keine Score-/Prioritätsänderung.
- Bestehende Tests unverändert grün.
- Importoberfläche `@netgrid/ai` bleibt stabil.

### Schritt 3: Legacy-Baseline markieren und isolieren

Ziel: Verhindern, dass Legacy-Fallback mit Zielarchitektur verwechselt wird.

Empfohlener Schnitt:

- `chooseRunnerBaselineAction`, `chooseCorpBaselineAction`, `scoreActions`, `scoreRunnerAction`, `scoreCorpAction`, `decisionFromChoices` in `legacy/legacy-baseline.ts`.
- Keine Entfernung, solange Notaus und No-Candidate-Fallback bestehen.

### Schritt 4: Simulation auslagern

Ziel: Live-Runtime und Benchmarking trennen.

Empfohlener Schnitt:

- `simulateAiGame`, `simulateAiSoak`, Benchmark-Deckadapter und Reportformatierer nach `simulation/`.
- Metrikaggregation nach `simulation/simulation-metrics.ts`.
- Exploit-Fixtures nach `simulation/exploit-fixtures.ts` oder dediziertem Test-Helfer.

### Schritt 5: Testdateien nach fachlichen Modulen aufteilen

Ziel: `index.test.ts` nicht weiter wachsen lassen und langfristig schrittweise verkleinern.

Priorisierte Blöcke:

1. Controller-/DTO-/Hidden-Info-Vertrag.
2. Legacy-Baseline.
3. Semantic Runtime.
4. Belief-/Memory-Regressions.
5. Simulation/Benchmark.
6. Konkrete Runner-/Corp-Regressionen.

## Was nicht empfohlen wird

- Kein Löschen der alten Runner-/Corp-Planer ohne neuen Vertrag für Legacy-Notaus und No-Candidate-Fallback.
- Keine Big-Bang-Refaktorierung über alle AI-Dateien.
- Keine Änderung an `LegalActions`, `applyAction`, Replay, StateHash oder Hidden-Info-Projektion im Rahmen dieser Wartbarkeitsarbeit.
- Keine Verschiebung von Tests ohne vorher grünen Ausgangszustand.

## Gesamtbewertung

Der AI-Spieler-Code ist fachlich ernsthaft ausgebaut und in vielen neuen Schichten bereits sinnvoll getrennt. Der aktuelle Zustand ist nicht "alles Monolith", sondern "ausgebaute Module plus zentraler historisch gewachsener Restmonolith".

Die wichtigsten Architekturgrenzen von NETGRID sind intakt: Engine-Korrektheit, LegalAction-Bindung, side-sichere AI-Inputs, Debug-Redaction und `applyAction` als finale Autorität. Die größte Wartbarkeitsschuld liegt in `index.ts` und `index.test.ts`, nicht im Grundmodell der KI.

Der beste nächste Weg ist klein und sequenziell: erst roten Teststatus klären, dann Entrypoints, Semantic Runtime, Legacy-Baseline und Simulation in eigene Module ziehen, danach Tests entlang derselben Grenzen aufteilen.
