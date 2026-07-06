# Post-Match-731b-Fixes 100er-Vergleich

Ausgeführt wurde der 100-Spiele-Benchmark mit Seed-Präfix `latest-match-baseline`, Batchgröße 5 und `maxActions=480`.

Wichtiger Vergleichshinweis: Der neue Lauf nutzt den aktuell letzten abgeschlossenen Match-Snapshot `match_731b436e85fb2484`. Der vorherige 100er-Referenzlauf vom 2026-07-04 nutzt `match_41020769c9f35150`. Die Deltas sind deshalb kein reiner Codevergleich, sondern zeigen den aktuellen Stand aus Code plus neuem Match-Snapshot.

## Ergebnis

| Stand | Git | Match | Runner Siege | Corp Siege | Limits | Runner AP Ø | Corp AP Ø | Corp Scores | Runner Steals | Missed Score Windows |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Post Central/Remote/Scoreline Fixes | `513bde69a` | `match_41020769c9f35150` | 52 | 48 | 0 | 3.41 | 5.53 | 315 | 194 | 0 |
| Post Match-731b Fixes | `41e3f0e3b` | `match_731b436e85fb2484` | 37 | 11 | 52 | 3.96 | 2.17 | 57 | 99 | 0 |

## Delta zum letzten 100er

| Metrik | Vorher | Jetzt | Delta |
| --- | ---: | ---: | ---: |
| Runner Siege | 52 | 37 | -15 |
| Corp Siege | 48 | 11 | -37 |
| Action-Limits | 0 | 52 | +52 |
| Runner Winrate | 0.52 | 0.37 | -0.15 |
| Corp Winrate | 0.48 | 0.11 | -0.37 |
| Action-Limit-Rate | 0 | 0.52 | +0.52 |
| Runner AP Ø | 3.41 | 3.96 | +0.55 |
| Corp AP Ø | 5.53 | 2.17 | -3.36 |
| Corp AP Median | 6 | 0 | -6 |
| Durchschnittliche Actions | 298.82 | 400.65 | +101.83 |
| Durchschnittliche Turns | 46.15 | 49.78 | +3.63 |

## Progression-Signale

| Metrik | Vorher | Jetzt | Delta |
| --- | ---: | ---: | ---: |
| Corp Score Actions | 315 | 57 | -258 |
| Runner Steal Actions | 194 | 99 | -95 |
| Score/Steal Actions pro Spiel | 5.09 | 1.56 | -3.53 |
| Score Action Take Rate | 1.00 | 1.00 | 0 |
| Remote Build -> Advance/Score | 174 | 72 | -102 |
| Advance -> Score | 588 | 101 | -487 |
| Central Pressure -> Steal | 115 | 6 | -109 |
| No-Progress Chain Ø | 8.869 | 11.613 | +2.744 |
| Längste No-Progress Chain | 173 | 441 | +268 |
| Turns ohne Progress | 2444 | 3013 | +569 |
| Actions bis nächster Score/Steal | 49.083 | 120.241 | +71.158 |

## Corp-Remote-und-Central-Signale

| Metrik | Vorher | Jetzt | Delta |
| --- | ---: | ---: | ---: |
| Corp Central ICE installiert | 1018 | 1228 | +210 |
| Corp HQ ICE installiert | 433 | 531 | +98 |
| Corp R&D ICE installiert | 534 | 513 | -21 |
| Corp Remote ICE installiert | 429 | 362 | -67 |
| Corp Central Over-Iced | 9896 | 12915 | +3019 |
| Central Over-Iced mit niedriger Rez-Reserve | 4597 | 7982 | +3385 |
| Agenda in HQ bei Ready Remote | 8525 | 3919 | -4606 |
| Remote Scoring underbuilt while Centrals over-iced | 910 | 1132 | +222 |

## Trace-Mining

| Metrik | Vorher | Jetzt | Delta |
| --- | ---: | ---: | ---: |
| Findings gesamt | 5170 | 9894 | +4724 |
| High-Findings | 1 | 41 | +40 |
| Plan/Action Mismatch | 2715 | 7880 | +5165 |
| Repeated No-Progress Run | 1030 | 1960 | +930 |
| Passive Action with Scoreline available | 3517 | 4602 | +1085 |
| Action-Limit Cluster: Low-Value Repeat | 0 | 48 | +48 |
| Action-Limit Cluster: Setup/Economy Loop | 0 | 2 | +2 |
| Action-Limit Subcluster: Continue without Progress | 0 | 39 | +39 |

## Kurzbewertung

Der aktuelle 100er-Lauf ist technisch sauber, aber spielerisch deutlich schlechter als der letzte Referenzlauf: keine Replay-Fehler, keine illegalen Aktionen und keine missed Score Windows, aber 52 von 100 Spielen laufen ins Action-Limit.

Das Hauptproblem ist nicht, dass die Corp verfügbare Score-Aktionen auslässt: `scoreActionTakeRate` bleibt bei 1.00 und `missedScoreWindows` bleibt bei 0. Das Problem liegt davor: Es entstehen zu wenige verwertete Score-/Steal-Progressionen, die durchschnittliche Zeit bis zum nächsten Score/Steal steigt stark, und viele Spiele versacken in Low-Value-Repeat- oder Continue-without-Progress-Mustern.

Der stärkste konkrete Corp-Befund ist der Rückfall in Central-ICE-Ablenkung bei gleichzeitig schwächerem Remote-Ausbau: mehr Central-ICE, mehr Central-over-iced-Signale, weniger Remote-ICE und mehr underbuilt Remote Scoring. Das passt zur stark gesunkenen Corp-AP-Leistung.

Priorisierte Folgeanalyse:

- Seeds mit Action-Limit und Corp-Vorsprung prüfen, besonders `001`, `020`, `032`, `036`, `045`, `046`, `049`, `052`, `056`, `058`, `062`, `063` und `079`.
- Seeds mit 0:0-Limit prüfen, besonders `016`, `031`, `034`, `051`, `055`, `068`, `071`, `074`, `084`, `091`, `092` und `097`.
- Trace-Mining zuerst auf `plan_step_action_mismatch`, `continue_without_progress` und Central-over-iced-vs-Remote-Scoreline-Entscheidungen fokussieren.
