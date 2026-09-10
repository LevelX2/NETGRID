# AI-Architektur

Stand: 2026-09-10

Diese Karte führt vom aktuellen Entscheidungspfad und Planowner zu Code und
maßgeblichem Vertrag. Implementierungsprozesse und historische Reviewstände
werden nicht als zweite Steuerungsschicht gepflegt; Git hält die Historie.

## Welche Quelle beantwortet welche Frage?

| Frage / zentrale Regel                                                         | Maßgebliche Definition                                                                                                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warum Plan-first, welche Schicht hat welche Autorität?                         | [Zielbild](target-architecture.md)                                                                                                                    |
| Wie wird eine Änderung vorbereitet und belegt?                                 | [Änderungskompass](change-compass.md), Prüftiefe in [packages/ai/AGENTS.md](../../../packages/ai/AGENTS.md)                                           |
| Was ist die reale Modul-API, wie leben Instanzen und Parent-/Need-Beziehungen? | [Gemeinsamer Planvertrag](planning-architecture.md)                                                                                                   |
| Welche Action darf ein aktueller Step ausführen; wann ist EndTurn zulässig?    | [Planvertrag: Eingabe-/Ausgabegrenze](planning-architecture.md#5-eingabe--und-ausgabegrenze), [EndTurn](planning-architecture.md#17-endturn-vertrag)  |
| Wie werden Zuglinien, Claims und Unsicherheit bewertet?                        | [Zug-/Kampagnenvertrag](turn-campaign-planner.md)                                                                                                     |
| Wann bleibt ein Zugcommitment bestehen, wann wird neu geplant?                 | [Revalidierung](turn-campaign-planner.md#8-revalidierung-und-neuplanung)                                                                              |
| Welche Fachentscheidung gehört zu welchem Owner?                               | [Runner-](runner-plan-contracts.md) und [Corp-Planverträge](corp-plan-contracts.md), Codekarte unten                                                  |
| Welche Fähigkeiten sind offen oder nur begrenzt abgenommen?                    | [Implementierungsgrenzen](planning-architecture.md#2-implementierungsstand-und-offene-grenzen), [Capability-Review](hidden-node-capability-review.md) |
| Woher kommen Hints und ihre Metadaten?                                         | [Hint-Vertrag](hint-architecture.md)                                                                                                                  |
| Was bedeuten Taktiksignale und Strategiekomposition?                           | [Strategiereferenz](strategy-signals-guide.md)                                                                                                        |
| Welche Informationen darf die KI konsumieren?                                  | [Controllervertrag](controller-contract.md) und [Zielbild: Sicherheitsgrenzen](target-architecture.md#sicherheitsgrenzen)                             |
| Was darf Diagnose speichern und anzeigen?                                      | [Trace-Vertrag](decision-trace-contract.md); Plannerinhalte in [Zugplan-Diagnostik](turn-campaign-planner.md#12-diagnostik)                           |

## Aktueller Aufrufpfad

1. [index.ts](../../../packages/ai/src/index.ts) exportiert die öffentliche
   AI-Fassade. [ai-live-runtime-composition.ts](../../../packages/ai/src/runtime/ai-live-runtime-composition.ts)
   verdrahtet ihre Abhängigkeiten über die bestehenden Composition-Dateien.
2. `chooseAiAction` verteilt über `chooseAiActionFromSides` an
   `chooseCorpAction` / `chooseRunnerAction` in
   [ai-action-entrypoints.ts](../../../packages/ai/src/runtime/ai-action-entrypoints.ts).
   Beide rufen dieselbe injizierte `chooseSemanticRuntimeAction` auf.
3. [semantic-runtime-decision-context.ts](../../../packages/ai/src/runtime/semantic-runtime-decision-context.ts)
   öffnet den entscheidungslokalen Cache und ruft `choosePlanFirstLiveAction`.
4. [plan-first-live-runtime.ts](../../../packages/ai/src/runtime/plan-first-live-runtime.ts)
   erzeugt Semantik, `runnerContext` / `corpContext`, Signale, Dispositionen
   und die side-spezifische Registry. Fachliche Signalbildung liegt heute
   teilweise noch hier; sie ist nicht vollständig in die Moduldateien ausgelagert.
5. [runPlanScheduler](../../../packages/ai/src/plans/plan-scheduler.ts) verbindet
   Discovery, Reconciliation, Assessment und aktuelle Routen. Der normale
   Planpfad läuft anschließend durch den side-spezifischen TurnPlanner und
   die Commitment-/Rematerialisierungsbindung. Der
   [Ablaufvertrag](planning-architecture.md#10-aktueller-scheduler--und-runtime-ablauf)
   benennt diese Reihenfolge; die [Plannerkarte](turn-campaign-planner.md#implementierungskarte)
   verlinkt die Details.
6. Gebundene Choices vervollständigen ausschließlich den ausgewählten Step;
   die Engine revalidiert und vollzieht die Action. Portfolio-/Commitment-
   Persistenz liegt beim Runtime-/Serveranschluss. Simulation verwendet
   denselben Plan-first-Einstieg.

Dateinamen wie `*-shadow.ts` oder `*-cutover.ts` sind bestehende technische
Namen. Die normale Live-Runtime verwendet für beide Seiten den Modus
`cutover`. `legacy_compare` ist ausdrücklich angeforderte Vergleichslogik
und kein stiller Fehlerpfad. Die Composition-Kette wird hier dokumentiert;
ihre Extraktion oder Zusammenlegung ist keine erledigte Änderung.

## Planowner und Implementierungen

Die folgenden 25 Module werden durch `currentRunnerPlanModules` und
`currentCorpPlanModules` in der Live-Runtime zusammengestellt. Core- und
Tactical-Factories liefern die fachlichen Module, pro Side kommt ein
Completion-Modul hinzu. Diese Registrierung belegt Zuständigkeit, keine
vollständige Abdeckung aller denkbaren Kartenfolgen.

| Registrierter Owner               | Implementierung von Discovery, Assessment und Materialisierung                                  | Fachvertrag                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `runner.shell_traders_pipeline`   | [shellTradersPipelineModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L875)   | [Runner §13](runner-plan-contracts.md#13-runnershell_traders_pipeline)                               |
| `runner.resource_lifecycle`       | [resourceLifecycleModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L950)      | [Runner §12](runner-plan-contracts.md#12-runnerresource_lifecycle)                                   |
| `runner.score_installed_agenda`   | [installedAgendaScoreModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L1023)  | [Runner §14](runner-plan-contracts.md#14-runnerscore_installed_agenda-und-runnersecure_terminal_win) |
| `runner.recurring_economy`        | [recurringEconomyModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L1080)      | [Runner §11](runner-plan-contracts.md#11-runnercredit_bank-und-runnerrecurring_economy)              |
| `runner.credit_bank`              | [creditBankModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L1147)            | [Runner §11](runner-plan-contracts.md#11-runnercredit_bank-und-runnerrecurring_economy)              |
| `runner.economy`                  | [economyModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L1328)               | [Runner §6](runner-plan-contracts.md#6-runnereconomy)                                                |
| `runner.rig_and_coverage`         | [coverageModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L1529)              | [Runner §4](runner-plan-contracts.md#4-runnerrig_and_coverage)                                       |
| `runner.defense_and_recovery`     | [defenseModule](../../../packages/ai/src/plans/runner-core-plan-modules.ts#L1726)               | [Runner §7](runner-plan-contracts.md#7-runnerdefense_and_recovery)                                   |
| `runner.secure_terminal_win`      | [terminalWinModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L430)        | [Runner §14](runner-plan-contracts.md#14-runnerscore_installed_agenda-und-runnersecure_terminal_win) |
| `runner.expose_information`       | [exposeInformationModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L666)  | [Runner §9](runner-plan-contracts.md#9-runnerexpose_information)                                     |
| `runner.pressure_central`         | [centralPressureModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L737)    | [Runner §2](runner-plan-contracts.md#2-runnerpressure_central)                                       |
| `runner.contest_remote`           | [remoteContestModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L908)      | [Runner §3](runner-plan-contracts.md#3-runnercontest_remote)                                         |
| `runner.develop_board_and_hand`   | [developmentModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L1013)       | [Runner §5](runner-plan-contracts.md#5-runnerdevelop_board_and_hand)                                 |
| `runner.convert_run_window`       | [runWindowModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L1166)         | [Runner §8](runner-plan-contracts.md#8-runnerconvert_run_window)                                     |
| `runner.complete_turn`            | [createTurnCompletionPlanModule](../../../packages/ai/src/plans/turn-completion-plan-module.ts) | [EndTurn](planning-architecture.md#17-endturn-vertrag)                                               |
| `corp.score_agenda`               | [scoreModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1191)                   | [Corp §2](corp-plan-contracts.md#2-corpscore_agenda)                                                 |
| `corp.establish_scoring_remote`   | [remoteModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1514)                  | [Corp §3](corp-plan-contracts.md#3-corpestablish_scoring_remote)                                     |
| `corp.defend_servers`             | [defenseModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1573)                 | [Corp §4](corp-plan-contracts.md#4-corpdefend_servers)                                               |
| `corp.economy`                    | [economyModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1944)                 | [Corp §6](corp-plan-contracts.md#6-corpeconomy)                                                      |
| `corp.respond_to_virus_pressure`  | [virusModule](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts#L357)                | [Corp §5](corp-plan-contracts.md#5-corprespond_to_virus_pressure)                                    |
| `corp.punish_campaign`            | [punishCampaignModule](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts#L406)       | [Corp §7](corp-plan-contracts.md#7-corppunish_campaign)                                              |
| `corp.execute_punish_sequence`    | [punishSequenceModule](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts#L483)       | [Corp §8](corp-plan-contracts.md#8-corpexecute_punish_sequence)                                      |
| `corp.ambush_and_bluff`           | [ambushModule](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts#L597)               | [Corp §9](corp-plan-contracts.md#9-corpambush_and_bluff)                                             |
| `corp.hand_and_agenda_management` | [handModule](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts#L845)                 | [Corp §10](corp-plan-contracts.md#10-corphand_and_agenda_management)                                 |
| `corp.complete_turn`              | [createTurnCompletionPlanModule](../../../packages/ai/src/plans/turn-completion-plan-module.ts) | [EndTurn](planning-architecture.md#17-endturn-vertrag)                                               |

Die Faktenproduzenten sind in `runnerContext` / `corpContext` der
[Live-Runtime](../../../packages/ai/src/runtime/plan-first-live-runtime.ts)
verdrahtet. Beispielsweise liefert `runnerCreditBankSignals` den Bankbedarf,
`accessCommitmentForEvaluation` die typisierte Access-Bindung und
`corpScoreProjectNeedsProtectionMaturity` den Schutzbedarf eines Scoreprojekts.
Die jeweilige Moduldatei deklariert ihren Domain-/Signalvertrag. Eine Änderung
am Owner verfolgt daher Fact-Erzeugung, Modul, Disposition und gebundene
Fortsetzung; allein die Moduldatei erklärt den heutigen Pfad nicht vollständig.

Nicht registriert sind die konzeptionellen Opening-Module
`runner.opening_strategy` und `corp.opening_and_board_foundation`. Ihre
fachliche Idee steht ausdrücklich als offen in den Ownerverträgen.

## Weitere aktuelle Referenzen

- [R&D-Zugriffsgedächtnis](rnd-access-memory.md): geordnete side-sichere Erinnerung.
- [Simulations- und Evidenzmatrix](simulation-test-matrix.md): passende Nachweise.
- [Arbeitsboard](../../activities/README.md): aktueller Umsetzungsauftrag.

## Pflegevertrag

Jede zentrale Regel hat die oben zugeordnete maßgebliche Definition.
Andere Seiten erläutern ihre Anwendung oder verweisen darauf; sie führen
keine zweite normative Fassung. Der Änderungskompass ist eine Prüfanleitung,
keine zusätzliche ausführliche Fachspezifikation.

Bei einer Änderung zuerst die zuständige Definition pflegen, anschließend
die betroffenen Verweise, Ownerkarte, Zielbild und den Kompass auf Folgen
prüfen. Nur tatsächlich betroffene Aussagen werden angepasst; eine Pflicht
zum dreifachen Ausschreiben derselben Regel besteht nicht. Der Abschluss
benennt die Folgenprüfung oder bestätigt die unveränderte Gültigkeit.

Aktiver Vertrag, erklärendes Beispiel und offene Fähigkeit müssen erkennbar
sein. Eine konzeptionelle Schnittstelle wird mit ihrer realen Umsetzung
abgeglichen, bevor daraus neue Codepflichten abgeleitet werden. Normative
Links müssen auf vorhandene aktuelle Quellen zeigen. Änderungen der
Registrierung werden in dieser Ownerkarte nachvollzogen.

Lebende Dokumente tragen kurze, versionslose Dateinamen. Historische
Umsetzungsschritte, Versionschroniken und erledigte Reviews werden nach
Übertragung ihrer weiterhin gültigen Aussagen gelöscht, nicht archiviert.
