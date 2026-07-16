# Broker-Audit zu Match `match_ecfe3ce373a56823`

## Korrigiertes Ergebnis

Der vollständige 208/208-Decision-Audit bestätigt zwei eigenständige
Broker-Fehler und entlastet drei zunächst zu pauschal bewertete
Mehrkopien-Entscheidungen:

- D56 zahlte eine erst einmal geladene Bank bei 5 liquiden Credits aus. Der
  Consumer behandelte bereits eine teure Entwicklungskarte in der Hand als
  konkreten Finanzierungsbedarf, obwohl der 3-Credit-Cashout noch keinen
  dringenden Zug belegte. Auf aktuellem Code wird stattdessen weitergeladen.
- D156 nahm mit dem letzten Klick einen Basic Credit, obwohl ein legaler Load
  drei gespeicherte Credits erzeugte. Auf aktuellem Code wird geladen.
- D179 darf in der finanzierten Aufbauphase die zweite Kopie installieren;
  ein weiterer Load der ersten Kopie ist ebenfalls vertretbar.
- D180 darf bei zwei noch aufbaufähigen Quellen entweder Kopie bedienen. Es
  gibt keine allgemeine Mature-first- oder Empty-first-Regel.
- D191 ist auf aktuellem Code keine Broker-Quellenfrage: Sichtbarer
  Überlebens- und Handdruck macht den Draw besser als beide Loads. Diese
  Gegenprobe bleibt ausdrücklich geschützt.

Die Engine-Regel war und ist korrekt: Laden und Entladen teilen pro
installierter Kopie `once_per_turn_per_source`. Weitere Aktionen erlauben
nicht, dieselbe Kopie im selben Zug erneut zu verwenden. Zwei installierte
Kopien sind dagegen zwei eigenständig nutzbare Quellen.

## Wirtschaftlicher Vertrag

Ohne Installationskosten liefert eine Bank bei `n` Loads und einem Cashout:

| Loads | Credits | Aktionen | Credits je Aktion |
| ----: | ------: | -------: | ----------------: |
| 1 | 3 | 2 | 1,50 |
| 2 | 6 | 3 | 2,00 |
| 3 | 9 | 4 | 2,25 |
| 4 | 12 | 5 | 2,40 |

Eine neue Kopie kostet zusätzlich 3 Credits und eine Installationsaktion.
Darum ist der erste Load allein keine Amortisation. Eine zweite Kopie ist in
der echten Aufbauphase trotzdem sinnvoll, weil pro Zug beide Quellen bedient
werden können und ihr Aktionsverhältnis mit jeder weiteren Ladung steigt.

Der freigegebene Vertrag lautet deshalb:

- mehrere Banken als Portfolio behandeln;
- keine starre Wahl immer der volleren oder immer der leereren Quelle;
- jede nutzbare Quelle in freien Aufbauaktionen grundsätzlich mitentwickeln;
- ungefähr 12 gespeicherte Credits je Quelle als normalen Reifebereich
  anstreben, ohne 15 oder 18 zu verbieten;
- ohne unmittelbaren Liquiditätsbedarf einen 3-Credit-Load gegenüber einem
  einzelnen Basic Credit bevorzugen;
- unter 5 liquiden Credits einen 3-Credit-Cashout als Reaktionsreserve
  zulassen;
- normalen Entwicklungsbedarf erst ab einem auszahlbaren 6-Credit-Speicher
  als konkreten Cashout-Grund werten;
- reife Banken ab 12 bei weniger als 20 liquiden Credits auszahlen dürfen;
- bei 20 liquiden Credits ohne konkretes Ziel keinen Cashout erzwingen;
- neuen Bankaufbau und weitere Installation ab 15 liquiden Credits nicht mehr
  als eigenen Aufbauplan erzwingen.

Die letzten beiden Grenzen sind bewusst getrennt: Zwischen 15 und 19
liquiden Credits kann ein reifer Speicher sinnvoll in Reaktionsfähigkeit
umgewandelt werden, weitere Klicks zum erzwungenen Ansparen sind aber keine
Aufbaupriorität mehr.

