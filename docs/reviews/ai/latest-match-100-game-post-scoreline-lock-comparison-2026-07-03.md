# Post-Scoreline-Lock 100er-Vergleich

Verglichen wurden dieselben Match-Decks, dieselben Seeds `latest-match-baseline-001` bis `latest-match-baseline-100` und `maxActions=480`.

## Ergebnis

| Stand | Git | Runner Siege | Corp Siege | Limits | Runner AP Ø | Corp AP Ø | Corp Scores | Runner Steals | Missed Score Windows |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Post ICE Placement | `26926f7b7` | 69 | 24 | 7 | 5.60 | 3.34 | 188 | 330 | 15 |
| Post Triage + Signal Consumer | `b525bf09e` | 52 | 35 | 13 | 4.12 | 4.38 | 251 | 238 | 19 |
| Post Scoreline Lock | `28c521da1` | 48 | 40 | 12 | 3.85 | 4.92 | 280 | 224 | 18 |

## Delta zum letzten 100er

- Corp Siege: `+5`
- Runner Siege: `-4`
- Action-Limits: `-1`
- Corp AP Ø: `+0.54`
- Runner AP Ø: `-0.27`
- Corp Score Actions: `+29`
- Runner Steals: `-14`
- Missed Score Windows: `-1`
- Durchschnittliche Spiellänge: `-13.1` Actions

## Scoreline- und Remote-Signale

| Metrik | Vorher | Nachher | Delta |
| --- | ---: | ---: | ---: |
| `remoteAdvances` | 734 | 805 | +71 |
| `scoreWindows` | 251 | 280 | +29 |
| `corpAdvanceConvertedToScoreOrProtectedWindow` | 664 | 746 | +82 |
| `turnsToFirstCorpScore` | 11.51 | 9.73 | -1.78 |
| `turnsFromFirstAdvanceToScore` | 3.89 | 2.86 | -1.03 |
| `turnsFromFinalAdvanceToScoreOrSteal` | 0.59 | 0.46 | -0.13 |

## Auffälligkeiten

- Die Änderung verbessert die konkrete Scoreline-Nutzung messbar: mehr Advances, mehr Scores, schnellere erste Corp-Scores und weniger Runner-Steals.
- Die `new_remote`-Überexpansion bleibt in den aggregierten Metriken bei 0; der gezielte Fix gegen zweite Remotes hat keine neue Portfolio-Expansion erzeugt.
- Gegenläufig gestiegen sind Central-ICE-Ablenkungen:
  - `corpExtraCentralIceChosenOverReadyRemoteBuild`: 27 -> 59
  - `corpExtraCentralIceChosenOverEconomy`: 30 -> 62
  - `corpExtraCentralIceChosenOverAdvanceOrScore`: 6 -> 8
  - `corpInstalledCentralIceWithoutRezReserve`: 68 -> 84
- `corpCentralOverIcedWithLowRezReserve` sinkt zwar von 5672 auf 5290, aber das absolute Central-Over-Ice-Niveau bleibt hoch.

## Seed-Flip-Befund

30 von 100 Seeds ändern den Ausgang gegenüber dem letzten großen Stand.

Gute Corp-Flips:
- `latest-match-baseline-015`: Runner 7:3 -> Corp 8:3
- `latest-match-baseline-023`: Runner 7:4 -> Corp 8:2
- `latest-match-baseline-036`: Runner 8:0 -> Corp 7:1
- `latest-match-baseline-038`: Runner 7:2 -> Corp 8:3
- `latest-match-baseline-042`: Runner 6:2 -> Corp 7:4
- `latest-match-baseline-085`: Limit 4:0 -> Corp 8:2
- `latest-match-baseline-100`: Limit 1:1 -> Corp 7:1

Schlechte Corp-Flips:
- `latest-match-baseline-004`: Corp 8:0 -> Runner 2:6
- `latest-match-baseline-017`: Corp 7:4 -> Runner 8:6
- `latest-match-baseline-020`: Corp 8:5 -> Runner 3:6
- `latest-match-baseline-043`: Corp 7:1 -> Runner 7:2
- `latest-match-baseline-080`: Corp 8:6 -> Runner 8:2

## Kurzbewertung

Der Scoreline-Lock war kein Rückschritt, sondern netto eine Verbesserung: Corp +5 Siege, +0.54 AP, +29 Scores. Die bessere Scoreline-Konversion bestätigt die Richtung.

Der nächste fachliche Engpass ist nicht mehr primär `new_remote`, sondern die weiter zu hohe Central-ICE-Ablenkung in Situationen mit Ready-Remote, Economy-Need oder aktiver Scoreline. Dafür sollte kein globaler Central-Nerf folgen, sondern ein weiterer konkreter Gate-Schnitt: Extra-Central-ICE nur dann erlauben, wenn aktuelle HQ/R&D-Evidence akut ist oder das ICE bezahlbar und sofort relevant ist.
