# Controlled Shadow Mode Automationsprozess

Stand: 2026-06-04
Status: Prozessdefinition für sequenzielle Codex-Ausführung; keine Hintergrundautomation, kein Scheduler, keine produktive KI-Aktivierung
Erstellt durch: `release-planning-agent`
Primärer Agent für spätere Ausführung: `release-implementation-agent`

## Zweck

Dieser Prozess macht den nächsten Meta-Schritt nach AI050 ausführbar: `Controlled Shadow Mode / Semantic-vs-Legacy Evaluation`.

Der Prozess definiert, wie ein Codex-Controller die zehn Schritte `AI051` bis `AI060` strikt sequenziell in einem eigenen Worktree abarbeitet, ohne planmäßige menschliche Zwischenfreigaben und mit lokalem Merge nach `main`, sobald alle Gates erfolgreich abgeschlossen sind.

Der spätere Umsetzungslauf darf eine semantische Shadow-Entscheidung berechnen, vergleichen, erklären und messen. Er darf sie nicht ausführen.

Verbindliche Kernformel:

```text
legacyDecision = chooseLegacyAiAction(input)
semanticShadowDecision = chooseSemanticAiActionShadow(input)
actualDecision = legacyDecision
writeDeveloperOnlyShadowTrace(legacyDecision, semanticShadowDecision)
```

## Quellen

- Eingefügte Aufgabenbeschreibung vom 2026-06-04 mit `AI051` bis `AI060`.
- `docs/codex/CODEX_STATUS.md`.
- `docs/architecture/ai/ki-roadmap-neue-ki-spieler-2026-06-02-v1.md`, besonders Roadmap-Step 11 Shadow Mode und Step 12 Bereichsweiser Cutover.
- `docs/architecture/ai/action-semantics-bridge-automation-process-2026-06-04.md`.
- `docs/reviews/ai/ai047-050-shadow-scoring-final-report-2026-06-04.md`.
- `docs/reviews/ai/ai050-hard-gate-rollback-readiness-review-2026-06-04.md`.

## Zielprüfung

Das Gesamtziel ist für einen automatischen Prozess ausreichend präzise. Es ist keine fachliche Rückfrage nötig, wenn die folgenden Annahmen gelten.

Verbindliches Ziel:

```text
NETGRID erzeugt für ausgewählte KI-Entscheidungspunkte parallel zur Legacy-Entscheidung eine semantische Shadow-Entscheidung mit Trace, Candidate-Evidence, TacticalGoals, Hard-Gates, Score-/Ranking-Evidence, WhyNot-Erklärungen, Legacy-Vergleich, Abweichungskategorie, Metriken und Readiness-Bewertung.

Die Legacy-Entscheidung bleibt die einzige ausgeführte Entscheidung.
```

Gesicherte Annahmen:

1. Die "10 Schritte" meinen genau `AI051` bis `AI060` aus der eingefügten Beschreibung.
2. AI047 bis AI050 sind als direkter Vorgänger abgeschlossen; der gültige Eingangszustand ist `broaderShadowSimulationReadiness: ready_with_constraints` und `productiveCutoverReadiness: blocked`.
3. "Vollautomatisch" bedeutet: keine planmäßigen Human-Review- oder Klärungsstopps zwischen AI051 und AI060. Wenn ein Sicherheitsblocker eintritt, stoppt der Controller sauber mit Blocker-Report und Removal Condition, statt eine Frage zu stellen.
4. `AI055 Deviation Taxonomy and Human Triage` erzeugt eine Human-Review-Liste als Artefakt. Diese Liste ist kein manueller Freigabestopp innerhalb dieses Prozesses.
5. "Ausgewählte Entscheidungspunkte" meint den in AI052 definierten und in AI058 ausgeführten Szenario-/Fixture-Korpus plus ausdrücklich diagnostisch aktivierte Harnesspunkte. Es ist keine Aussage über alle theoretisch möglichen Spielzustände.
6. `AI057 Runtime Shadow Harness` darf an Entscheidungspunkte angeschlossen werden, bleibt aber default-off, diagnostic-only und ohne Einfluss auf `actualDecision`.
7. `AI060` entscheidet nur über Shadow-Readiness. Es gibt keinen produktiven Cutover. Roadmap-Step 12 bleibt ein separater Folgeprozess.
8. Der Arbeitsbranch wird nach erfolgreichem Abschluss lokal nach `main` gemerged. Push und Pull Request bleiben außerhalb dieses Prozesses.

## Nicht-Ziele

- Kein produktiver Cutover.
- Keine produktive Action-Auswahl durch die semantische KI.
- Kein Override von `legacyDecision`.
- Keine Planner-Gewichte, keine Legacy-Entfernung und kein produktiver Default-Switch.
- Keine LegalAction-Erzeugung durch Semantikdaten.
- Keine Änderung an `applyAction`-Autorität.
- Keine Hidden-Info-Projektion in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, Replays, Logs, Client-Fehler oder DOM-/Public-Debug-Flächen.
- Keine Proteus-KI-Freigabe.
- Kein Public-Debug- oder User-facing-Trace.
- Kein Bereichsweiser Cutover per Feature Flag. Feature-Flag-Kandidaten dürfen nur dokumentiert und default-off diagnostic-only angelegt werden.

