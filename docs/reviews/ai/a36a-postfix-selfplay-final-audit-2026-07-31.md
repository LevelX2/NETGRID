# A36A Postfix Selfplay – Abschlussaudit aller KI-Entscheidungen

Stand: 2026-07-31
Seed: `a36a-postfix-selfplay-20260731-002`
Prüfstand: Arbeitsbranch nach P1–P5 und den beiden im ersten Postfix-Lauf
entdeckten generischen Nachkorrekturen

## Gesamturteil

Das identische Hard-vs.-Hard-Kontrollspiel endet nach 109 vollständig
geprüften KI-Entscheidungen und 14 abgeschlossenen Halbzügen mit 7:0 für die
Corp. Das Ergebnis ist kein Beleg für gleich starke Spielqualität beider
Seiten: Die Corp verwertet drei schnelle, geschützte Score-Linien sehr gut;
der Runner entwickelt seine Engine sinnvoller als im Ausgangsspiel, bleibt
aber im Wettlauf zu langsam.

Die drei führenden Fehler sind geschlossen:

- Der frühere Bodyweight-Fehler D45 tritt nicht wieder auf. Bodyweight wird
  erst mit zwei verbleibenden Clicks gespielt; danach werden The Shell
  Traders installiert und der Zug geordnet abgeschlossen.
- Der frühere Breaker-Discard D47 tritt nicht wieder auf. Der Cleanup-Discard
  entfernt Invisibility und R&D Interface, während Rent-I-Con installiert
  bleibt.
- Der frühere `step_target_mismatch` nach Zustand 107 tritt nicht wieder auf.
  Alle Shell-Traders-Schritte D60–D69 bleiben auf dieselbe Vewy-Vewy-Quiet-
  Instanz gebunden.

Der erste Postfix-Auditlauf machte zwei weitere klare Ursachen sichtbar:
Shell Traders konnte ein Null-Counter-Ziel dauerhaft beiseitelegen, und die
persistente Kartenbewertung behandelte jede aktionsgebundene Suche als Ersatz
für jede andere Such-/Recovery-Familie. Beide Ursachen wurden generisch
korrigiert. Im hier dokumentierten Abschlusslauf wird kein Null-Counter-Ziel
mehr gestaged. Recovery, Programmsuche, Stacksuche und Hidden-Zone-Suche
bleiben eigenständige Funktionsfamilien.

## Laufkonfiguration und Integrität

- Runner: `Rent-I-Con: Das Shellspiel`
  (`standard_runner_rent_i_con_shellspiel_2026_07_17`,
  `fnv1a:518ccd75`)
- Corp: `Universal Fast Advance`
  (`standard_corp_universal_fast_advance`,
  `fnv1a:94aba061`)
- Controller: `current_candidate` gegen `current_candidate`
- Schwierigkeit: `hard` gegen `hard`
- tatsächliches Ende: `game_result`, Corp durch `agenda_points`
- Decisions: 109
- beendete Halbzüge: 14
- finaler StateHash: `fnv1a:264c98ae`
- Eventlog-Länge: 110
- Replay: erfolgreich, keine Replay-Fehler
- Runtime-/Engine-Fehler: 0
- illegale Actions: 0
- Fallback-Rate: 0
- Timeout-Rate: 0
- verdeckte harte Planfehler: 0

Das Spiel lief vollständig in-process. Weder Server noch Webclient,
Standardports oder die SQLite-Dateien des Haupt-Checkouts wurden verwendet.
Die lokale Auditdatei enthält absichtlich die privilegierte KI-Sicht und ist
kein öffentliches Replay- oder PlayerView-Artefakt.

## Geschlossener Decision-Nenner

Jede angewandte Entscheidung besitzt genau eine Auditzeile:

`erwartete Decisions = Simulationstraces = angewandte Events =
Ledger-Zeilen = 109`.

