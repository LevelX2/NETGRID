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
Kartenexemplare verwenden einen kurzen Base36-Schlüssel. SQLite-Schema 13 speichert
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
`applyMatchActionOffer` prüft Match-ID und StateVersion, erzeugt die LegalActions
für die eingereichte Seite einmal und wendet die ausgewählte Aktion unmittelbar
an. Choice-, Ziel- und Kostenprüfung sowie Replay und StateHash verwenden
denselben Engine-Pfad wie interne Aktionen.
[Engine-Aktionspfad](../../packages/engine/src/game/apply-action.ts)

Die Engine vergibt Unterroutinenreferenzen nach
Aufbau der vollständigen ICE-Sequenz als nullbasierte Base36-Position.
Gedruckte Herkunft, hinzugefügte Beiträge, Mark-Wiederholungen und
Run-Kopien haben eigene typisierte Herkunftstupel. Kopien binden diese
Herkunft auch dann weiter, wenn sich die endgültige Position verschiebt.
Aktionsangebot, Quote und Engine-Auflösung verwenden dieselbe Folge. Die
IDs und Indexmengen für Brechen, Fortsetzen und Auslösen werden als
typisierte Listen weitergegeben. Die KI prüft damit auch die genaue
Bindung des Aktionsangebots an den Planungszustand.
[Encounter-Folge](../../packages/engine/src/game/run/effective-ice-run-subroutines.ts)

Ein Zufallszweck ist ein Tupel aus festem numerischem Code und
typisierten Argumenten. Spielzufall und KI-Auswahl besitzen getrennte,
explizit initialisierte Zähler. Die kanonische Seed-Eingabe enthält den
Seed, das Tupel und den jeweiligen Zähler. Jede Aufzeichnung hält eine
eigene Kopie des Tupels. Öffentliche Ereignisse geben nur den Zweckcode
weiter. SQLite-Schema 13 speichert die Tupel unmittelbar in den
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
| Verdeckter Kartenslot                       | Position in der sichtbaren Zone mit eigenem Präfix. Die Engine bindet die Position an das aktuelle Angebot.                                           |
| Adressierbare Fähigkeit                     | Feste positive Nummer im Fähigkeitsregister. Eine Instanzbindung verwendet Quelleninstanz und Fähigkeitsnummer.                                                                                    |
| `MatchActionId`                             | Laufende positive Nummer im projizierten LegalAction-Satz einer Seite und StateVersion. Die Einreichung beim Server bindet auch Match und MatchVersion.                                             |
| `ChoiceId`, `ChoiceOptionId`                | Nummer der geöffneten Choice innerhalb der Partie und Nummer einer Option innerhalb dieser Choice. Reihenfolge und fachlicher Wert der Option sind eigene Eigenschaften.                             |
| Server, Run, Trace und Fenster              | Remotes heißen `rN`. Run, Spiel-Trace sowie Zahlungs-, Änderungs- und Ersatzfenster verwenden die Eröffnungs-StateVersion. „Neuer Remote“ ist ein eigenes Installationsziel.                                    |
| Ereignis, Snapshot, KI-Trace                | Nummern in der jeweiligen Match-Tabelle. Historienreferenzen enthalten den Matchkontext. Eine Diagnosekennung für einen fehlgeschlagenen KI-Versuch bleibt eine Fehlerreferenz.                      |
| Aufgelöster Effekt, Subroutine              | Effektposition innerhalb des Ereignisses. Unterroutinen tragen die Base36-Position in der endgültigen ICE-Sequenz. Typisierte Herkunftstupel binden gedruckte, hinzugefügte und kopierte Beiträge. |
| Zufallszweck und wiederholte Speicherfelder | Festes Tupel aus numerischem Zweckcode und typisierten Argumenten. SQLite speichert Karteninstanzlisten und Zufallsaufzeichnungen als schemafeste Zeilen.                                             |

`LegalAction.actionId` beginnt mit einem Zeichen für die Seite und einem
fest vergebenen Zeichen für den Aktionstyp. Quelle und Variantenmerkmale
ergänzen den Schlüssel, wenn das Angebot sie zur Unterscheidung braucht.
Der Spieltransport nummeriert das Angebot je Seite. Die Engine löst die
gewählte Nummer vor der Aktionsanwendung auf.
[Interner Schlüssel](../../packages/engine/src/game/turn/action-builders.ts) · [Spielangebot](../../packages/engine/src/game/player-offer.ts)

Verdeckte Karten erhalten Referenzen aus der aktuellen Zonenposition. Bei
einem Server bestimmen Server, ICE oder Root und Position den Slot. Bei
verdeckten Runner-Ressourcen zählt die Position innerhalb der Ressourcen.
Die Engine löst eine Auswahl über die aktuelle Version und das konkrete
Angebot auf und ermittelt erst dabei das private Kartenexemplar.
[Kartenposition](../../packages/engine/src/game/view/hidden-card-slot.ts) · [Kartenprojektion](../../packages/engine/src/game/view/card-view.ts)

KI-Planinstanzen und Kampagnen erhalten getrennt markierte Base36-IDs aus
einem deterministischen 128-Bit-Hash. Planmodule, der Deduplizierungsschlüssel
und das Kampagnenziel sind eigene fachliche Felder. Das Portfolio prüft die
Bindung zwischen diesen Feldern und der ID. Bei Gleichstand entscheidet die
fachliche Reihenfolge von Modul und Deduplizierungsschlüssel. Bei gleich
bewerteten vollständigen Turnlinien entscheidet der deterministische
Linienfingerabdruck.
[Plan- und Kampagnenvergabe](../../packages/ai/src/plans/compact-plan-identity.ts) · [Residentes Portfolio](../../packages/ai/src/plans/resident-plan-portfolio.ts)

