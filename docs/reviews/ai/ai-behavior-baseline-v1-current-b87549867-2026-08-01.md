# AI Behavior Baseline v1

Status: attention_required
Git head: b87549867
Generated: 2026-08-01T04:56:13.997Z

## Contract

- Slots: progression_tuning_origin_rig_vs_tax, progression_tuning_origin_pressure_vs_tax, snapshot_holdout_origin_pressure_vs_tag_ops, strategy_panel_fast_advance_chrome_rush, strategy_panel_net_damage_black_ice, strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-01, ai-behavior-baseline-v1-02, ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-04, ai-behavior-baseline-v1-05, ai-behavior-baseline-v1-06, ai-behavior-baseline-v1-07, ai-behavior-baseline-v1-08, ai-behavior-baseline-v1-09, ai-behavior-baseline-v1-10
- Games: 60
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: no
Hard failures: illegal_actions:2, runtime_errors:2

| Metric                       | Value |
| ---------------------------- | ----: |
| illegalActions               |     2 |
| replayFailures               |     0 |
| actionLimitGames             |     0 |
| fallbackActions              |     0 |
| timeoutActions               |     0 |
| runtimeErrors                |     2 |
| classifiedRuntimeFailures    |     2 |
| unclassifiedRuntimeFailures  |     0 |
| classifiedActionLimitGames   |     0 |
| unclassifiedActionLimitGames |     0 |
| hiddenInfoFindings           |     0 |
| noLegalActionFailures        |     0 |
| redactionSafe                |   yes |

### Runtime failure classifications

| Code                         | Count |
| ---------------------------- | ----: |
| missing_plan_module_coverage |     2 |

| Owner         | Count |
| ------------- | ----: |
| plan_registry |     1 |
| scheduler     |     1 |

### Action-limit classifications

| Slot | Seed | Classified | Last owner | Last plan | Last step | No-progress cluster | No-progress subcluster |
| ---- | ---- | ---------- | ---------- | --------- | --------- | ------------------- | ---------------------- |
| none | none | yes        | none       | none      | none      | none                | none                   |

## Behavioural metrics

| Metric                                             | Value |
| -------------------------------------------------- | ----: |
| Missed score window rate                           | 0.150 |
| Advanced remote contest skip rate                  | 0.854 |
| Plan conversion rate                               | 0.687 |
| Strategic no-progress repeats / 100 decisions      | 3.086 |
| Clearly dominated plan choices / 100 decisions     |     0 |
| Trace findings / 100 decisions                     | 0.762 |
| Action-capacity use rate                           |   n/a |
| Action-capacity plan conversion rate               |   n/a |
| Action-capacity expiration rate                    |   n/a |
| Action-capacity misconversion rate                 |   n/a |
| Premature Runner end turns / 100 decisions         |     0 |
| Redundant low-value Runner persistent install rate |   n/a |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| progression_tuning_origin_rig_vs_tax         | rig_economy_pressure | remote_scoring      |    10 |      1685 |             0.100 |                    0.868 |                0.804 |             1.068 |               0 |      0 |
| progression_tuning_origin_pressure_vs_tax    | event_pressure       | remote_scoring      |    10 |      1811 |             0.100 |                    0.889 |                0.640 |             5.411 |               0 |      0 |
| snapshot_holdout_origin_pressure_vs_tag_ops  | event_pressure       | tag_punish          |    10 |      1966 |             0.167 |                    0.944 |                0.732 |             3.154 |               0 |      0 |
| strategy_panel_fast_advance_chrome_rush      | rig_economy_pressure | fast_advance        |    10 |      2934 |             0.091 |                    0.696 |                0.647 |             3.067 |               0 |      0 |
| strategy_panel_net_damage_black_ice          | central_multiaccess  | net_damage          |    10 |      2763 |             0.333 |                    0.933 |                0.698 |             2.244 |               0 |      0 |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |    10 |      2485 |             0.278 |                    0.883 |                0.653 |             3.662 |               0 |      0 |

## Outcome context

- Runner agenda points: 193
- Corp agenda points: 151
- Runner steals: 118
- Corp scores: 85
- Score or steal actions: 203
- Action-capacity opportunities: 0
- Action-capacity uses: 0
- Action-capacity plan conversions: 0
- Action-capacity follow-up conversions: 0
- Action-capacity expired uses: 0
- Action-capacity misconversions: 0
- Runner end turns with clicks: 33
- Deterministic Corp-deckout end turns with clicks: 33
- Premature Runner end turns with clicks: 0
- Runner persistent install selections: 0
- Redundant low-value Runner persistent install selections: 0
- Average actions: 227.4
- Average turns: 29.167

## Comparison

Comparable: yes
Baseline git head: c6e1d4d72
Candidate git head: b87549867
Incompatibilities: none