| Klassifikation | Anzahl |
|---|---:|
| Gut | 70 |
| Pflicht | 33 |
| Vertretbar | 6 |
| klarer Fehler | 0 |
| **Gesamt** | **109** |

Die Urteile bedeuten:

- **Gut:** strategisch oder taktisch schlüssige Wahl.
- **Pflicht:** Regel-, Choice-, Kosten-, Run- oder Abschlussfortsetzung ohne
  eigenständige neue Strategieentscheidung.
- **Vertretbar:** nicht eindeutig optimal, aber eine kohärente und
  fachlich begründbare Variante.

Es verbleibt in diesem Lauf kein als klarer Fehler klassifizierter Schritt.
Die nach dem Ledger aufgeführten Restprobleme betreffen breitere
Qualitätsabwägungen, nicht eine einzelne sicher falsche Action.

## Vollständiges Entscheidungsledger

### Zug 1 – Setup und Corp-Eröffnung

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 0 | Runner | Starthand mulligan | Gut | Die Ausgangshand enthält weder Rent-I-Con noch einen unmittelbaren Suchpfad; der Mulligan ist deckstrategisch richtig. |
| 1 | Corp | Starthand behalten | Gut | Die Hand trägt zentrale Defense, Economy und eine frühe Agenda-Linie. |
| 2 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 3 | Corp | Data Wall vor R&D installieren | Gut | R&D wird sofort geschützt. |
| 4 | Corp | Efficiency Experts spielen | Gut | Die Operation finanziert zweite Zentraldefense und spätere Rez-/Score-Linien. |
| 5 | Corp | Misleading Access Menus vor HQ installieren | Gut | HQ und R&D sind damit im ersten Corp-Zug beide geschützt. |
| 6 | Corp | Zug beenden | Pflicht | Alle Clicks wurden produktiv verbraucht. |

