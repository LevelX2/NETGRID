# SeeYa-Informationswert: Ist-Audit und Sollzustand 2026-07-17

## Ergebnis

SeeYas Hint, Engine-Effekt und nachgelagerte Zielwahl sind im Kern korrekt.
Der historische Wiederholungsfehler aus `match_fd7671d270e1a716` ist auf
aktuellem Code geschlossen. Die aktuelle Fehlentscheidung entsteht in zwei
Runtime-Übergängen:

1. Eine langsame Bank-Aufladung erhält zusätzlich zu ihrem eigenen
   Commitment-Wert allgemeine Boni für sofortige Credits, niedrige Liquidität
   und Handkarten-Funding, obwohl die Credits zunächst nur gespeichert sind.
2. Der terminale Expose-Bonus unterscheidet nicht sauber zwischen dem
   Ausführen eines Expose-Effekts und dem bloßen Installieren eines Programms,
   das diesen Effekt später bereitstellt.

Der Sollzustand braucht deshalb keine SeeYa-Karten-ID-Regel und keine
Hintänderung. Er braucht eine präzisere Action-Semantik an der Grenze zwischen
gespeicherter Ökonomie, Informationsvorbereitung und tatsächlicher
Informationsaktion.

## Datenbasis und Coverage

- Runtime-SQLite ausschließlich read-only:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- FD7671: 156/156 gespeicherte Runner-KI-Entscheidungen zugeordnet; sieben
  SeeYa-Auswahlen, davon eine Installation und sechs Aktivierungen.
- 424A: 155/155 gespeicherte Runner-KI-Entscheidungen zugeordnet; SeeYa wurde
  bei D86 installiert. D146 / StateVersion 273 ist der relevante spätere
  Matchpoint-Entscheidungspunkt mit installiertem SeeYa.
- Die bestehenden vollständigen Decision-Audits wurden als führende
  Klassifikation verwendet; die SeeYa-, Broker- und Zielwahlpunkte wurden auf
  aktuellem Code erneut produktiv abgespielt.

## Karten- und Hintvertrag

### Engine

SeeYa ist ein Runner-Programm mit:

- Installationskosten: 3 Credits;
- Speicherbedarf: 1 MU;
- Aktivierungskosten: 1 Klick und 1 Credit;
- Effekt: eine beliebige installierte Korp-Karte aus einer legalen Choice
  öffentlich exponieren.

Eine kurzfristige vollständige Sequenz aus Installation, Aktivierung und einer
anschließenden Reaktion benötigt damit mindestens drei Klicks und vier
Credits. Ist SeeYa bereits installiert, benötigt die Informationsaktion
mindestens zwei Klicks vor Aktivierung: einen für SeeYa und einen für die
anschließende Reaktion.

### Hint und Ableitungen

Aktiver Hint, kompilierter Hint, Inspector und Derived Facts stimmen materiell
überein:

- Rollen: `program`, `hidden_zone_tool`, `expose_helper`;
- Planrollen: `build_rig`, `contest_remote`;
- Effekt: `expose_info` auf `installed_card`;
- TargetProfile: `expose_installed_card`, ausschließlich legale Ziele;
- Function Signals: `info.expose`, `info.expose_installed_card`;
- Value Hints: Information 2, Tempo 1.

Der Deck-Consumer-Audit deckte in beiden Checkpoints 18/18 eindeutige Karten
und 45/45 Karten ab. SeeYa besitzt keinen Blocking-Fund. Die drei harten
Audit-Funde sind bereits vorhandene, vom SeeYa-Scope unabhängige
Force-Shield-Effektüberlappungen.

## Historischer Ist-Zustand

### FD7671: Wiederholung und falsches Ziel

- D104 installierte SeeYa historisch für 3 Credits mit dem letzten Klick.
- D124, D134, D139, D143, D149 und D152 aktivierten SeeYa jeweils für einen
  Klick und einen Credit.
- Die zugehörigen Choices D125, D135, D140, D144, D150 und D153 wählten immer
  dieselbe HQ-ICE-Position.
- Nach dem ersten Expose gab es bis zum letzten Expose keine Installation,
  Bewegung, Vertauschung oder Trash-Änderung an dieser Position. Fünf
  Aktivierungen lieferten deshalb keine neue Information.
- Die Korp stand am Matchpoint. Ein unbekannter Remote-Root war legal wählbar,
  wurde aber vom historischen generischen Choice-Fallback nicht priorisiert.

Aktueller Stand:

