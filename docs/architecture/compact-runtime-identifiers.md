# Kompakte Laufzeit-IDs

Karten, Kartenexemplare, Aktionsangebote und häufig wiederholte Spielreferenzen
verwenden kompakte IDs. Fachliche Daten wie Rez-Variante, Ziel,
Zahlungsquelle und Auswahlwert liegen in typisierten Feldern.
Engine, KI, Server, Webclient und SQLite verwenden denselben Vertrag.

Die numerische Kartenbasis wird mit dem gemeinsamen Spieltransport ausgeliefert.
Neue Aktionen und Undo sind an die MatchVersion gebunden. Ereignis- und
Snapshot-Referenzen sind numerisch. KI-Trace-Details verwenden Match und
Entscheidungsnummer.

Variable Rez-Varianten, Pflichttrash vor der Installation, zusätzliche
Aktionsangebote und die Playful-AI-Aufteilung lesen ihre fachlichen
Werte aus Engine-Daten. Die Engine verwendet im öffentlichen Verlauf
die Nummer des Übergangs plus eins und der Server für terminalen
Zeitablauf die nächste Nummer.

Runs, Spiel-Traces, Zahlungs-, Änderungs- und Ersatzfenster sowie
laufende Ziehvorgänge erhalten beim Öffnen die StateVersion des
Übergangs. Die Herkunft eines Traces wird gesondert gebunden.
Öffentliche Effekte tragen ihre Position im Ereignis, beginnend bei null.
Kartenexemplare verwenden einen kurzen Base36-Schlüssel. SQLite-Schema 10 speichert
Kartenlisten als Positionen in der Instanztabelle. Verdeckte Slots und
adressierbare verdeckte Ressourcen haben jeweils einen eigenen kurzen
Schlüsseltyp. Remotes werden als `r1`, `r2` und entsprechend ihrer
fortlaufenden Nummer adressiert.

Beim Deckaufbau erzeugt die Engine den Instanzschlüssel aus Seite,
numerischer Kartendefinition und Kopienummer. Aktionen binden Quelle und
Ziele über diese Referenzen. Der WebSocket überträgt die side-sichere
Projektion.
[Instanzvergabe](../../packages/engine/src/game/state/card-instance-id.ts)

Das Fähigkeitsregister vergibt stabile globale Nummern. Der Spieltransport
verwendet laufende Nummern für Aktionen und Optionen im aktuellen Angebot
sowie die StateVersion für geöffnete Choices. Die Engine bindet diese Nummern
an das Angebot einer Seite. Der Server prüft zusätzlich die MatchVersion.

Die Engine vergibt Unterroutinenreferenzen nach
Aufbau der vollständigen ICE-Sequenz als nullbasierte Base36-Position.
Gedruckte Herkunft, hinzugefügte Beiträge, Mark-Wiederholungen und
Run-Kopien haben eigene typisierte Herkunftstupel. Kopien binden diese
Herkunft auch dann weiter, wenn sich die endgültige Position verschiebt.
Aktionsangebot, Quote und Engine-Auflösung verwenden dieselbe Folge.
[Encounter-Folge](../../packages/engine/src/game/run/effective-ice-run-subroutines.ts)

Ein Zufallszweck ist ein Tupel aus festem numerischem Code und
typisierten Argumenten. Spielzufall und KI-Auswahl besitzen getrennte,
explizit initialisierte Zähler. Die kanonische Seed-Eingabe enthält den
Seed, das Tupel und den jeweiligen Zähler. Jede Aufzeichnung hält eine
eigene Kopie des Tupels. Öffentliche Ereignisse geben nur den Zweckcode
weiter. SQLite-Schema 10 speichert die Tupel unmittelbar in den
Zufallszeilen.
[Zweckvertrag](../../packages/shared/src/random-purpose.ts) · [Zufallsvergabe](../../packages/engine/src/game/state/draw-random.ts)

Die neue Serialisierung definiert die Zufallsfolge für aktuelle Spiele.
Die aktiv genutzten Replay-Szenarien mit fest vorausgesetzten
Kartenanordnungen deklarieren ihre Startanordnung ausdrücklich und
prüfen die anschließenden Übergänge mit dem aktuellen Engine-Vertrag.

## Umfang und Vergabe der Schlüssel

