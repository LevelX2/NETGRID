# Runner-RunPlan Big-Cutover ohne Fallback

Status: in Umsetzung

## Quelle/Vorgabe

Ausgangspunkt ist die Nutzerfreigabe vom 2026-07-07 und die lokale Vorgabe
`Plan für Runs.txt`. Der Umbau ersetzt im Runner-Run-Fenster die planlose
reaktive Entscheidung durch einen verbindlichen `RunnerRunPlan`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für eine sequenzielle Umsetzung:

- Gesamtziel und Endzustand sind klar: Jeder Runner-Run hat während des Runs
  genau einen führenden `RunnerRunPlan`.
- In Scope sind Run-Start, aktiver Run-Kontext, Encounter, Pump, Break,
  Continue, Jack-out, Access, Debug und Tests.
- Nicht-Ziele sind ausdrücklich definiert: kein Legacy-Fallback, kein Shadow
  Mode, keine Rekonstruktion bei fehlendem RunPlan, keine Feature-Flag-
  Rückschaltung und keine Spezialregel für Codecracker.
- Sicherheitsgrenzen bleiben unverändert: Engine als Regelautorität,
  LegalActions-only, Hidden-Info-Schutz, deterministische Debug-/Trace-Flächen.
- Die aktuelle Codebasis nutzt bereits neue Deckstrategie- und Strategic-
  Intent-Pfade. Wo die Vorgabe historisch `DeckDoctrine` nennt, wird im
  aktuellen Workspace die produktive Deckstrategie/Strategic-Intent-Schicht
  verwendet.

## Preflight-Befund im Workspace

Der aktuelle Code bestätigt die Architekturdiagnose:

- `packages/ai/src/runtime/semantic-runtime.ts` berechnet zuerst
  `reactiveChoice`; wenn eine reaktive Choice existiert, wird
  `planRuntime = emptyTacticalPlanRuntimeResult()` gesetzt. Dadurch kann die
  bestehende TacticalPlan-Schicht Encounter-/Access-Entscheidungen nicht mehr
  führen.
- `packages/ai/src/runtime/reactive-action.ts` stuft `break_subroutine`,
  `pump_breaker`, `continue_run`, `jack_out` und Access-Actions als reaktiv ein.
  Diese Actions bleiben LegalActions, dürfen im aktiven Run aber nicht mehr als
  planlose Sonderroute vor RunPlan ausgewählt werden.
- `packages/ai/src/runtime/semantic-runtime-scope.ts` trennt Encounter-
  Survival (`pump_breaker`, `break_subroutine`) und simple Run Choice
  (`continue_run`, `jack_out`) in verschiedene Scopes. Der RunPlan muss diese
  Scopes wieder unter einem Ziel zusammenführen.
- `packages/ai/src/runtime/runner-basic-action-penalty-score.ts` bestraft
  `continue_run` durch ETR nur, wenn bereits direkt ein `break_subroutine`
  legal ist. Pump-then-Break-Sequenzen fehlen dort.
- `packages/ai/src/runtime/runner-pump-viability-context.ts` besitzt bereits
  wichtige Vorarbeit für Pump-Viability und kann als Quelle für generische
  Sequenzquotes genutzt werden.
- `packages/ai/src/runner-run-target-evaluation.ts`,
  `packages/ai/src/actions/run-action-projection.ts`,
  `packages/ai/src/actions/basic-action-semantics.ts` und
  `packages/ai/src/access/*` liefern wiederverwendbare, side-sichere
  Bausteine für Run-Ziel, Run-Action-Semantik und Access-Intents.
- `packages/ai/src/plans/plan-memory.ts` markiert
  `runner.opportunistic_central_run` aktuell bei gemapptem Schritt als
  `satisfied`. Das ist für den neuen Vertrag zu früh, wenn der Run noch aktiv
  ist oder Access noch aussteht.