### Zug 2 – erster Runner-Zug

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 7 | Runner | Probe-Run auf R&D | Vertretbar | Erzwingt das Rezzen des unbekannten ICE. Eine direkte Rent-Installation wäre ebenfalls sinnvoll; deshalb kein apodiktischer Fehler. |
| 8 | Corp | Data Wall rezzen | Gut | Günstiger Run-Stopp und Schutz der wichtigsten Zentrale. |
| 9 | Runner | Subroutinen auslösen; Run endet | Pflicht | Vor der Installation existiert kein legaler Break. |
| 10 | Runner | Rent-I-Con installieren | Gut | Schließt die sichtbar gewordene Wall-Lücke. |
| 11 | Runner | Livewire’s Contacts spielen | Gut | Finanziert den sofortigen zweiten R&D-Anlauf. |
| 12 | Runner | Run auf R&D | Gut | Der bekannte Pfad ist nun passierbar. |
| 13 | Runner | Data-Wall-Subroutine brechen | Gut | Korrekte Nutzung des einzigen Universal-Breakers. |
| 14 | Runner | ICE passieren | Pflicht | Regelgebundene Run-Fortsetzung. |
| 15 | Runner | Run fortsetzen | Gut | Der bezahlte Zugang wird nicht aufgegeben. |
| 16 | Runner | R&D-Karte accessen | Pflicht | Regelgebundenes Zugriffsfenster. |
| 17 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 3 – erstes Scoring-Remote

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 18 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 19 | Corp | Wall of Static vor neuem Remote installieren | Gut | Erst Schutz, dann Agenda; die Reihenfolge ist konsistent. |
| 20 | Corp | Corporate Downsizing in Remote 1 installieren | Gut | Die Agenda nutzt das soeben geschützte Remote. |
| 21 | Corp | Corporate Downsizing advancen | Gut | Der letzte Click erzeugt konkreten Score-Fortschritt. |
| 22 | Corp | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 4 – Runner contestet das Remote

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 23 | Runner | 1 Credit nehmen | Gut | Exakte Finanzierung des gebundenen Contest-Plans. |
| 24 | Runner | Gideon’s Pawnshop spielen | Gut | Holt den konsumierten einzigen Breaker-Provider aus dem Heap zurück. |
| 25 | Runner | Rent-I-Con aus dem Heap wählen | Gut | Die Choice folgt exakt dem Coverage-Bedarf. |
| 26 | Runner | Run auf Remote 1 | Gut | Die entwickelte Agenda muss vor dem nächsten Corp-Zug geprüft werden. |
| 27 | Corp | Wall of Static rezzen | Gut | Schützt den akuten Score-Pfad. |
| 28 | Runner | Subroutinen auslösen; Run endet | Pflicht | Rent-I-Con befindet sich noch auf der Hand. |
| 29 | Runner | Rent-I-Con installieren | Gut | Verbraucht den letzten Click für die wiederhergestellte Universal-Coverage statt für einen irrelevanten Nebenrun. |
| 30 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 5 – Corporate Downsizing wird gescort

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 31 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 32 | Corp | Corporate Downsizing advancen | Gut | Setzt denselben mehrzügigen Agenda-Plan fort. |
| 33 | Corp | Corporate Downsizing advancen | Gut | Vollendet die Advancement-Anforderung. |
| 34 | Corp | 1 Credit nehmen | Gut | Sichert Liquidität, ohne die noch im selben Fenster mögliche Score-Action aufzugeben. |
| 35 | Corp | Corporate Downsizing scoren | Gut | Konvertiert die vollständige Agenda-Linie. |
| 36 | Corp | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 6 – Runner stabilisiert Hand und Economy

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 37 | Runner | Karte ziehen | Vertretbar | Bei leerer Economy und kleiner Hand ist eine neue Informationsphase nachvollziehbar. |
| 38 | Runner | 1 Credit nehmen | Gut | Bereitet die sichtbare Entwicklungsroute vor. |
| 39 | Runner | Karte ziehen | Vertretbar | Erhöht den frühen Deckdurchsatz, ohne Cleanup-Überlauf zu erzeugen. |
| 40 | Runner | 1 Credit nehmen | Gut | Baut den für kommende Entwicklungs- und Runlinien nötigen Reserveboden auf. |
| 41 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 7 – Corp baut Hand und Defense aus

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 42 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 43 | Corp | Day Shift spielen | Gut | Erweitert die Hand und findet Fast-Advance-Material. |
| 44 | Corp | zweites ICE vor HQ installieren | Vertretbar | Mehr Zentraldefense ist sinnvoll, auch wenn eine weitere Remote-Schicht ebenfalls plausibel wäre. |
| 45 | Corp | 1 Credit nehmen | Gut | Restclick in Liquidität für die nächste Score-Linie umsetzen. |
| 46 | Corp | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 8/9 – Bodyweight ohne alten Überlauffehler

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 47 | Runner | 1 Credit nehmen | Gut | Finanziert zunächst die sichtbare Vewy-Vewy-Quiet-Entwicklung. |
| 48 | Runner | Bodyweight™ Synthetic Blood spielen | Gut | Anders als im Ausgangsfehler bleiben zwei Clicks; die neue Information darf den Restzug neu planen. |
| 49 | Runner | The Shell Traders installieren | Gut | Konvertiert einen Folgeclick in die decktragende Staging-Infrastruktur. |
| 50 | Runner | 1 Credit nehmen | Gut | Der letzte Click verbessert die Folgerunde; ein Null-Counter-Ziel wird nicht gestaged. |
| 51 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |
| 52 | Runner | Invisibility und R&D Interface discarden | Gut | Der Cleanup entfernt zwei nicht akute Karten; der einzige Breaker bleibt installiert und Vewy wird gehalten. |

