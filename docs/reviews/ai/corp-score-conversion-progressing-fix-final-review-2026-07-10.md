# Corp-Score-Conversion-Progressing-Fix: Final Review

## Urteil

Der belegte Fehler ist behoben. Ein als
`corp_score_conversion_same_turn_guaranteed:true` ausgewählter
`corp.create_score_window`-Pfad behält seinen engen Controller-Schutz nach dem
Übergang von `active` zu `progressing`. Der Fix ist planstatus- und
evidence-basiert; er kennt weder Vapor Ops noch eine andere Karten-ID.

Im identischen 20-Spiel-Nachtest wurden alle sechs beobachteten garantierten
Conversion-Pfade als `Install -> Advance -> Advance -> Advance -> Score` im
selben Corp-Zug abgeschlossen. Vor dem Fix brachen zwei dieser sechs Pfade nach
der Installation zugunsten von drei Basic Credits ab.

## Änderung

`tacticalPlanCorpScoreConversionBlocksOffPlanOverride` akzeptiert den
Planstatus `progressing` zusätzlich zu `active`, verlangt aber weiterhin:

- Corp-Seite und Plantyp `corp.create_score_window`;
- Evidence `corp_score_conversion_same_turn_guaranteed:true`;
- eine tatsächlich gemappte nächste Planaktion.

Regressionstests bilden die Installation im Status `active` und das folgende
Advancen im Status `progressing` ab. Negative Tests sichern blockierte Pläne
und Progressing-Pläne ohne Garantie gegen einen zu breiten Vorrang.

## Testvertrag

- Corp-Deck: `Universal Fast Advance`
- Runner-Decks: Blink Pressure Rig, Classic Prep Economy, Proteus HQ Virus &
  Derez sowie Proteus R&D Virus & Bad Publicity
- Seeds: `universal-fast-advance-01` bis `-05`
- Spiele: 20, je fünf pro Matchup
- Aktionslimit: 240
- Controller: Corp und Runner jeweils `current_candidate`
- Rohdaten lokal:
  `data/local/universal-fast-advance-progressing-fix-retest-20games-2026-07-10.json`

## A/B-Ergebnis

| Kennzahl                                          |       vor Fix |      nach Fix |
| ------------------------------------------------- | ------------: | ------------: |
| Corp-Siege                                        |             9 |             9 |
| Runner-Siege                                      |             5 |             4 |
| Action-Limits                                     |             6 |             7 |
| Corp-/Runner-Agendapunkte im Mittel               |   5,10 / 3,25 |   5,05 / 3,45 |
| Corp-Scores / Runner-Steals                       |       42 / 27 |       42 / 28 |
| Spiele mit Corp-Score                             |            18 |            18 |
| erster Corp-Scorezug im Mittel                    |         8,778 |         8,778 |
| illegale Aktionen / Replay / Redaction / Fallback | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |

Nur das Blink-Matchup änderte sein Ergebnisaggregat: von 4/1/0 auf 4/0/1
(Corp/Runner/Limit). Die übrigen drei Matchups blieben unverändert. Wegen der
kleinen Stichprobe ist daraus kein allgemeiner Stärkegewinn abzuleiten.

## Direkte Fehlerreproduktion

### Blink Seed 02, Corp-Zug 23

- vor Fix: `Install -> Credit -> Credit -> Credit -> End turn`, später
  Runner-Sieg;
- nach Fix: `Install -> Advance -> Advance -> Advance -> Score`, Corp-Sieg;
- der Controller blockierte den Credit-Override bei Installation und den
  ersten beiden Advancement-Schritten.

### Blink Seed 05, Corp-Zug 13

- vor Fix: `Install -> Credit -> Credit -> Credit -> End turn`, später
  Corp-Sieg;
- nach Fix: `Install -> Advance -> Advance -> Advance -> Score`, später
  Action-Limit;
- der Controller blockierte den Credit-Override ebenfalls bei Installation
  und den ersten beiden Advancement-Schritten.

Damit ist der taktische Abnahmepunkt erfüllt. Dass der zweite geänderte
Spielverlauf später das Aktionslimit statt eines Corp-Siegs erreicht, ist eine
separate Langzeittrajektorie und kein erneuter Abbruch des Conversion-Plans.

## Vapor Ops und Chicago Branch

Die Corp aktivierte Kartenfähigkeiten neunmal; wie in der Baseline waren dies
Credit-Cashouts. Es gab weiterhin keinen `p3_34.move_advancement`-Choice und
keine beobachtete Chicago-Branch-Counterplatzierung. Der Fix verbessert also
die Verbindlichkeit eines bereits erkannten Conversion-Plans, erzeugt aber in
dieser Stichprobe keine zusätzlichen Countertransfer-Pläne.

## Verifikation

- 47 fokussierte Semantic-Ranking- und Score-Conversion-Tests grün;
- `@netgrid/ai`-Typecheck grün;
- drei AI-Shards: 281 Testdateien, 1.803 Tests grün;
- `check:ai` grün;
- Package-Boundaries und Format grün;
- 20 Selfplays mit null illegalen Aktionen, Replayfehlern,
  Redactionfehlern, Fallbacks, verpassten Scorefenstern und unsicheren Scores.

## Restpunkte

- Vapor-Ops-/Chicago-Branch-Conversion bleibt in dieser Playtest-Stichprobe
  unbeobachtet und sollte erst anhand neuer konkreter Decision-Evidence
  weiterbearbeitet werden.
- Die sieben Action-Limits gehören nicht zum Umfang dieses Fixes und sollten
  nach ihren bestehenden Clustern separat analysiert werden.
