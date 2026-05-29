# Aufgabe 041 - Compiled Hint Runtime Pilot

## Kurzfazit

Aufgabe 041 ist als echter Runtime-Cut umgesetzt. `packages/ai/src/ai-hints.ts` lädt AI-Hints jetzt aus `data/ai/ai-card-hints-compiled.json` statt direkt aus `data/ai/ai-card-hints-active.json`. Das compiled Artefakt enthält alle 410 aktiven AI-Hints, markiert die 10 Pilotkarten mit `runtimeCompiledHintPilot: true`, übernimmt Generated Facts für 193 Karten und nutzt für 217 Karten Legacy-Fallback.

Der Schritt ist kein weiterer Shadow-Review: die bestehenden Consumer (`breakerProfile`, `targetProfiles`, `remoteRole`, Tag/Punish-Ontologie und Future-ICE-Klassifikation) sehen die compiled Hints im normalen Runtimepfad.

## Pilotkarten

- Runner: `Loony Goon`, `Krash`, `Self-Modifying Code`, `Mystery Box`, `Scatter Shot`
- Corp: `BBS Whispering Campaign`, `Ball and Chain`, `Canis Major`, `Scorched Earth`, `Red Herrings`

Alle 10 Karten sind in `data/ai/ai-compiled-hint-runtime-pilot-cards-2026-05-25.json` versioniert und im compiled Artefakt als Runtime-Pilot markiert.

## Compiler-Architektur

Neuer Buildpfad:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm check:ai-compiled-hints`
- Implementierung: `scripts/build-ai-compiled-hints.mjs`
- Artefakt: `data/ai/ai-card-hints-compiled.json`
- Maschinenreport: `docs/reviews/ai/aufgabe-041-compiled-hint-runtime-pilot-report-2026-05-25.json`

Quellen:

- aktiver Legacy-Monolith `data/ai/ai-card-hints-active.json`
- Generated Facts aus `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`
- optionale Overlays aus `data/ai/hints/overlays/`

Der Compiler führt mechanische Felder additiv zusammen. Aktive Legacy-Felder bleiben erhalten; Generated Facts ergänzen `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole` und `targetProfiles`. Overlays ergänzen nur Strategie-/Qualitätsfelder. Der Validator blockt Hidden-Info-Felder, Runtime-/Legalitätsfelder, unbekannte Ontology-Werte, `aiSupportStatus`-Drift, Legacy-Feld-Drift und die spezifischen SMC/BBS/Ball/Canis-Guards.

## Generated Facts

Wichtige Pilot-Facts:

- `Loony Goon`: `breakerProfile.coverage = ["sentry"]`, `pumpCost = 1`, `breakCost = 1`.
- `Krash`: `breakerProfile.coverage = ["universal"]`, `pumpCost = 2`, `breakCost = 2`.
- `Self-Modifying Code`: `effect:search`, `condition:requires_during_run`, `targetProfiles.installCost = "normal"`, kein `install_discount`.
- `Mystery Box`: `effect:search`, `effect:topdeck_info`, `effect:install_discount`, `targetProfiles.installCost = "free"`, `oncePerRun = true`.
- `Scatter Shot`: `effect:trash_credit`.
- `BBS Whispering Campaign`: `effect:finite_economy_pool`, `effect:action_economy`, `remoteRole.kind = "asset_economy"`; aktueller Pool bleibt Boardstate.
- `Ball and Chain` / `Canis Major`: zusätzlich `effect:future_encounter_effect` und `condition:requires_remaining_ice`.
- `Scorched Earth`: `effect:damage`, `effect:tag_punish_payoff`, `condition:requires_runner_tagged`.
- `Red Herrings`: `remoteRole.kind = "agenda_steal_tax"` plus Run-/Access-Tax-Facts.

## Tests und Benchmark

Ergänzte Runtime-Tests: `packages/ai/src/compiled-hints-runtime.test.ts`.

Fokusabdeckung:

- 410 compiled Hints im Runtime-Loader.
- Nicht-Pilotkarte bleibt legacy-identisch.
- Pilotkarten behalten Legacy-Felder und erhalten Generated Facts.
- Breaker-, Search-, RemoteRole-, Tag/Punish- und Future-ICE-Consumer sehen compiled Facts.
- Hidden-State-/LegalAction-Felder bleiben draußen.

8-Slot-Benchmark:

- Befehl: `runMatchProgressionBenchmarkSuite({ includeHoldout: true, maxActions: 160, baselineProfile: "belief_ai_v1_4_2", candidateProfile: "current_candidate" })`
- Slots: 8/8 runnable, 72 Games pro Profil.
- Safety: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.
- Candidate global: `corpScores = 61` vs Baseline `52`; `runnerSteals = 118` vs Baseline `132`; `ActionLimitRate` praktisch unverändert (`2.778` vs `2.779` aufsummierte Slotraten).
- Compiled/Consumer-Signale im Candidate: `runnerRemoteRoleProfilesSeen = 3`, `runnerRemoteRoleUsedForTrashValue = 3`, `corpRemoteRoleProfilesSeen = 52`, `corpRemoteRoleUsedForSafety = 45`, `corpTagPunishPayoffOntologyUsed = 31`, `futureEffectSubroutinesEncountered = 4`.

## Gate-Ergebnis

Der 10-Karten-Pilot ist grün. Der Compiler ist im selben Task auf das vollständige 410-Karten-Artefakt erweitert:

- 410 compiled entries.
- 193 Karten mit Generated Facts.
- 217 Karten nur Legacy-Fallback.
- 6 Karten mit Manual Overlay.
- 0 Hard Errors, 0 Warnings im Aufgabe-041-Report.

Kein Full-Cutover-Blocker für den aktuellen compiled Runtimepfad. Ein fachlich größerer nächster Schritt bleibt die Ausweitung von Generated-Facts-Derivern über die 193 bereits abgedeckten Karten hinaus und eine weitere Beobachtung der Benchmark-Metriken, bevor daraus eine AI-Profil- oder Default-Promotion abgeleitet wird.

`corepack pnpm --filter @netgrid/catalog test` wurde als zusätzlicher Check ausgeführt, aber nicht als Aufgabe-041-Blocker gewertet. Der rote Befund stammt aus bekannter Proteus-/Catalog-Baseline-Drift: neu implementierte Proteus-Karten verändern `EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS` von 87 erwarteten auf 113 sichtbare Runtime-Karten. Aufgabe 041 ändert keine Proteus-/Catalog-Dateien und keine Card-Support-Artefakte.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine Änderung an LegalActions oder `applyAction`.
- Keine neue Legalität.
- Keine Änderung an `aiSupportStatus`.
- Keine Profil-/Default-Umschaltung.
- Keine neuen Decks.
- Keine manuelle Massenänderung an `data/ai/ai-card-hints-active.json`.
- Keine Hidden-Info-Nutzung.
- Keine Proteus-/Catalog-Baseline-Änderung.
