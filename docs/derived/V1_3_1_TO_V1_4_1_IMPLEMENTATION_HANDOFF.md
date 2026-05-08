# V1.3.1 to V1.4.1 Implementation Handoff

Stand: 2026-05-08
Status: bereit für Folgeumsetzung

## Zweck

Dieses Handoff fasst die Detailplanung für die nächsten drei Releases nach V1.3.0 zusammen. Es ist der empfohlene Einstiegspunkt für den Umsetzungsthread.

## Reihenfolge

1. V1.3.1: Card Data Pipeline v2.
2. V1.4.0: Planbasierte Corp-KI.
3. V1.4.1: Planbasierte Runner-KI.

Die Reihenfolge ist hart:

- V1.3.1 darf erst nach grünem V1.3.0-Final-Gate starten.
- V1.4.0 darf erst nach grünem V1.3.1-Final-Gate starten.
- V1.4.1 darf erst nach grünem V1.4.0-Final-Gate starten.
- AI-Hints erzeugen keine KI-Freigabe.
- Plan-KI darf nur LegalActions bewerten und eine LegalAction auswählen.

## Verbindliche Artefakte

### V1.3.1

- `docs/derived/V1_3_1_CARD_DATA_PIPELINE_V2_DETAILED_PLAN.md`
- `docs/derived/V1_3_1_REQUIREMENTS.md`
- `docs/derived/CARD_DATA_PIPELINE_1_3_1_SPEC.md`
- `docs/derived/V1_3_1_TEST_MATRIX.md`
- `docs/derived/V1_3_1_REQUIREMENTS_REVIEW.md`

### V1.4.0

- `docs/derived/V1_4_0_PLAN_BASED_CORP_AI_DETAILED_PLAN.md`
- `docs/derived/V1_4_0_REQUIREMENTS.md`
- `docs/derived/PLAN_BASED_CORP_AI_1_4_0_SPEC.md`
- `docs/derived/V1_4_0_TEST_MATRIX.md`
- `docs/derived/V1_4_0_REQUIREMENTS_REVIEW.md`

### V1.4.1

- `docs/derived/V1_4_1_PLAN_BASED_RUNNER_AI_DETAILED_PLAN.md`
- `docs/derived/V1_4_1_REQUIREMENTS.md`
- `docs/derived/PLAN_BASED_RUNNER_AI_1_4_1_SPEC.md`
- `docs/derived/V1_4_1_TEST_MATRIX.md`
- `docs/derived/V1_4_1_REQUIREMENTS_REVIEW.md`

## Wichtigste Entscheidungen

- V1.3.1 ist ein Datenpipeline- und Reviewrelease, kein Kartenrelease.
- V1.3.1 führt AI-Hints v2 ein, aber Hints setzen `ai_supported` nicht selbst.
- V1.4.0 baut zuerst die Corp-Plan-KI.
- V1.4.1 baut danach die Runner-Plan-KI.
- V1.4.0/V1.4.1 sind AI-Level-2-Arbeit: Planung und bessere Bewertung, aber kein Belief State.
- Belief State, Gegner-Modell, Simulation und Selfplay bleiben V1.4.2/V1.4.3.
- Keine neuen Karten, Mechaniken, offiziellen Assets oder Public-Plattformfunktionen in diesen drei Releases.

## Harte Dauer-Gates

Jede Umsetzung muss grün halten:

- Rules Engine bleibt einzige Regelautorität.
- UI, Server, menschliche Spieler und KI reichen nur LegalActions-abgeleitete PlayerActions ein.
- `applyAction` revalidiert Side, actionId, stateVersion, Timingpunkt, Kosten, Ziele und Choices.
- Hidden Info bleibt aus PlayerViews, PublicEvents, WebSocket, Reconnect, Undo-Previews, Logs, Fehlern, DOM, Replayprojektionen und KI-Inputs draußen.
- Replay, StateHash, Seed, RandomCounter und RandomDrawRecords bleiben deterministisch.
- Multiplayer-Submit, Idempotency, stale StateVersion und Reconnect bleiben side-sicher.
- KI nutzt nur PlayerView, LegalActions, side-gefilterte Events, eigene Deck-/Hint-Daten und explizit erlaubte öffentliche Metadaten.
- Keine offiziellen Assets, Card Frames, Card Backs, Logos oder externen Kartendatenbank-Abhängigkeiten.
- Keine Public-Plattformfunktionen ohne eigenes späteres Gate.

## V1.3.1 Umsetzungskern

Priorität:

1. V1.3.0-Final Review, Catalog-, Deck- und AI-Daten lesen.
2. Source Registry v2 definieren.
3. Card Pipeline Snapshot deterministisch erzeugen.
4. Statusketten validieren: Import, Katalog, Engine, human, deck, format, AI.
5. `requiredMechanics`, `resolverRef`, `abilityRefs` und Tests reviewpflichtig machen.
6. AI-Hints v2 validieren, aber nicht freigabeautoritativ machen.
7. Import-Diff und Rollbackvertrag testen.
8. Statusreport für blockierte Karten und KI-Blocker erzeugen.
9. Redaction gegen Tokens, lokale Pfade, Decklisten und Hidden Info.
10. No-Scope gegen Parser, Kartenfreigabe, Mechanik, Assets und Public-Funktionen.