| Metric                                        | Candidate minus baseline |
| --------------------------------------------- | -----------------------: |
| missedScoreWindowRate                         |                    +0.15 |
| advancedRemoteContestSkipRate                 |                   +0.016 |
| planConversionRate                            |                   -0.013 |
| strategicNoProgressRatePer100Decisions        |                   +0.061 |
| clearlyDominatedPlanChoiceRatePer100Decisions |                        0 |
| findingRatePer100Decisions                    |                   -5.093 |
| averageActions                                |                  +30.133 |

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.
- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.
- Win rate is deliberately outcome context rather than the acceptance criterion.

## Review 2026-08-01

### Einordnung

Der aktuelle Standardlauf ist gegen die jüngste noch lokal vorhandene kompakte
und grüne Referenz `c6e1d4d72` formal vergleichbar. Der jüngste versionierte
Standardlauf vor diesem Review ist der Runner-TurnPlanner-Cutover auf
`c72842d70`; dessen kompakte lokale JSON-Datei ist nicht mehr vorhanden, sein
Review dient daher als zweite, nicht erneut maschinell eingelesene
Vergleichslinie.

Das Ergebnis ist **nicht akzeptiert**. Zwei deterministische
Plan-Ownership-Vertragsverletzungen beenden je ein Spiel vorzeitig. Dieselben
zwei Vorfälle werden sowohl als `illegalActions` als auch als `runtimeErrors`
gezählt; es wurden nicht zusätzlich zwei ungültige Aktionen auf den Zustand
angewandt. In beiden Fällen endet die ActionSequence unmittelbar vor der
fehlgeschlagenen KI-Auswahl.

| Slot                                        | Seed                         | StateVersion | Befund                                                                                                                        |
| ------------------------------------------- | ---------------------------- | -----------: | ----------------------------------------------------------------------------------------------------------------------------- |
| `progression_tuning_origin_pressure_vs_tax` | `ai-behavior-baseline-v1-05` |          189 | `Night Shift` besitzt im Corp-Hauptfenster widersprüchliche Plan-Ownership; die TurnPlanner-Coverage fällt auf 92,86 Prozent. |
| `strategy_panel_net_damage_black_ice`       | `ai-behavior-baseline-v1-09` |           43 | Die `Singapore City Grid`-ICE-Swap-Action wird im Approach-Fenster doppelt durch `corp.defend_servers` klassifiziert.         |

Replay, Redaction, Hidden-Info-Schutz, Fallbacks, Timeouts und
No-LegalAction-Gate bleiben sauber. Gegen den Cutover-Review `c72842d70`
entfällt zwar das damalige einzelne Action-Limit, dafür treten die beiden
Coverage-Abbrüche neu auf.

### Verhaltensvergleich

Gegen die formale Referenz `c6e1d4d72` steigen die verpassten Scorefenster von
`0/85` auf `15/100` (`+0,150`). Remote-Contest-Skips steigen um `0,016`,
Plan-Konversion sinkt um `0,013`, No-progress steigt um `0,061` je 100
Entscheidungen und die mittlere Spiellänge steigt um `30,133` Aktionen.

Gegen den jüngsten Cutover-Review `c72842d70` ergibt sich ein gemischtes Bild:

| Metrik                            | `c72842d70` | `b87549867` |  Delta |
| --------------------------------- | ----------: | ----------: | -----: |
| Missed score window rate          |       0,108 |       0,150 | +0,042 |
| Advanced remote contest skip rate |       0,866 |       0,854 | -0,012 |
| Plan conversion rate              |       0,667 |       0,687 | +0,020 |
| Strategic no-progress / 100       |       3,827 |       3,086 | -0,741 |
| Findings / 100                    |       1,122 |       0,762 | -0,360 |
| Average actions                   |      227,35 |      227,40 |  +0,05 |

Die Scorefenster-Verschlechterung betrifft 15 Fenster in 13 Spielen und ist
nach Behebung der Hard Failures gezielt zu prüfen. Alle Verhaltenswerte dieses
Laufs bleiben vorläufig, weil zwei Spiele nach 189 beziehungsweise 43 Aktionen
abbrechen und damit nicht dieselbe vollständige Stichprobe wie ein grüner Lauf
bilden.

Die pauschale Findingrate darf nicht als allgemeine Verbesserung gelesen
werden. Im aktuellen Lauf verteilen sich die 104 Findings insbesondere auf:

- 60 `repeated_no_progress_run`;
- 27 `plan_step_action_mismatch`;
- 10 `recovery_low_value_loop`;
- 6 `bank_over_target_without_funding_need`;
- 3 `corp_never_scores_long_game`;
- 2 `illegal_action`.

### Kriterienaudit

