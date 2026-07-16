# Match 9D15: Runner-Contest Red Evidence (2026-07-16)

## Evidence-Basis

- Match: `match_9d15b8e9a2d9269d`
- Modus: `human_corp_vs_runner_ai`, Runner-KI auf `hard`
- Ergebnis: Corp-Sieg durch Agenda-Punkte
- Runtime: StateVersion 156, 157 Events, 157 StateSnapshots, ein finaler
  GameState und 84 detaillierte Runner-AI-Traces
- Decision-Denominator: 84 erwartete, 84 gespeicherte und 84 eindeutig über
  `event_id` verbundene Entscheidungen; keine fehlenden, verwaisten,
  doppelten oder typabweichenden Links
- Datenquelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`, nur lesend

Der vollständige Audit klassifizierte alle 84 Runner-Entscheidungen. Broker-
Installation, Laden, Cashout, Bankplanung und Portfolio wurden auf
Nutzerwunsch nicht als Fehler freigegeben und nicht verändert.

## Vor dem Fix rote historische Verträge

| Finding    | Historischer Zustand                                                                                                           | Sichtbare bessere Aktion                                                                                                     | Roter Nachweis                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `9D15-F01` | Decision 22, StateVersion 39; Remote 1 akut bedroht, ein sichtbarer blockierender ICE, Runner ohne passende Code-Gate-Coverage | Legaler `Inside Job` auf Remote 1; aktionsspezifische Projektion `reachable`, `pathCost:0`, `run_now`, Bypass des ersten ICE | `behavior_regression`: Jack 'n' Joe statt der unveränderten akzeptablen Inside-Job-Action                         |
| `9D15-F02` | Decision 81, StateVersion 147; Corp 5/7, unbekannte Remote-Karte mit zwei öffentlichen Advancement-Countern, aktive Run-Sperre | Legale und bezahlbare Run-Lock-Freigabe mit Folgeclick und erreichbarem Contestpfad                                          | `behavior_regression`: `runner.draw_card` statt `runner.trigger_ability` mit `runner_matchpoint_run_lock_release` |

Der erste Checkpoint-Lauf endete exakt mit zwei roten Zielverträgen und vier
grünen Gegenproben. Beide Fixtures wurden mit `warmup-policy=strict` erzeugt:

- D22: 21 Warmup-Entscheidungen, null Drift, Eventpräfix 40,
  TacticalPlan/PlanPortfolio/StrategicIntent vorhanden;
- D81: 80 Warmup-Entscheidungen, null Drift, Eventpräfix 148,
  TacticalPlan/PlanPortfolio/StrategicIntent vorhanden.

## Rekonstruierte Consumer-Ketten

### D22: korrekte Action-Projektion wurde zweimal verloren

1. `RunnerRunTargetEvaluation` erkannte den konkreten Inside-Job-Run korrekt
   als `reachable`, `score_threat` und `run_now`.
2. `semantic-runtime-action-exclusion.ts` berechnete danach denselben Server
   noch einmal ohne Action-Projektion und schloss die Action fälschlich als
   `known_ice_path_no_access` aus.
3. Nach Beseitigung dieses Widerspruchs war Inside Job Rohscore-Sieger mit
   2167 gegen Jack 'n' Joe mit 1187.
4. Das TacticalPlan-Mapping `runner.contest_remote` blockierte den konkreten
   gleichzieligen `run_now`-Run dennoch zugunsten eines abstrakten
   `draw_for_answer`-Schritts.

### D81: Endspiel-Gate war auf exakt einen fehlenden Punkt verengt

`runner-run-lock-release-score.ts` und
`runner-opponent-matchpoint-contest-choice.ts` akzeptierten ausschließlich
`agendaPoints >= agendaPointsToWin - 1`. Die öffentlich sichtbare mögliche
Zwei-Punkte-Terminal-Remote bei 5/7 konnte daher weder die Run-Sperre lösen
noch den anschließenden Remote-Contest absichern.

## Vor dem Fix grüne Grenzen

- Ein Inside-Job-Bypass genügt nicht, wenn danach ein zweiter blockierender
  ICE verbleibt.
- Eine Run-Lock-Freigabe entsteht nicht ohne Folgeclick, ohne bezahlbare
  Kosten oder ohne öffentliche Advancement-Bedrohung.
- Drei fehlende Agenda-Punkte werden nicht aus zwei oder drei sichtbaren
  Countern pauschal als Terminalfenster abgeleitet.
- Hidden Card Identity, spätere Access-Ergebnisse und FullGameState-Fakten
  waren keine Entscheidungsgrundlage.

## Versionierte Fixtures

- `data/scenarios/ai-decision-checkpoints/cp-9d15-01-urgent-remote-inside-job.json`
- `data/scenarios/ai-decision-checkpoints/cp-9d15-02-multi-point-run-lock-release.json`
- `packages/ai/src/evaluation/decision-checkpoints/match-9d15-runner-contest-decision-checkpoints.test.ts`

Red-Evidence-Commit: `5e63c23ed` (`test(ai): capture match 9d15 runner regressions`).
