# V1.4.0 Planbasierte Corp-KI - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.4.0 hebt die Corp-KI von einzelaktionsbasierter Bewertung auf planbasierte Entscheidungen für den AI-supported Kartenpool. Die Corp bewertet erkennbare Ziele wie sofort scoren, nächstrundig scoren, Scoring-Remote bauen, HQ/R&D schützen, Wirtschaft erholen und Runner ködern.

V1.4.0 ist kein Runner-KI-, Belief-State-, FullState-Simulations-, Kartenfreigabe- oder Mechanikrelease.

## Quellenbasis

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/V1_3_1_REQUIREMENTS_REVIEW.md`
- `docs/derived/CARD_DATA_PIPELINE_1_3_1_SPEC.md`
- `data/ai/card-role-manifest-0.9.json`
- `data/ai/ai-profiles-0.9.json`
- bestehende `packages/ai` Scorer, Simulationen und Hidden-Info-Tests

## Scope

- Corp-Planmodell mit PlanGenerator, PlanEvaluator, PlanStep und PlanDecision.
- Planarten `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `protect_rnd`, `recover_economy` und `bait_runner`.
- Evaluatoren für AgendaRisk, ServerThreat, EconomyReserve, IceRez, ScoringWindow und RemoteIntentMemory.
- DecisionDebug mit Plan-ID, Score, Confidence, sichtbarer Begründung, Fallback und Seed.
- Difficulty-Profile mappen auf Planbreite, Risikobereitschaft und Tiefe, nicht auf Informationszugang.
- Server-Zeitbudget und legaler Fallback.
- KI-vs-KI- und Human-vs-Corp-KI-Smokes.
- Benchmark-Baselines gegen die V0.9/V1.3.1-Corp-KI.

## Nicht-Ziele

- Keine planbasierte Runner-KI.
- Kein Belief State und kein Gegner-Handmodell.
- Keine echte Hidden-State-Simulation.
- Kein LLM als Live-Regelakteur oder Action-Erzeuger.
- Keine neuen Karten, keine neuen Mechaniken, keine KI-Deckfreigabe ohne `ai_supported`.
- Kein Zugriff auf Runner-Grip, Runner-Stack, verdeckte HQ-/R&D-Informationen oder Full GameState.
- Keine Änderung der Rules Engine als Regelautorität.

## Leitentscheidung

Die Corp-KI plant über erlaubte Projektionen. Ein Plan ist nur eine Bewertungsstruktur über LegalActions; ausgeführt wird weiterhin exakt eine aus `LegalActions` abgeleitete `PlayerAction`, die `applyAction` erneut validiert.

## Umsetzungspakete

1. **Planmodell**
   - PlanCandidate, PlanStep, PlanScore und PlanDecision definieren.
   - PlanGenerator erzeugt Kandidaten ausschließlich aus PlayerView, LegalActions, PublicEvents, eigenem Deckrollenprofil und AI-Hints.
   - PlanEvaluator bewertet Kandidaten deterministisch.

2. **Corp-Evaluatoren**
   - AgendaRiskEvaluator: Sichtbare Agenda-Punkte, installierte/fortgeschrittene eigene Agendas, Runner-Druck.
   - ServerThreatEvaluator: HQ-, R&D- und Remote-Gefahr aus sichtbarer Historie.
   - EconomyReserveEvaluator: Credits, Rez-Kosten, Score-Kosten und Operationsrollen.
   - IceRezEvaluator: sichtbare ICE-Eigenschaften, Rez-Kosten, Subroutine-Rollen.
   - ScoringWindowEvaluator: Advancement-Stand, Klicks, Credits, Runner-Gefahr.
   - RemoteIntentMemory: nur eigene sicht-/zulässige Installationshistorie, keine privaten Runnerdaten.

3. **Planarten**
   - `score_now`: Agenda jetzt punkten.
   - `score_next_turn`: Agenda sicher vorbereiten.
   - `build_scoring_remote`: Remote mit ICE/Root aufbauen.
   - `protect_hq`: zentrale Hand schützen.
   - `protect_rnd`: F&E schützen.
   - `recover_economy`: Credits/Kartenbasis wiederherstellen.
   - `bait_runner`: nur mit safe Rollen und sichtbarer Begründung.

4. **DecisionDebug und UI/Pacing**
   - Debug nennt Planrolle, sichtbare Gründe, Score, Confidence und Fallback.
   - Keine verdeckten gegnerischen Karten, Decklisten oder internen FullState-Daten.
   - Web-Cues bleiben side-sicher und dürfen keine Plan-Interna mit Hidden Info zeigen.

5. **Benchmarks und Soaks**
   - Szenariometriken für Score Now, Score Next Turn, Remote Build, HQ/R&D-Schutz und Economy Recovery.
   - Vergleich gegen alte Baseline.
   - Soaks prüfen keine illegalen Actions, Timeouts, Hänger oder Replay-Divergenzen.

## Erwartete Umsetzungsartefakte

- Plan-/Evaluator-Module unter `packages/ai/src` oder gleichwertig.
- Versioniertes Corp-Planprofil, z. B. `data/ai/corp-plan-profiles-1.4.0.json`.
- Szenario-/Benchmarkdaten, z. B. `data/scenarios/ai-v140-corp-*.json`.
- Soak-/Benchmarkreport, z. B. `data/ai/ai-corp-plan-benchmark-1.4.0.json`.
- `docs/derived/V1_4_0_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_0_FINAL_REVIEW.md`

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Planer nutzt versteckte Runnerdaten. | Sehr hoch | Input-Invariance- und Redaction-Tests. |
| Planmodell übergeht LegalActions. | Sehr hoch | PlanStep darf nur LegalAction referenzieren; applyAction bleibt Gate. |
| KI hängt in Choice-/Run-Fenstern. | Hoch | Zeitbudget, Fallback und Soaks. |
| Bait-Plan wird aus verdeckten Informationen begründet. | Hoch | Bait nur aus eigenen/öffentlichen Daten. |
| Bewertung verbessert Szenarien, verschlechtert Regressionen. | Mittel | Baseline-Vergleich und alte Smokes bleiben Pflicht. |

## Offene Fragen

Keine blockierenden offenen Fragen.

Nicht blockierend:

- Exakte Score-Gewichte dürfen im Umsetzungsthread als versionierte Profile starten und später getuned werden.
- Falls V1.3.1 nur einen minimalen AI-Hints-v2-Satz liefert, bleibt V1.4.0 auf diesen AI-supported Pool begrenzt.

## Gate

`V1_4_0_requirements_freeze_done: true`

`ready_for_implementation_after_V1_3_1: true`