Die Baseline besitzt eine sinnvolle Sicherheits- und Regressionsbasis:
LegalAction-/Runtime-/Replay-/Redaction-Gates, direkte Scorefenster,
Remote-Contest-Gelegenheiten, Plan-Konversion, strategische Stagnation und
deckübergreifende Ergebniswerte treffen wesentliche Fehlerklassen. Sie reicht
aber noch nicht als belastbarer alleiniger Nachweis für Spielstärke.

1. **Messvertrag versionieren.** Der Kompatibilitätscheck prüft derzeit
   Schema, Slots, Seeds, Actionlimit und Deck-Fingerprints, aber keinen Hash
   der Metrikdefinitionen oder Detector-Konfiguration. Seit `c6e1d4d72`
   wurden in den ausgewählten Baseline-/Trace-Metrikpfaden 625 Zeilen ergänzt
   und 24 entfernt, ohne die v1-Kompatibilität zu brechen. Künftig sollten
   `metricContractVersion`, Detector-Set samt Konfiguration und ein
   reproduzierbarer Messlogik-Fingerprint Bestandteil des Vergleichs sein.

2. **Messabdeckung explizit gaten.** Action-Capacity hatte im identischen
   Standardpanel am 22.07. noch 530 Gelegenheiten; seit dem Plan-first-Stand
   vom 25.07. melden die Reviews durchgehend null. Persistent-Install-
   Selections bleiben ebenfalls null. `n/a` ist korrekt, belegt aber keine
   Qualität. Pro vorgesehenem Kriterium braucht es Mindest-Denominator,
   `not_exercised`-Status und entweder wiederhergestellte Trace-Evidence oder
   einen ergänzenden festen Target-Slot.

3. **Findings detector-spezifisch vergleichen.** Eine Summenrate über ein
   veränderliches Detector-Set kann Verbesserungen vortäuschen. Stabilere
   Zeitreihen sind Rate und Schweregrad pro Detector sowie getrennte Summen
   für Safety, Plan-Ownership, Passivität, Ressourcenverschwendung und
   Run-Qualität.

4. **Tail-Risiken statt nur Mittelwerte zeigen.** Zusätzlich zu
   `averageActions` sollten p50/p90/p95, Maximum, terminale Endgründe und die
   längste strategische No-progress-Kette je Slot/Seed ausgewiesen werden.
   Null Action-Limits kann lange, spielschwache Endgames sonst verdecken.

5. **Scoreline- und Remote-Konversion vertiefen.** Sinnvolle normalisierte
   Kriterien sind geschütztes Agenda-Installieren bis Score innerhalb eines
   festen Horizonts, unnötige Economy-/Defense-Aktionen vor einem sicheren
   Score, zu lange HQ-Agenda-Exposition, Protection-Loops nach bereits
   erreichter Sicherheit und severity-gewichtete verpasste Scorepunkte statt
   nur Anzahl legaler Scoreaktionen.

6. **Runner-Run-Qualität messen.** Ergänzend zur Remote-Contest-Skiprate
   sollten Starts gegen bekannte unbezahlbare Pfade, unnötig vor dem Abbruch
   ausgegebene Credits, fehlende Steal-/Trash-Reserve, Wiederholungsruns ohne
   neue Information und die Konversion erfolgreicher Runs in Access, Steal,
   Trash oder einen begründeten Pivot normalisiert werden. Die vorhandene
   Progressionsdiagnostik enthält dafür bereits viele Rohsignale, führt sie
   aber nicht in die kompakte Baseline zurück.

7. **Planqualität über reine Drei-Schritt-Konversion hinaus prüfen.** Nützlich
   sind Abbruch-/Replanrate mit begründetem Owner-Wechsel, Commitment-Churn,
   Fortschritt je Planphase, Zeit bis zur Konversion und Opportunity Cost
   gegenüber der besten zulässigen Alternative. Eine schnelle Konversion
   kann sonst auch einen schwachen Plan positiv bewerten.

8. **Separate Spielstärke-Evidence ergänzen.** Der symmetrische
   `current_candidate`-Selfplay-Lauf bleibt ein guter Regressionssensor, kann
   aber nicht allein zeigen, welche Seite oder welcher Stand stärker geworden
   ist. Ein zweites, gepaartes Panel sollte den Kandidaten auf beiden Seiten
   gegen einen eingefrorenen Referenzgegner prüfen und seedweise Deltas mit
   Unsicherheitsintervallen sowie Slotverteilung ausweisen. Winrate und
   Agendapunkte bleiben dabei Ergebnisdimensionen, nicht das einzige Gate.

Priorität haben zunächst die beiden Hard Failures, danach Messvertrags-
Fingerprint und Abdeckungsgates. Erst auf einem vollständigen grünen Lauf
sollten Scorefenster und die zusätzlichen Spielstärkekriterien kalibriert oder
mit Schwellen versehen werden.
