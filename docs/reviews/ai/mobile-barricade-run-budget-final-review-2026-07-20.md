# Mobile-Barricade-Run-Budget – Abschlussreview 2026-07-20

## Ergebnis

Der Run auf Remote 1 in Zug 20 von `match_2023bc6567e45faa` war in der
gespielten Situation nicht sinnvoll. Der Runner hatte acht Credits. Für den
bereits bekannten Gatekeeper waren zwölf Breaker-Credits nötig. Nur zwei Bits
von Vewy Vewy Quiet waren für Krash nutzbar; die zwei Bits auf Eurocorpse Spin
Chip waren nicht nutzbar, weil Krash nicht darauf gehostet war. Damit fehlten
bereits vor den beiden unbekannten ICE zwei Credits. Die Corp hatte zugleich
sieben Credits und konnte Mobile Barricade für sechs rezzen.

Nach dem Rezzen war kein Jack-out mehr legal. Die spätere Entscheidung blieb
trotzdem unwirtschaftlich: Der Runner bezahlte insgesamt acht Breaker-Credits,
um einen Net Damage zu brechen, ließ danach aber die End-the-run-Subroutine
auflösen. Mit fünf Karten im Grip war der eine Net Damage nicht tödlich. Die
sinnvolle Linie war deshalb, den Schaden zu akzeptieren und die Credits zu
behalten; falls die Engine anschließend eine legale Damage-Prevention anbietet,
wählt der bestehende Prevention-Chooser diese bevorzugt.

## Korrigierte Entscheidungslogik

### Credit-Budget

- Eingeschränkte Credits werden nicht mehr global als beliebige
  Icebreaker-Credits gezählt.
- Hosted-only-Pools werden dem tatsächlich gehosteten Breaker zugeordnet und
  in Pfadquote, Pump-Sequenz und Encounter-Zahlung identisch verbraucht.
- Das AI-DTO bewahrt diese öffentlich sichtbare Engine-Berechtigung; es wird
  keine Kartenidentität oder verdeckte Information erraten.

### Unbekanntes ICE und Corp-Credits

- Ein unbekanntes ICE allein verbietet keinen Run.
- Bei einem Score-Threat bleibt ein Versuch mit finanzierter bekannter Route
  erlaubt, wenn die Corp sichtbar null oder einen Credit besitzt.
- Hat die Corp mehr Geld und bliebe nach der bekannten Route höchstens ein
  Credit Reserve, empfiehlt und mapped der Plan zunächst Finanzierung.
- Gewöhnliche Informationsprobes mit einem realen Restpolster werden nicht in
  endloses Funding umgeleitet. Die bestehenden E8886- und 9FEF-Kontrollen
  sichern diese Grenze.

### Schaden und Prävention

- Nichtpermanenter Net-/Meat-Damage ist kein pauschaler Survival-Break mehr.
- Würde der sichtbare Schaden die aktuelle Gripgröße übersteigen, bleibt die
  Safety-Sequenz zwingend. Core-/Brain-Damage, Programmtrash, Tag-/Trace-Gefahr
  und andere unmittelbare Verluste bleiben ebenfalls geschützt.
- Wenn der Restpfad keinen Zugriff mehr erreicht und `continue_run` den Run
  beendet, darf die KI nichttödlichen Schaden akzeptieren, statt Credits in
  einen wertlosen Break zu investieren.
- Prävention wird nicht vorweg erfunden: Sobald die Engine das echte
  Prevention-Fenster und dessen LegalActions/Choice-Optionen erzeugt, nutzt die
  KI weiterhin eine legale routinemäßige Damage-Prevention vor `pass`.

## Checkpoints und Gegenproben

| Fall                             | Erwartung                                       | Ergebnis |
| -------------------------------- | ----------------------------------------------- | -------- |
| historische Decision 72          | Credit nehmen, Remote 1 nicht starten           | grün     |
| finanzierte Route, Corp 1 Credit | Remote-Score-Contest bleibt erlaubt             | grün     |
| dieselbe Route, Corp 7 Credits   | zuerst finanzieren                              | grün     |
| Spin Chip ungehostet             | Bits nicht für Krash zählen                     | grün     |
| Krash auf Spin Chip gehostet     | Bits für Krash zählen                           | grün     |
| historische Decision 73          | nichttödlichen Damage akzeptieren, nicht pumpen | grün     |
| historische Decision 76          | Damage nicht mehr wertlos brechen               | grün     |
| leerer Grip                      | Safety-Sequenz gegen Flatline starten           | grün     |

## Verifikation

- fokussierte und angrenzende KI-Tests: 125/125 grün;
- AI-Shard 1: 141 Dateien, 1.039 Tests grün;
- AI-Shard 2: 141 Dateien, 1.012 Tests grün;
- AI-Shard 3: 140 Dateien, 876 Tests grün;
- Shared-, Engine- und AI-Typecheck: grün;
- Eurocorpse-PlayerView-/Engine-Test: grün;
- Formatprüfung und `git diff --check`: grün.

Der Deck-Hint-/Consumer-Audit bestätigt das neue Checkpoint-Verhalten und
20/20 eindeutige Karten. Er meldet fünf bereits vorhandene, nicht kausale
Blocker bei Disgruntled Ice Technician, Streetware Distributor, Cloak, Clown
und Vewy Vewy Quiet. Sie gehören nicht zum Run-Budget-/Damage-Fix und wurden
nicht nebenbei verändert.

Es gibt keine Match-ID-, Mobile-Barricade-, Gatekeeper- oder Krash-Sonderregel.
Engine-Legalität, Hidden-Info-Grenze, Replay und StateHash bleiben die
verbindlichen Autoritäten.