## Controller-Invarianten

Diese Invarianten gelten für jeden Step:

- Die Rules Engine bleibt einzige Regelautorität.
- Eingang sind nur Engine-`LegalActions`, side-safe `PlayerView`-/`AiDecisionInput`-Daten, `ActionSemanticCandidates`, TacticalGoal-/Doctrine-Diagnostik und geprüfte Semantikartefakte.
- `actualDecision` muss immer exakt aus dem Legacy-Pfad kommen.
- Shadow-Code darf keine `PlayerAction` erzeugen, nicht an `applyAction` schreiben und keinen Engine-State mutieren.
- Shadow-Traces sind `developer_only`.
- Jede Trace-, Report- oder Debug-Ausgabe muss Hidden-Info-Grenzen prüfen.
- Unklare Semantik wird nicht geraten, sondern als `blocked_by_gap`, `blocked_by_gate`, `comparison_unavailable`, `semantic_gap` oder passende Triage-Klasse reportet.
- Jeder Step erzeugt Markdown- und JSON-Evidence.
- Jeder Step erhält ein Check-Skript oder erweitert ein bestehendes Check-Skript mit expliziten Assertions.
- Ein Step darf den nächsten Step erst freigeben, wenn sein Done-Gate erfüllt ist.
- Rote Checks sind zuerst Debug-Arbeit. Erst bestätigte Sicherheitsverletzungen oder nicht eng reparierbare Basisschäden blockieren den Prozess.

No-Effect-Flags bleiben bis AI060 verbindlich:

```json
{
  "actualDecisionOverride": false,
  "productiveScoring": false,
  "plannerWeightChange": false,
  "engineMutation": false,
  "legalityGeneration": false,
  "publicPayloadChange": false,
  "hiddenInfoLeak": false,
  "featureFlagCutover": false
}
```

## Automatische Fehlerbehandlung

Der Prozess hat keine planmäßigen Human-Review-Stopps.

Konservative automatische Fortsetzung:

- fehlender TargetContext -> Candidate bleibt sichtbar, aber `scoreStatus: "blocked_by_gap"` und Triage `missing_target_context`;
- fehlende Ability-Auflösung -> `blocked_by_gap` und Triage `missing_ability_binding`;
- fehlende Card-Semantik -> `blocked_by_gap` oder `comparison_unavailable` und Triage `needs_card_semantics_review`;
- unklare Kosten oder Timingdaten -> `blocked_by_gap`, sofern der betroffene Goal-Typ diese Daten verlangt;
- Legacy-Referenz nicht abbildbar -> `comparison_unavailable`, nicht `semantic_better_candidate`;
- semantische Entscheidung nicht verfügbar -> `scoreStatus: "no_candidate"` oder `"not_scored"`;
- abweichende, aber legale und side-safe semantische Entscheidung -> Triage `acceptable_difference` oder `semantic_improvement_candidate`;
- rote Tests -> Ursache eingrenzen, engen Fix versuchen, relevante Checks wiederholen und die Fix-/Verify-Schleife dokumentieren.

Sicherheitsblocker ohne Rückfrage:

- bestätigter Hidden-Info-Leak;
- bestätigte illegale semantische Entscheidung, die nicht automatisch in `blocked_by_gate` zurückgeführt werden kann;
- `actualDecision` weicht von `legacyDecision` ab;
- Shadow-Code erreicht `applyAction`, `PlayerAction`-Erzeugung oder Engine-Mutation;
- öffentlicher Payload, PlayerView, Reconnect, Undo, Replay, WebSocket oder Client-Fehler enthält Shadow-Interna;
- unklassifizierbare fremde Worktree-Änderungen;
- kaputte Repo-Grundlage, die nicht mit engem Step-Fix reparierbar ist;
- Sicherheitsverletzung, bei der Fortsetzung das NETGRID-Kernmodell schwächen würde.

Ein Sicherheitsblocker erzeugt:

```text
docs/reviews/ai/ai051-060-controlled-shadow-mode-blocker-<date>.md
docs/reviews/ai/ai051-060-controlled-shadow-mode-blocker-<date>.json
```

Der Blocker-Report nennt Ursache, betroffene Dateien, letzten grünen Stand, letzte grüne Verification und Removal Condition. Der Controller fragt nicht nach und merged nicht nach `main`.

## State Machine

Empfohlener State-Pfad:

```text
worktree_preflight
→ step_planned
→ step_implementing
→ step_verifying
→ step_done
→ next_step_planned
→ ...
→ final_shadow_review
→ integration_preflight
→ integration_verifying
→ merged_to_main
→ worktree_removed
→ complete
```

