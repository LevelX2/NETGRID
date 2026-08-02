# Corp-Draw-Transaktionen – Final Review

Datum: 2026-08-02
Status: **technisch freigegeben; manueller Corporate-Shuffle-Pfad blockiert**
Primärer Agent: `release-implementation-agent`
Prozess:
`docs/architecture/engine/corp-draw-transactions-process-2026-08-02.md`

## Ergebnis

Der zuvor kartenspezifische Strategic-Planning-Group-Pfad ist durch einen
allgemeinen Corp-Draw-Transaktionsvertrag ersetzt. Eine Anweisung `Draw N`
zieht N Karten als eine fachliche Einheit. Eine aktive Strategic Planning
Group ergänzt dieselbe Einheit um genau eine Karte und öffnet genau eine
private Auswahl über alle N+1 Karten. Eine Karte wird unter R&D gelegt, die
übrigen N gehen gemeinsam nach HQ.

Gezogene Karten liegen bis zum Abschluss Corp-privat in `setAside`. Die
Runner-View, öffentliche Events, Chronicle und Reconnect-Payloads sehen nur
Zählwerte und öffentliche Quellen. Replay, StateHash und Zufallszähler
behandeln die gesamte Folge deterministisch.

## Architekturentscheidungen

- `CorpDrawTransaction` ist die einzige offene Draw-Einheit und Bestandteil
  des Engine-Zustands.
- `CorpDrawContinuation` hält CardImplementation-On-play-/Activated-Effekte,
  Corporate Shuffle, EffectCommands und den Pflichtzug serialisierbar an.
- Ein Effektinterpreter pausiert unmittelbar nach dem Draw, wenn SPG eine
  Choice öffnet, und setzt erst nach deren Auflösung beim nächsten Effekt fort.
- Pflichtkarte, verpflichtende Agendaboni, gewählte optionale Agendaboni und
  Skivviss-Counter werden vor dem Draw zu einer Basisgesamtzahl aggregiert.
- Leeres R&D während Basis- oder SPG-Zusatzdraw beendet das Spiel als
  Corp-Deckout ohne verwaiste Transaktion oder Choice.
- Basis-, Zusatz-, Gesamt-, Netto- und Rücklage-Counts sind explizite
  side-sichere PublicPayload-Felder; Kartenidentitäten sind nicht öffentlich.

## Kartenmatrix

| Karte oder Quelle                   |                       Basis |          SPG-Gesamt | Ergebnis                                         |
| ----------------------------------- | --------------------------: | ------------------: | ------------------------------------------------ |
| Annual Reviews                      |                           3 |                   4 | drei Karten netto nach HQ                        |
| Employee Empowerment, Agenda-Aktion |                           2 |                   3 | zwei Karten netto nach HQ                        |
| Employee Empowerment, Startbonus    |            +1 im Pflichtzug | Pflichtzugbasis + 1 | vor Draw gewählt oder übersprungen               |
| ESA Contract                        |                           2 |                   3 | zwei Karten netto nach HQ                        |
| Euromarket Consortium               |                           2 |                   3 | zwei Karten netto nach HQ                        |
| AI Chief Financial Officer          |                           5 |                   6 | nach HQ-/Archives-Shuffle fünf nach HQ           |
| Rescheduler                         |            frühere HQ-Größe |           Basis + 1 | gleiche HQ-Größe nach Abschluss                  |
| Night Shift                         |                           1 |                   2 | ein Netto-Draw plus geordneter Credit-Effekt     |
| Panic Button                        |                           1 |                   2 | Runfenster bleibt erhalten                       |
| AI Board Member                     |                           1 |                   2 | eingeschränkte Basic-Draw-Aktion bleibt gebunden |
| Corporate Shuffle                   |                           5 |                   6 | danach genau eine HQ-zu-R&D-Choice               |
| Unlisted Research Lab               |            +1 im Pflichtzug | Pflichtzugbasis + 1 | aggregierter Pflichtzug                          |
| Skivviss                            | +1 je Counter im Pflichtzug | Pflichtzugbasis + 1 | aggregierter Pflichtzug                          |

Einfache Ein-Karten-Draws bleiben Gegenproben derselben allgemeinen
Transaktion; getrennte gedruckte Draw-Anweisungen werden nicht künstlich
zusammengezogen.

## Chronicle und Bedienung

Die bestehende Pflichtzugmeldung bleibt als eigenes Turn-Ereignis erhalten.
Nach der SPG-Auswahl folgt eine öffentliche Kartenmeldung mit dynamischen
Counts, zum Beispiel bei Corporate Shuffle: fünf Basiskarten, eine zusätzliche
SPG-Karte, sechs gezogene Karten, fünf Karten nach HQ und eine Karte unter
R&D. Die spätere Corporate-Shuffle-Meldung beschreibt separat die verdeckte
HQ-zu-R&D-Mischung.

Corp-Human und Corp-Reconnect sehen alle Choice-Karten lesbar. Runner-Human,
Runner-KI und Runner-Reconnect sehen weder die Choice noch Definitionen,
Titel oder ausgewählte Instanz-IDs.

## KI-Ownership

Strategic Planning Group bleibt eine Payload-Auflösung hinter einer bereits
gewählten `resolve_choice`-LegalAction. Der fachliche Owner ist
`corp.hand_and_agenda_management` mit `draw_filter_window`. Die KI bewertet
die in der Corp-privaten Choice sichtbaren Set-aside-Karten, ohne sie als
öffentliche oder gegnerische Information zu behandeln.

