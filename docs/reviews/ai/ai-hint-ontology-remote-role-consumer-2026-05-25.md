# AI Hint Ontology RemoteRole Consumer 2026-05-25

## Kurzfazit

Der Slice bindet strukturierte `remoteRole`-Ontology-Felder eng und konservativ an Corp Remote-Safety und Remote-Portfolio-Diagnostik an. Die Engine bleibt Regelautorität: Ontology erzeugt keine LegalActions, macht keine Install-/Rez-/Advance-/Score-Linie legal und überschreibt weder Boardstate noch `effectiveRunQuote`.

Der 8-Slot-Lauf bleibt safety-stabil. Candidate hält `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`, `corpAgendaInstalledInCheaplyContestableRemote = 0` und `corpAdvanceInCheaplyContestableRemote = 0`.

## Verbraucherstelle

Die neue Hilfsdatei `packages/ai/src/remote-role-ontology-consumer.ts` liefert read-only Klassifikation und Safety-Bewertung:

- `getStructuredRemoteRoleForCard`
- `classifyRemoteRoleFromOntology`
- `structuredRemoteRoleSafetyAssessmentForCard`
- `structuredRemoteRoleSafetyBonusForServer`
- Konfliktprüfung zwischen Legacy-Rollen und strukturierter `remoteRole`

In `corp-plans.ts` wird `remoteRole` in `assessCorpEffectiveRemoteSafety`, `remoteProtectionScoreForServer`, `isVisibleRemoteProtectionCard` und der Remote-Portfolio-Evidence genutzt.

## Prioritätsregeln

Die Rangfolge bleibt:

1. LegalActions, aktueller Boardstate und `applyAction`.
2. `effectiveRunQuote` und sichtbare Run-Analyse.
3. sichtbarer/rezzter installed Card State.
4. strukturierte `remoteRole`/Effects.
5. Legacy-`roles`/`planRoles` als Fallback.

Nur bekannte und rezzte Root-Karten dürfen aktive RemoteRole-Safety liefern. Unrezzte/inaktive Root-Karten erzeugen Diagnose-Evidence, aber keinen aktiven Schutzbonus.

## Genutzte RemoteRole-Kinds

Aktiv safety-wirksam:

- `scoring_protection`
- `agenda_steal_tax`
- `run_tax`
- `tax_fort`
- `ice_modifier`

Nicht als Scoring-Schutz gezählt:

- `remote_capacity`
- `asset_economy`
- `bait`
- `ambush`

`agenda_steal_tax` wirkt nur im Agenda-/Scoring-Kontext. Ein Red-Herrings-artiger Effekt kann die Scoring-Safety erhöhen, wenn der Runner nach dem sichtbaren Pfad die Zusatzkosten nicht bezahlen kann. Crystal-Palace-artiger `run_tax` unterstützt Safety, wird aber nicht als Economy, Counter oder Agenda-Steal-Tax behandelt.

## Runner-Seite

Runner-Anbindung bleibt eng diagnostisch. Bei sichtbaren accessed Remote-Root-Karten werden strukturierte `remoteRole`-Daten in Remote-Trash-Metriken gespiegelt. Trash-Legalität, Trash-Budget und Reserve-Discipline werden nicht überschrieben.

## Metriken

Neue First-Class-Metriken:

- Corp: `corpRemoteRoleProfilesSeen`, `corpRemoteRoleUsedForSafety`, `corpRemoteRoleUsedForScoringRemote`, `corpRemoteRoleUsedForPortfolio`, `corpRemoteRoleConflictWithLegacy`, `corpRemoteRoleConflictWithBoardState`, `corpScoringProtectionRemoteRoleSeen`, `corpAgendaStealTaxRemoteRoleSeen`, `corpRunTaxRemoteRoleSeen`, `corpRemoteCapacityRoleSeen`, `corpAssetEconomyRemoteRoleSeen`, `corpBaitRemoteRoleSeen`, `corpAmbushRemoteRoleSeen`, `corpIceModifierRemoteRoleSeen`, `corpRemoteRoleRaisedSafetyScore`, `corpRemoteRoleDidNotRaiseSafetyBecauseInactive`, `corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest`, `corpRemoteRolePreventedBaitAsScoringProtection`, `corpRemoteRolePreventedAssetAsScoringProtection`, `corpRemoteRoleHelpedChooseExistingRemote`, `corpRemoteRoleHelpedAvoidNewEmptyRemote`.
- Runner: `runnerRemoteRoleProfilesSeen`, `runnerRemoteRoleUsedForTrashValue`, `runnerRemoteRoleUsedForContestValue`, `runnerRemoteRoleTrashBudgetPreserved`, `runnerRemoteRoleConflictWithHiddenStateGuard`, `runnerRunTaxRemoteRoleAccessed`, `runnerAgendaStealTaxRemoteRoleAccessed`, `runnerAssetEconomyRemoteRoleAccessed`.
- Breakdowns: `remoteRoleByKind`, `remoteRoleKind*`, `remoteRoleByServerScope`, `remoteRoleServerScope*`, `remoteRoleSafetyDedupeCount`.