Blocker-Pfad:

```text
step_implementing oder step_verifying
→ blocked
```

Regeln:

- Es ist immer genau ein Step aktiv.
- Kein Step darf übersprungen werden.
- Der Controller darf innerhalb eines Steps mehrere Fix-/Verify-Schleifen drehen.
- `complete` ist erst erlaubt, wenn AI051 bis AI060 abgeschlossen, der Abschlussreport geschrieben, der Arbeitsbranch erfolgreich nach `main` gemerged und der separate Umsetzungs-Worktree entfernt wurde.
- `blocked` ist kein menschlicher Reviewzustand, sondern ein Sicherheitsstopp mit Removal Condition.

## Schrittfolge

Vor AI051 läuft ein nicht nummerierter Preflight. Er erzeugt keine Shadow-Codeänderung.

| Preflight | Ziel | Kernartefakte | Done-Gate |
| --- | --- | --- | --- |
| Controlled Shadow Mode Baseline Check | AI047-AI050-Eingangszustand, Worktree, Branch, Checkbestand, Szenario- und Hidden-Info-Grenzen dokumentieren. | `docs/reviews/ai/controlled-shadow-mode-preflight-<date>.md`, `docs/reviews/ai/controlled-shadow-mode-progress-<date>.json` | Arbeits-Worktree/Branch eindeutig; AI047-AI050 final grün referenziert; produktiver Cutover blockiert; keine Shadow-Codeänderung im Preflight. |

| Step | Batch | Ziel | Kernartefakte | Done-Gate |
| --- | --- | --- | --- | --- |
| 1 | `AI051 Shadow Mode Trace Contract` | Stabiles Trace-Format für Legacy- und semantische Shadow-Entscheidung definieren. | `docs/reviews/ai/ai051-shadow-mode-trace-contract-<date>.md`, `.json`, `scripts/check-ai051-shadow-mode-trace-contract.mjs` | Trace-Schema existiert; `visibilityScope: "developer_only"`; `noRuntimeEffect: true`; keine produktiven Imports. |
| 2 | `AI052 Shadow Scenario Corpus` | Wiederholbaren Szenario-Korpus für Shadow Mode definieren. | `docs/reviews/ai/ai052-shadow-scenario-corpus-<date>.md`, `.json`, Check-Skript, Fixture-/Scenario-Refs | Runner-, Korp- und Advanced-Szenarien vorhanden; LegalAction-Typen, TacticalGoals, HiddenInfoBoundary und KnownGaps dokumentiert. |
| 3 | `AI053 Semantic Shadow Decision v0` | Erste semantische Shadow-Entscheidung berechnen, nur für Report/Trace. | Shadow-Decision-Typ/Builder, Report, Check-Skript, Tests | Fixtures können `SemanticShadowDecision` berechnen; 0 produktive Verbraucher; 0 Ausführung; blockierte Candidates sind erklärbar. |
| 4 | `AI054 Legacy-vs-Semantic Comparison Report` | Legacy- und Semantic-Shadow-Entscheidung pro Fixture vergleichen. | Comparison-Typ/Builder, Report, Check-Skript, Tests | Jedes Fixture erzeugt Comparison; Abweichungen kategorisiert; illegal/Hidden-Info/unreachable = harte Fehler oder Gate-Block. |
| 5 | `AI055 Deviation Taxonomy and Triage` | Kontrollierte Sprache für Abweichungen und Followups erzeugen. | Taxonomie, Triage-Report, Check-Skript | Alle Deltas haben Triage-Klasse; Human-Review-Liste wird generiert, aber stoppt den Prozess nicht; Followups getrennt vom Shadow-Code. |
| 6 | `AI056 Shadow Metrics and Quality Gates` | Metriken, harte Gates und Failure-Policy festlegen. | Metrics-/Gate-Schema, Report, Check-Skript | Harte Gates definiert; initiale Schwellen dokumentiert; Gate-Failure-Policy vorhanden; keine Runtime-Wirkung. |
| 7 | `AI057 Runtime Shadow Harness, disabled by default` | Shadow-Runner diagnostisch an Entscheidungspunkte anschließen, default-off. | Harness, Flag-/Config-Vertrag, Report, Check-Skript, Tests | `actualDecision === legacyDecision`; Flag default false; keine public payload changes; Shadow nie an `applyAction`. |
| 8 | `AI058 Shadow Evaluation Batch Report` | Harness über Fixture-Korpus laufen lassen und Auswertungsbericht schreiben. | Batch-Report `.md`/`.json`, Check-Skript, Tests | Alle Fixtures laufen; Report vollständig; Hard Gate Errors = 0 oder Prozess blockiert; keine Runtime-Wirkung. |
| 9 | `AI059 Shadow Regression Fixtures` | Aus AI058 reproduzierbare Regressionstests ableiten. | Regression-Fixtures, Tests, Report, Check-Skript | Known-bad-Fälle reproduzierbar; Hidden-Info-/Illegal-/Gap-Guards stabil; deterministische Ausgabe. |
| 10 | `AI060 Shadow Readiness Review` | Shadow-Readiness bewerten und nächste Cutover-Voraussetzungen dokumentieren. | Readiness Review `.md`/`.json`, Final Report, Check-Skript | Status `blocked`, `limited_shadow_ready`, `broad_shadow_ready` oder `cutover_candidate_later`; kein Cutover; Abschlussreport vorhanden. |

