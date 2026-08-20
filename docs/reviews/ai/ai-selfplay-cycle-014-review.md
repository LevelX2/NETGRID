# KI-Selbstspielzyklus 014 – Zentraldruck und Run-Fortsetzungen

Stand: 2026-08-20  
Status: sechs generische Ursachen behoben; drei finale Seeds vollständig
auditiert; strategischer Manhunt-Verdacht verdichtet

## Reproduktionsvertrag

- Auswahlseed: `14fe1e91c0914518a4ae35c593308f71`
- Runner: **Proteus Runner – Breaker Lab & Virus Pressure**, 45 Karten,
  `fnv1a:70ae3c9a`
- Corp: **Manhunt Pressure Bureau**, 45 Karten und 9 Agendapunkte,
  `fnv1a:331301d7`
- Spielseeds:
  - `selfplay-014-207e279f56d326783bd4488d84f0fad0`
  - `selfplay-014-6fa5abb4dd9b264674361f22f885dce9`
  - `selfplay-014-54ad6e1cf68b6922230d1f4bc7d4bab0`
- harte KI, Detailtrace, `rules_match`, moderner offener Trace-Vertrag

Alle Ausgangs-, Zwischen- und Abschlussläufe liegen in der fortgeschriebenen
isolierten SQLite-Datenbank des Worktrees. Die Datenbank wurde nicht zwischen
den Replays geleert. Analyse und Reproduktion verwendeten ausschließlich die
lokale read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks | Endergebnis | Agendapunkte | Niederlage | Entscheidungen |
| --- | --- | ---: | ---: | --- | ---: |
| Seed 1 | **Proteus Runner – Breaker Lab & Virus Pressure** gegen **Manhunt Pressure Bureau** | Runner **10 – 6** Corp | **3:6** | Corp-Deck leer | 538 |
| Seed 2 | **Proteus Runner – Breaker Lab & Virus Pressure** gegen **Manhunt Pressure Bureau** | Runner **10 – 3** Corp | **3:3** | Corp-Deck leer | 579 |
| Seed 3 | **Proteus Runner – Breaker Lab & Virus Pressure** gegen **Manhunt Pressure Bureau** | Runner **10 – 6** Corp | **3:6** | Corp-Deck leer | 526 |

Die finalen Match-IDs sind `match_84ffbfd10d17e350`,
`match_00aa4f0e62037b40` und `match_f72e37db39652eeb`.

Im dritten Seed änderte der letzte Fix den produktiven Suffix: Die
Viral-Pipeline-Konvertierung wird nun an D213 ausgeführt. Der zuvor hinter
P4- bis P6-Plänen liegen gebliebene Effekt kostet weder Klick noch Credit und
nimmt der Corp anschließend wiederholt Aktionen. Das Ergebnis bleibt ein
Runner-Sieg, entsteht aber aus einer fachlich besseren Linie.

## Vollständiger Decision-Denominator

Alle 1.643 finalen Entscheidungen wurden seitenweise und genau einmal
geladen:

- Seed 1: 538/538;
- Seed 2: 579/579;
- Seed 3: 526/526;
- keine Lücke, kein Duplikat, Fallback, Timeout, unbekannter Plan,
  Coveragefehler, Auswahlmismatch oder Engine-Rejection;
- vollständige historische LegalActions, Engine-Evidence, actor-private
  Analysesnapshots und Checkpoint-Captures;
- getrennte terminale Ereignishistorien;
- 66 Runstarts, davon 32 erfolgreich; genau eine gestohlene Agenda und zwei,
  eine beziehungsweise zwei von der Corp gescorte Agenden.

## Behobene Findings

### SP-068 – kostenlose Bulldozer-Fortsetzung verlor ihre Fähigkeit

Die Engine erzeugte den kostenlosen Break der nächsten Sentry ohne die
kanonische Breaker-Fähigkeitsbindung. Der folgende Runplan konnte die Action
deshalb nicht als Fortsetzung derselben Bulldozer-Fähigkeit beweisen.

Die Engine übernimmt nun die exakte Quellfähigkeit in die LegalAction-Payload
und scheitert sichtbar, wenn die gespeicherte Fähigkeit nicht mehr existiert.
Ziel-ICE, Subroutine und Fähigkeit bleiben Engine-gebunden; die KI erhält
keine neue Zielautorität.

### SP-069 – Fehler beim Aufbau des KI-Inputs verschwanden vor der Evidence