- `packages/ai/src/diagnostics/semantic-runtime-decision-debug.ts` und
  `apps/web/features/debug/AiDecisionDebugOverlay.tsx` sind die relevanten
  Debug-Flächen für eine redigierte RunPlan-Anzeige.

## Gesamtziel

Nach Abschluss darf ein Runner-Run nicht mehr als Folge isolierter reaktiver
Einzelentscheidungen behandelt werden. Jeder gewählte Run erzeugt zwingend
einen `RunnerRunPlan`; dieser Plan führt alle weiteren Runner-Entscheidungen
während des Runs: `pump_breaker`, `break_subroutine`, `continue_run`,
`jack_out` und Access-Entscheidungen.

Der Plan erzeugt keine LegalActions. Er bewertet nur vorhandene LegalActions.
Die final gewählte `actionId` muss immer aus den aktuellen `input.legalActions`
stammen und weiterhin durch `applyAction` validiert werden.

## Annahmen

- `ActionSemanticCandidate` bleibt die semantische Brücke zwischen Engine-
  LegalActions und AI-Bewertung.
- `TacticalPlan` und TacticalGoals liefern den Grund, warum ein Run gestartet
  wird. Während eines aktiven Runs führt danach der `RunnerRunPlan`.
- Die produktive Deckstrategie, DeckCapabilities und RunnerStrategicIntent
  dürfen den Run-Zweck beeinflussen, aber nicht verdeckte Gegnerinformationen
  verwenden.
- No-Fallback bedeutet technische Entscheidungspfade, nicht fachliche
  Neutralität. Eine neutrale Strategie für ankerlose Decks bleibt fachliche
  Semantik, kein Legacy-Fallback.
- Falls Engine-Tests oder AI-Fixtures künstlich direkt in einen Runzustand
  springen, müssen sie künftig entweder einen RunPlan initialisieren oder
  bewusst den Missing-Plan-Fehler testen.

## Nicht-Ziele

- Keine Engine- oder `applyAction`-Regeländerung.
- Keine Erzeugung neuer LegalActions durch die KI.
- Keine Hidden-Info-Ausweitung in PlayerViews, Debug, Traces oder Tests.
- Kein LegacyRunnerRunPlanAdapter.
- Keine `reconstructRunPlanFromPlayerView`-Funktion.
- Kein `chooseLegacyReactiveIfNoRunPlan`-Pfad.
- Kein RunPlan-Feature-Flag und kein Shadow-vs-Legacy-Vergleich.
- Keine Speziallogik für einzelne Kartenpaare wie Codecracker/Quandary.
- Keine Wiederbelebung der entfernten alten DeckDoctrine.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt oder ein
  Sicherheitsblocker dokumentiert ist.
- Aktiver Runner-Run ohne `RunnerRunPlan` ist ein Fehlerzustand.
- Jede ausgewählte Action stammt aus aktuellen LegalActions.
- RunPlan und Quote lesen nur side-sichere Daten.
- RunPlan erzeugt keine Legalität.
- Reaktive Run-Actions dürfen den RunPlan im aktiven Run nicht überspringen.
- PlanMemory für TacticalPlans darf den Run-Zweck liefern, aber nicht die
  In-Run-Führung übernehmen.

## Automatische Fehlerbehandlung

- TypeScript- und Testfehler werden im aktuellen Paket eng debuggt.
- Wenn ein aktiver Run ohne Plan sichtbar wird, wird nicht fallbacked; die
  Plan-Erzeugung oder der Lifecycle wird repariert.
- Wenn ein Fixture ohne vorherigen `start_run` in den Runzustand springt, wird
  entschieden, ob der Test den Fehlerzustand absichert oder die Fixture den
  benötigten Plan initialisiert.
- Wenn eine Subroutine nicht side-sicher klassifizierbar ist, wird sie
  konservativ als unbekanntes Risiko behandelt, nicht durch Hidden Info
  aufgelöst.
- Wenn ein Paket Sicherheitsgrenzen berührt, werden fokussierte Regressionen
  vor dem nächsten Paket ergänzt.

## Sicherheitsblocker