## Step-Details

### Preflight: Controlled Shadow Mode Baseline Check

Der Preflight ist verpflichtend und nicht Teil der zehn fachlichen Steps.

Pflichtpunkte:

- Branch/HEAD und separater Umsetzungs-Worktree sind dokumentiert.
- Hauptworkspace und Arbeits-Worktree sind sauber oder fremde Änderungen sind ausdrücklich excluded.
- `docs/reviews/ai/ai047-050-shadow-scoring-final-report-2026-06-04.json` ist vorhanden und `status: "done"`.
- `broaderShadowSimulationReadiness` ist `ready_with_constraints`.
- `productiveCutoverReadiness` ist `blocked`.
- `stillForbidden` aus AI047-AI050 wird in den Prozess übernommen.
- Relevante Checks `check-ai047` bis `check-ai050` sind grün oder als nicht betroffen begründet.
- Keine Codeänderung im Preflight.

Progress-State-Mindestform:

```json
{
  "processId": "controlled-shadow-mode",
  "currentStep": "AI051",
  "completedSteps": [],
  "blocked": false,
  "lastGreenCommit": null,
  "nextStep": "AI052",
  "actualDecisionContract": "legacyDecision"
}
```

### AI051 Shadow Mode Trace Contract

Ziel: Ein maschinenlesbares Trace-Format definieren, das Legacy-Entscheidung und semantische Shadow-Entscheidung nebeneinander developer-only protokollieren kann.

Mindestform:

```ts
type ShadowDecisionTrace = {
  traceId: string;
  matchId?: string;
  stateVersion: number;
  actorSide: "runner" | "corp";
  legacyDecision: LegacyDecisionTrace;
  semanticShadowDecision?: SemanticShadowDecisionTrace;
  legalActionSummary: LegalActionTraceSummary[];
  candidateSummary: ActionSemanticCandidateSummary[];
  tacticalGoals: TacticalGoalTrace[];
  doctrineReadiness: DeckDoctrineReadinessTrace;
  hardGates: ShadowHardGateSummary;
  comparison?: LegacySemanticComparison;
  visibilityScope: "developer_only";
  noRuntimeEffect: true;
};
```

Pflichtfelder:

- `LegacyDecisionTrace.selectedActionId`
- `LegacyDecisionTrace.selectedActionType`
- `LegacyDecisionTrace.source: "legacy_ai"`
- `SemanticShadowDecisionTrace.scoreStatus`
- `SemanticShadowDecisionTrace.topCandidates`
- `SemanticShadowDecisionTrace.blockedCandidates`
- `SemanticShadowDecisionTrace.whyNot`
- `LegalActionTraceSummary.actionId`
- `ActionSemanticCandidateSummary.primaryProjectionStatus`
- `ActionSemanticCandidateSummary.hardGateStatus`

Nicht erlaubt:

- Import in produktive `chooseAction`-Pfade.
- Rückkanal zu `applyAction`.
- PublicEvent, WebSocket, Reconnect, Undo oder Replay-Verbrauch.
- PlayerView-Feld.
- produktives Feature Flag.

Done-Gate:

```text
Trace-Schema existiert.
Trace ist developer_only.
Keine Runtime-Ausführung.
Keine Hidden-Info-Projektion.
Keine produktiven Imports.
```

### AI052 Shadow Scenario Corpus

Ziel: Einen stabilen Korpus definieren, auf dem Shadow Mode und spätere semantische Rankings wiederholbar geprüft werden.

Mindestkorpus Runner:

```text
runner_basic_economy
runner_draw_vs_credit
runner_install_program
runner_install_breaker_for_known_ice
runner_start_hq_run
runner_start_rnd_run
runner_remote_contest
runner_access_steal_agenda
runner_access_trash_asset
runner_remove_tag
runner_survival_damage_risk
runner_jack_out_vs_continue
runner_break_subroutine
```

Mindestkorpus Korp:

```text
corp_basic_economy
corp_install_ice
corp_rez_ice_window
corp_advance_agenda
corp_score_agenda
corp_remote_score_window
corp_defend_hq
corp_defend_rnd
corp_tag_trace_window
corp_tagged_runner_punish
corp_damage_kill_window
corp_ambush_or_remote_bait
corp_operation_play
```

Mixed / Advanced:

```text
trace_boost_or_decline
x_value_choice
multi_target_choice
source_target_advancement_counter
hidden_info_boundary_unrezzed_ice
hidden_resource_boundary
multi_ability_card_unresolved
```

Szenarioformat:

```ts
type ShadowScenarioFixture = {
  scenarioId: string;
  side: "runner" | "corp";
  description: string;
  setupKind: "fixture_state" | "saved_state" | "synthetic_legal_actions";
  stateRef?: string;
  expectedLegalActionTypes: string[];
  expectedTacticalGoals: string[];
  requiredCandidateFields: string[];
  knownProjectionGaps: string[];
  hiddenInfoBoundary: string[];
  allowedShadow: boolean;
  reasonIfDisabled?: string;
};
```

Automatische Fortsetzung:

- Noch nicht baubare echte Matchstates dürfen als `synthetic_legal_actions` oder `saved_state_missing` geplant werden, wenn sie im Report nicht als runtime-abgedeckt gezählt werden.
- KnownGaps sind keine Fehler, solange sie explizit gezählt und später in AI055/AI058 sichtbar sind.

### AI053 Semantic Shadow Decision v0

Ziel: Eine erste semantische Shadow-Entscheidung berechnen. Diese Entscheidung bleibt developer-only und darf keinen produktiven Pfad erreichen.

Input:

```text
ActionSemanticCandidates
DeckDoctrine-v2-Readiness
TacticalGoals
Action-to-Goal Mapping
HardGateResults
CostProfile
TimingProfile
TargetContext, falls side-safe vorhanden
```

Output:

```ts
type SemanticShadowDecision = {
  selectedActionId?: string;
  selectedCandidateId?: string;
  scoreStatus:
    | "ranked_shadow_only"
    | "blocked_by_gate"
    | "blocked_by_gap"
    | "no_candidate"
    | "not_scored";
  ranking: ShadowCandidateRank[];
  blockingReasons: ShadowBlockingReason[];
  whyNot: WhyNotTrace[];
  noRuntimeEffect: true;
};
```

Ranking-Logik v0:

1. Hard Gates vor jedem Score: `engine_legal_action`, `hidden_info`, `side_visibility`, `runtime_no_effect`.
2. Required Gaps blockieren Zielarten, die Pflichtdaten brauchen: TargetContext, AbilityId, CostProfile, TimingProfile.
3. Evidence-Buckets bleiben grob und erklärbar: `goalAlignment`, `doctrineAlignment`, `basicActionValue`, `costPenalty`, `riskPenalty`, `timingFit`, `targetFit`, `boardThreatResponse`.

Nicht erlaubt:

- Export als `PlayerAction`.
- Aufruf oder Vorbereitung von `applyAction`.
- Plannergewicht oder Legacy-Override.
- produktives Feature-Flag.

### AI054 Legacy-vs-Semantic Comparison Report

Ziel: Legacy-Entscheidung und semantische Shadow-Entscheidung systematisch vergleichen. Legacy ist Vergleichspunkt, nicht Wahrheit.

Vergleichsstruktur:

```ts
type LegacySemanticComparison = {
  scenarioId: string;
  actorSide: "runner" | "corp";
  legacyActionId: string;
  legacyActionType: string;
  semanticActionId?: string;
  semanticActionType?: string;
  agreement:
    | "same_action"
    | "same_action_type"
    | "different_but_plausible"
    | "semantic_better_candidate"
    | "legacy_better_candidate"
    | "semantic_blocked"
    | "comparison_unavailable";
  deltaCategory: LegacySemanticDeltaCategory[];
  explanation: string[];
};
```

Pflichtkategorien:

```text
same_exact_action
same_action_type_different_target
semantic_prefers_economy
semantic_prefers_setup
semantic_prefers_run_pressure
semantic_prefers_remote_contest
semantic_prefers_score_window
semantic_prefers_defense
semantic_avoids_hidden_info
semantic_blocked_by_target_context
semantic_blocked_by_ability_gap
semantic_blocked_by_cost_gap
semantic_lacks_card_semantics
legacy_selected_unknown_semantics
semantic_selected_risky_action
semantic_selected_unreachable_action
semantic_selected_low_value_action
```

Harte Fehler:

- illegale semantische Entscheidung;
- Hidden-Info-basierte semantische Entscheidung;
- unerreichbare semantische Entscheidung;
- semantische Entscheidung ohne Engine-LegalAction-Referenz.

### AI055 Deviation Taxonomy and Triage

Ziel: Eine kontrollierte Sprache für Abweichungen schaffen, damit Shadow Mode verwertbare Lernsignale produziert.

Triage-Klassen:

```text
acceptable_difference
semantic_improvement_candidate
legacy_preferred
semantic_gap
missing_tactic_signal
missing_target_context
missing_ability_binding
missing_cost_or_timing
bad_goal_mapping
bad_doctrine_context
bad_risk_evaluation
hidden_info_blocker
legal_or_reachability_blocker
needs_card_semantics_review
needs_engine_payload_projection
```