Eine Exception in `buildAiDecisionInput` verließ den Multiplayer-Pfad vor
der strukturierten Failure-Persistenz. Dadurch fehlte gerade für frühe DTO-
und Projektionsfehler die vollständige Reproduktionsbasis.

Der Server speichert nun auch die Phase `input` als eigenen fail-closed
Versuch mit LegalActions, Enginezustand und actor-privatem Snapshot. Eine
nicht erzeugbare Checkpoint-Projektion wird nicht erfunden; die übrige
Evidence bleibt vollständig verfügbar.

### SP-070 – Fubar-Moduswechsel blieb im Encounter ohne Planassessment

Fubar konnte im Encounter kostenlos auf den Typ des aktuellen ICE wechseln
und danach dessen ETR-Subroutine bezahlen. Die Action war legal, wurde aber
von `runner.convert_run_window` mangels planlokaler Bewertung verworfen.

Der bestehende Run-Window-Owner prüft nun Quellinstanz, sichtbares rezztes
ICE, Engine-Quote, exakten Zieltyp und den bezahlbaren Folgepfad. Nur dann
wird die aktuelle LegalAction zugelassen. Paarung 029 bestätigt denselben
Fehler und denselben Fix unabhängig.

### SP-071 – Vacuum-Link-Fortsetzung hatte eine künstliche Hop-Grenze

Die Run-Fortsetzung war korrekt an den bestehenden Runplan gebunden, durfte
aber zunächst höchstens drei, später vier Zustandsübergänge umfassen. Mehrere
legitime Corp-Rez-/Pass-Fenster erzeugten fünf Übergänge und führten zum
fail-closed `window_origin_missing`.

Die Bindung verwendet nun keine willkürliche Anzahl. Sie verlangt eine
lückenlose, einzeln inkrementierte Kette: erster Schritt vom gespeicherten
Planstand, letzter Schritt im aktuellen Zustand, dazwischen ausschließlich
Corp-Rez oder -Pass, abschließend die passende Vacuum-Link-Auflösung. Der
Choice-Resolver entscheidet weiterhin nur die Payload der exakt gebundenen
Fortsetzung.

### SP-072 – sichtbarer flexibler Breaker verlor seinen aktuellen Modus

Der normale AI-DTO-Sanitizer entfernte `selectedSubtype` und
`selectedSubtypeLabel` aus einer für den Actor sichtbaren installierten
Karte. Die privilegierte Debugansicht zeigte den Modus, der eigentliche
Runpfad rechnete aber mit einem unbestimmten Breaker.

Actor-sichtbare Karten behalten die beiden aktuellen Modusfelder. Verdeckte
Karten und private Auswahlfelder bleiben unverändert redigiert. Der zweite
Seed wechselt dadurch von Corp 10:0 bei 5 Runs zu Runner 10:3 bei 22 Runs.

### SP-075 – Viral Pipeline hatte weder Semantik noch rechtzeitige Konversion

Die kanonische CardSpec-Aktion war legal, aber der generische Compiler
projizierte `add_corp_purgeable_runner_virus_counter` nicht als
Action-Denial. Nach der ersten Ownership-Reparatur blieb die kostenlose
Konvertierung 144-mal legal, erbte jedoch P4 bis P6 und wurde nie ausgeführt.

Der Compiler veröffentlicht die Action-gebundene Wirkung als persistente
Corp-Aktionsreduktion. `runner.pressure_central` bleibt alleiniger Owner und
bindet die Action an eine residente oder deterministisch aktuelle
Central-Instanz. Die sofort ausführbare, kostenlose Umwandlung erhält als
aktuelles Konvertierungsfenster P3; andere Server-, Run- oder Choice-
Entscheidungen entstehen nicht. Im finalen Seed wird die Action an D213
tatsächlich ausgeführt.

## Gewinneranalyse

Der Runner stiehlt in jedem Seed genau eine Corporate War. Danach kontrolliert
er das Deckrennen und hält sich vollständig tagfrei. Seed 1 benötigt nur vier
erfolgreiche Runs, trifft aber die entscheidende Agenda und überlebt die
späten Corp-Fenster. Seed 2 nutzt nach Erhalt des sichtbaren Breakermodus 19
erfolgreiche Zugriffe bei 22 Runs. Seed 3 konvertiert zusätzlich die komplette
Socket-Menge in einen Pipe-Counter und zwingt die Corp insgesamt 16-mal zum
Aktionsverzicht.