- Auswahl einer nicht legalen oder nicht aktuellen `actionId`.
- Hidden-Info-Leak durch Quote, Debug, Trace, Testhelper oder Entscheidung.
- RunPlan-Fallback auf alte Reactive-/TacticalPlan-/Legacy-Scorer bei aktivem
  Run.
- Stille Rekonstruktion eines Plans aus `playerView.run`.
- Nicht erklärbarer Typecheck- oder Testbruch in betroffenen AI-Pfaden.
- Fachlich offensichtlich falsche In-Run-Entscheidung trotz grünem Test.

## State Machine

`preflight` -> `runplan_1_contract_and_cutover_spine` ->
`runplan_2_start_objectives_and_memory` ->
`runplan_3_path_quote_budget_sequences` -> `runplan_4_encounter_policy` ->
`runplan_5_revalidation` -> `runplan_6_access_policy` ->
`runplan_7_debug_cleanup_regression` -> `final_verify` -> `merge_main` ->
`complete`

## Paketfolge

### RUNPLAN-0: Preflight und Prozessartefakt

Ziel: Entscheidungspfade, betroffene Module, Tests und Sicherheitsgrenzen
inventarisieren; dieses Prozessartefakt versionieren.

Konkrete Arbeit:

- Aktuelle Runner-Run-Entscheidungspfade prüfen.
- Betroffene Runtime-, Plan-, RunTarget-, Pump-, Encounter-, Access- und Debug-
  Module erfassen.
- Prozessartefakt mit Paketfolge und Done-Gates erstellen.

Kernartefakte:

- `docs/architecture/ai/runner-runplan-big-cutover-process-2026-07-07.md`

Checks:

- `git diff --check`
- `git status --short`

Done-Gate:

- Prozessartefakt liegt vor.
- Worktree und Branch sind isoliert.
- Keine Code-Verhaltensänderung in RUNPLAN-0.

Commit-Message: `docs(ai): plan runner runplan big cutover`

### RUNPLAN-1: Vertrag und Cutover-Spine

Ziel: Typen, Memory und Runtime-Dispatcher für den RunPlan einführen, ohne alte
Run-Fallbacks zu akzeptieren.

Konkrete Arbeit:

- `RunnerRunPlan`, Lifecycle, Origin, Objective, Budget, Reserve, PathQuote,
  EncounterObligation, Revalidation und Debug-Typen einführen.
- `RunnerRunPlanMemory` mit genau einem aktiven Plan je Runner-Kontext bauen.
- Guard `requireActiveRunnerRunPlan` einführen: aktiver Runner-Run ohne Plan ist
  Fehler.
- Semantic Runtime so schneiden, dass aktive Runner-Run-Fenster über
  RunPlan-aware Entscheidung laufen und nicht durch `reactiveChoice` vorzeitig
  abgeschlossen werden.
- Erste Invarianten-Tests für Missing-Plan und LegalActions-only ergänzen.

Done-Gate:

- Aktiver Run ohne Plan fällt sichtbar fehl.
- Run-Fenster überspringen die RunPlan-Schicht nicht mehr.
- Keine Legacy-/Fallback-Funktion für fehlenden Plan existiert.

Commit-Message: `feat(ai): introduce runner runplan cutover spine`

### RUNPLAN-2: Run-Start, Objective und Memory

Ziel: Jede gewählte Run-Start-Action erzeugt zwingend einen Plan.

Konkrete Arbeit:

- `start_run` und kartenbasierte Run-Actions aus Action-Semantik, TacticalGoals,
  RunnerRunTargetEvaluation, Deckstrategie und DeckCapabilities in
  `RunObjective` übersetzen.
- `AccessIntent` für HQ, R&D, Remote, Archives, Multiaccess und
  card-effect Runs ableiten.
- Plan nach erfolgreicher Auswahl der Run-Start-Action speichern.
- TacticalPlanMemory so anpassen, dass Run-Start nicht als voll erfüllter Run-
  Zweck behandelt wird, solange der aktive Run/Access läuft.