### Zug 9 – Corp finanziert den Fast-Advance-Zug

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 53 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 54 | Corp | 1 Credit nehmen | Gut | Erster Schritt zur vollständig finanzierten Corporate-War-/Systematic-Layoffs-Linie. |
| 55 | Corp | 1 Credit nehmen | Gut | Der deterministische Mehrzugplan wird beibehalten. |
| 56 | Corp | 1 Credit nehmen | Gut | Erreicht exakt die sechs Credits für Installieren, Operation und Abschluss-Advance. |
| 57 | Corp | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 10 – Shell-Traders-Pipeline

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 58 | Runner | 1 Credit nehmen | Gut | Bereitet die Economy-Engine vor. |
| 59 | Runner | Swiss Bank Account installieren | Gut | Kostenlose, sofort verfügbare Finanzierungshilfe. |
| 60 | Runner | Vewy Vewy Quiet mit vier Shell-Countern vorbereiten | Gut | Positiv bepreistes Breaker-Supportprogramm; kein Null-Counter-Staging. |
| 61 | Runner | ersten Shell-Counter entfernen | Gut | Beginnt die exakt gebundene Fertigstellungsroute. |
| 62 | Runner | Kostenfenster ohne weiteren Bank-Support fortsetzen | Pflicht | Payload-Fortsetzung derselben gebundenen Action. |
| 63 | Runner | zweiten Shell-Counter entfernen | Gut | Bleibt auf Quelle und Ziel D60 gebunden. |
| 64 | Runner | Kostenfenster fortsetzen | Pflicht | Payload-Fortsetzung derselben Action. |
| 65 | Runner | dritten Shell-Counter entfernen | Gut | Bringt das Supportprogramm auf einen verbleibenden Counter. |
| 66 | Runner | Kostenfenster fortsetzen | Pflicht | Payload-Fortsetzung derselben Action. |
| 67 | Runner | letzten Shell-Counter entfernen | Gut | Ziel und installierbare MU sind vor Abschluss korrekt geprüft. |
| 68 | Runner | Swiss Bank Account für 2 Credits trashen | Gut | Exakt gebundene Kostenunterstützung für den letzten Counter. |
| 69 | Runner | Kostenfenster schließen; Vewy installieren | Pflicht | Dieselbe Vewy-Instanz wird regelkonform kostenlos installiert. |
| 70 | Runner | 1 Credit nehmen | Gut | Letzten Click nach abgeschlossener Engine-Linie in Reserve umsetzen. |
| 71 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 11 – Corporate War in einem Zug

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 72 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 73 | Corp | Corporate War in Remote 1 installieren | Gut | Nutzt das geschützte Remote und den vorfinanzierten Plan. |
| 74 | Corp | Systematic Layoffs spielen | Gut | Erzeugt zwei Advancement-Counter und ermöglicht den Score in diesem Zug. |
| 75 | Corp | beide Counter auf Corporate War legen | Gut | Choice bleibt an die im Score-Plan gebundene Agenda gebunden. |
| 76 | Corp | Corporate War advancen | Gut | Der verbleibende reguläre Counter schließt die Anforderung. |
| 77 | Corp | Corporate War scoren | Gut | Konsequenter Abschluss auf fünf Agenda-Punkte. |
| 78 | Corp | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 12 – Runner-Druck und konsumierte Coverage

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 79 | Runner | 1 Credit nehmen | Gut | Baut Run- und Entwicklungsliquidität auf. |
| 80 | Runner | Karte ziehen | Vertretbar | Früher Deckdurchsatz bleibt bei vier Karten und zwei Restclicks zulässig. |
| 81 | Runner | Run auf R&D | Vertretbar | Der Run kann eine Agenda treffen, konsumiert aber Rent-I-Con ohne bereits installierte Recovery; diese Abwägung bleibt ein Restthema. |
| 82 | Runner | Data Wall mit Rent-I-Con brechen | Gut | Notwendige Fortsetzung des gewählten R&D-Runs; Vewy bezahlt kompatibel. |
| 83 | Runner | ICE passieren | Pflicht | Regelgebundene Run-Fortsetzung. |
| 84 | Runner | Run fortsetzen | Gut | Der Zugang ist erreicht. |
| 85 | Runner | R&D-Karte accessen | Pflicht | Regelgebundenes Zugriffsfenster. |
| 86 | Runner | Run auf HQ | Gut | Corp hat keine Credits; der Runner nutzt das sichtbare Rez-Risiko sinnvoll aus. |
| 87 | Corp | äußeres Wall of Static nicht rezzen | Gut | Mit null Credits ist Rezzen nicht finanzierbar. |
| 88 | Runner | Run fortsetzen | Gut | Die erste ICE-Schicht wurde nicht aktiviert. |
| 89 | Corp | Misleading Access Menus rezzen | Gut | Die günstige innere Steuer wird im relevanten Fenster aktiviert. |
| 90 | Runner | Steuer zahlen und fortsetzen | Gut | Zugang bleibt profitabel erreichbar. |
| 91 | Runner | Run fortsetzen | Gut | Bereits bezahlten HQ-Zugang nicht aufgeben. |
| 92 | Runner | HQ-Karte accessen | Pflicht | Regelgebundenes Zugriffsfenster. |
| 93 | Runner | Vapor Ops trashen | Gut | Entfernt das Advancement-Bank-Werkzeug für nur einen Credit. |
| 94 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 13 – Superserum wird vorbereitet

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 95 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 96 | Corp | Superserum in Remote 1 installieren | Gut | Der Runner hat Rent gerade konsumiert; die vorhandene Wall schützt den Score-Pfad. |
| 97 | Corp | Superserum advancen | Gut | Direkter Fortschritt auf der terminalen Agenda. |
| 98 | Corp | Superserum advancen | Gut | Zweiter Counter im selben Zug; der Plan bleibt auf Agenda und Server gebunden. |
| 99 | Corp | Zug beenden | Pflicht | Keine Clicks verbleiben. |