Prozessregel:

- Die Human-Review-Liste ist ein Output, kein Stop.
- Triage-Followups dürfen keine stillen Card-Hint- oder Resolver-Korrekturen im selben Step erzwingen.
- Semantik-Followups werden getrennt von Shadow-Code reportet.

Done-Gate:

```text
Alle Deltas haben Triage-Klasse.
Human-review-Liste generiert.
Semantik-Followups getrennt von Shadow-Code.
Keine produktive Wirkung.
```

### AI056 Shadow Metrics and Quality Gates

Ziel: Objektive Schwellen definieren, ab wann Shadow Mode stabil genug für breitere Simulationen ist.

Harte Gates:

```text
illegalSemanticDecisionCount = 0
hiddenInfoViolationCount = 0
runtimeEffectCount = 0
actualDecisionOverrideCount = 0
nonEngineLegalAssumptionCount = 0
determinismFailureCount = 0
```

Qualitätsmetriken:

```text
semanticDecisionAvailableRate
semanticBlockedByGapRate
sourceResolvedRate
abilityResolvedRate
targetContextAvailableRate
cardSemanticJoinedRate
sameActionRate
sameActionTypeRate
acceptableDifferenceRate
humanReviewRate
semanticImprovementCandidateRate
legacyBetterCandidateRate
```

Initiale Schwellen:

```text
Hard Gates immer 0 Fehler.
semanticDecisionAvailableRate >= 80% im Fixture-Korpus.
hiddenInfoViolationCount = 0.
illegalSemanticDecisionCount = 0.
determinismFailureCount = 0.
humanReviewRate dokumentiert, keine harte Schwelle am Anfang.
```

Spätere Verschärfung:

```text
semanticDecisionAvailableRate >= 95%.
semanticBlockedByGapRate <= 10%.
targetContextAvailableRate steigt pro Fixture-Familie.
```

### AI057 Runtime Shadow Harness, disabled by default

Ziel: Den Shadow-Runner technisch an Entscheidungspunkte anschließen, aber deaktiviert und ohne Einfluss.

Pflichtprinzip:

```ts
const legacyDecision = chooseLegacyAiAction(input);

if (shadowDiagnosticsEnabled) {
  const semanticDecision = chooseSemanticAiActionShadow(input);
  writeDeveloperOnlyShadowTrace(legacyDecision, semanticDecision);
}

const actualDecision = legacyDecision;
```

Feature-Flag-/Config-Vertrag:

```text
semanticAiShadowModeEnabled = false by default
```

Pflicht:

- Default false.
- Nicht in Production aktiv.
- Nur Tests/diagnostic harness.
- Keine Auswirkung auf `actualDecision`.
- Keine PlayerView-, PublicEvent-, WebSocket-, Reconnect-, Undo- oder Replay-Änderung.

Check-Gates:

```text
actualDecision === legacyDecision in all fixtures.
shadowDecision never passed to applyAction.
no public payload changes.
no hidden info in trace output beyond developer-only scrubbed scope.
feature flag default false.
```

### AI058 Shadow Evaluation Batch Report

Ziel: Den Shadow Harness über den Fixture-Korpus laufen lassen und den ersten vollständigen Auswertungsbericht erzeugen.

Report-Mindestform:

```json
{
  "taskId": "AI058",
  "scenarioCount": 0,
  "decisionPointCount": 0,
  "legacySemanticComparison": {},
  "hardGateFailures": [],
  "deltaTriage": [],
  "topSemanticGaps": [],
  "topPotentialImprovements": [],
  "knownBadDecisions": [],
  "recommendedFollowups": []
}
```

Top Semantic Gaps:

```text
target_context_unavailable
ability_unresolved
card_semantics_unavailable
cost_unknown
timing_unknown
```

Known Bad Decisions sind nur zulässig, wenn sie reproduzierbare ScenarioRefs enthalten und nicht als produktive Entscheidung ausgeführt wurden.

Done-Gate:

```text
Alle Fixtures laufen.
Report vollständig.
Hard Gate Errors = 0 oder Prozess blockiert.
Keine Runtime-Wirkung.
```

### AI059 Shadow Regression Fixtures

Ziel: Aus AI058 wiederholbare Regressionstests ableiten.

Fixture-Typen:

```text
golden_same_as_legacy
golden_semantic_improvement
golden_semantic_blocked_by_gap
golden_hidden_info_guard
golden_illegal_action_guard
golden_target_context_required
golden_ability_resolution_required
golden_cost_known_required
```

Nicht prüfen:

```text
Semantic muss immer Legacy kopieren.
```

Prüfen:

```text
Semantic darf nichts Illegales bevorzugen.
Semantic darf Hidden Info nicht verwenden.
Semantic muss bei fehlenden Pflichtdaten blocken.
Semantic muss erwartete Top-Gap-Kategorie melden.
Semantic muss deterministisch sein.
```