Done-Gate:

- Jeder von der Runner-KI gewählte Run hat danach einen aktiven RunPlan.
- RunPlan wird nicht direkt bei `start_run` abgeschlossen.
- Keine alte DeckDoctrine wird als Quelle verwendet.

Commit-Message: `feat(ai): create runner runplans from run starts`

### RUNPLAN-3: PathQuote, Budget und Sequenzen

Ziel: Bekannte Pfade, Kosten und Pump-Break-Sequenzen planrelativ quoten.

Konkrete Arbeit:

- `RunBudget` mit getrennten Credit-Pools modellieren: normale Credits,
  run-only, recurring nach Verwendungszweck, stealth, non-noisy, Steal-/Trash-
  Reserve, Damage-/Tag-Safety.
- `RunPathQuote`, `IceEncounterQuote`, `SubroutineQuote`,
  `BreakerCoverageQuote` und `EncounterActionSequence` bauen.
- Sequenzen erkennen, insbesondere `pump_breaker -> break_subroutine ->
  continue_run`.
- Stealth-Credits nicht für noisy Breaker zählen.
- Steal-/Trash-Reserve nicht versehentlich für Pump/Break ausgeben.

Done-Gate:

- Quote erkennt direktes Breaken und Pump-then-Break als generische Sequenz.
- Codecracker-Fälle sind über generische Daten modellierbar, ohne Sonderregel.
- Bekannter unpayable Pfad blockiert Run-Start, außer Probe/Survival erlaubt es.

Commit-Message: `feat(ai): quote runner run paths with action sequences`

### RUNPLAN-4: EncounterPolicy

Ziel: Encounter-Actions vollständig über den aktiven RunPlan bewerten.

Konkrete Arbeit:

- `SubroutineThreatClassifier` planrelativ anbinden.
- `EncounterPolicy` für `pump_breaker`, `break_subroutine`, `continue_run` und
  `jack_out` bauen.
- `continue_run` durch ungebrochenes planrelevantes ETR hart ausschließen oder
  hart bestrafen, wenn eine bezahlbare Plansequenz existiert.
- `jack_out` als planrelativen Abbruch bewerten.
- Bestehende nachrangige Penalties nur als sekundäre Safety behalten, nicht als
  Hauptlogik.

Done-Gate:

- Codecracker gegen Quandary: pump, pump, break, continue.
- Codecracker gegen Keeper: viermal pump, break, continue.
- Nutzloses Pumpen bleibt ausgeschlossen.
- Nicht blockierende oder neutralisierte Subroutinen dürfen planrichtig
  durchgelassen werden.

Commit-Message: `feat(ai): route runner encounters through runplans`

### RUNPLAN-5: Revalidation

Ziel: Aktiven Plan bei jedem Runner-Entscheidungspunkt im Run revalidieren.

Konkrete Arbeit:

- Revalidation-Fingerprint für Server, Position, ICE, Root, Quotes, Credits,
  Bypass/Prevention, Safety, AccessIntent und Zielstatus bauen.
- Statuswerte `valid`, `adjusted`, `abort_recommended`, `invalid`,
  `objective_satisfied` verwenden.
- ICE-Rez, Stärke-/Subroutine-/Kostenänderung und Root-/Upgrade-/Node-Rez als
  Revalidation-Trigger behandeln.
- Bei `invalid` bevorzugt legalen `jack_out` wählen; wenn nicht legal,
  schadensminimierende RunPlan-Policy verwenden, nicht Legacy.

Done-Gate:

- Root-/Upgrade-/Node-Rez verändert Trash-, Steal- oder ICE-Quote.
- Future-ICE-Modifier requoten verbleibenden Pfad.
- Abort-Status führt zu planrichtigem Jack-out.

Commit-Message: `feat(ai): revalidate runner runplans during runs`

### RUNPLAN-6: AccessPolicy

Ziel: RunPlan bis zum vollständigen Access fortführen.

