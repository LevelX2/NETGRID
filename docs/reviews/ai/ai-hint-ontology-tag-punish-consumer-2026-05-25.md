# AI Hint Ontology Tag/Punish Consumer 2026-05-25

## Kurzfazit

Der Slice bindet strukturierte Tag/Punish-Ontology-Felder eng an bereits legale Corp-Aktionen an. Die Ontology erzeugt keine LegalActions, keine Tags und keinen Damage. Sie bestätigt oder klassifiziert nur vorhandene `play_operation`-, `activated_card_ability`-, `trigger_ability`-, `trash_resource`- oder passende ICE-Aktionsfenster.

Der 8-Slot-Lauf bleibt safety-stabil: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`, `corpAgendaInstalledInCheaplyContestableRemote = 0`, `corpAdvanceInCheaplyContestableRemote = 0`. Candidate bleibt insgesamt besser bei Corp Scores und Runner Steals; Local Pair 2 bleibt ein Holdout-Warnsignal, ist jetzt aber klarer als echter Tag/Punish-Funnel sichtbar.

## Verbrauch

Neu ist `packages/ai/src/tag-punish-ontology-consumer.ts`.

Konsumiert werden:

- `effects.kind = tag_source`
- `effects.kind = tag_punish_payoff`
- `effects.kind = trace`
- `effects.kind = tag`
- `effects.kind = damage`
- `effects.kind = resource_trash`
- `effects.kind = hardware_trash`
- `conditions.requires_runner_tagged`
- `conditions.requires_trace_success`

Die Corp-Baseline nutzt die Klassifikation für bereits legale Aktionen. Legale Punish-Payoffs gegen sichtbar getaggten Runner schlagen generische Economy, bleiben aber unter klaren `score_agenda`-Fenstern. Legale Tagquellen werden höher bewertet, wenn ein Payoff aus legalen Aktionen oder Corp-eigenen sichtbaren/HQ-/Score-/Board-Karten plausibel ist.

Corp-Plan-/Strategic-Line-Code nutzt die Ontology nur ergänzend zur Tag-/Trace-/Punish-Erkennung. Runner-Verhalten wurde nicht angebunden; Runner-seitige Hidden-Info-Risiken bleiben damit vermieden.

## Vorrangregeln

Priorität bleibt:

1. LegalActions, aktueller Boardstate und `applyAction`.
2. sichtbarer Runner-Tag-State.
3. LegalAction-Payload, ActionType und sichtbarer Kartentext.
4. strukturierte Ontology.
5. Legacy-Rollen/Planrollen.

`requires_runner_tagged` wird hart durch sichtbare Runner-Tags geprüft. Ohne sichtbaren Tag wird ein Payoff nicht als spielbarer Punish-Payoff gewertet. `requires_trace_success` beschreibt nur eine Tagquelle; es garantiert keinen Trace-Erfolg.

## Metriken

Ergänzte First-Class-Metriken:

- `corpTagPunishOntologyProfilesSeen`
- `corpTagSourceOntologyProfilesSeen`
- `corpTagPunishPayoffOntologyProfilesSeen`
- `corpTagSourceOntologyUsed`
- `corpTagPunishPayoffOntologyUsed`
- `corpTagPunishOntologyFallbackUsed`
- `corpTagPunishOntologyConflict`
- `corpTagSourceLegalActionClassifiedByOntology`
- `corpPunishLegalActionClassifiedByOntology`
- `corpPunishOpportunityConfirmedByOntology`
- `corpPunishSkippedDespiteOntologyOpportunity`
- `corpTagSourceTakenWithOntologyPayoffAvailable`
- `corpTagSourceTakenWithoutOntologyPayoff`
- `corpTagSourceConvertedToOntologyPunishOpportunity`
- `corpOntologyPunishOpportunityConverted`
- `corpOntologyPunishOpportunityExpired`
- `corpTagPunishOntologyByKind`
- `corpTagPunishConditionByKind`

Die bestehenden Tag-State-, Punish-Opportunity- und Funnel-Metriken bleiben erhalten.

## Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Gesamtwerte über die 8 Slots:

| Metrik                                      | Baseline | Candidate |
| ------------------------------------------- | -------: | --------: |
| illegalActions                              |        0 |         0 |
| replayFailures                              |        0 |         0 |
| timeoutRate                                 |        0 |         0 |
| ActionLimitRate Summe                       |    2.890 |     2.777 |
| Corp Scores                                 |       54 |        63 |
| Runner Steals                               |      127 |       117 |
| Cheap Agenda Installs                       |        0 |         0 |
| Cheap Advances                              |        0 |         0 |
| corpPunishOpportunities                     |       26 |        36 |
| corpPunishTaken                             |       20 |        24 |
| corpPunishSkipped                           |        6 |        12 |
| runnerTaggedAtCorpDecision                  |      183 |       152 |
| runnerTagClearedBeforeCorpDecision          |       56 |        49 |
| corpTagPunishOntologyProfilesSeen           |       84 |        95 |
| corpTagSourceOntologyUsed                   |       65 |        72 |
| corpTagPunishPayoffOntologyUsed             |       24 |        31 |
| corpPunishOpportunityConfirmedByOntology    |       19 |        23 |
| corpPunishSkippedDespiteOntologyOpportunity |        1 |         4 |
| corpOntologyPunishOpportunityConverted      |       18 |        19 |
| corpOntologyPunishOpportunityExpired        |       21 |        20 |

## Local Pair 2

Local Pair 2 zeigt jetzt echte Tag/Punish-Ontology-Nutzung:

| Metrik                                      | Baseline | Candidate |
| ------------------------------------------- | -------: | --------: |
| ActionLimitRate                             |    0.000 |     0.222 |
| Corp Scores                                 |        0 |         3 |
| Runner Steals                               |       19 |        15 |
| corpPunishOpportunities                     |       12 |        11 |
| corpPunishTaken                             |        9 |         8 |
| corpPunishSkipped                           |        3 |         3 |
| runnerTaggedAtCorpDecision                  |       50 |        28 |
| runnerTagClearedBeforeCorpDecision          |       14 |        10 |
| corpTagPunishOntologyProfilesSeen           |       34 |        36 |
| corpTagSourceOntologyUsed                   |       24 |        28 |
| corpTagPunishPayoffOntologyUsed             |       12 |        11 |
| corpPunishOpportunityConfirmedByOntology    |       10 |         9 |
| corpPunishSkippedDespiteOntologyOpportunity |        1 |         1 |
| corpOntologyPunishOpportunityConverted      |        9 |         8 |
| corpOntologyPunishOpportunityExpired        |        8 |         7 |

Das Warnsignal ist nicht "Punish wird nie genutzt". Candidate nutzt echte Punish-Fenster, scored mehr und lässt weniger Runner-Steals zu. Die verbleibende ActionLimit-Verschlechterung wirkt eher wie terminaler Druck/Stagnation trotz vorhandener Konversion, nicht wie fehlende Ontology-Klassifikation.

## Tests

Ergänzt wurden fokussierte Tests für:

- Tagquelle per Ontology klassifizieren.
- Punish-Payoff per Ontology nur bei sichtbar getaggtem Runner klassifizieren.
- fehlenden Runner-Tag als Payoff-Blocker.
- keine Opportunity ohne LegalAction-Träger.
- sichtbarer Tag plus Punish legal schlägt generische Economy.
- Tag/Punish-Ontology-Funnel-Metriken.
- Hidden-State-Invarianz der bestehenden Tag/Punish-Metriken bleibt erhalten.

## Ergebnis

Der Consumer kann aktiv bleiben. Er ist eng an LegalActions und sichtbaren Tag-State gebunden und verbessert die Diagnosequalität deutlich. Ein weiterer enger Tag/Punish-Fix ist durch diesen Lauf nicht automatisch gerechtfertigt, weil echte Punish-Fenster bereits genutzt werden. Sinnvoller nächster Schritt ist ein konsolidierter Release-/Default-Review; alternativ erst danach ein Future-run/Future-encounter-ICE-Consumer.