## V1.4.0 Umsetzungskern

Priorität:

1. V1.3.1-Final Review und AI-Hints v2 lesen.
2. PlanCandidate/PlanScore/PlanDecision für Corp definieren.
3. PlanGenerator und PlanEvaluator trennen.
4. Corp-Planarten implementieren: Score Now, Score Next Turn, Remote Build, Protect HQ, Protect R&D, Economy Recovery, Bait Runner.
5. Evaluatoren ergänzen: AgendaRisk, ServerThreat, EconomyReserve, IceRez, ScoringWindow, RemoteIntentMemory.
6. DecisionDebug side-sicher machen.
7. Zeitbudget und legalen Fallback sichern.
8. Benchmarks gegen alte Baseline und Soaks ausführen.
9. Human-vs-Corp-KI und KI-vs-KI smoken.
10. No-Scope gegen Runner-Plan-KI, Belief State, FullState-Simulation, neue Karten/Mechaniken.

## V1.4.1 Umsetzungskern

Priorität:

1. V1.4.0-Final Review und Corp-Regression lesen.
2. Runner-Planmodell auf gemeinsamer Plan-Infrastruktur aufbauen.
3. Runner-Planarten implementieren: Pressure R&D, Pressure HQ, Contest Remote, Build Rig, Recover Economy, Draw for Answers, Trash Asset, Safe Probe Run.
4. Evaluatoren ergänzen: RunnerRig, RunCost, ServerAccessValue, RemoteThreat, CorpScoringThreat.
5. Jack-out-, Access-, Trash- und Creditreserve-Entscheidungen berücksichtigen.
6. DecisionDebug mit sichtbaren Gründen und Unsicherheit.
7. Human-Corp-vs-Runner-KI-Pacing und Rezfenster testen.
8. Hidden-State-Invariance für gleiche sichtbare Projektion.
9. Runner-KI gegen Basic Corp und planbasierte Corp smoken.
10. V1.4.0-Corp-Plan-KI regressionsprüfen.

## Erwartete neue Umsetzungsartefakte

### Nach V1.3.1

- versionierte Source Registry v2
- Card Pipeline Snapshot und Hash
- Card-Support-/Pipeline-Report
- AI-Hints-v2-Daten und Report
- `docs/derived/V1_3_1_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_3_1_FINAL_REVIEW.md`

### Nach V1.4.0

- Corp-Plan-/Evaluator-Code oder gleichwertige Module
- Corp-Planprofile und Benchmark-/Szenariodaten
- Corp-Plan-Soak-/Benchmarkreport
- `docs/derived/V1_4_0_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_0_FINAL_REVIEW.md`

### Nach V1.4.1

- Runner-Plan-/Evaluator-Code oder gleichwertige Module
- Runner-Planprofile und Benchmark-/Szenariodaten
- Runner-Plan-Soak-/Benchmarkreport
- `docs/derived/V1_4_1_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_1_FINAL_REVIEW.md`

## Ready-Status

| Release | ready_for_implementation | Bemerkung |
| --- | --- | --- |
| V1.3.1 | true | Umsetzbar nach V1.3.0. |
| V1.4.0 | true_after_V1.3.1 | Nutzt AI-Hints-v2 und Pipeline-Reports. |
| V1.4.1 | true_after_V1.4.0 | Nutzt Corp-Plan-Infrastruktur und Regression. |

## Kopierbarer Folgeprompt

```text
Setze V1.3.1 Card Data Pipeline v2 um und bereite danach V1.4.0 sowie V1.4.1 entlang des Handoffs vor.

Repository: C:\Projekte\NETGRID

Arbeite wiki-first und gemäß AGENTS.md. Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- docs/codex/CODEX_STATUS.md
- docs/derived/V1_3_1_TO_V1_4_1_IMPLEMENTATION_HANDOFF.md
- docs/derived/V1_3_1_CARD_DATA_PIPELINE_V2_DETAILED_PLAN.md
- docs/derived/V1_3_1_REQUIREMENTS.md
- docs/derived/CARD_DATA_PIPELINE_1_3_1_SPEC.md
- docs/derived/V1_3_1_TEST_MATRIX.md
- docs/derived/V1_3_1_REQUIREMENTS_REVIEW.md

Implementiere zuerst nur V1.3.1:
- Source Registry v2.
- deterministischen Card Pipeline Snapshot mit Hash.
- Statuskettenvalidierung für Import, Katalog, Engine, human, deck, format und AI.
- reviewpflichtige requiredMechanics, resolverRef, abilityRefs und AI-Hints v2.
- Import-Diff, Rollbackvertrag und Statusreports.
- Redaction gegen Tokens, lokale private Pfade, Decklisten und Hidden Info.

Nicht erweitern:
- kein Kartentextparser,
- keine neuen Kartenfreigaben,
- keine neue Mechanik,
- keine planbasierte KI,
- keine offiziellen Assets,
- keine Public-Plattformfunktionen.

Pflichtgates:
- Hidden Info,
- Statusketten,
- deterministische Snapshots,
- Diff/Rollback,
- AI-Hints-Safety,
- V1.3.0-Deck-/Matchstart-Regression,
- No-Scope-Regression.
```