## Vollständiger Broker-Census

| Entscheidung | Zustand | Historische Wahl | Aktuelle Bewertung |
| --- | --- | --- | --- |
| D36/D37 | 6 Credits, neue B1 | installieren, auf 3 laden | plausibler Aufbau |
| D41 | 0 liquid, B1=3 | auszahlen | korrekter Notfall |
| D52 | B1=0 | auf 3 laden | korrekter Neuaufbau |
| D56 | 5 liquid, B1=3 | auszahlen | bestätigter Frühcashout; jetzt Load |
| D70 | letzter Klick, B1=0 | auf 3 laden | korrekte Zukunftsinvestition |
| D72 | 0 liquid, B1=3 | auszahlen | korrektes Score-Fenster |
| D90 | B1=0 | auf 3 laden | plausibler Neuaufbau |
| D95 | 2 liquid, B1=3 | auszahlen | korrekte akute Liquidität |
| D102 | 7 liquid, B1=0 | auf 3 laden | korrekter Aufbau |
| D108/D112 | B1=3/6 | auf 6/9 laden | korrekte Reifung |
| D133 | 1 liquid, B1=9 | auszahlen | korrekte Reaktionsreserve |
| D155 | vorletzter Klick, B1=0 | Basic Credit | kurzfristig vertretbar |
| D156 | letzter Klick, B1=0 | Basic Credit | bestätigter Fehler; jetzt Load |
| D161/D164/D169 | B1=0/3/6 | auf 3/6/9 laden | korrekter Aufbau |
| D179 | 10 liquid, B1=9 | B2 installieren | zulässiger Portfolioaufbau |
| D180 | B1=9, B2=0 | B2 auf 3 | zulässige Quellenwahl |
| D181 | B1=9, B2=3 | B1 auf 12 | korrekte Parallelentwicklung |
| D183 | B1=12, B2=3 | B2 auf 6 | korrekte Parallelentwicklung |
| D184 | 7 liquid, B1=12, B2=6 | B1 auszahlen | korrekter reifer Transfer |
| D191 | 11 liquid, B1=0, B2=6 | historisch B1-Load | aktuell korrekter Survival-Draw |

## Umsetzung im Consumer

Die Korrektur ist generisch und enthält keine Broker-ID-Sonderregel:

1. `runner-bank-investment-context.ts` trennt Aufbau-Liquidität, komfortable
   Cashout-Liquidität, Reaktionsreserve und konkret auszahlbaren Bedarf.
2. First Load und Fortsetzung liegen mit 1200/1100 nah beieinander; die Quelle
   wird dadurch nicht mehr allein aufgrund ihres Füllstands entschieden.
3. `runner-hand-funding-target.ts` veröffentlicht Kosten und fehlende Credits.
   Der Bank-Consumer erkennt dadurch, ob ein 6+-Payout ein Ziel tatsächlich
   in diesem Zug finanziert.
4. `deck-capabilities.ts` hält Einzelstände, Portfoliosumme und größte reale
   Auszahlung getrennt. Zwei Kopien mit 12 und 3 werden nicht länger als eine
   fiktive 15-Credit-Auszahlung behandelt.
5. Der taktische Bankplan baut anhand der am wenigsten geladenen Quelle auf,
   während Cashout-Bewertung die größte reale Auszahlung verwendet.

## Regressionsevidence

Zehn spielgleiche Checkpoints sichern D41, D56, D72, D95, D133, D156,
D179, D180, D184 und D191. Hinzu kommen synthetische Verträge für
Mehrkopien-Portfolios, Reaktionsreserve, 6-Credit-Funding, Reifetransfer,
15-Credit-Aufbaugrenze, 20-Credit-Liquidität und Installationsprojektion.

Das zuletzt begonnene andere Spiel ist nicht Teil dieses Audits. Es wird in
einem separaten Arbeitsstrang analysiert; hier gab es keine Doppelanalyse und
keine daraus abgeleitete Änderung.
