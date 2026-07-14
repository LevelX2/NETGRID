# AI Behavior Baseline v1

Status: verifiziert; beide Zielseeds regulär beendet
Ausgeführter Arbeitsstand: Git head `7db451faa` plus später als `a415cc575`
versionierter P5-Arbeitsbaum
Generated: 2026-07-14T20:15:06.786Z

## Contract

- Slots: strategy_panel_hybrid_score_punish_cheap_bag
- Seeds: ai-behavior-baseline-v1-03, ai-behavior-baseline-v1-05
- Games: 2
- Max actions: 480
- Controllers: Runner and Corp both current_candidate.
- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.

## Hard gates

Accepted: yes
Hard failures: none

| Metric                | Value |
| --------------------- | ----: |
| illegalActions        |     0 |
| replayFailures        |     0 |
| actionLimitGames      |     0 |
| fallbackActions       |     0 |
| timeoutActions        |     0 |
| runtimeErrors         |     0 |
| hiddenInfoFindings    |     0 |
| noLegalActionFailures |     0 |
| redactionSafe         |   yes |

## Behavioural metrics

| Metric                                         | Value |
| ---------------------------------------------- | ----: |
| Missed score window rate                       |   n/a |
| Advanced remote contest skip rate              |   n/a |
| Plan conversion rate                           | 0.706 |
| Strategic no-progress repeats / 100 decisions  | 4.505 |
| Clearly dominated plan choices / 100 decisions |     0 |
| Trace findings / 100 decisions                 | 0.721 |

## Deck slots

| Slot                                         | Runner               | Corp                | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |
| -------------------------------------------- | -------------------- | ------------------- | ----: | --------: | ----------------: | -----------------------: | -------------------: | ----------------: | --------------: | -----: |
| strategy_panel_hybrid_score_punish_cheap_bag | rig_economy_pressure | hybrid_score_punish |     2 |       555 |               n/a |                      n/a |                0.706 |             4.505 |               0 |      0 |

## Outcome context

- Runner agenda points: 4
- Corp agenda points: 0
- Runner steals: 1
- Corp scores: 0
- Score or steal actions: 1
- Average actions: 277.5
- Average turns: 37.5

## Comparison

Vergleichsbasis ist der analysierte Lauf auf `4dfe4b80a` aus
`ai-behavior-baseline-v1-seeds-03-05-deep-dive-2026-07-14.md`. Slot, Seeds,
Controller und 480-Aktionen-Grenze blieben unverändert.

| Seed | Ausgangslauf                                      | Finaler Lauf                                                                          | Bewertung                                                                                                      |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 03   | Action Limit nach 480 Aktionen, Runner 4 : Korp 3 | Korp-Sieg nach 307 Aktionen und 40 Zügen, Runner 4 : Korp 0; Reporter-Grund `unknown` | Die Broker-/Basic-Credit-Schleife endet. Der Runner zieht, entwickelt und läuft wieder; das Replay ist gültig. |
| 05   | Action Limit nach 480 Aktionen, Runner 0 : Korp 5 | Korp-Flatline nach 248 Aktionen und 35 Zügen, 0 : 0                                   | Newsgroup-/Netwatch-Gegenökonomie konvertiert in ein reguläres Damage-Ende statt in eine stabile Tax-Schleife. |

Die beiden Action-Limit-Partien fallen auf null. Illegal Actions,
Replayfehler, Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Funde und
No-LegalAction-Fehler bleiben ebenfalls bei null; Redaction bleibt sicher.

## Umgesetzte Entscheidungsverträge

- Eindeutig gebundene einzelne aktivierte Fähigkeiten können ihren
  strukturierten Effekt side-sicher spezialisieren; mehrdeutige Fähigkeiten
  bleiben fail-closed.
- Wiederholbare Runner-Economy erhält vollen Wert unter Reserve oder bei
  konkretem Funding. Oberhalb der Zielreserve sinkt der Grenznutzen, wenn Draw,
  Entwicklung oder Druck legal ist. Mehrfachnutzung bleibt ohne feste
  Kartengrenze möglich.
- Erreichte Reserven entfernen stale Creditbase-Planmemory. Punish-Pläne
  verlängern sich nicht allein durch eine gemappte Auswahl, sondern benötigen
  Tag, Payoff oder sichtbare Zielannäherung.
- Ein Trace, der den letzten Korp-Klick verbraucht und selbst keinen
  unmittelbaren Payoff enthält, wird weder als Punish-Fortschritt geplant noch
  gegenüber konkretem Scoreline-Funding bevorzugt.
- Blink zählt als universelle probabilistische Coverage. Zweite Kopien erhöhen
  die Erfolgswahrscheinlichkeit nur um ihren marginalen Delta-Wert; ein
  unzureichender Handpuffer verhindert dennoch riskante Entwicklung oder Runs.
- Broker-Bankaufbau ohne konkreten Fundingbedarf bleibt ein Hintergrundplan.
  Bei kleinem Bewertungsabstand darf er mehrfach genutzt werden; eine klar
  bessere Aktion überstimmt ihn.

Alle acht daraus abgeleiteten exakten Checkpoints laden Enginezustand,
Eventpräfix, Decksnapshot und Runtime-Memory des jeweiligen
Entscheidungszeitpunkts. Sie sichern damit nicht nur isolierte Scores, sondern
die vollständige produktive Auswahlkette.

## Verbleibende Detector-Rohsignale

Der finale Trace enthält vier
`bank_over_target_without_funding_need`-Meldungen statt sieben im ersten
akzeptierten Zwischenlauf. Sie sind kein automatischer Correctness-Beweis:

- Seed 03, State 10: `Loan from Chiba` ohne expliziten Fundingbedarf bleibt
  ein review-würdiger High-Risk-Einzelfall, aber keine Schleife;
- Seed 05, State 56: dieselbe Aktion besitzt laut Runtime bereits
  `bankConcreteFundingNeed:true`; der grobe Detector überschätzt den Fund;
- Seed 05, State 192: die einmalige Broker-Installation schafft eine neue
  Bank-Fähigkeit;
- Seed 05, State 194: die erste Broker-Einzahlung bleibt durch den positiven
  Gegenvertrag bewusst zulässig.

Die drei späteren Broker-Einzahlungen bei den States 202, 212 und 223 wurden
durch die gewichtete Hintergrundplan-Arbitration beseitigt. Für die vier
verbleibenden Meldungen gibt es ohne gesonderte fachliche Freigabe keinen
weiteren Produktionsfix.

## Verifikation

- 235 fokussierte Tests einschließlich aller acht spielgleichen Checkpoints;
- vollständige AI-Shards: 109/666, 109/785 und 109/740 grün, zusammen 2.191
  Tests;
- `@netgrid/ai`-Typecheck;
- `check:ai`, `check:card-function-abstraction` und
  `check:package-boundaries`;
- `format:changed` und `git diff --check`;
- finaler unveränderter Seed-03/05-Baselinevertrag: akzeptiert, keine Hard
  Failures.

## Metric interpretation

- Missed score windows are direct Corp conversion misses.
- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.
- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.
- Win rate is deliberately outcome context rather than the acceptance criterion.