- exakte Positionshistorie und Zielranking wählen den unbekannten
  Remote-Root;
- wiederholte unveränderte Positionen werden mit -10000 abgewertet;
- wenn alle Positionen exakt bekannt sind, erhält die Aktivierung -3200;
- Install/Move/Swap/Trash invalidiert nur die betroffene Positionshistorie;
- FD7671-Zielcheckpoint und vier Choice-/Historientests sind grün.

### FD7671 D104: aktuelle Installationsgegenprobe

Der historische D104-Zustand wurde mit aktuellem Code und rebasiertem
Runtime-Warmup erneut abgespielt. Aktuell wählt die KI Jack 'n' Joe mit 1187
vor Draw 1048; beide SeeYa-Installationen werden wegen des verbleibenden
Credit-Floors ausgeschlossen. Der alte letzte-Klick-Install ist daher kein
aktuell reproduzierbarer Fehler und erhält keinen eigenen Produktionsfix.

## Aktueller Ist-Zustand 424A-F04

Sichtbarer Zustand D146 / StateVersion 273:

- Korp: 6/7 Agendapunkte;
- Runner: 8 Credits, 4 Klicks;
- ein dreifach geschützter Remote mit unbekanntem Root;
- SeeYa bereits installiert;
- direkter Remote-Run aktuell unzahlbar, aber SeeYa, Pfadöffnungswerkzeug und
  weitere Vorbereitungsaktionen sind legal. Die Information entscheidet, ob
  eine kurze Vorbereitungssequenz überhaupt auf diesen Remote gerichtet wird.

Produktiver aktueller Chooser:

| Rang | Aktion | Score | entscheidende Komponenten |
| ---: | --- | ---: | --- |
| 1 | Broker: 3 Credits speichern | 2062 | Credit-Yield 900, Bank-Commitment 1100 |
| 2 | SeeYa aktivieren | 1827 | terminale Remote-Information 1800, Creditkosten -35 |
| 3 | Draw | 898 | Setup-Ziel 820 |

Die Entscheidungskette enthält keinen Plan-Override: Broker ist Raw-Score-
Sieger und finale Auswahl. Seine Evidence nennt zugleich:

- `bankConcreteFundingNeed:false`;
- `bankTerminalContestFundingNeed:false`;
- `bankPortfolioRole:background`;
- `bankPortfolioLifecycle:dormant`.

Damit widerspricht die Begründung dem Ergebnis: Ein ruhender Hintergrundplan
ohne konkreten Bedarf verdrängt ein terminales Informationsfenster.

## Angrenzende rote 424A-Verträge

Der fokussierte unveränderte Lauf umfasst 50 Tests: 46 grün, 4 rot. Alle vier
roten Fälle wählen Broker-Aufladung:

1. F01 bei 2 Credits: Broker 4157 statt Krash 2314. Broker erhält neben 1200
   Bankwert zusätzlich 1800 allgemeinen Credit-Yield, 700 Niedrig-Credit- und
   395 Handkarten-Funding-Wert, obwohl der Load keine sofortige Liquidität
   erzeugt.
2. F04: Broker 2062 statt SeeYa 1827.
3. F06 bei 12 Credits und letztem Klick: Broker 1612 statt Draw 898.
4. Die F06-Coverage-Gegenprobe scheitert aus demselben Grund.

Die gemeinsame Ursache ist nicht ein zu niedriger SeeYa-Wert, sondern eine
überzählige Sofortliquiditätsbewertung für gespeicherte Credits plus ein zu
starker zweiter Hintergrund-Load mit dem letzten Klick.

## Verbindlicher Sollzustand

### 1. Installation eines Informationswerkzeugs

Ein Expose-Programm ist keine generische Rig-Pflichtkarte. Der terminale
Informationsbonus darf auf eine Installation nur projiziert werden, wenn:

1. ein noch unbekannter Remote-Root im gegnerischen Matchpoint existiert;
2. vor der Installation mindestens drei Klicks vorhanden sind;
3. die sichtbaren Credits mindestens Installationskosten plus einen Credit für
   die anschließende Aktivierung decken;
4. nach Installation und Aktivierung noch ein Klick für Run, Pfadöffnung,
   Funding oder eine andere Reaktion bleibt;
5. Duplicate-/MU-/Credit-Floor- und akute Überlebensbewertungen die
   Installation nicht ausschließen.

Ohne vollständige kurzfristige Sequenz erhält die Installation keinen
terminalen Expose-Bonus. Normale Installations- und Hintwerte bleiben
erhalten.