### AI060 Shadow Readiness Review

Ziel: Entscheiden, ob Shadow Mode breit genug ist, um in größeren Simulationen oder begrenzten internen Testläufen dauerhaft mitzulaufen.

Nicht entscheiden:

```text
Produktiver Cutover.
```

Readiness-Werte:

```text
blocked
limited_shadow_ready
broad_shadow_ready
cutover_candidate_later
```

`blocked` wenn:

- Hidden-Info-Verstoß > 0.
- illegale semantische Entscheidung > 0.
- `actualDecision` wurde überschrieben.
- nicht erklärter Determinismusfehler.
- Shadow Trace unsicher.

`limited_shadow_ready` wenn:

- Hard Gates grün.
- Fixture-Korpus klein.
- viele Schema-Gaps.
- nur interne Simulationen empfohlen.

`broad_shadow_ready` wenn:

- Hard Gates grün.
- Korpus breit.
- Regression stabil.
- Gaps klassifiziert.
- keine kritischen Known-Bad-Entscheidungen.

`cutover_candidate_later` nur wenn:

- Shadow Mode stabil genug ist, um einen getrennten Folgeprozess "bereichsweiser Cutover Design" zu planen.
- Roadmap-Step 12 weiter nicht in diesem Prozess umgesetzt wird.

Output:

```text
AI060 Shadow Readiness Review
Status
Blocker
Metriken
Gaps
Nächste Cutover-Voraussetzungen
Rollback-Anforderungen
```

## Verifikationsregeln

Pflicht je Step:

- Step-spezifisches Check-Skript.
- `corepack pnpm --filter @netgrid/ai test`, sobald AI-Code betroffen ist.
- `corepack pnpm --filter @netgrid/ai typecheck`, sobald AI-Code oder AI-Typen betroffen sind.
- `corepack pnpm --filter @netgrid/engine test` und `typecheck`, wenn Engine-Typen, LegalAction-Builder oder Payload-Normalisierung betroffen sind.
- `corepack pnpm --filter @netgrid/server test` und `typecheck`, wenn Runtime-Harness oder Multiplayer-`advance_ai` betroffen sind.
- `corepack pnpm --filter @netgrid/web typecheck`, wenn Shared-Typen, DTOs oder Debug-/Viewer-Daten betroffen sind.
- bestehende relevante AI-Semantik- und Shadow-Checks, mindestens AI047 bis AI050, soweit sie betroffen sind.
- `git diff --check`.

Ein Step-Review muss dokumentieren:

- ausgeführte Befehle;
- Exit-Code oder Ergebnis;
- bekannte Warnungen;
- nicht ausgeführte Checks mit Begründung;
- No-Effect-Bestätigung;
- `actualDecision === legacyDecision`-Nachweis, sobald AI057 oder später betroffen ist.

## Worktree-, Git- und Integrationsregeln für automatische Ausführung

Empfohlener Umsetzungsbranch:

```text
codex/ai051-ai060-controlled-shadow-mode
```

Empfohlener Umsetzungs-Worktree:

```text
C:\Projekte\NETGRID_AI051_AI060_CONTROLLED_SHADOW_MODE
```

Worktree-Regeln:

- Der Hauptworkspace `C:\Projekte\NETGRID` bleibt der lokale Integrationsworkspace für `main`.
- Die AI051-bis-AI060-Abarbeitung läuft ausschließlich im separaten Umsetzungs-Worktree.
- Vor AI051 prüft der Controller, ob der Ziel-Worktree bereits existiert.
- Falls der Ziel-Worktree fehlt, wird er aus `main` für `codex/ai051-ai060-controlled-shadow-mode` angelegt.
- Falls der Branch bereits existiert, darf er nur verwendet werden, wenn er eindeutig zu diesem Prozess gehört und keine unklassifizierbaren Änderungen enthält.
- Der Controller darf während der Abarbeitung nicht in den Hauptworkspace zurückwechseln, außer für den abschließenden lokalen Merge nach `main`.
- Lokale Runtime-Daten, Caches, SQLite-Dateien, Secrets und Build-Artefakte bleiben unversioniert.

Commit-Regel:

- Nach jedem grünen Step-Gate darf lokal committed werden.
- Commit-Message-Muster: `ai: <kurzer step-titel>`.
- Kein Push und kein Pull Request durch diesen Prozess.
- Keine lokalen Runtime-Daten, Caches, SQLite-Dateien, Secrets oder Build-Artefakte versionieren.

Empfohlene Commit-Titel:

```text
ai: define shadow mode trace contract
ai: add shadow scenario corpus
ai: add semantic shadow decision v0
ai: compare legacy and semantic shadow decisions
ai: classify shadow deviations
ai: define shadow metrics and gates
ai: add disabled runtime shadow harness
ai: report shadow evaluation batch
ai: add shadow regression fixtures
ai: review shadow readiness
```

Finale Integrationsregel:

- Nach AI060 muss der Arbeits-Worktree sauber sein und alle Step-Artefakte müssen committed sein.
- Vor dem Merge prüft der Controller im Hauptworkspace `C:\Projekte\NETGRID`, dass `main` aktiv und sauber ist.
- Wenn `main` seit Anlage des Arbeitsbranches weitergelaufen ist, muss der Controller `main` zuerst im Arbeits-Worktree in `codex/ai051-ai060-controlled-shadow-mode` integrieren und die relevanten Checks erneut ausführen.
- Konflikte oder rote Integrationschecks sind Sicherheitsblocker.
- Der lokale Merge nach `main` erfolgt erst, wenn AI060 abgeschlossen ist, der Abschlussreport existiert und die finalen Checks grün oder begründet nicht erforderlich sind.
- Bevorzugt ist ein Fast-Forward-Merge von `codex/ai051-ai060-controlled-shadow-mode` nach `main`. Wenn Fast-Forward nicht möglich ist, darf der Controller nur mit dokumentierter Begründung einen lokalen Merge-Commit erzeugen.
- Nach erfolgreichem Merge prüft der Controller den integrierten `main`-Stand mindestens mit `git status --short` und `git diff --check`.
- Erst danach wird der separate Umsetzungs-Worktree entfernt.
- Das Löschen des Arbeitsbranches ist optional und nur erlaubt, wenn `main` die Arbeit enthält und keine spätere Nachprüfung auf diesem Branch benötigt wird.

## Controller-Prompt-Kern

Wenn dieser Prozess später als Codex-Controller ausgeführt wird, gilt folgender Kernauftrag:

```text
Arbeite im NETGRID-Repo wiki-first.

Ziel: Arbeite Controlled Shadow Mode strikt sequenziell von AI051 bis AI060 ab.

Lies zuerst AGENTS.md, AGENTS.local.md falls vorhanden, release-implementation-agent und die Pflicht-Wissensseiten.
Lies danach diesen Prozess, CODEX_STATUS, die KI-Roadmap, den Action-Semantik-Brücken-Prozess, AI047-AI050 Final Report und AI050 Hard-Gate/Rollback Review.

Arbeite für die Umsetzung ausschließlich im separaten Worktree C:\Projekte\NETGRID_AI051_AI060_CONTROLLED_SHADOW_MODE auf Branch codex/ai051-ai060-controlled-shadow-mode.
Nutze C:\Projekte\NETGRID nur für den abschließenden lokalen Merge nach main.

Stelle keine Zwischenfragen.
Triff konservative Annahmen nur, wenn sie im Prozess erlaubt sind.
Rate keine Semantik und keine Zielqualität.
Markiere Unsicherheit über scoreStatus, hardGates, deltaCategory, triageClass, Gaps und Reports.

Arbeite immer nur am aktuellen Step.
Führe Step-spezifische Checks aus.
Debugge rote Checks, solange kein Sicherheitsblocker vorliegt.
Schreibe Markdown-/JSON-Report und Check-Skript je Step.
Bestätige No-Effect-Flags und ab AI057 actualDecision === legacyDecision.
Gehe erst zum nächsten Step, wenn das Done-Gate erfüllt ist.

Bei Hidden-Info-Leak, illegaler semantischer Entscheidung, actualDecision-Override, Runtime-/Planner-Wirkung, unklassifizierbaren fremden Änderungen oder anderem Sicherheitsblocker:
stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition und ändere keinen weiteren Step.

Wenn AI060 abgeschlossen ist, schreibe Abschlussreport und setze den Prozess auf integration_preflight.
Danach merge den Arbeitsbranch lokal nach main. Wenn der Merge erfolgreich ist und main sauber bleibt, entferne den separaten Worktree. Erst danach ist der Prozess complete.
```

## Abschlusskriterien für den Gesamtprozess

Der 10-Schritte-Prozess ist abgeschlossen, wenn:

1. AI051 bis AI060 in genau dieser Reihenfolge abgeschlossen sind.
2. Trace Contract, Scenario Corpus, SemanticShadowDecision, Legacy-Vergleich, Triage, Metrics, disabled Runtime Harness, Batch Report, Regression Fixtures und Readiness Review vorliegen.
3. `actualDecision = legacyDecision` durch Tests oder Harness-Assertions belegt ist.
4. `illegalSemanticDecisionCount = 0`.
5. `hiddenInfoViolationCount = 0`.
6. `runtimeEffectCount = 0`.
7. `actualDecisionOverrideCount = 0`.
8. `determinismFailureCount = 0`.
9. Alle bekannten Gaps klassifiziert und in Followups überführt sind.
10. AI060 ausdrücklich keinen produktiven Cutover freigibt.
11. `codex/ai051-ai060-controlled-shadow-mode` lokal erfolgreich nach `main` gemerged wurde.
12. Der separate Umsetzungs-Worktree nach erfolgreichem Merge entfernt wurde.