### Zug 14/15 – Runner sucht, Corp gewinnt

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 100 | Runner | 1 Credit nehmen | Gut | Eröffnet die finanzierbare Coverage-Suchroute. |
| 101 | Runner | Karte ziehen | Gut | Der Coverage-Plan sucht nach der konsumierten einzigen Breaker-Definition und findet Temple Microcode Outlet. |
| 102 | Runner | Temple Microcode Outlet spielen | Gut | Konkrete, plan-owned Breaker-Suche statt generischer Nebenentwicklung. |
| 103 | Runner | Rent-I-Con aus dem Stack wählen | Gut | Choice und Providerinstanz folgen exakt dem Coverage-Plan. |
| 104 | Runner | 1 Credit nehmen | Gut | Mit einem Restclick und zwei Credits ist Installieren plus Remote-Run nicht mehr erreichbar; Reserve ist die sinnvolle Restaktion. |
| 105 | Runner | Zug beenden | Pflicht | Keine Clicks verbleiben. |
| 106 | Corp | Pflichtkarte ziehen | Pflicht | Regelgebundenes Startfenster. |
| 107 | Corp | Superserum zum dritten Mal advancen | Gut | P1-Terminalplan auf derselben Agenda und demselben Remote. |
| 108 | Corp | Superserum scoren | Gut | Erzielt sieben Agenda-Punkte und beendet die Partie. |

## Was die Änderungen nachweisbar verbessert haben

1. **Zugendvergleich statt lokaler Draw-Verlockung:** Bodyweight wird nicht
   mehr als isoliert gute Karte gewählt, wenn der tatsächliche sichere
   Cleanup-Zustand eine bessere Coverage-Linie zerstören würde.
2. **Planabhängige Kartenhaltung:** Die einzige erreichbare
   Breaker-Providerinstanz wird als Planbedarf gehalten; der
   Discard-Resolver vervollständigt nur das Pflichtfenster.