| Bezeichner                                  | Zielformat und Gültigkeitsbereich                                                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CardDefinitionId`                          | Feste positive Ganzzahl pro Regelkarte. In der CardSpec verankert, über alle Sets einschließlich System-, Katalog- und Testkarten eindeutig. Releasefilter behalten dieselben Nummern.               |
| `CardInstanceId`                            | Kompakter Base36-Schlüssel pro Kartenexemplar einer Partie. In SQLite referenzieren Kartenlisten die Zeilenposition.                                                                                |
| Verdeckter Kartenslot                       | Kurzer Base36-Schlüssel mit eigenem Präfix in der jeweiligen Projektion. Bereich und Position binden die Referenz.                                                                                   |
| Adressierbare Fähigkeit                     | Feste positive Nummer im Fähigkeitsregister. Eine Instanzbindung verwendet Quelleninstanz und Fähigkeitsnummer.                                                                                    |
| `ActionId`                                  | Laufende positive Nummer im deterministisch erzeugten LegalAction-Satz einer Seite und StateVersion. Die Einreichung beim Server bindet auch Match und MatchVersion.                                 |
| `ChoiceId`, `ChoiceOptionId`                | Nummer der geöffneten Choice innerhalb der Partie und Nummer einer Option innerhalb dieser Choice. Reihenfolge und fachlicher Wert der Option sind eigene Eigenschaften.                             |
| Server, Run, Trace und Fenster              | Remotes heißen `rN`. Run, Spiel-Trace sowie Zahlungs-, Änderungs- und Ersatzfenster verwenden die Eröffnungs-StateVersion. „Neuer Remote“ ist ein eigenes Installationsziel.                                    |
| Ereignis, Snapshot, KI-Trace                | Nummern in der jeweiligen Match-Tabelle. Historienreferenzen enthalten den Matchkontext. Eine Diagnosekennung für einen fehlgeschlagenen KI-Versuch bleibt eine Fehlerreferenz.                      |
| Aufgelöster Effekt, Subroutine              | Effektposition innerhalb des Ereignisses. Unterroutinen tragen die Base36-Position in der endgültigen ICE-Sequenz. Typisierte Herkunftstupel binden gedruckte, hinzugefügte und kopierte Beiträge. |
| Zufallszweck und wiederholte Speicherfelder | Festes Tupel aus numerischem Zweckcode und typisierten Argumenten. SQLite speichert Karteninstanzlisten und Zufallsaufzeichnungen als schemafeste Zeilen.                                             |

Die internen KI-Plan- und Kampagnenschlüssel enthalten heute Modul- und
Deduplizierungsmerkmale und binden wiederkehrende Vorschläge an residente
Instanzen. Die darin verwendeten Karten-, Aktions-
und Serverbezüge folgen dem kompakten Schema. Eine Umstellung der
Plan- und Kampagnenidentität ist ein Folgeschritt. Sie setzt voraus, dass
Portfolio, Parent-/Need-Bindung und Kampagnenfortschritt dieselbe fachliche
Instanz über Züge und Reopen hinweg wiederfinden.
[Vergabe der Planinstanz-ID](../../packages/ai/src/plans/plan-instance.ts) · [Kampagnenfortsetzung](../../packages/ai/src/plans/corp-opponent-campaign-continuity.ts)

`printingId` adressiert Drucke, Bilddateien, Bildpakete und Einträge im
Bildimport. Die numerische Regelkarte verweist über ihre CardSpec auf
die zugehörigen Drucke. Set-Codes, Kartentitel, Regeltexte, Lokalisierungsschlüssel,
Szenarioreferenzen und Assetpfade tragen ihre jeweilige fachliche Bedeutung.
Match-, Account-, Deck- und Session-Adressen werden an ihrer jeweiligen
API- oder Speichergrenze geführt. Zugangstokens und Idempotenzschlüssel erfüllen
eigene Verträge für Authentifizierung oder Wiederholung. StateHash und
Fingerprints dienen als Prüfsummen. Innerhalb eines Datensatzes genügt die
bereits vorhandene übergeordnete Referenz, wenn sie denselben Bezug eindeutig
herstellt. [CardSpec und Drucke](central-card-specification-and-registry-target-state-2026-08-09.md#63-regelidentität-druck-und-set) · [Kartenbildimport](card-images/personal-card-image-import.md) · [Aktionsquittungen](../../apps/server/src/action-idempotency.test.ts)

## Verbindliche Verträge

- **Ein Format pro ID-Domäne.** Shared definiert getrennte Typen für
  die beteiligten Domänen. Numerische IDs sind sichere positive Ganzzahlen.
  StateVersion, Positionen und vorhandene Zähler dürfen null sein.
  SQLite verwendet für numerische ID-Spalten `INTEGER`. Textpfade und
  DOM-Werte werden einmal an ihrer konkreten Grenze
  in den typisierten Wert übersetzt. Unbekannte, doppelte oder falsch
  gebundene IDs liefern eine strukturierte Ablehnung.
- **Stabilität über die fachliche Lebensdauer.** Die Definition trägt
  ihre Nummer in der CardSpec und die Fähigkeit erhält sie im Register.
  Reihenfolge der Imports,
  neue Karten und der Releasefilter ändern vorhandene Zuordnungen nicht.
  Vergabe, Sortierung und Bindung im Match sind deterministisch. Bei
  `Object.keys`, lexikografischen Sortierungen und früheren String-Sentinels
  wird der fachliche Zweck geprüft und direkt als Zahl, explizite
  Reihenfolge oder fehlender Wert modelliert.
- **Engine als einzige Vergabestelle für Spielangebote.** UI, Server und KI
  verwenden die angebotenen IDs. `applyAction` ermittelt die aktuelle
  LegalAction und prüft Seite, Version, Timing, Kosten, Ziele und Choices.
  Für Regeln und mehrstufige Fortsetzungen ist die exakt gebundene
  semantische Variante maßgeblich. [Engine-Grundsätze](engine/README.md#verbindliche-grundsätze) · [Aktionsanwendung](../../packages/engine/src/game/apply-action.ts)
- **Undo und Wiederholung.** Undo stellt eine ältere StateVersion wieder her,
  während die MatchVersion weiterläuft. Jede neue Aktionsanfrage trägt beide
  Versionen aus demselben Update. Der Server prüft sie unter dem bestehenden
  Match-Lock. Die bereits authentifizierte Wiederholung eines identischen
  Requests darf ihre gespeicherte Quittung erhalten. Ein Request aus dem
  verworfenen Verlauf scheitert an der MatchVersion, auch wenn die gleiche
  numerische ActionId wieder angeboten wird. [Undo und Aktionsannahme](../../apps/server/src/multiplayer.ts)
- **Sichtbarkeit folgt der Projektion.** Bekannte Karten, öffentlich
  adressierbare Slots und private Instanzen haben typisierte Referenzen.
  Die Projektion entscheidet, welcher Bezug auf welcher Seite erscheint.
  Eine Slot-Auswahl wird in der Engine gegen die aktuelle Position und
  das Angebot aufgelöst. Die privilegierte lokale KI-Diagnose erhält ihre
  bestehende eigene Projektion. [Kartenansicht](../../packages/engine/src/game/view/card-view.ts) · [Öffentliche Ereignisse](engine/public-event-payload-architecture.md)
- **Ein aktives Schema.** CardSpec-Projektion, Deckdaten, Engine-Kontext,
  Request-/Response-Vertrag und Matchdatenbank werden als gemeinsamer
  Build ausgeliefert. Generatoren und Laufzeitvalidatoren akzeptieren
  das Zielformat. Einmalige Umschreibungen betreffen versionierte Quellen
  und aktuelle Fixtures. Spielstände, Replay- und Trace-Nachweise entstehen
  aus frischen Partien im neuen Format.

## Speicherung und lokale Matchdaten

SQLite-Schema 10 speichert den aktuellen Engine-Zustand in `game_states`.
`matches.record_json` enthält die Match-Metadaten. Vor-Aktionssnapshots binden
Undo und Replay an ihren jeweiligen Übergang. Full Save, Delta-Save,
Wiederöffnung und Maintenance verwenden denselben Spielstands-Codec.

Karteninstanzen werden als schemafeste Zeilen gespeichert. Kartenlisten
referenzieren die Position der jeweiligen Instanzzeile. Zufallszeilen haben
die Form `[counter, purpose, value]` mit dem typisierten Zweck-Tupel.
Die kanonische StateHash-Berechnung verwendet den fachlichen Spielzustand.
Verläufe besitzen vollständig belegte, lückenlos nummerierte Aufzeichnungen.
Fehlerhafte Zwecke, Zähler, Zeilen und Versionsbindungen scheitern vor
Zufallsverbrauch oder Speicherung.
[SQLite-Codec](../../apps/server/src/storage-sqlite.ts) · [Aktionspersistenz](maintenance/action-persistence-contract.md)

Der lokale Betrieb beginnt mit einer frischen Matchdatenbank im aktuellen
Schema. Match- und Accountpfad werden ausdrücklich konfiguriert. Der
Accountpfad kann dieselbe SQLite-Datei verwenden und wird beim Einrichten
mitgeprüft. Der Start mit einem unpassenden Matchschema liefert vor dem ersten
Schreibzugriff eine Storage-Diagnose.
[Runtime-Pfade](../../apps/server/src/runtime-paths.ts) · [Lokale Datenpfade](../runbooks/netgrid-local-transfer.md)