Konkrete Arbeit:

- Access-Actions über Plan, AccessIntent, Budget und sichtbare Zieloptionen
  bewerten.
- Agenda-Steal, Trash, Decline, Multiaccess und Ersatzaccess planrelativ
  entscheiden.
- RunPlan erst nach abgeschlossenem Access, Jack-out oder Run-Ende löschen.
- Access-Ambush-Risiken nur aus side-sicheren Daten berücksichtigen.

Done-Gate:

- Access-Entscheidungen nutzen den aktiven RunPlan.
- Plan wird nach erfolgreichem Access gelöscht.
- Plan wird nicht nach Passieren des letzten ICE vorzeitig abgeschlossen.

Commit-Message: `feat(ai): keep runner runplans through access`

### RUNPLAN-7: Debug, Cleanup und Regression

Ziel: Debug-Flächen, Tests und alte Run-Fallbacks final bereinigen.

Konkrete Arbeit:

- DebugSurface redigiert erweitern: Plan-ID, Lifecycle, Origin, Objective,
  Target, Budget, PathQuote, Obligation, gewählte Semantik, Revalidation und
  Abort-Grund.
- Alte Run-Fallbacks entfernen oder im aktiven Run unerreichbar machen.
- Pflichtregressionen ergänzen und bestehende Fixtures an No-Fallback anpassen.
- Review-Artefakt mit Scope, Checks, Restpunkten und Abweichungen schreiben.

Done-Gate:

- Kein Run-Fenster nutzt alte `reactiveChoice`-Priorität als führenden Pfad.
- Missing-RunPlan-Test beweist sichtbaren Fehler.
- Hidden-Info-Regressionen bleiben grün.
- Finale AI-Checks sind grün oder Sicherheitsblocker ist dokumentiert.

Commit-Message: `test(ai): harden runner runplan cutover regressions`

## Verifikationsregeln

Je Paket:

- Fokussierte Vitest-Dateien für geänderte AI-Module.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Final:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- relevante Runtime-/Plan-/RunTarget-/ActionSemantic-Suites
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_RUNNER_RUNPLAN_BIG_CUTOVER`
- Branch: `codex/runner-runplan-big-cutover`
- Integrationsbranch: `main`
- Umsetzung erfolgt ausschließlich im Arbeits-Worktree.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge
  genutzt.
- Nur paketzugehörige Änderungen werden gestaged.
- Pro abgeschlossenem Paket wird ein Commit erstellt.
- Push oder Pull Request nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Runner-RunPlan Big-Cutover ohne Fallback vollständig und
sequenziell von RUNPLAN-0 bis RUNPLAN-7 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis,
agents/release-implementation-agent.md und
docs/architecture/ai/runner-runplan-big-cutover-process-2026-07-07.md.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_RUNNER_RUNPLAN_BIG_CUTOVER auf Branch
codex/runner-runplan-big-cutover.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische
Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit
Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen,
Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Paketcommits RUNPLAN-0 bis RUNPLAN-7 liegen auf
  `codex/runner-runplan-big-cutover`.
- Bei aktivem Runner-Run existiert genau ein aktiver `RunnerRunPlan`.
- Encounter- und Access-Entscheidungen laufen über RunPlan.
- Fehlender RunPlan bei aktivem Run ist sichtbar fehlerhaft und fallbacked nicht.
- Codecracker schlägt Quandary und Keeper über generische Pump-Break-Sequenz.
- `continue_run` wird nicht durch ungebrochenes planrelevantes ETR gewählt.
- `jack_out` ist planrelativer Abbruch.
- Root-/Upgrade-/Node-Rez revalidiert den Plan.
- Alle gewählten Actions sind aktuelle LegalActions.
- Hidden-Info-Schutz bleibt gewahrt.
- Finale AI-Checks und `git diff --check` sind grün oder ein dokumentierter
  Sicherheitsblocker stoppt den Prozess.
- Arbeitsbranch ist lokal nach `main` gemerged und der Worktree entfernt.
