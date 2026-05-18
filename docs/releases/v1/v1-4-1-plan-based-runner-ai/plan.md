# V1.4.1 Planbasierte Runner-KI - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.4.1 hebt die Runner-KI auf planbasierte Run-, Rig-, Economy- und Remote-Contest-Entscheidungen. Die Runner-KI soll nicht mehr nur einzelne Aktionen scoren, sondern erkennbare Spielpläne wie R&D-Druck, HQ-Druck, Remote contesten, Rig aufbauen, Wirtschaft erholen, nach Antworten ziehen, Asset trashen und Safe Probe Run bewerten.

V1.4.1 baut auf V1.4.0 auf und darf keine planbasierte Corp-Regression verursachen.

## Quellenbasis

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/releases/v1/v1-4-0-plan-based-corp-ai/requirements-review.md`
- `docs/releases/v1/v1-4-0-plan-based-corp-ai/spec.md`
- `docs/releases/v1/v1-3-1-card-data-pipeline-v2/spec.md`
- bestehende `packages/ai` Runner-Heuristiken, Run-/Breach-/Access-Mechaniken und AI-Smokes

## Scope

- Runner-Planmodell mit PlanGenerator, PlanEvaluator, PlanStep und PlanDecision.
- Planarten `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset` und `safe_probe_run`.
- Evaluatoren für RunnerRig, RunCost, ServerAccessValue, RemoteThreat und CorpScoringThreat.
- Jack-out-, Breach-, Access-, Trash-Kosten-, Creditreserve- und MU-Bewertung aus erlaubten Daten.
- DecisionDebug mit Plan-ID, sichtbaren Gründen, Score, Confidence, Fallback und Seed.
- Runner-KI-vs-Basic-Corp und Runner-KI-vs-planbasierte-Corp-Smokes.
- Benchmarks für schlechte Run-Entscheidungen, Rig-Aufbau und Remote-Contest.

## Nicht-Ziele

- Kein Belief State und kein Gegner-Hand-/Deckmodell.
- Keine FullState-Simulation.
- Kein Zugriff auf verdeckte HQ-/R&D-/Remote-Titel.
- Keine automatische Aufdeckung unrezzed ICE.
- Keine neuen Karten, Mechaniken oder AI-supported-Freigaben.
- Kein LLM als Live-Regelakteur oder Action-Erzeuger.
- Keine Änderung der Corp-Plan-KI außer nötiger Regressionseinbindung.

## Leitentscheidung

Die Runner-KI plant mit Unsicherheit. Unbekannte Serverinhalte bleiben unbekannt; Zugriffswert wird aus sichtbarer Historie, offenem Board, PublicEvents und sicheren Risikoannahmen berechnet.

## Umsetzungspakete

1. **Runner-Planmodell**
   - Gemeinsame Plan-Infrastruktur aus V1.4.0 wiederverwenden oder erweitern.
   - RunnerPlanKind, RunnerPlanCandidate, RunnerPlanScore und RunnerPlanDecision definieren.
   - PlanSteps referenzieren nur LegalActions.

2. **Runner-Evaluatoren**
   - RunnerRigEvaluator: Breakerrollen, MU, Credits, installierte Programme.
   - RunCostEstimator: sichtbares/rezzed ICE, bekannte Kosten, Creditreserve.
   - ServerAccessValueEvaluator: R&D/HQ/Archives/Remote-Wert aus erlaubten Daten.
   - RemoteThreatEvaluator: Advance-Stand, sichtbare Root-Karten, PublicEvents.
   - CorpScoringThreatEvaluator: sichtbare Agenda-Punkte, Remote-Status, Corp-Credits/Klicklage.

3. **Planarten**
   - `pressure_rnd`: R&D-Druck bei vertretbarem Risiko.
   - `pressure_hq`: HQ-Druck aus öffentlicher Hand-/Eventlage, ohne echte HQ-Titel.
   - `contest_remote`: fortgeschrittenen oder gefährlichen Remote angreifen.
   - `build_rig`: fehlende Breaker/MU/Economy aufbauen.
   - `recover_economy`: Credits statt schlechter Runs.
   - `draw_for_answers`: Karten ziehen, wenn Setup fehlt.
   - `trash_asset`: sichtbare Assets/Upgrades mit vertretbaren Trash-Kosten.
   - `safe_probe_run`: günstiger Informations-/Druck-Run ohne Hidden-Vorteil.

4. **DecisionDebug und Pacing**
   - Runner-Erklärungen nennen sichtbare Gründe und Unsicherheit.
   - Keine verdeckten Korp-Karten, keine echten HQ-/R&D-Titel, keine privaten Corp-Deckdaten.
   - Corp-Rezfenster und Runner-KI-Pacing bleiben robust.

5. **Benchmarks und Soaks**
   - Szenarien für R&D-Druck, HQ-Druck, Remote-Contest, Rig-Aufbau, Economy Recovery, Asset-Trash und Safe Probe Run.
   - Runner-KI gegen Random/Basic Corp und planbasierte Corp testen.
   - Keine sinnlosen Runs in definierten Negativfixtures.

## Erwartete Umsetzungsartefakte

- Runner-Plan-/Evaluator-Module unter `packages/ai/src` oder gleichwertig.
- Versioniertes Runner-Planprofil, z. B. `data/ai/runner-plan-profiles-1.4.1.json`.
- Szenario-/Benchmarkdaten, z. B. `data/scenarios/ai-v141-runner-*.json`.
- Soak-/Benchmarkreport, z. B. `data/ai/ai-runner-plan-benchmark-1.4.1.json`.
- `docs/releases/v1/v1-4-1-plan-based-runner-ai/implementation-review.md`
- `docs/releases/v1/v1-4-1-plan-based-runner-ai/final-review.md`

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Runner-KI liest verdeckte Corp-Karten implizit. | Sehr hoch | Hidden-State-Invariance und Input-Redaction. |
| Runner läuft zu oft sinnlos in sichere Niederlagen. | Hoch | Negativszenarien und RunCostEstimator. |
| Planbasierte Runner-KI stört Corp-Rezfenster/Pacing. | Hoch | Human-Corp-vs-Runner-KI-Smoke und Web-Pacing-Test. |
| Runner-Planer überschattet V1.4.0-Corp-Planer. | Mittel | KI-vs-KI-Regression mit beiden Seiten. |

## Offene Fragen

Keine blockierenden offenen Fragen.

Nicht blockierend:

- Exacte Risikoschwellen für Runs dürfen in versionierten Profilen starten.
- `safe_probe_run` darf konservativ sein, solange es keine Hidden-Info-Annahmen als Fakten nutzt.

## Gate

`V1_4_1_requirements_freeze_done: true`

`ready_for_implementation_after_V1_4_0: true`