### 2. Aktivierung

Eine bereits verfügbare Expose-Aktion erhält terminale Priorität, wenn:

1. die Korp genau einen Punkt vor dem Sieg steht;
2. mindestens ein noch nicht exakt exponierter Remote-Root existiert;
3. die Aktivierung legal bezahlbar ist;
4. nach Bezahlung mindestens ein Klick für eine Folgeaktion verbleibt.

Ein aktuell unzahlbarer direkter Run schließt die Information nicht pauschal
aus. SeeYa kann zuerst entscheiden, ob Pfadöffnung, Funding oder Run überhaupt
auf diesen Remote gerichtet werden müssen. Ohne verbleibenden Folgeclick ist
der terminale Bonus dagegen falsch.

Unterhalb des gegnerischen Matchpoints entsteht kein pauschaler terminaler
Bonus. Wenn keine neue exakte Position verbleibt, ist die Aktivierung stark
negativ.

### 2a. Bestätigte Damage-Strategie

Unterhalb des Matchpoints darf SeeYa einen kleineren proaktiven
Informationsbonus erhalten, wenn das side-sichere Schadensmodell die Gefahr
als `confirmed` oder `critical` einstuft. Dafür müssen zusätzlich gelten:

1. Die Einstufung beruht auf sichtbaren Korp-Karten, öffentlichen
   Damage-Ereignissen oder einer sichtbaren Tag-/Trace-/Damage-Kombination;
   unbekannte Deckkarten werden nicht unterstellt.
2. Mindestens ein noch nicht exakt exponierter Remote-Root oder ein
   unbekanntes Remote-ICE existiert. Ein unbekanntes zentrales ICE allein
   reicht nicht.
3. Der Runner besitzt mindestens den vom Schadensmodell empfohlenen
   Handpuffer. Bei akut zu kleiner Hand haben Draw und Überleben Vorrang.
4. Für eine Installation bleibt der vollständige Vertrag aus Installation,
   Aktivierung und Folgeaktion bestehen.

`suspected` erzeugt keinen Bonus. Der Damage-Informationswert bleibt unter
dem Matchpoint-Wert; fortgeschrittene Remote-Roots erhalten innerhalb dieses
kleineren Fensters die höchste Zielrelevanz.

### 3. Zielwahl

Die Choice verwendet ausschließlich legale Optionen und sichtbare
Positionsmerkmale. Reihenfolge:

1. fortgeschrittener unbekannter Remote-Root;
2. sonstiger unbekannter Remote-Root;
3. fortgeschrittenes oder sonstiges unbekanntes Remote-ICE;
4. zentrales unbekanntes ICE;
5. zentraler unbekannter Root.

Exakte unveränderte Wiederholungen stehen hinter jedem neuen Ziel. Eine
öffentliche Boardmutation macht nur die betroffene Position wieder unbekannt.

### 4. Arbitration gegen Ökonomie

- Ein Bank-Load erzeugt gespeicherte Credits und erhält deshalb nicht noch
  einmal die allgemeinen Boni für sofortige Credit-Ausbeute, niedrige liquide
  Credits oder sofort finanzierbare Handkarten.
- Sein Wert kommt aus dem dedizierten Bank-Commitment mit Reife-, Liquiditäts-,
  Funding- und Portfolio-Kontext.
- Ein erster Load bleibt auch mit dem letzten Klick ein sinnvoller
  Zukunftsinvestment-Schritt und muss einen einzelnen Basic Credit schlagen
  können.
- Ein zweiter Load mit dem letzten Klick bleibt positiv, darf aber einen klar
  besseren Draw, eine notwendige Coverage-Installation oder terminale
  Information nicht dominieren.
- Ohne Matchpoint-Gefahr und ohne klar bessere Alternative bleibt normaler
  Broker-Aufbau zulässig.

## Geplante Produktionsgrenzen

- `runner-credit-yield-score` und `runner-credit-need-score` trennen
  `cardImplementationAddsHostedCredits` von sofort liquiden Credit-Aktionen.
- `runner-bank-investment-context` senkt nur den letzten zweiten
  Hintergrund-Load; erste Loads und mehrklickige Aufbauphasen bleiben
  geschützt.
- `runner-terminal-remote-tool-score` unterscheidet Effekt-Ausführung und
  Installationsvorbereitung anhand von Action-Typ, sichtbaren Kosten und
  verbleibenden Klicks.
- Hintdaten, Engine, LegalActions und SeeYa-Karten-ID bleiben unverändert.