Die Gewinnerlinie ist nicht bloß glückliches Agenda-Sampling: Der Runner
erhält durch exakte Breaker-Modi, planlokale Encounter-Aktionen und den
konvertierten Multi-Central-Druck wiederholt bezahlbare Zugriffe. Trotzdem ist
der erste Agenda-Treffer wegen der Deckkonstruktion überproportional wichtig.

## Verliereranalyse und Metaebene

Manhunt Pressure Bureau enthält drei Agenden zu je 3 Punkten. Sobald der
Runner eine davon stiehlt, kann die Corp mit den beiden verbleibenden Agenden
höchstens 6 Punkte erreichen. In allen drei Seeds geschieht genau dies; die
Corp muss danach zwingend über Tags und Schaden gewinnen.

Diese alternative Siegroute kommt nicht zustande:

- der Runner hat über alle sichtbaren Zustände maximal 0 Tags;
- Trace-Operationen sind 9-, 9- und 52-mal legal;
- nur im ersten Seed wird einmal spät Chance Observation ausgeführt;
- die Punish-Evidence verwirft die übrigen Fenster nicht pauschal: Sie weist
  konkret fehlende Same-Turn-Credits/Klicks, unbekannte Routequotes oder
  keinen positiven Mindestschaden aus;
- im dritten Seed erkennt D98 bei nur einer Runner-Handkarte zwar eine
  mögliche terminale Chance-Observation-/Scorched-Earth-Kette, hat aber nur
  einen Klick und kann die Zwei-Klick-Folge in diesem auslaufenden Fenster
  nicht mehr beginnen.

Damit ist kein einzelner sicher besserer LegalAction-Zug belegt. Das
seedübergreifende Muster ist dennoch strategisch relevant: Nach dem ersten
3-Punkte-Steal besitzt dieses konkrete Deck keine Scoring-Siegroute mehr,
hat aber seine Credits und Klicks zuvor nicht in ein ausführbares
Tag-plus-Schaden-Fenster überführt. SP-076 speichert deshalb als Verdacht, ob
Low-Agenda-/Flatline-Decks früher eine strengere, sichtbare
Punish-Liquiditätsreserve oder eine angepasste Phasenumschaltung benötigen.
Ein Fix folgt erst mit weiteren unabhängigen Paarungen oder einer exakt
dominanten früheren Reserveentscheidung.

## Architektur-, Test- und Dokumentationswirkung

- Engine-Payloads behalten die Fähigkeit, welche eine kostenlose
  Break-Fortsetzung erzeugt hat.
- Actor-sichtbare dynamische Kartenmodi bleiben im AI-DTO erhalten.
- `runner.convert_run_window` bewertet flexible Breaker-Modi nur gegen den
  aktuellen Engine-zertifizierten Encounterpfad.
- `runner.pressure_central` konvertiert angesammelten Multi-Central-Druck als
  eigene P3-Route desselben Plans, nicht als Karten-Sonderplan.
- Vacuum-Link-Choices bleiben über eine lückenlose erlaubte Ereigniskette am
  ursprünglichen Runplan gebunden.
- `planning-architecture.md` dokumentiert die beiden geänderten Owner- und
  Continuation-Verträge; Änderungskompass und AI-README bleiben unverändert
  ausreichend.

## Ablauf- und Laufzeitoptimierung

Unveränderte finale Spiele wurden nur dann wiederverwendet, wenn die
geänderte Action dort nachweislich nicht legal war. Nur der betroffene dritte
Seed wurde erneut ausgeführt. Der Decision-Denominator wurde ohne wiederholte
Eventeinbettung in 200er-Seiten geladen, die Ereignisse separat paginiert.

Für fokussierte Tests wird künftig direkt
`pnpm --filter @netgrid/ai exec vitest run <Datei>` verwendet. Die zuvor
verwendete Kombination `pnpm ... test -- --run <Datei>` reichte die Argumente
falsch weiter und erzeugte einen mehrminütigen Hängelauf; der direkte Aufruf
benötigte für denselben Pfad sieben Sekunden.

## Verifikation

- finale Drei-Seed-Serie mit 1.643/1.643 Entscheidungen und `FLAGS=0`;
- CardSpec-Hint-Generierung konsistent;
- fokussierte Compiler-, DTO-, Runpfad-, Ownership- und
  Vacuum-Link-Regressionsfälle grün;
- nach dem Main-Vorsync die beiden zuletzt geänderten Realpfade erneut grün;
- AI-Typecheck nur mit fünf bekannten, unabhängigen Baselinefehlern.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