3. **Generische Doctrine:** Das Deck wird als Engine aus einziger
   Breaker-Providerdefinition, konsumierbarer Coverage, Recovery,
   kompatibler wiederkehrender Economy, Staging und frühem Durchsatz
   beschrieben. Vewy ist Support, nicht selbst Breaker.
4. **Shell-Traders-Ownership:** Quelle, Ziel, Counterroute und installierte
   Instanz bleiben im zuständigen Plan gebunden. Null-Counter-Ziele werden
   abgelehnt, weil sie niemals ein letztes Counter-Entfernungsereignis
   erreichen könnten.
5. **Getrennte Utility-Familien:** Programmsuche erfüllt nicht mehr
   automatisch Recovery. Dadurch kann eine erste echte
   Recovery-Infrastruktur weiterhin als neue Coverage bewertet werden.
6. **Corp-Plankohärenz:** Defense, Vorfinanzierung, Fast-Advance und
   mehrzügige Agenda-Fortsetzungen bleiben jeweils konsistent.

## Verbleibende Probleme und Grenzen

### 1. Runner bleibt im Wettlauf zu langsam

Die Runner-KI verliert trotz besserer Engine-Entwicklung 0:7. Das ist kein
einzelner sicher falscher Schritt, sondern die Summe aus Economy-Aufbau,
Coverage-Konsum und anschließend erneuter Suche. Besonders D81 konsumiert
Rent-I-Con für einen R&D-Zugang, obwohl noch keine persistente
Recovery-Infrastruktur installiert ist. Eine generische nächste
Verbesserung wäre, den erwarteten Zugangswert gegen die Dauer bis zur
Wiederherstellung einer kritischen Single-Definition-Coverage zu bewerten.
Das gehört in `runner.rig_and_coverage` beziehungsweise den Run-Planbeitrag,
nicht in einen globalen Kartenmalus.

### 2. Corp-Defense-Portfolio kann Remote-Tiefe früher bewerten

D44 legt ein zweites ICE vor HQ, während das Scoring-Remote nur eine
ICE-Schicht besitzt. In diesem konkreten Lauf ist die Wahl vertretbar und die
Corp gewinnt; in längeren Spielen kann dieselbe Portfoliotendenz jedoch zu
zu viel Zentral- und zu wenig Remote-Tiefe führen. Die Ursache liegt in der
serverübergreifenden Defense-Allokation. Sie sollte nicht durch einen
karten- oder serverlokalen Bonus außerhalb von `corp.defend_servers`
überdeckt werden.

### 3. Selfplay-Metrik `scoreWindowMissed` erzeugt einen Fehlalarm

Die Metrik zählt D34 als verpasstes Scorefenster, obwohl die Corp erst einen
Credit nimmt und D35 im selben Zug scoret. Die Spiellogik ist korrekt; die
Metrik sollte künftig komplette gebundene Restzuglinien statt einzelner
Zwischenzustände bewerten.

### 4. Ein Seed beweist keine allgemeine Spielstärke

Die strukturellen Fehler sind durch gezielte Checkpoints und Gegenproben
abgesichert. Das einzelne Spiel dient als Integrationsaudit, nicht als
statistische Balance- oder Stärkeaussage. Breitere Verhaltensbewertung bleibt
Aufgabe der AI Behavior Baseline mit mehreren Seeds und Deckpaarungen.

## Verifikation

- fokussierte Null-Counter-/Utility-Familien-Tests: 25/25 grün
- vollständige AI-Shards:
  - Shard 1: 181 Dateien, 1763 Tests
  - Shard 2: 181 Dateien, 1515 Tests
  - Shard 3: 180 Dateien, 1154 Tests
  - gesamt: 542 Datei-Shards, 4432 Tests, vollständig grün
- AI-Typecheck mit 8-GB-Node-Heap: grün
- Abschluss-Selfplay: 109/109 Entscheidungen geschlossen geprüft
- Replay, StateHash, LegalActions, Fallbacks und Runtimefehler: grün
