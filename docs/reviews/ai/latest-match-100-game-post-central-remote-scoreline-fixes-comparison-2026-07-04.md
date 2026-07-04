# Post-Central-Remote-Scoreline-Fixes 100er-Vergleich

Verglichen wurden dieselben Match-Decks, dieselben Seeds `latest-match-baseline-001` bis `latest-match-baseline-100`, Batchgröße 5 und `maxActions=480`.

## Ergebnis

| Stand | Git | Runner Siege | Corp Siege | Limits | Runner AP Ø | Corp AP Ø | Corp Scores | Runner Steals | Missed Score Windows |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Post Triage + Signal Consumer | `b525bf09e` | 52 | 35 | 13 | 4.12 | 4.38 | 251 | 238 | 19 |
| Post Scoreline Lock | `28c521da1` | 48 | 40 | 12 | 3.85 | 4.92 | 280 | 224 | 18 |
| Post Central/Remote/Scoreline Fixes | `513bde69a` | 52 | 48 | 0 | 3.41 | 5.53 | 315 | 194 | 0 |

## Delta zum letzten 100er

Gegen `Post Scoreline Lock`:

- Corp Siege: `+8`
- Runner Siege: `+4`
- Action-Limits: `-12`
- Corp AP Ø: `+0.61`
- Runner AP Ø: `-0.44`
- Corp Score Actions: `+35`
- Runner Steals: `-30`
- Missed Score Windows: `-18`
- Durchschnittliche Spiellänge: `+3.28` Actions, `+6.89` Turns

Gegen `Post Triage + Signal Consumer`:

- Corp Siege: `+13`
- Runner Siege: `0`
- Action-Limits: `-13`
- Corp AP Ø: `+1.15`
- Runner AP Ø: `-0.71`
- Corp Score Actions: `+64`
- Runner Steals: `-44`
- Missed Score Windows: `-19`
- Durchschnittliche Spiellänge: `-9.82` Actions, `+4.77` Turns

## Scoreline- und Remote-Signale

| Metrik | Post Scoreline Lock | Neuer Stand | Delta |
| --- | ---: | ---: | ---: |
| `remoteAdvances` | 805 | 935 | +130 |
| `scoreWindows` | 280 | 315 | +35 |
| `scoreActionsAvailable` | 298 | 315 | +17 |
| `scoreActionsTaken` | 280 | 315 | +35 |
| `scoreActionTakeRate` | 0.94 | 1.00 | +0.06 |
| `corpAdvanceConvertedToScoreOrProtectedWindow` | 746 | 838 | +92 |
| `turnsToFirstCorpScore` | 9.731 | 15.697 | +5.966 |
| `turnsFromFirstAdvanceToScore` | 2.860 | 3.618 | +0.758 |
| `turnsFromFinalAdvanceToScoreOrSteal` | 0.458 | 0.395 | -0.063 |

## Central-Ablenkung

| Metrik | Post Scoreline Lock | Neuer Stand | Delta |
| --- | ---: | ---: | ---: |
| `corpCentralOverIcedWithLowRezReserve` | 5290 | 4597 | -693 |
| `corpExtraCentralIceChosenOverReadyRemoteBuild` | 59 | 46 | -13 |
| `corpExtraCentralIceChosenOverEconomy` | 62 | 51 | -11 |
| `corpExtraCentralIceChosenOverRezReserve` | 12 | 14 | +2 |
| `corpExtraCentralIceChosenOverAgendaInstall` | 29 | 30 | +1 |
| `corpExtraCentralIceChosenOverAdvanceOrScore` | 8 | 3 | -5 |
| `centralPressureRuns` | 2067 | 1587 | -480 |
| `centralAgendaSteals` | 217 | 155 | -62 |
| `centralRunWhileRemoteScoreThreatVisible` | 341 | 90 | -251 |
| `centralRunInsteadOfContestableAdvancedRemote` | 42 | 21 | -21 |

## Seed-Flip-Befund

Gegen `Post Scoreline Lock` ändern 51 von 100 Seeds den Ausgang.

Matrix:

| Vorher | Jetzt Runner | Jetzt Corp | Jetzt Limit |
| --- | ---: | ---: | ---: |
| Runner | 28 | 20 | 0 |
| Corp | 19 | 21 | 0 |
| Limit | 5 | 7 | 0 |

Gute Corp-Flips:

- `latest-match-baseline-002`: Runner 7:4 -> Corp 1:7
- `latest-match-baseline-013`: Runner 7:2 -> Corp 2:8
- `latest-match-baseline-014`: Limit 4:6 -> Corp 4:7
- `latest-match-baseline-016`: Runner 7:3 -> Corp 2:8
- `latest-match-baseline-017`: Runner 8:6 -> Corp 6:7
- `latest-match-baseline-021`: Runner 8:2 -> Corp 1:7
- `latest-match-baseline-035`: Limit 0:4 -> Corp 0:8
- `latest-match-baseline-043`: Runner 7:2 -> Corp 0:8

Schlechte Runner-Flips:

- `latest-match-baseline-001`: Corp 0:8 -> Runner 2:6
- `latest-match-baseline-007`: Corp 1:7 -> Runner 2:6
- `latest-match-baseline-015`: Corp 3:8 -> Runner 8:0
- `latest-match-baseline-023`: Corp 2:8 -> Runner 5:2
- `latest-match-baseline-031`: Corp 3:7 -> Runner 7:6
- `latest-match-baseline-032`: Corp 3:8 -> Runner 3:5
- `latest-match-baseline-033`: Corp 0:7 -> Runner 0:6
- `latest-match-baseline-042`: Corp 4:7 -> Runner 7:0

## Kurzbewertung

Der neue Stand ist im 100er-Vergleich klar besser als der letzte Referenzlauf: mehr Corp-Siege, deutlich mehr Corp-Scores, weniger Runner-Steals, keine Action-Limits und keine gemessenen missed Score Windows.

Die zuletzt adressierte Central-vs-Remote-Problematik ist messbar verbessert. Extra-Central-ICE gegen Ready-Remote, Economy und Advance/Score sinkt, ebenso Central-Runs bei sichtbarer Remote-Score-Threat.

Rest-Risiken bleiben:

- Die erste Corp-Score kommt im Schnitt später (`turnsToFirstCorpScore` 9.731 -> 15.697), obwohl die spätere Scoreline-Verwertung deutlich besser ist.
- `turnsFromFirstAdvanceToScore` steigt leicht. Das spricht dafür, dass die Corp manche angefangene Scoreline noch nicht schnell genug abschließt.
- `passiveActionWithScoreLineAvailable` steigt von 2390 auf 3517. Das ist nicht automatisch ein missed Score Window, aber ein Hinweis auf verbleibende Effizienzverluste bei vorhandener Scoreline.
- Einzelne schlechte Runner-Flips sollten bei der nächsten Analyse gezielt mit Replay/AI-Traces geprüft werden, besonders Seeds `001`, `015`, `023`, `031`, `032`, `033` und `042`.
