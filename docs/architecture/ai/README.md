# AI-Architektur

Stand: 2026-09-11

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

| Registrierter Owner               | Implementierung von Discovery, Assessment und Materialisierung                                                              | Fachvertrag                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `runner.shell_traders_pipeline`   | [createRunnerShellTradersPipelineModule](../../../packages/ai/src/runner/shell-traders/shell-traders-plan-module.ts)        | [Runner §13](runner-plan-contracts.md#13-runnershell_traders_pipeline)                               |
| `runner.resource_lifecycle`       | [createRunnerResourceLifecycleModule](../../../packages/ai/src/runner/resource-lifecycle/resource-lifecycle-plan-module.ts) | [Runner §12](runner-plan-contracts.md#12-runnerresource_lifecycle)                                   |
| `runner.score_installed_agenda`   | [createRunnerInstalledAgendaScoreModule](../../../packages/ai/src/runner/installed-agenda/installed-agenda-plan-module.ts)  | [Runner §14](runner-plan-contracts.md#14-runnerscore_installed_agenda-und-runnersecure_terminal_win) |
| `runner.recurring_economy`        | [createRunnerRecurringEconomyModule](../../../packages/ai/src/runner/recurring-economy/recurring-economy-plan-module.ts)    | [Runner §11](runner-plan-contracts.md#11-runnercredit_bank-und-runnerrecurring_economy)              |
| `runner.credit_bank`              | [createRunnerCreditBankModule](../../../packages/ai/src/runner/credit-bank/credit-bank-plan-module.ts)                      | [Runner §11](runner-plan-contracts.md#11-runnercredit_bank-und-runnerrecurring_economy)              |
| `runner.economy`                  | [createRunnerEconomyModule](../../../packages/ai/src/runner/economy/economy-plan-module.ts)                                 | [Runner §6](runner-plan-contracts.md#6-runnereconomy)                                                |
| `runner.rig_and_coverage`         | [createRunnerCoverageModule](../../../packages/ai/src/runner/rig-coverage/coverage-plan-module.ts)                          | [Runner §4](runner-plan-contracts.md#4-runnerrig_and_coverage)                                       |
| `runner.defense_and_recovery`     | [createRunnerDefenseModule](../../../packages/ai/src/runner/defense-recovery/defense-plan-module.ts)                        | [Runner §7](runner-plan-contracts.md#7-runnerdefense_and_recovery)                                   |
| `runner.secure_terminal_win`      | [createRunnerTerminalWinModule](../../../packages/ai/src/runner/terminal-win/terminal-win-plan-module.ts)                   | [Runner §14](runner-plan-contracts.md#14-runnerscore_installed_agenda-und-runnersecure_terminal_win) |
| `runner.expose_information`       | [createRunnerExposeInformationModule](../../../packages/ai/src/runner/expose-information/expose-information-plan-module.ts) | [Runner §9](runner-plan-contracts.md#9-runnerexpose_information)                                     |
| `runner.pressure_central`         | [centralPressureModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L567)                                | [Runner §2](runner-plan-contracts.md#2-runnerpressure_central)                                       |
| `runner.contest_remote`           | [remoteContestModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L738)                                  | [Runner §3](runner-plan-contracts.md#3-runnercontest_remote)                                         |
| `runner.develop_board_and_hand`   | [developmentModule](../../../packages/ai/src/runner/hand-development/development-plan-module.ts)                                    | [Runner §5](runner-plan-contracts.md#5-runnerdevelop_board_and_hand)                                 |
| `runner.convert_run_window`       | [runWindowModule](../../../packages/ai/src/plans/runner-tactical-plan-modules.ts#L996)                                      | [Runner §8](runner-plan-contracts.md#8-runnerconvert_run_window)                                     |
| `runner.complete_turn`            | [createTurnCompletionPlanModule](../../../packages/ai/src/plans/turn-completion-plan-module.ts)                             | [EndTurn](planning-architecture.md#17-endturn-vertrag)                                               |
| `corp.score_agenda`               | [scoreModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1191)                                               | [Corp §2](corp-plan-contracts.md#2-corpscore_agenda)                                                 |
| `corp.establish_scoring_remote`   | [remoteModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1514)                                              | [Corp §3](corp-plan-contracts.md#3-corpestablish_scoring_remote)                                     |
| `corp.defend_servers`             | [defenseModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1573)                                             | [Corp §4](corp-plan-contracts.md#4-corpdefend_servers)                                               |
| `corp.economy`                    | [economyModule](../../../packages/ai/src/plans/corp-core-plan-modules.ts#L1944)                                             | [Corp §6](corp-plan-contracts.md#6-corpeconomy)                                                      |
| `corp.respond_to_virus_pressure`  | [createCorpVirusPressureModule](../../../packages/ai/src/corp/virus-pressure/virus-pressure-plan-module.ts)                 | [Corp §5](corp-plan-contracts.md#5-corprespond_to_virus_pressure)                                    |
| `corp.punish_campaign`            | [punishCampaignModule](../../../packages/ai/src/corp/punish/punish-campaign-plan-module.ts)                                   | [Corp §7](corp-plan-contracts.md#7-corppunish_campaign)                                              |
| `corp.execute_punish_sequence`    | [punishSequenceModule](../../../packages/ai/src/corp/punish/punish-sequence-plan-module.ts)                                   | [Corp §8](corp-plan-contracts.md#8-corpexecute_punish_sequence)                                      |
| `corp.ambush_and_bluff`           | [ambushModule](../../../packages/ai/src/plans/corp-tactical-plan-modules.ts#L539)                                           | [Corp §9](corp-plan-contracts.md#9-corpambush_and_bluff)                                             |
| `corp.hand_and_agenda_management` | [handModule](../../../packages/ai/src/corp/hand-management/hand-management-plan-module.ts)                                             | [Corp §10](corp-plan-contracts.md#10-corphand_and_agenda_management)                                 |
| `corp.complete_turn`              | [createTurnCompletionPlanModule](../../../packages/ai/src/plans/turn-completion-plan-module.ts)                             | [EndTurn](planning-architecture.md#17-endturn-vertrag)                                               |

Die Faktenproduzenten sind in `runnerContext` / `corpContext` der
[Live-Runtime](../../../packages/ai/src/runtime/plan-first-live-runtime.ts)
verdrahtet. Beispielsweise liefert `runnerCreditBankSignals` den Bankbedarf,
`accessCommitmentForEvaluation` die typisierte Access-Bindung und
`corpScoreProjectNeedsProtectionMaturity` den Schutzbedarf eines Scoreprojekts.
Eine Änderung am Owner verfolgt Fact-Erzeugung, Modul, Disposition und gebundene
Fortsetzung. Für `runner.credit_bank` liegen diese Teile gemeinsam im
[Bank-Owner](../../../packages/ai/src/runner/credit-bank/credit-bank-plan-module.ts);
Vertrag, Dienste und Grenzen stehen in [Runner §11](runner-plan-contracts.md#11-runnercredit_bank-und-runnerrecurring_economy).
Auch [wiederkehrende Economy](../../../packages/ai/src/runner/recurring-economy/recurring-economy-plan-module.ts)
bündelt Signale, Investmentbewertung, Dispositionen und Runzurückstellung im
Owner-Verzeichnis. Der [Ressourcenlebenszyklus](../../../packages/ai/src/runner/resource-lifecycle/resource-lifecycle-plan-module.ts)
bündelt Halten/Verlassen, Quellen- und Zahlungsbindung sowie seinen konkreten
Finanzierungsbedarf. Die gemeinsamen [Finanzierungsverträge](../../../packages/ai/src/plans/runner-funding-contracts.ts)
liegen außerhalb der Core-Registry. Ebenso bündeln
[installierte Agenda-Konversion](../../../packages/ai/src/runner/installed-agenda/installed-agenda-plan-module.ts),
[unmittelbare Siege](../../../packages/ai/src/runner/terminal-win/terminal-win-plan-module.ts)
und [Informationsentscheidungen](../../../packages/ai/src/runner/expose-information/expose-information-plan-module.ts)
ihre fachlichen Pfade in eigenen Verzeichnissen. Beim Informationsowner gehören
auch Erinnerung und installierte Karten-Choices dazu. Gemeinsame taktische
Planstandards liegen in [runner-tactical-module-support.ts](../../../packages/ai/src/plans/runner-tactical-module-support.ts).
Bei den übrigen Ownern erklärt allein die Moduldatei den heutigen Pfad noch
nicht vollständig.

Auch Shell-Traders-Pipeline, Corp-Virusdruck, Runner-Abwehr, Runner-Economy
und Rig/Coverage besitzen vertikale Implementierungen unter `runner/` bzw.
`corp/virus-pressure/`; die Ownerkarte verlinkt ihre Factories, die jeweiligen
Fachverträge benennen Signale, Bindungen und Dienste. Die Runner-Core-Datei
enthält nur noch die Domänentypen und die Registrierung ihrer acht Module.
Geteilte taktische Standards, Funding- und Entwicklungskriterien sowie
Run-Payoff-Fakten sind von den Registries getrennt. Die gemeinsame Live-Runtime
komponiert die Daten und Dienste und koordiniert weiterhin planübergreifende
Ausschlüsse. Das ist eine Quellcodestruktur innerhalb von `@netgrid/ai`, keine
Aufteilung in separat geladene Laufzeitbibliotheken.

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