`printingId` adressiert Drucke, Bilddateien, Bildpakete und Einträge im
Bildimport. Die numerische Regelkarte verweist über ihre CardSpec auf
die zugehörigen Drucke. Set-Codes, Kartentitel, Regeltexte, Lokalisierungsschlüssel,
Szenarioreferenzen und Assetpfade tragen ihre jeweilige fachliche Bedeutung.
Match-, Account-, Deck- und Session-Adressen werden an ihrer jeweiligen
API- oder Speichergrenze geführt. Zugangstokens und Idempotenzschlüssel erfüllen
eigene Verträge für Authentifizierung oder Wiederholung. StateHash und
Fingerprints dienen als Prüfsummen. Innerhalb eines Datensatzes genügt die
bereits vorhandene übergeordnete Referenz, wenn sie denselben Bezug eindeutig
herstellt. [CardSpec und Drucke](central-card-specification-and-registry-target-state-2026-08-09.md#regelidentität-druck-und-set) · [Kartenbildimport](card-images/personal-card-image-import.md) · [Aktionsquittungen](../../apps/server/src/action-idempotency.test.ts)

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

SQLite-Schema 13 speichert den aktuellen Engine-Zustand in `game_states`.
`matches.record_json` enthält die Match-Metadaten. Vor-Aktionssnapshots binden
Undo und Replay an ihren jeweiligen Übergang. Full Save, Delta-Save,
Wiederöffnung und Maintenance verwenden denselben Spielstands-Codec.

SQLite speichert pro öffentlichem Ereignis den Chronikkontext und die
Summen vor dem Ereignis. Aktions- und Verbindungsloads lesen bis zu 80
öffentliche Ereignisse. Spielupdates und Reconnect geben diesen Ausschnitt
in der Spielersicht aus. Journalgrößen und die Engine-Journalgeneration
binden Delta-Transaktionen an die geladene Historie. Bei laufenden KI-Partien
liest der SQLite-Adapter bei passender Generation nur neue Engine-Zeilen. Undo
schneidet die gespeicherten Ereignisse samt Kontext auf die Zielversion
zurück. Replay, Wartung und KI-Pfade mit dauerhaftem Spielwissen haben
weiterhin Zugriff auf die vollständige benötigte Historie. Die
KI-Verbraucher für Wissen, Risiko und Zentralserver-Verteidigung teilen
eine zusammengeführte, deduplizierte Sicht.
[Aktionsload](../../apps/server/src/storage-sqlite.ts) · [Spielupdate](../../apps/server/src/multiplayer-payload.ts)

Karteninstanzen werden als schemafeste Zeilen gespeichert. Kartenlisten
referenzieren die Position der jeweiligen Instanzzeile. Zufallszeilen haben
die Form `[counter, purpose, value]` mit dem typisierten Zweck-Tupel.
Die kanonische StateHash-Berechnung verwendet den fachlichen Spielzustand.
Verläufe besitzen vollständig belegte, lückenlos nummerierte Aufzeichnungen.
Innerhalb einer Aktionsauflösung prüft die Engine bereits vorhandene
Zufallszeilen beim ersten Verbrauch. Jede neue Ziehung hängt eine gültige
Zeile an. Die Zustandsprüfung kontrolliert am Ende den vollständigen
Verlauf. Fehlerhafte Zwecke, Zähler und Zeilen scheitern an der jeweiligen
Verbrauchs- oder Speichergrenze.
[SQLite-Codec](../../apps/server/src/storage-sqlite.ts) · [Aktionspersistenz](maintenance/action-persistence-contract.md)

Der lokale Betrieb beginnt mit einer frischen Matchdatenbank im aktuellen
Schema. Match- und Accountpfad werden ausdrücklich konfiguriert. Der
Accountpfad kann dieselbe SQLite-Datei verwenden und wird beim Einrichten
mitgeprüft. Der Start mit einem unpassenden Matchschema liefert vor dem ersten
Schreibzugriff eine Storage-Diagnose.
[Runtime-Pfade](../../apps/server/src/runtime-paths.ts) · [Lokale Datenpfade](../runbooks/netgrid-local-transfer.md)

## Standarddecks und lokaler Start

Der Browser prüft beim Laden der Standarddecks jede Karten-ID als gültige
numerische Regelkarten-Referenz. Ungültige Katalogdaten zeigen den
Diagnosecode und die betroffene Stelle im Katalog. Die Deckauswahl braucht
zusätzlich die Karten-Sets aus `/api/cards/catalog`, um die Decks für den
gewählten Kartenpool zu prüfen. Schlägt diese Abfrage fehl, kann trotz
erfolgreichem Abruf von `/api/decks/standards` nur die Zufallsoption angezeigt
werden. Nach Wiederherstellung des Kartenkatalogs stößt ein Neuladen der Seite
beide Abfragen erneut an. Der lokale Starter
vergleicht die Buildkennung von Server und Webclient mit dem Checkout,
aus dem das Startskript läuft. Damit erkennt er auch den Fall, dass beide
laufenden Prozesse denselben älteren Build melden.
[Lokaler Starter](../../scripts/start-netgrid.ps1)
