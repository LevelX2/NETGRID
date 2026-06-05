# AI Plan Layer Current State Review, 2026-06-05

Status: Ist-Analyse  
Aktiver Agent: architecture-review-agent  
Scope: Lean Local Mode, keine Runtime-Umstellung, keine neue Kartensemantik

## Kurzfazit

Die neue KI besitzt im aktuellen Livepfad keine echte neue Planebene zwischen `DeckDoctrine`/`TacticalGoalState` und LegalAction-Auswahl. Der Livepfad im Lean Local Mode bewertet im Wesentlichen aktuelle `input.legalActions` direkt über die Semantic Runtime und wählt daraus die beste nicht ausgeschlossene Aktion.

Es existieren zwei ältere per-Decision Planheuristiken:

- `packages/ai/src/runner-plans.ts` mit `RunnerPlanKind`, `RunnerPlanCandidate`, `RunnerPlanStep` und `RunnerPlanDecision`.
- `packages/ai/src/corp-plans.ts` mit `CorpPlanKind`, `CorpPlanCandidate`, `CorpPlanStep` und `CorpPlanDecision`.

Diese alten Planer gruppieren aktuelle LegalActions unter Planarten und liefern weiterhin eine Legacy-Referenzentscheidung. Seit dem Semantic-Runtime-Cutover wird diese Legacy-Entscheidung aber standardmäßig nur noch als Referenz in `chooseSemanticRuntimeAction` verwendet. Die tatsächlich ausgeführte Entscheidung kommt aus der Semantic Runtime.

## Quellen und geprüfte Codepfade

Primär geprüft:

