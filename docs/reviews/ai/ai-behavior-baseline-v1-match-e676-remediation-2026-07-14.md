# AI Behavior Baseline v1

Status: attention_required
Git head: 4dfe4b80a
Generated: 2026-07-14T15:27:14.137Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: action_limit_games:2

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     2 |
| fallbackActions       |     0 |
| timeoutActions        |     0 |
| runtimeErrors         |     0 |
| hiddenInfoFindings    |     0 |
| noLegalActionFailures |     0 |
| redactionSafe         |   yes |

## Behavioural metrics

| Metric                                         | Value |
| ---------------------------------------------- | ----: |
| Missed score window rate                       | 0.000 |
| Advanced remote contest skip rate              | 0.884 |
| Plan conversion rate                           | 0.789 |
| Strategic no-progress repeats / 100 decisions  | 2.511 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 2.697 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1654 |             0.000 |                    0.867 |                0.851 |             1.511 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1478 |             0.000 |                    0.857 |                0.932 |             0.947 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1309 |             0.000 |                    0.750 |                0.900 |             0.993 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2482 |             0.000 |                    0.625 |                0.642 |             4.069 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      1536 |             0.000 |                    0.867 |                0.808 |              3.19 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2850 |             0.000 |                    0.957 |                0.744 |             2.877 |               0 |      2 |

## Outcome context

- Runner agenda points: 172
- Corp agenda points: 139
- Runner steals: 86
- Corp scores: 86
- Score or steal actions: 172
- Average actions: 188.483
- Average turns: 25.817

## Comparison

Comparable: yes
Baseline git head: a8a27f41d
Candidate git head: 4dfe4b80a
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                        0 |
| advancedRemoteContestSkipRate                 |                   +0.024 |
| planConversionRate                            |                   +0.015 |
| strategicNoProgressRatePer100Decisions        |                   -0.046 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -0.534 |
| averageActions                                |                  -14.217 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review-Einordnung

Der Kandidat ist gegen die Referenz
`ai-behavior-baseline-v1-manhunt-execution-refinement-2026-07-13.json`
vollständig vergleichbar. Der Lauf bleibt formal rot, weil zwei Partien das
Limit von 480 Aktionen erreichen. Es ist jedoch keine neue Limit-Partie und
keine neue technische Fehlerklasse hinzugekommen: Die Referenz erreichte das
Limit in den Hybrid-Seeds 02, 03, 05 und 10; der Kandidat nur noch in 03 und 05. Illegal Actions, Replay-Abweichungen, Fallbacks, Timeouts, Runtimefehler,
Hidden-Information-Funde und Redaktionsfehler stehen weiterhin bei null.

Der Vergleich ist ein Gesamtvergleich von Git-Head `4dfe4b80a` mit
`a8a27f41d`. Er isoliert nicht kausal eine einzelne Änderung zwischen diesen
Ständen. Die Ergebnisverteilung ist außerdem kein Spielstärkenachweis.

## Verbliebene Action-Limit-Partien

| Slot                                           | Seed                         | Aktionen | Züge | Endstand Runner : Korp | Einordnung                                |
| ---------------------------------------------- | ---------------------------- | -------: | ---: | ---------------------: | ----------------------------------------- |
| `strategy_panel_hybrid_score_punish_cheap_bag` | `ai-behavior-baseline-v1-03` |      480 |   79 |                  4 : 3 | geerbte Credit-/Entwicklungsschleife      |
| `strategy_panel_hybrid_score_punish_cheap_bag` | `ai-behavior-baseline-v1-05` |      480 |   65 |                  0 : 5 | geerbte Punish-/Credit-Fähigkeitsschleife |

### Seed 03: Vermögen wird nicht in Spielfortschritt umgewandelt

- Der letzte Runner-Run beginnt bei Aktion 197, die letzte aktivierte
  Runner-Fähigkeit liegt bei Aktion 271. Ab Aktion 300 wählt der Runner 68-mal
  `gain_credit` und beendet 17 Züge, ohne erneut zu laufen.
- Nach Aktion 400 folgen nochmals 28 Credit-Aktionen und acht beendete Züge.
  Das Runner-Vermögen wächst dabei bis Aktion 473 auf 91 Credits, obwohl pro
  Klick 13 ausführbare Alternativen vorliegen.
- Beispiel Aktion 470: Der Runner hat 87 Credits, wählt mit Score 859 erneut
  `gain_credit` und markiert im Trace selbst
  `runnerEconomyChosenWhileRich:true`. Gleichzeitig fehlen Breaker-Abdeckungen
  für Sentry, Special und Wall; eine Suchaktion, eine Recovery-Aktion und eine
  legale Memory-Hardware sind vorhanden. Der strategische Intent bleibt
  dennoch `runner.run_event_tempo` mit R&D als Druckziel.
- Die Korp fällt ebenfalls in eine Reserveschleife. Bei Aktion 476 wählt sie
  mit neun Credits `gain_credit`, obwohl 23 ausführbare Alternativen vorliegen.
  Der Plan `corp.create_score_window` bleibt aktiv, Installieren und eine
  Operation werden durch Plan-Mismatch stark abgewertet. Diese lokale
  Vorsicht erklärt einzelne Entscheidungen, nicht aber die über viele Züge
  fehlende Neuplanung.

