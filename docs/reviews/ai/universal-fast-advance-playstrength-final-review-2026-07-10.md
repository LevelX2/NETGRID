# Universal Fast Advance – Play-Strength Final Review

Status: `verified_before_main_merge`

Datum: 2026-07-10

## Ergebnis vorweg

Das kombinierte 45-Karten-Corp-Deck ist nach dem zweiten identischen
20-Spiel-Lauf ein spielbarer universeller Fast-Advance-Kandidat. Unter den 14
regulär entschiedenen Nachtestspielen gewann die Corp 9 und verlor 5
(64,3 %). Das ist eine klare Richtungsverbesserung gegenüber 7:8 (46,7 %) in
der Baseline, aber wegen nur fünf Seeds je Matchup und sechs Action-Limits kein
statistisch belastbarer Matchup-Nachweis.

Die wichtigsten fachlichen Verbesserungen sind belegt:

- Advancement-Operationen werden als konkrete Scorekonversion bewertet.
- 8 der 41 Corp-Scores lagen in einem Zug mit einer vorherigen Operation; 7
  davon folgten im selben Zug auf eine Corp-Choice.
- Die Corp nutzte 11 aktivierte Kartenfähigkeiten statt 0 in der Baseline.
  Diese 11 Nutzungen öffneten keine Advancement-Choice und waren damit
  sichtbare Vapor-Ops-Cashouts, keine Chicago-Branch-/Transfer-Konversionen.
- Roadblock- und Hidden-Payment-Fenster erzeugten keinen weiteren
  LegalAction-Stillstand.
- Replay, Redaction und Fallback blieben fehlerfrei.

## Finaler Deckkandidat

Identität: `corp_identity_001`

Agenden – 7 Karten / 17 Punkte:

- 3x Corporate War
- 3x Corporate Downsizing
- 1x Superserum

Economy und Tempo – 14 Karten:

- 3x Accounts Receivable
- 2x Annual Reviews
- 3x Day Shift
- 3x Efficiency Experts
- 3x Overtime Incentives

Fast Advance – 12 Karten:

- 3x Management Shake-Up
- 3x Systematic Layoffs
- 3x Chicago Branch
- 3x Vapor Ops

ICE – 12 Karten:

- 3x Misleading Access Menus
- 3x Snowbank
- 3x Data Wall
- 3x Wall of Static

## A/B-Ergebnis

| Kennzahl                                   |                   Baseline |                Nachtest |
| ------------------------------------------ | -------------------------: | ----------------------: |
| Corp-Siege                                 |                          7 |                       9 |
| Runner-Siege                               |                          8 |                       5 |
| Action-Limits / nicht entschieden          | 5, davon 1 Engine-Deadlock | 6, kein Engine-Deadlock |
| Corp-Siegquote unter entschiedenen Spielen |                     46,7 % |                  64,3 % |
| Corp-AP im Mittel                          |                       4,25 |                    5,00 |
| Runner-AP im Mittel                        |                       4,85 |                    3,65 |
| Corp-Scores                                |                         35 |                      41 |
| Runner-Steals                              |                         39 |                      29 |
| erster Corp-Scorezug im Mittel             |                       9,47 |                    9,00 |
| Corp-Ability-Nutzungen                     |                          0 |                      11 |
| illegale Aktionen                          |     1 Engine-Fensterfehler |                       0 |
| Replay-/Redactionfehler                    |                      0 / 0 |                   0 / 0 |

Nachtest je Runner:

| Runner                            | Corp | Runner | Limit | Corp-AP | Runner-AP |
| --------------------------------- | ---: | -----: | ----: | ------: | --------: |
| Blink Pressure Rig                |    3 |      1 |     1 |     6,2 |       3,2 |
| Classic Prep Economy              |    1 |      2 |     2 |     3,8 |       4,4 |
| Proteus HQ Virus & Derez          |    2 |      1 |     2 |     5,4 |       4,0 |
| Proteus R&D Virus & Bad Publicity |    3 |      1 |     1 |     4,6 |       3,0 |

## KI-Analyse der Runner-Restpunkte

Der identische Nachtest mit dem geänderten Entscheidungsverhalten ergab unter
dem alten Detector 70 statt 105 wiederholte Runs. Nach der gleichzeitig
notwendigen Korrektur falscher Positiver – eine Corp-Mandatory-Draw- oder
HQ-Änderung macht den nächsten Zentralzugriff frisch – bleiben 8 echte stale
Repeats.

Recovery-Loops sanken mit unveränderter Definition von 31 auf 24. Die
Plan-Mismatch-Zahl stieg unter dem alten Detector zunächst von 126 auf 154,
weil nun mehr absichtliche semantische Overrides gegen schlechte Pläne
stattfanden. Nachdem tatsächlich gemappte Zwischenschritte und dokumentierte
Overrides als kompatibel gelten, bleiben 18 Mismatches. Die korrigierte
Nachtestauswertung lautet:

- 8 wiederholte Runs ohne frischen Access-Fingerprint;
- 24 Recovery-Loops ohne Funding-/Coverage-Nachweis;
- 18 echte Plan-/Aktions-Mismatches;
- 9 Bank-/Debt-Aktionen ohne konkreten Funding-Bedarf.

Diese Zahlen mischen Verhaltens- und Detector-Verbesserung und sind daher nicht
als reine Effektgröße zu lesen. Die unveränderte Recovery-Definition liefert
mit 31 → 24 den saubersten direkten Vergleich.

## Aussagegrenzen und Empfehlung

Die sechs Action-Limits sind keine Engine-Stillstände: alle endeten bei exakt
240 Aktionen mit vorhandenen LegalActions. Vier wurden als Low-Value-Repeat,
eines als Setup-/Economy-Loop und eines gemischt klassifiziert. Zwei dieser
Spiele hatten 0 Corp-AP; Agenda-Draw und frühere Steals begrenzen dort die
Aussage über Fast-Advance-Entscheidungen.

Empfehlung:

1. Dieses Deck als aktuellen universellen Testkandidaten verwenden.
2. Für belastbare Balanceaussagen mindestens 20 Seeds je Matchup und ein
   turnbasiertes Zusatzlimit verwenden, damit Run-Mikroschritte das
   Aktionsbudget nicht verzerren.
3. Chicago Branch und Vapor-Ops-Transfer noch nicht aus dem Deck entfernen.
   Ihre konkrete Scorekonversion ist jetzt bewertet, trat in diesen 20 Seeds
   aber nicht auf. Dafür ist ein gezieltes Szenario sinnvoller als weitere
   zufällige Selfplays.
4. Die verbleibenden 24 Recovery- und 18 Plan-Funde als eigenes
   Play-Strength-Follow-up behandeln; sie blockieren weder Engine-Korrektheit
   noch diesen Deckvergleich.

## Verifikation

- Engine: 180 Testdateien / 1.602 Tests grün.
- AI: 278 Testdateien / 1.765 Tests grün über drei Shards.
- Engine- und AI-Typecheck grün.
- `check:ai`, Deck-Doctrine- und Format-Gate grün.
- Nachtest: 20 Spiele, 0 illegale Aktionen, 0 Replayfehler, 0
  Redactionfehler, 0 Fallback.

Rohdaten bleiben lokal und unversioniert unter
`data/local/universal-fast-advance-final-20games-2026-07-10.json`.