- `packages/ai/src/index.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/semantic-ai-core-meta.ts`
- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/belief-state.ts`
- `apps/server/src/multiplayer.ts`
- `docs/reviews/ai/semantic-ai-runtime-cutover-2026-06-04.md`
- `docs/reviews/ai/meta1-deck-doctrine-tactical-goal-engine-v0-2026-06-04.md`
- `docs/reviews/ai/meta2-semantic-decision-core-quality-calibration-2026-06-04.md`

Der Begriff `Lean Local Mode` wurde im Code nicht als eigener Schalter gefunden. Diese Analyse behandelt ihn daher als aktuellen lokalen Livepfad: Server ruft `chooseAiAction(buildAiDecisionInput(...))`, Semantic Runtime ist default aktiv, `NETGRID_SEMANTIC_AI_RUNTIME=legacy` bleibt nur Notaus.

## Findings

### Hoch: Semantic Runtime ist direkte LegalAction-Bewertung, keine Plan-Step-Ausführung

Fundstellen:

- `packages/ai/src/index.ts:3200` `chooseAiAction`
- `packages/ai/src/index.ts:3206` `chooseCorpAction`
- `packages/ai/src/index.ts:3219` `chooseRunnerAction`
- `packages/ai/src/index.ts:3251` `chooseSemanticRuntimeAction`
- `packages/ai/src/index.ts:3316` `semanticRuntimeChoices`
- `packages/ai/src/index.ts:3333` `scoreSemanticRuntimeAction`
- `packages/ai/src/index.ts:3644` `semanticRuntimeRankedAlternatives`
- `packages/ai/src/index.ts:3663` `semanticRuntimeActionAlternatives`
- `packages/ai/src/index.ts:3690` `semanticRuntimeScoreBreakdown`
- `packages/ai/src/index.ts:3795` `semanticRuntimeScopeForAction`

Bewertung:

`chooseCorpAction` und `chooseRunnerAction` berechnen zuerst Baseline und alte Planentscheidung. Danach rufen beide `chooseSemanticRuntimeAction(input, legacyDecision)` auf. Diese Funktion erzeugt `semanticRuntimeChoices(input)`, indem sie jede aktuelle LegalAction mit `scoreSemanticRuntimeAction` bewertet, ausgeschlossene Aktionen aussortiert und die beste nicht ausgeschlossene Action wählt.

Die Debug-Felder `planId` und `planKind` der Semantic Runtime sind aktuell Scope-Labels wie `semantic_runtime:remote_contest`, `simple_hq_or_rnd_pressure`, `basic_economy_draw` oder `basic_install`. Sie sind keine persistenten TacticalPlans und keine Step-Instanzen.

Risiko:

Die UI kann den Eindruck einer Planebene vermitteln, obwohl die Liveauswahl auf Action-Score-Komponenten basiert. Genau dadurch wirken Anzeigen wie `Planranking` semantisch stärker, als sie im aktuellen Code sind.

Empfehlung:

Plan- und Action-Ranking in Debug/UI begrifflich trennen:

- `Planranking` nur verwenden, wenn ein echtes `TacticalPlan`-Objekt bewertet wurde.
- Semantic Runtime Direct Scores als `LegalAction-Ranking` oder `Action-Ranking` anzeigen.

### Hoch: `DeckDoctrine`, `TacticalGoalState` und `SemanticDecisionScore` sind nicht die live genutzte Planebene

Fundstellen:

- `packages/ai/src/deck-doctrine.ts:60` `buildDeckDoctrineProfile`
- `packages/ai/src/semantic-ai-core-meta.ts:139` `DeckDoctrine`
- `packages/ai/src/semantic-ai-core-meta.ts:184` `TacticalGoalState`
- `packages/ai/src/semantic-ai-core-meta.ts:294` `SemanticDecisionScore`
- `packages/ai/src/semantic-ai-core-meta.ts:1424` `buildMeta1DeckDoctrineTacticalGoalEngineReport`
- `packages/ai/src/semantic-ai-core-meta.ts:1956` `buildSemanticDecisionScore`
- `packages/ai/src/semantic-ai-core-meta.ts:1508` `noRuntimeConsumer: true`
- `packages/ai/src/semantic-ai-core-meta.ts:1520` `productiveUseAllowed: false`
- `packages/ai/src/semantic-ai-core-meta.ts:1523` `noRuntimeEffect: true`

Bewertung:

Es gibt zwei unterschiedliche Doctrine-Begriffe:

- Live relevant ist `AiDeckDoctrineProfile` aus `deck-doctrine.ts`. Es wird aus dem eigenen Decksnapshot gebaut und enthält Archetype-Tags, Rollen, `planWeights`, MulliganWeights, Confidence und RiskFlags.
- Die neuen Typen `DeckDoctrine`, `TacticalGoalState` und `SemanticDecisionScore` in `semantic-ai-core-meta.ts` sind Meta-/Diagnostikmodelle. Die Datei deklariert ausdrücklich `noRuntimeConsumer`, `productiveUseAllowed: false` und `noRuntimeEffect: true`.

`AiDeckDoctrineProfile` wirkt heute vor allem in alten Runner-/Corp-Planern, Mulligan-/Discard-Heuristiken und Debug. Die Semantic Runtime verwendet `TacticalGoalState` und `SemanticDecisionScore` nicht als Live-Eingabe.

Risiko:

Die Projektbegriffe "DeckDoctrine", "TacticalGoal" und "SemanticDecisionScore" sind vorhanden, aber nicht produktiv verdrahtet. Das kann bei Debug und Umsetzungsplanung zu falschen Annahmen führen.

Empfehlung:

Für die nächste Umsetzung klar trennen:

- `AiDeckDoctrineProfile`: bestehende Live-Doktrin, konservativ weiter nutzbar.
- `DeckDoctrineV2`/`TacticalGoalState`: geplantes Zielmodell, erst produktiv machen, wenn ein echter Plan-Controller existiert.
- `SemanticDecisionScore`: nicht mit dem aktuellen `AiDecisionScoreComponent`-Summenscore der Semantic Runtime gleichsetzen.

### Hoch: Es gibt keine persistenten TacticalPlan- oder PlanStep-Objekte

Fundstellen:

- `packages/ai/src/runner-plans.ts:58` `RunnerPlanStep`
- `packages/ai/src/runner-plans.ts:66` `RunnerPlanCandidate`
- `packages/ai/src/runner-plans.ts:673` `generateRunnerPlanCandidates`
- `packages/ai/src/corp-plans.ts:56` `CorpPlanStep`
- `packages/ai/src/corp-plans.ts:64` `CorpPlanCandidate`
- `packages/ai/src/corp-plans.ts:777` `generateCorpPlanCandidates`
- `apps/server/src/multiplayer.ts:1643` Live-Inputbau für KI-Step
- `apps/server/src/multiplayer.ts:2612` automatischer KI-Step

Bewertung:

Die vorhandenen `RunnerPlanStep`- und `CorpPlanStep`-Objekte werden pro Entscheidung aus aktuellen `input.legalActions` gebaut. Sie referenzieren `actionId`, `actionType`, optionales `targetServerId` und Rollen-Tags. Sie werden nicht als laufender Planzustand über Züge gespeichert.

Die Suche nach `TacticalPlan`, `planState`, `activePlan` und produktivem `TacticalGoalState` fand keinen Live-Plan-State. `active_plan:<kind>` taucht als Debug-/Evidence-String in alten Planern auf, nicht als persistentes Objekt.

Risiko:

Die KI kann nicht sauber sagen: "Mein Plan ist Remote contesten, aber Schritt 1 ist Breaker-Abdeckung beschaffen." Sie bewertet im nächsten KI-Step wieder neu.

Empfehlung:

Ein echtes Planmodell braucht mindestens:

- `TacticalPlan`: Side, PlanType, Target, Status, Horizon, Created/Updated StateVersion, RequiredCapabilities, Blockers.
- `PlanStep`: StepKind, Goal, Prerequisites, DesiredActionSemantics, MappingStatus, ActionCandidateIds.
- actor-private Plan Memory pro Match/Side oder deterministische Rekonstruktion aus PublicEvents und aktuellem `PlayerView`.

### Mittel: Fehlende Voraussetzungen werden nur punktuell erkannt

Fundstellen:

- `packages/ai/src/index.ts:3735` `semanticRuntimeActionExclusion`
- `packages/ai/src/index.ts:3763` `semanticRuntimeRunnerArchivesExclusion`
- `packages/ai/src/index.ts:4156` `semanticRuntimeRunnerKnownIcePathComponents`
- `packages/ai/src/runner-plans.ts:432` `runnerRunActionIsKnownNoAccess`
- `packages/ai/src/runner-plans.ts:678` `hasCoverageSearchNeed`
- `packages/ai/src/runner-plans.ts:8001` `assessVisibleBreakerPressure`
- `packages/ai/src/visible-run-analysis.ts:46` `missing_breaker_coverage`

Bewertung:

Es gibt inzwischen wichtige Einzelprüfungen:

- Leeres oder vollständig bekannt nicht-agendahaltiges Archiv wird semantisch ausgeschlossen.
- Bekannte gerezzte ICE-Pfade, die der Runner aktuell nicht erreichen kann, werden als `known_ice_path_no_access` ausgeschlossen.
- Die alten Runner-Pläne erkennen sichtbaren Breaker-Druck und können `build_rig` oder `draw_for_answers` über Such-/Recovery-Actions attraktiver machen.

Was fehlt:

- Kein allgemeiner Plan-Blocker `missing_breaker_coverage`.
- Kein Plan-Pivot `contest_remote -> obtain_breaker_coverage`.
- Kein Step-Modell, das eine aktuell nicht ausführbare Zielabsicht in einen nächsten LegalAction-Schritt übersetzt.
- Keine persistent gespeicherte Zielbindung, die nach Breaker-Installation wieder auf dasselbe Remote zurückführt.

Risiko:

Ad-hoc-Ausschlüsse verhindern offensichtlichen Unsinn, ersetzen aber keine Planlogik. Sobald eine Situation nicht durch eine Sonderregel abgedeckt ist, fällt die KI auf direkte Action-Bewertung zurück.

Empfehlung:

Prerequisite-Erkennung in `PlanBlocker`/`RequiredCapability` modellieren, nicht als verstreute Score-Penalties.

### Mittel: Aktuelle LegalActions werden als Schritte nur in der alten Planheuristik gruppiert

Fundstellen:

- `packages/ai/src/runner-plans.ts:673` `generateRunnerPlanCandidates`
- `packages/ai/src/runner-plans.ts:5807` `selectPlanAction`
- `packages/ai/src/runner-plans.ts:5828` `runnerActionAlternativesForPlan`
- `packages/ai/src/corp-plans.ts:777` `generateCorpPlanCandidates`
- `packages/ai/src/corp-plans.ts:7599` `selectPlanAction`

Bewertung:

Die alten Planer bilden aus aktuellen LegalActions Kandidatenlisten und `steps`. Das ist eine nützliche Gruppierung, aber kein Plan-Step-to-LegalAction-Mapping im neuen Zielsinne. Jeder Step ist bereits eine konkrete LegalAction, kein abstrakter Zwischenschritt.

Die Semantic Runtime dagegen baut kein `PlanStep`-Objekt. Sie labelt Actions über `semanticRuntimeScopeForAction` und summiert Score-Komponenten.

Empfehlung:

Die nächste Ebene sollte abstrakte `PlanStepKind`s einführen, zum Beispiel `install_breaker`, `draw_for_answer`, `run_target`, `build_bank_counter`, `cash_out_bank`, `rez_outer_ice`, `advance_score_card`.

### Mittel: Mehrzügigkeit ist Diagnose oder Heuristik, nicht Planfortschreibung

Fundstellen:

- `packages/ai/src/belief-state.ts` `reconstructBeliefState`
- `packages/ai/src/index.ts:16966` `planIntentConverted`
- `packages/ai/src/index.ts:17839` `planIntentConvertedWithin1OwnDecision`
- `packages/ai/src/index.ts:23685` `planIntentConvertedWithin`
- `packages/ai/src/runner-plans.ts` Evidence für `two_turn_run_intent_lifetime:single_decision`

Bewertung:

Der Belief State rekonstruiert Wissen aus aktuellem PlayerView und PublicEvents. Simulationsmetriken prüfen, ob Planabsichten später in Fortschritt konvertieren. Alte Runner-Logik kennt eine kurze Zwei-Zug-Intent-Heuristik. Das ist wertvoll, aber keine persistente Planfortschreibung.

Empfehlung:

Wenn Planfortschreibung gewünscht ist, braucht sie einen eigenen Lebenszyklus:

- `proposed`
- `active`
- `blocked`
- `progressing`
- `satisfied`
- `failed`
- `expired`

Dieser Lifecycle existiert als Meta-Typ in `TacticalGoalState`, aber nicht als Live-Plan-Controller.

### Niedrig: `ActionSemanticCandidate` existiert, ist aber nicht der Live-Auswahlpfad

Fundstellen:

- `packages/ai/src/action-semantic-candidate.ts:205` `ActionSemanticCandidate`
- `packages/ai/src/action-semantic-candidate.ts:293` `buildActionSemanticCandidates`
- `packages/ai/src/action-doctrine-goal-diagnostics.ts` diagnostische Consumer
- `docs/architecture/ai/action-semantics-bridge-automation-process-2026-06-04.md`

Bewertung:

`ActionSemanticCandidate` ist als read-only Projektion vorhanden und getestet. Die produktive Semantic Runtime in `index.ts` ruft `buildActionSemanticCandidates` aber nicht auf. Damit fehlt genau die geplante Brücke zwischen LegalAction und Plan-/Goal-Sprache.

Empfehlung:

Phase 2 sollte nicht noch eine parallele LegalAction-Interpretation bauen, sondern `ActionSemanticCandidate` als Mapping-Grundlage nutzen und gezielt erweitern, wo Felder fehlen.

## Antworten auf die konkreten Prüfpunkte

| Frage | Ist-Stand |
| --- | --- |
| 1. Wo wird die finale KI-Action gewählt? | Im Server über `chooseAiAction(buildAiDecisionInput(...))`, danach Revalidierung über aktuelle LegalActions und `applyAction`. In der KI selbst wählen `chooseCorpAction`/`chooseRunnerAction` letztlich `chooseSemanticRuntimeAction`, sofern kein `NETGRID_SEMANTIC_AI_RUNTIME=legacy` gesetzt ist. |
| 2. Rolle von DeckDoctrine, TacticalGoalState, SemanticDecisionScore? | Live relevant ist nur `AiDeckDoctrineProfile` aus eigenem Decksnapshot. `DeckDoctrine`, `TacticalGoalState` und `SemanticDecisionScore` aus `semantic-ai-core-meta.ts` sind diagnostisch und laut Code ohne Runtime-Consumer. |
| 3. Persistente TacticalPlan- oder PlanStep-Objekte? | Nein. Es gibt alte `RunnerPlanStep`/`CorpPlanStep`, aber nur per Entscheidung aus aktuellen LegalActions. Keine persistente Planinstanz. |
| 4. Werden fehlende Voraussetzungen erkannt? | Punktuell ja: known no-access Run und wertlose Archives werden ausgeschlossen; sichtbarer Breaker-Druck beeinflusst alte Runner-Pläne. Allgemeines Plan-Blocker-/Prerequisite-Modell fehlt. |
| 5. Werden aktuelle LegalActions als Schritte in einem Plan bewertet? | In alten Runner-/Corp-Planern ja, aber nur als gruppierte konkrete LegalActions. In der Semantic Runtime nein, dort werden LegalActions direkt gescored. |
| 6. Wird ein Plan über mehrere Züge fortgeschrieben? | Nein. Es gibt Belief-Rekonstruktion, Eventhistorie, Debug-/Simulationsmetriken und einzelne Zwei-Zug-Heuristiken, aber keinen persistenten Plan-Lifecycle. |
| 7. Gibt es die genannten Plantypen? | Teilweise als alte grobe Planarten oder semantische Scope-Labels, aber nicht als einheitliche TacticalPlan-Typen. Details siehe nächste Tabelle. |
| 8. Lücken? | Hauptlücke ist die fehlende Zwischenschicht: TacticalPlan -> PlanStep -> ActionSemanticCandidate -> LegalAction. |

## Plantypen-Abgleich

| Gewünschter Plantyp | Aktueller Stand | Lücke |
| --- | --- | --- |
| `runner.obtain_breaker_coverage` | Nicht als Plantyp vorhanden. Annäherungen: `build_rig`, `draw_for_answers`, `assessVisibleBreakerPressure`, `runnerCoverageSearchAction`. | Kein expliziter Plan, kein Target-ICE/Server, kein Rücksprung zum blockierten Ziel. |
| `runner.contest_remote` | Vorhanden als alter `RunnerPlanKind` `contest_remote` und als Semantic-Scope `remote_contest`. | Im Livepfad keine echte Planinstanz; direkter Run wird bewertet oder ausgeschlossen. |
| `runner.opportunistic_central_run` | Nicht als Plantyp vorhanden. Annäherungen: `pressure_hq`, `pressure_rnd`, `safe_probe_run`, Semantic-Scope `simple_hq_or_rnd_pressure`. | Keine gemeinsame Zielauswahl mit R&D/HQ/Archives-Freshness als Planentscheidung. |
| `runner.build_credit_bank` | Nicht als Plantyp vorhanden. Annäherung: installierte Economy-Bewertung mit `pool_build`. | Kein mehrzügiger Bank-Aufbauplan, keine Schwellen-/Horizon-Persistenz. |
| `runner.cash_out_credit_bank` | Nicht als Plantyp vorhanden. Annäherung: installierte Economy-Bewertung mit `pool_payout`. | Kein Plan, wann Bank aufgebaut statt ausgezahlt wird. |
| `corp.create_score_window` | In `semantic-ai-core-meta.ts` als Goal-Family vorhanden; alte Annäherungen: `score_next_turn`, `build_scoring_remote`. | Nicht produktiv als TacticalPlan; kein PlanStep-Lifecycle bis Score. |
| `corp.build_credit_bank` | Nicht als Plantyp vorhanden. Annäherung: `recover_economy` und installierte Economy-Pool-Logik. | Kein dedizierter Credit-Bank-Plan. |
| `corp.rez_defense` | Nicht als Plantyp vorhanden. Annäherung: Semantic-Scope `simple_rez`, alte `protect_hq`/`protect_rnd`/Remote-Schutzbewertung. | Kein strategischer Rez-Plan als eigener Schritt in Score-/Defense-Linie. |

## Schlanker Umsetzungsplan

### Phase 1: TacticalPlan + PlanStep Modell

Ziel: Eine echte Zwischenebene schaffen, ohne Engine-Regeln oder Kartensemantik umzubauen.

Vorschlag:

- Neues Modul `packages/ai/src/tactical-plans.ts`.
- Typen:
  - `TacticalPlan`
  - `TacticalPlanType`
  - `PlanStep`
  - `PlanStepKind`
  - `PlanBlocker`
  - `RequiredCapability`
  - `PlanLifecycle`
  - `PlanScoreBreakdown`
- PlanState actor-privat und side-safe halten. Für Lean Local zuerst deterministisch aus `AiDecisionInput`, Belief State und optional kurzer `previousPlan`-Snapshot rekonstruieren; Persistenz danach nur, wenn sie explizit gebraucht wird.
- `DeckDoctrine` zunächst nur über bestehendes `AiDeckDoctrineProfile` einspeisen. `TacticalGoalState` aus `semantic-ai-core-meta.ts` nicht direkt produktiv übernehmen, sondern die brauchbaren Lifecycle-Felder kontrolliert nachziehen.
- Debug-Ausgabe: separates `planAlternatives`, `planSteps`, `blockedPlans`, `selectedPlan`, `selectedStep`.

Akzeptanz:

- Es gibt echte Planobjekte unabhängig von aktuellen LegalActions.
- Ein Plan kann `blocked` sein und trotzdem einen sinnvollen nächsten Schritt erzeugen.
- Kein Plan enthält Hidden Info oder erfundene Legalität.

### Phase 2: PlanStep-to-LegalAction Mapping

Ziel: Nicht mehr LegalActions direkt scoren, sondern den nächsten Schritt eines Plans auf aktuelle LegalActions mappen.

Vorschlag:

- `buildActionSemanticCandidates(input.legalActions)` als Standardprojektion verwenden.
- Mapper `mapPlanStepToLegalActions(plan, step, candidates, input)` einführen.
- Mapping-Ergebnis:
  - `matched`
  - `blocked_no_legal_action`
  - `blocked_missing_capability`
  - `blocked_too_expensive`
  - `blocked_timing`
  - `defer_to_reactive_window`
- Reaktive Fenster weiter hart priorisieren: Setup-Choice, Access, Steal, Trash, Trace, Encounter Break/Pump, Mandatory Draw, Rez-Fenster.
- `chooseSemanticRuntimeAction` schrittweise umbauen: zuerst Plancontroller erzeugt Plan-/Step-Ranking, dann LegalAction-Mapping; nur bei No-Plan-Fallback direkte Action-Semantic-Score-Auswahl.

Akzeptanz:

- Das Debug-Fenster zeigt: Plan -> nächster Schritt -> gemappte LegalActions -> Score.
- Eine blockierte Remote-Contest-Absicht erzeugt `obtain_breaker_coverage` oder Economy/Draw statt wieder Run auf die Wand.
- Die finale Action bleibt eine Engine-`LegalAction` und `applyAction` bleibt Regelautorität.

### Phase 3: Erste Plantypen

#### `runner.obtain_breaker_coverage`

Auslöser:

- Sichtbarer bekannter ICE-Pfad blockiert ein wertvolles Ziel.
- R&D/HQ/Remote-Druck ist relevant, aber Breaker-Coverage fehlt.

Schritte:

- passenden Breaker installieren
- Such-/Recovery-Action nutzen
- Karte ziehen
- Credits nehmen, falls installierbarer Breaker knapp außerhalb Budget liegt

#### `runner.contest_remote`

Auslöser:

- Remote hat unbekannte Root-Karte, Agenda-Kandidat, Advancement oder relevante trashbare Karte.

Prerequisites:

- Ziel erreichbar oder Risiko bewusst akzeptierbar.
- Wenn bekannte ICE-Path-Blockade: Plan blockiert, nächster Schritt `runner.obtain_breaker_coverage`.

Schritte:

- Run Remote
- bei Access stehlen/trashen/declinen
- bei Fehlschlag Plan aktualisieren oder verwerfen

#### `runner.opportunistic_central_run`

Auslöser:

- Zentralserver frei oder billig erreichbar.
- R&D-Top unbekannt/frisch oder HQ teilweise unbekannt mit Agenda-Dichte.

Schritte:

- HQ/R&D/Archives-Ziel wählen
- Run starten
- Wiederholte Low-Value-Ziele abwerten oder blocken

#### `runner.build_credit_bank`

Auslöser:

- Broker-/Pool-Karte installiert, kein akuter Credit- oder Run-Druck.

Schritte:

- Counter/Pool aufbauen
- nur ausführen, wenn Horizon passt und kein Sofortbedarf blockiert

#### `runner.cash_out_credit_bank`

Auslöser:

- Bank hat hinreichenden Wert oder aktueller Plan braucht Credits.

Schritte:

- Pool auszahlen
- danach abhängig vom aktiven Plan weiterlaufen

#### `corp.create_score_window`

Auslöser:

- Agenda/Scoreline in Hand oder Remote, Runner-Druck kontrollierbar.

Schritte:

- Remote-Root installieren
- ICE installieren oder rezzbare Verteidigung herstellen
- advance
- score

Blocker:

- Remote nackt gegen erreichbaren Runner.
- Creditreserve reicht nicht für Rez/Advance.

#### `corp.build_credit_bank`

Auslöser:

- Pool-/Broker-artige Economy-Karte sichtbar/aktivierbar, kein akutes Score-/Defense-Fenster.

Schritte:

- Bank aufbauen
- bei Score-/Rez-Bedarf auszahlen

#### `corp.rez_defense`

Auslöser:

- Runner greift relevanten Server an oder Score-Fenster braucht sichtbare Verteidigung.

Schritte:

- ICE rezzen
- Rez ablehnen nur, wenn Ziel niedrigen Wert hat, Kosten schlecht sind oder spätere Rez-Linie besser ist

## Empfohlene Tests

Minimaler Testumfang ohne Enterprise-Gate-Struktur:

- `@netgrid/ai` Unit-Tests für Planmodell und Mapper.
- Szenario: Runner will Remote contesten, bekannte Wall blockiert, keine Coverage -> kein Run, nächster Schritt Breaker/Draw/Credit.
- Szenario: Runner hat passende Coverage -> `runner.contest_remote` mappt auf Remote-Run.
- Szenario: leeres/known no-agenda Archives -> kein `opportunistic_central_run` auf Archives.
- Szenario: Broker-Pool mit akutem Creditbedarf -> `cash_out_credit_bank` vor `build_credit_bank`.
- Szenario: Broker-Pool ohne akuten Bedarf und genug Klicks -> `build_credit_bank`.
- Szenario: Corp nacktes Score-Fenster -> `create_score_window` blockiert bis Defense/Rezreserve.
- Typecheck `@netgrid/ai`.

## Aktuelle Verifikation dieser Analyse

Ausgeführt am 2026-06-05:

| Check | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-core-meta.test.ts src/action-semantic-candidate.test.ts` | passed, 2 Testdateien, 32 Tests |
| `git diff --check` | passed |
