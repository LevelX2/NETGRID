# AI-Reviews und Benchmarks

`docs/reviews/ai/` enthält KI-bezogene Audits, Diagnoseberichte, Benchmark-Nachweise und Beobachtungen, die nicht als dauerhafte Architekturvorgabe oder einzelne Releasefamilie geführt werden.

## Enthaltene Artefakte

- `capability-deep-analysis-2026-05-17.md`: übergreifende KI-Fähigkeitsanalyse mit Prioritäten.
- `current-ai-logic-documentation-prompt-2026-05-22.md`: Prompt für eine umfassende, aktuelle Ist-Dokumentation der bestehenden KI-Logik als Grundlage für spätere Prüfung und Verbesserungsvorschläge.
- `ai-hints-support-contract-review-2026-05-22.md`: aktueller 410/411-Support-Contract, Toughonium-Wall-Entscheidung und priorisierte schwache AI-Hints.
- `ai-hint-consumer-contract-audit-2026-05-25.md` / `ai-hint-consumer-contract-inventory-2026-05-25.json`: Audit der AI-Hint-Verbraucherseite mit vollständigem Rollen-/Planrollen-Inventar, Entscheidungswirksamkeit, Lückenanalyse und rückwärtskompatiblem Ontologie-Vorschlag.
- `ai-hints-semantic-quality-audit-2026-05-25.md`: semantischer Qualitätsaudit priorisierter AI-Hints gegen Kartentext, Implementation und tatsächliche KI-Verbraucherpfade inklusive drei fokussierter Hintkorrekturen.
- `ai-hint-quality-gates-and-ontology-roadmap-2026-05-25.md` / `ai-hint-ontology-roadmap-2026-05-25.md`: kleiner maschinenlesbarer Hint-Quality-Gate-Slice mit Benchmark-Deck-Hint-Coverage und rückwärtskompatibler Ontologie-Roadmap.
- `ai-hint-ontology-redesign-proposal-2026-05-25.md`: langfristiger Redesign-Vorschlag für AI-Hints als strategische, side-safe Ontologie mit Schema, Beispielkarten, Verbraucherarchitektur, Migration und Risiken.
- `ai-hint-ontology-phase1-validation-2026-05-25.md`: Phase-1-Umsetzung der read-only Hint-Ontology-Validation mit Union Types, Hidden-Info-Safety und Legacy-Compatibility-Ergebnis.
- `ai-benchmark-card-hint-ontology-pilot-2026-05-25.md`: Phase-2-Pilotmigration strukturierter, read-only Ontology-Felder für Benchmark- und High-Impact-Karten ohne Planerwirkung.
- `ai-hint-ontology-phase3a-doctrine-diagnostics-2026-05-25.md`: Phase-3a-Umsetzung einer zentralen read-only Deck-Ontology-Summary für Diagnose ohne Action-Score- oder Planerwirkung.
- `ai-breaker-ontology-consumer-benchmark-2026-05-25.md`: Safety-/Benchmark-Check des BreakerProfile/CostProfile-Consumers mit 8-Slot-Suite, Guardrails, Evidence-Auswertung und Empfehlung.
- `ai-breaker-ontology-first-class-metrics-2026-05-25.md`: reiner Diagnose-/Metrik-Slice, der BreakerProfile-/CostProfile-Nutzung als First-Class-Match-Progression-Metriken ausweist und Local Pair 2 neu einordnet.
- `ai-hint-ontology-remote-role-consumer-2026-05-25.md`: enger Consumer-Slice für strukturierte `remoteRole`-/`run_tax`-/`scoring_protection`-Hints in Corp Remote-Safety und Remote-Portfolio-Diagnostik inklusive First-Class-Metriken und 8-Slot-Benchmark.
- `ai-hint-ontology-tag-punish-consumer-2026-05-25.md`: enger Consumer-Slice für strukturierte Tag/Punish-Source-/Payoff-/Condition-Hints mit LegalAction-/Tag-State-Vorrang, First-Class-Metriken und 8-Slot-Benchmark.
- `ai-release-default-readiness-review-2026-05-25.md`: konsolidierter Release-/Default-Review des aktuellen KI-Optimierungsstands mit Slice-Inventar, 8-Slot-Benchmark, Merge-/Default-Optionen und Release-Kriterien.
- `ai-release-default-gates-2026-05-25.md`: technische Release-/Default-Gate-Checkliste und Profilpolicy, die `belief_ai_v1_4_2` als stabile Benchmark-Baseline und `current_candidate` als profile-gated Candidate absichert.
- `ai-derived-basic-facts-architecture-prototype-2026-05-25.md` / `ai-derived-basic-facts-prototype-2026-05-25.json`: read-only Architektur- und Prototype-Report zur Ableitung mechanischer Basic-AI-Facts aus CardImplementations, damit manuelle Hints langfristig strategisches Overlay bleiben.
- `ai-benchmark-deck-basis-review-2026-05-23.md`: Klassifikation der aktuell genutzten AI-Smoke-/Soak-/League-/Progression-Decks und Empfehlung für eine kuratierte Benchmark-Decksuite.
- `ai-strategy-slices-consolidation-review-2026-05-23.md`: konsolidierte Bilanz der letzten AI-Strategie-/Diagnose-Slices inklusive aktueller Baseline-vs-Candidate-Suite, Ablation-light und Empfehlungen.
- `ai-plan-conversion-diagnosis-2026-05-23.md`: Planfolge-/Conversion-Diagnose für aktuelle KI-Slices mit neuen Short-Horizon-Metriken, Slotanalyse und Empfehlungen ohne neue Strategie-Heuristik.
- `ai-optimization-release-merge-review-2026-05-23.md`: Release-/Merge-Review des gesamten AI-Optimierungsbranches mit Änderungsklassifikation, Profilentscheidung, Benchmark-Zusammenfassung, Merge-Option und Test-/Gate-Plan.
- `ai-actionlimit-stability-and-repro-cases-2026-05-23.md`: zusätzliche 160er Seed-Stabilitätsanalyse der ActionLimit-/Endgame-Diagnose mit konkretem Repro-Korpus für problematische Slots.
- `ai-runner-phase-and-local-pair1-trace-2026-05-24.md`: enger Trace-/Diagnose-Slice zu Runner-Endgame-Closeout-Dedupe, Local-Pair-1-Repro-Seeds `001`/`005` und Runner-Phasen-/Breaker-Coverage-Befund ohne Strategieänderung.
- `ai-post-memory-freshness-benchmark-2026-05-24.md`: konsolidierter 160er Full-Suite-Benchmark nach Trash-Budget-, Future-Effect-/Pump- und R&D-Freshness-Fixes.
- `ai-real-scene-deck-suite-expansion-2026-05-24.md`: Aktivierung von zwei frozen Real-Scene-/Constructed-Holdout-Paaren mit Validierung, Hashes und erstem 160er Benchmarkbefund.
- `ai-corp-score-failure-diagnosis-2026-05-24.md`: Diagnose der verbleibenden Corp-Score-Schwächen nach Effective-Remote-Safety und Protection->Score-Conversion inklusive Metrikkorrektur und Slot-Traces.
- `ai-advance-to-score-window-compression-2026-05-24.md`: enger Corp-Slice zur Advance-to-Score-Window-Kompression mit neuen Verzögerungsmetriken, 8-Slot-Benchmark und Bewertung der verbleibenden Corp-Score-Schwächen.
- `ai-local-pair2-actionlimit-and-remote-portfolio-diagnosis-2026-05-24.md`: Diagnose der verbleibenden ActionLimit-/Stagnationssignale nach Remote-Portfolio-/HQ-Density-Slice mit Fokus auf Local Pair 2 und Remote-Ice-Consolidation-Metrik.
- `ai-tag-punish-terminal-conversion-diagnosis-2026-05-24.md`: gezielte Diagnose zu Tag-/Trace-/Punish-Terminalkonversion mit Local-Pair-2-Repro-Traces, Snapshot-Holdout-/Real-Scene-Vergleich und Metriklücken.
- `ai-tag-punish-terminal-window-metrics-2026-05-24.md`: reiner Diagnose-Metrik-Slice für Tag/Punish-Terminalfenster mit neuen Funnel-Metriken und 8-Slot-Suite-Auswertung.
- `match-progression-deck-suite-benchmark-2026-05-23.md`: deckseitig getrennte Progression-Suite mit Demo-Smoke, kuratierten Snapshot-Tuning-/Holdout-Paaren und pending Real-Scene-Holdouts.
- `match-progression-benchmark-2026-05-23.md`: erweiterter Progression-Benchmark mit Tuning- plus Holdout-Seeds, Profilvergleich und Stagnationsbefund zu Remote-Advances/Trash.
- `ai-hints-role-gap-report-2026-05-17.md`: Rollenlücken in AI-Hints und Folgepakete.
- `live-doctrine-input-path-audit-2026-05-17.md`: Audit der Live-Doctrine-Eingangspfade.
- `match-progression-benchmark-2026-05-17.md`: Diagnosepfad für Matchprogression.
- `discard-regression-review-2026-05-18.md`: Regression-Review für Discard-Entscheidungen.
- `corp-remote-scoring-hardening-2026-05-15.md`: Härtungsnotiz zu Corp Remote Scoring.
- `runner-archives-repeat-access-observation-2026-05-13.md`, `runner-hq-repeat-access-observation-2026-05-12.md`, `runner-rnd-repeat-access-observation-2026-05-08.md`: historische Runner-KI-Repeat-Access-Beobachtungen.

## Regel

Reviews bleiben als Evidence versioniert. Verdichtung erfolgt nur über ein separates Rollup mit Linkprüfung.