Die Metriken werden pro Action-Entry über deduplizierte Evidence-Sets aggregiert, nicht durch mehrfaches Zählen einzelner interner Bewertungen.

## Tests

Ergänzte fokussierte Tests:

- `run_tax` wird erkannt, aber nicht als Agenda-Steal-Tax überbewertet.
- `agenda_steal_tax` erhöht Scoring-Safety, wenn der Runner die Zusatzkosten nicht bezahlen kann.
- `remote_capacity`, `asset_economy`, `bait` und `ambush` zählen nicht als Scoring-Protection.
- inaktive/unrezzte RemoteRole-Karten liefern keine aktive Safety.
- RemoteRole-Summary-Metriken werden als First-Class-Metriken aggregiert.

Bestehende Regressionen für Cheap-Remote-Safety, Political-Overthrow/Scored-Agenda-Ontology und Breaker-Ontology bleiben Teil des AI-Testlaufs.

## 8-Slot-Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots, Real-Scene-Paare `holdout_only`

Gesamtsummen über die 8 Slots:

| Metrik                                             | Baseline | Candidate |
| -------------------------------------------------- | -------: | --------: |
| illegalActions                                     |        0 |         0 |
| replayFailures                                     |        0 |         0 |
| timeoutRate                                        |        0 |         0 |
| ActionLimitRate-Summe                              |    3.889 |     3.778 |
| Corp Scores                                        |       56 |        64 |
| Runner Steals                                      |      135 |       124 |
| corpAgendaInstalledInCheaplyContestableRemote      |        0 |         0 |
| corpAdvanceInCheaplyContestableRemote              |        0 |         0 |
| corpRemotePortfolioOverExpanded                    |        5 |         0 |
| corpNewRemoteCreatedWithoutPayloadPlan             |       14 |        11 |
| remoteTrashDroppedBelowReserve                     |        5 |         4 |
| corpRemoteRoleProfilesSeen                         |       59 |        40 |
| corpRemoteRoleUsedForSafety                        |       52 |        36 |
| corpRemoteRoleUsedForScoringRemote                 |       52 |        36 |
| corpRemoteRoleRaisedSafetyScore                    |       52 |        36 |
| corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest |       14 |         5 |
| runnerRemoteRoleProfilesSeen                       |        7 |         2 |

Slotbefund:

- Snapshot Rig: Candidate nutzt RemoteRole-Safety häufiger (`7/6/6`) und bleibt stabil.
- Snapshot Pressure: Candidate zeigt keine RemoteRole-Safety-Nutzung in diesem Lauf; Corp Scores steigen, ActionLimit steigt leicht.
- Snapshot Holdout: RemoteRole-Safety ist sichtbar (`26/23/23`), Runner Steals sinken leicht.
- Local Pair 1: Candidate bleibt ActionLimit-stabil, RemoteRole-Safety sichtbar (`7/7/7`), ein Runner-RemoteRole-Trash-Kontext sichtbar.
- Local Pair 2: keine RemoteRole-Nutzung (`0`), ActionLimit-Warnsignal bleibt daher nicht RemoteRole-getrieben.
- Real Scene Pair 1/2: nur Holdout-Signal; keine Optimierung darauf. Candidate nutzt dort kaum RemoteRole und bleibt safety-stabil.

## Empfehlung

Der Consumer kann bleiben. Er ist eng, side-safe und verbessert die Remote-Safety-Modellierung dort, wo strukturierte RemoteRoles tatsächlich sichtbar und aktiv sind. Local Pair 2 bleibt kein RemoteRole-Problem; der nächste Consumer-Slice sollte nur bei stabilem Gesamtstand Tag/Punish `source/payoff/condition` adressieren.