Bewertung: Der primäre Limit-Treiber ist die Runner-Schleife. Ein hoher
Creditstand, fehlende Abdeckung, legale Such-/Memory-/Recovery-Wege und lange
Run-Abstinenz werden noch nicht gemeinsam als Umsetzungszwang behandelt. Die
Korp benötigt zusätzlich eine zeitliche Neubewertung ihres Reservemusters.

### Seed 05: Punish und Gegenökonomie bilden eine positive Schleife

- Der letzte Runner-Run beginnt bei Aktion 87, der letzte Korp-Score liegt bei
  Aktion 258. Ab Aktion 300 gibt es keine Runs, Installationen oder Scores mehr.
- In jedem Korp-Zug wird dieselbe aktivierte Fähigkeit ungefähr dreimal
  verwendet. Die folgenden Choices entziehen dem Runner jeweils zwei Credits.
  In jedem Runner-Zug wird eine generische aktivierte Ökonomiefähigkeit
  ungefähr viermal verwendet und gibt jeweils zwei Credits zurück.
- Damit entzieht die Korp etwa sechs Credits pro Zyklus, während der Runner
  acht erzeugt. Die als `corp.apply_punish_pressure` geführte Linie kann ihr
  Ziel mathematisch nicht erreichen, wird aber nicht wegen ausbleibender
  Konversion aufgegeben.
- Beispiel Aktion 467: Die Korp hält bei fünf Agenda-Punkten am Punish-Plan
  fest und wählt die Fähigkeit mit Score 62. Ein blind erzwungener Score wäre
  trotzdem nicht korrekt, weil der Trace zugleich
  `corp_remote_risk:unsafe_score_action_available` meldet. Erforderlich ist
  eine Fortschrittsarbitration, kein pauschaler Score-Bonus.
- Beispiel Aktion 478: Der Runner besitzt 109 Credits und wählt mit Score 2042
  erneut die aktivierte Ökonomiefähigkeit; Ziehen liegt bei 1248,
  `gain_credit` bei 859. Es fehlen weiterhin Code-Gate-, Sentry-, Special- und
  Wall-Abdeckungen. Die hohe Bewertung der generischen Fähigkeit verdrängt
  Entwicklung, obwohl seit fast 390 Aktionen kein Run mehr stattgefunden hat.

Bewertung: Beide Seiten stabilisieren die Schleife. Die Korp muss wiederholte
Punish-Sequenzen verlassen, wenn der gegnerische Creditstand über mehrere
Zyklen nicht sinkt. Der Runner muss wiederholte generische Ökonomie bei hohem
Vermögen und ausbleibender Boardentwicklung dämpfen und Ziehen, Suche oder
Installation wieder in die Auswahl bringen.

## Regression- und Testfolgen

1. Der Baseline-Gate bleibt rot, bis die beiden geerbten Limit-Seeds 03 und 05
   unter demselben Vertrag regulär enden.
2. Ein spielgleicher Decision-Checkpoint für Seed 03 sollte die Situation um
   Aktion 470 absichern: `gain_credit` darf bei 87 Credits, fehlender Coverage
   und legaler Suche/Recovery/Memory nicht erneut die finale Wahl sein.
3. Ein spielgleicher Decision-Checkpoint für Seed 05 sollte die Runner-Situation
   um Aktion 478 absichern: Die wiederholte generische Ökonomiefähigkeit darf
   bei 109 Credits und langer Run-/Entwicklungsabstinenz nicht weiter dominieren.
4. Für die Korp in Seed 05 reicht ein isolierter Einzelentscheid nicht aus. Der
   Regressionstest muss den Verlauf mehrerer Punish-Zyklen mit nicht sinkendem
   Runner-Creditstand abbilden und den anschließenden Planwechsel prüfen.
5. Die vorhandenen Baseline-Findings erkennen beide späten Schleifen nicht:
   Seed 05 meldet nur zwei frühe `bank_over_target_without_funding_need`-Funde,
   Seed 03 nach Aktion 270 keinen passenden Endphasenfund. Die Trace-Detektion
   benötigt deshalb einen sequenziellen Fortschrittsbefund; ein einzelner
   Schwellenwert pro Entscheidung wäre zu kurz gegriffen.

## Evidenz

- Kompakter Kandidat:
  `data/local/ai-behavior-baseline-v1-match-e676-remediation-2026-07-14.json`
- Redaktierte Rohdaten:
  `data/local/ai-behavior-baseline-v1-match-e676-remediation-2026-07-14-raw.json`
- Vergleichsreferenz:
  `data/local/ai-behavior-baseline-v1-manhunt-execution-refinement-2026-07-13.json`

Die JSON-Artefakte bleiben als lokale, nicht versionierte Reproduktions- und
Vergleichsevidenz erhalten. Dieser Review ist die knappe versionierte
Gate- und Diagnosezusammenfassung.

Die vollständige chronologische Rekonstruktion und der daraus abgeleitete
Änderungs- und Testplan stehen im
[`Seed-03-/Seed-05-Deep-Dive`](ai-behavior-baseline-v1-seeds-03-05-deep-dive-2026-07-14.md).