Die nachgelagerte Corporate-Shuffle-HQ-Auswahl besitzt den eigenen gebundenen
Step `hq_shuffle_window` desselben Owners. Beide Resolver lesen ausschließlich
die genaue Planbindung. Eine abweichende Action-, Choice- oder
StateVersion-Bindung endet fail-closed mit `window_origin_missing`; es entsteht
keine zweite Plan- oder Action-Autorität.

## Verifikation

Paketnahe Evidence:

- Engine-Kartenmatrix: 5 Dateien, 120 Tests;
- Web Chronicle und Human-Choice: 2 Dateien, 325 Tests;
- Server-/Reconnect-Projektion: 1 Datei, 3 Tests;
- KI-Ownership und Real-Engine-Sequenz: 3 Dateien, 248 Tests;
- Shared-, Engine-, Web-, Server- und AI-Typecheck: grün;
- AI-Source-Structure und Package-Boundaries: grün;
- `git diff --check`: grün.

Vollständige Abschlussgates auf dem Arbeitsbranch:

- Engine: 212 Testdateien, 1.858 Tests, grün;
- Web: 76 Testdateien, 762 Tests, grün;
- KI-Shards: 552 Dateiläufe, 4.538 Tests, grün;
- Workspace-Typecheck: alle sieben Projekte grün;
- Shared-Verträge und Test-Discovery: grün;
- Engine-Source-Structure und CardImplementation-Zielarchitektur: grün;
- AI-Metadaten, AI-Source-Structure und generische Kartenwächter: grün;
- Package-Boundaries für 2.001 Dateien: grün;
- Formatprüfung für 43 geänderte Dateien und `git diff --check`: grün.

Der fokussierte Server-/Reconnect-Lauf des geänderten Pfads ist mit drei
Tests grün. Ein ergänzend ausgeführter vollständiger Serverlauf erreichte
216 von 217 Tests. Der einzelne Fehler
`restores the resident plan portfolio before preparing an AI decision after
a server restart` endet mit `ai_debug_contract_missing` und ist auf dem
unveränderten aktuellen `main` isoliert identisch reproduzierbar. Er betrifft
weder Corp-Draw-Transaktionen noch SPG-Choices, PlayerViews oder Reconnect und
ist daher ein dokumentierter Bestandsfehler, aber kein Blocker dieses Reviews.

## Manueller Firefox-Playtest

Der Human-vs-AI-Playtest vom 02.08.2026 auf dem lokalen `main`-Stand
`2b14ee427` und Build `6498-dev` bestätigt den normalen und den
Pflichtzugpfad:

- Eine gerezzte Strategic Planning Group erweitert einen normalen
  Ein-Karten-Draw auf genau zwei lesbare Corp-Choice-Karten. Nach der Auswahl
  bleibt genau eine Karte netto in HQ und eine Karte liegt unten in R&D.
- Die Spielchronik zeigt die normale Draw-Meldung und danach die eigene
  SPG-Meldung mit `1 Basiskarte`, `+1 durch Strategic Planning Group`,
  `2 gezogen`, `1 nach HQ` und `1 unter R&D`.
- Der Pflichtzug erzeugt dieselbe private Zwei-Karten-Auswahl. Nach der
  Auflösung stehen die Pflichtzugmeldung und die separate SPG-Meldung in der
  richtigen Reihenfolge in der Chronik.
- Ein vollständiges Neuladen während der offenen Pflichtzug-SPG-Auswahl
  stellt dieselbe Choice mit denselben beiden Karten wieder her; die Auswahl
  kann anschließend korrekt abgeschlossen werden.

Der geplante Corporate-Shuffle-Gegenlauf konnte nicht bis zum
Sechs-Karten-Dialog gelangen. Die aktuelle PlayerView bietet Corporate
Shuffle bei zwei und bei drei verfügbaren Aktionen als exakte
`play_operation`-LegalAction mit zwei Aktionskosten an. Das UI zeigt dieselbe
Aktion als `Spielen · Kosten: 2 Aktionen`, lehnt sie beim Einreichen aber mit
`Diese Aktion ist nicht legal` ab. Aktionen, StateVersion und Karte bleiben
unverändert. Der Befund ist als eigenes Activity-Paket erfasst und liegt vor
der SPG-Draw-Auflösung; die automatisierten Engine-Tests des sechs Karten
umfassenden Draws bleiben davon getrennte Evidence.

## Risiken und Restpunkte

- Laufende Version-0-Replays aus dem früheren Zwischenzustand werden nicht
  migriert; dies entspricht dem Projektvertrag.
- Andere Replacement-Karten sind nicht Teil dieses Changes. Neue
  Corp-Draw-Replacements müssen denselben Transaktions- und
  Hidden-Info-Vertrag verwenden.
- Kombinierte Pflichtzugquellen wie Unlisted Research Lab und Skivviss sind
  weiterhin nur automatisiert, noch nicht in einem menschlichen Playtest
  bestätigt.
- Der manuelle Corporate-Shuffle-SPG-Pfad bleibt bis zur Behebung der
  LegalAction-Diskrepanz blockiert; anschließend sind Sechs-Karten-Auswahl,
  nachgelagerte HQ-zu-R&D-Choice und beide Chronikmeldungen nachzutesten.
