# Umstellungsplan für kompakte technische Schlüssel

**Plan für V1.0.** Die Umsetzung erfolgt in einem eigenen Worktree auf Basis
des lokalen `main` und wird als ein zusammenhängender Stand integriert.

Karten, Kartenexemplare, Aktionsangebote und häufig wiederholte Spielreferenzen
erhalten kurze numerische IDs. Fachliche Daten wie Rez-Variante, Ziel,
Zahlungsquelle und Auswahlwert bekommen eigene typisierte Felder. Vollständige
Spielupdates und der aktuelle Spielstand werden jeweils einmal übertragen oder
gespeichert. Der Schnitt beginnt mit frischen Matchdaten und Eingaben im neuen
Schema. Die Abnahme prüft das Verhalten mit neu erzeugten Partien.

## Stand im Worktree

Der Worktree-Branch `codex/compact-runtime-card-ids` bündelt die
numerische Kartenbasis und den gemeinsamen Spieltransport. Neue
Aktionen und Undo sind an die MatchVersion gebunden. SQLite speichert
den aktuellen Spielstand einmal, mit festen Zeilen für Karteninstanzen
und Zufallsaufzeichnungen. Ereignis- und Snapshot-Referenzen sind
numerisch. KI-Trace-Details verwenden Match und Entscheidungsnummer.
Die Betriebsdaten für dieses Schema beginnen mit einer frischen
Matchdatenbank.

Variable Rez-Varianten, Pflichttrash vor der Installation, zusätzliche
Aktionsangebote und die Playful-AI-Aufteilung lesen ihre fachlichen
Werte aus Engine-Daten. Die Engine verwendet im öffentlichen Verlauf
die Nummer des Übergangs plus eins und der Server für terminalen
Zeitablauf die nächste Nummer.

Run-IDs werden aus der StateVersion des eröffnenden Übergangs vergeben.
Engine, Spieleransicht, KI und SQLite führen diese Referenz als Zahl.
Der gemeinsame Worktree verwendet SQLite-Schema 7. Kartenlisten
referenzieren die Position der zugehörigen Instanzzeile.

Die Abnahme umfasst noch die KI-Regressionen und ihre aktiven
Aufzeichnungen. Die weiteren Schritte betreffen insbesondere
Kartenexemplare in der Engine, Slotbezüge, Fähigkeiten, Aktionen,
Choices, Server, Spiel-Traces, Fenster, Effekte und Subroutinen.
Für Zufallsaufzeichnungen stehen die numerisch typisierten
Zufallszwecke aus.

## Umfang und Vergabe der Schlüssel

| Bezeichner                                  | Zielformat und Gültigkeitsbereich                                                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CardDefinitionId`                          | Feste positive Ganzzahl pro Regelkarte. In der CardSpec verankert, über alle Sets einschließlich System-, Katalog- und Testkarten eindeutig. Releasefilter behalten dieselben Nummern.               |
| `CardInstanceId`                            | Dichte positive Ganzzahl pro Partie. Gilt für genau ein Exemplar einschließlich Identitäten, gehosteter und aus dem Spiel entfernter Karten.                                                         |
| Verdeckter Kartenslot                       | Kurze Zahl in der jeweiligen side-sicheren Projektion. Bereich und Position binden die Referenz. Bekannte Karten führen eine `CardInstanceId`, verdeckte Slots eine eigene Slotreferenz.             |
| Adressierbare Fähigkeit                     | Feste positive Nummer innerhalb einer CardSpec. Ein Register-Lookup verwendet Kartendefinition und Fähigkeitsnummer. Eine Instanzbindung verwendet Quelleninstanz und Fähigkeitsnummer.              |
| `ActionId`                                  | Laufende positive Nummer im deterministisch erzeugten LegalAction-Satz einer Seite und StateVersion. Die Einreichung beim Server bindet auch Match und MatchVersion.                                 |
| `ChoiceId`, `ChoiceOptionId`                | Nummer der geöffneten Choice innerhalb der Partie und Nummer einer Option innerhalb dieser Choice. Reihenfolge und fachlicher Wert der Option sind eigene Eigenschaften.                             |
| Server, Run, Trace und Fenster              | Partielokale Ganzzahlen mit je eigenem Typ. Feste Nummern für HQ, R&D und Archives, laufende Nummern für Remotes. „Neuer Remote“ ist ein eigenes Installationsziel.                                  |
| Ereignis, Snapshot, KI-Trace                | Nummern in der jeweiligen Match-Tabelle. Historienreferenzen enthalten den Matchkontext. Eine Diagnosekennung für einen fehlgeschlagenen KI-Versuch bleibt eine Fehlerreferenz.                      |
| Aufgelöster Effekt, Subroutine              | Effektposition innerhalb des Ereignisses. Subroutinen werden innerhalb des konkreten Encounters adressiert; gedruckte Herkunft, zusätzliche Beiträge und Ausführungsreihenfolge haben eigene Felder. |
| Zufallszweck und wiederholte Speicherfelder | Numerischer Zweckcode mit typisierten Argumenten. In SQLite verwenden die Karteninstanzliste und die Zufallsprotokolle kompakte, fest definierte Zeilen.                                             |

Die internen KI-Plan- und Kampagnenschlüssel enthalten heute Modul- und
Deduplizierungsmerkmale und binden wiederkehrende Vorschläge an residente
Instanzen. Im ersten Schnitt werden die darin verwendeten Karten-, Aktions-
und Serverbezüge an das neue Schema angebunden. Eine eigene Umstellung der
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

## Bedingungen für den Schnitt

- **Ein Zahlenformat pro ID-Domäne.** Shared definiert getrennte Typen,
  damit beispielsweise die ID einer Definition und die einer Instanz
  auch im Typecheck auseinandergehalten werden. IDs sind
  sichere Ganzzahlen im festgelegten Bereich, gewöhnlich größer als null.
  StateVersion, Positionen und vorhandene Zähler dürfen null sein. JSON trägt
  IDs als Zahlenwerte, SQLite verwendet für die betreffenden ID-Spalten
  `INTEGER`. Textpfade und DOM-Werte werden einmal an ihrer konkreten Grenze
  in den typisierten Wert übersetzt. Unbekannte, doppelte oder falsch
  gebundene IDs liefern eine strukturierte Ablehnung.
- **Stabilität über die fachliche Lebensdauer.** Definitionen und Fähigkeiten
  tragen ihre Nummer explizit in der CardSpec. Reihenfolge der Imports,
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

## Reihenfolge der Umsetzung

| Schritt                                             | Abhängigkeit              | Ergebnis                                                                                     |
| --------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| 1. Worktree und Einstieg                            | Lokaler Integrationsstand | Eigener Branch, getrennte Testumgebung, betroffene Quellen und Gates festgelegt.             |
| 2. Fachliche Bindungen aus IDs lösen                | 1                         | Aktion, Choice und ihre Fortsetzungen lesen typisierte Engine-Fakten.                        |
| 3. Kartendefinitionen und Fähigkeiten nummerieren   | 2                         | Vollständiger Katalog und Deckpfad verwenden dieselben neuen IDs.                            |
| 4. Instanzen, Ziele und Spielreferenzen nummerieren | 3                         | Engine-State, Projektionen und Historienreferenzen sind numerisch.                           |
| 5. Aktionen, Choices und Spielupdates umstellen     | 2–4                       | Kurze Angebote, sichere Einreichung über HTTP/WS und ein vollständiges Update pro Empfänger. |
| 6. SQLite und wiederholte Listen kompakt speichern  | 3–5                       | Ein aktueller Spielstand je Match und kompakte Zeilen in neuen Zuständen und Snapshots.      |
| 7. Integrierte Abnahme                              | 1–6                       | Funktional geprüfter Schnitt, aktueller Betriebspfad und übernommene Architekturverträge.    |

### 1. Worktree und Einstieg

1. Zum vorgesehenen Start den aktuellen lokalen `main` und vorhandene
   Worktrees auf Überschneidungen in Shared, Engine, KI, Server und Web prüfen.
   Den eigenen Branch `codex/compact-runtime-identifiers` von einem abgestimmten
   Stand abzweigen. Die Schritte nach ihren Abhängigkeiten bearbeiten und
   zusammenhängende Änderungen lokal committen.
2. Für jede der benannten ID-Familien Producer und Consumer im aktuellen
   Stand prüfen. Zum Verbraucherpfad gehören dynamische Zugriffspfade,
   Schemas, Datenindexe, JSON-Fixtures, Generatoren, Match-/Deck-APIs,
   Kartenansichten, Replay, Chronicle, Undo und Maintenance. Die Phasen
   übernehmen jeweils ihre Consumer im selben Änderungsschnitt.
3. Worktree-Tests erhalten freie Testports und eigene Pfade für Match- und
   Account-SQLite, Deckbibliothek, Test-Build und generierte Artefakte.
   Der E2E-Runner setzt eigene Ports und Datenpfade. Ein manueller Browsercheck
   nutzt Firefox und die isolierte Instanz. [Projekt- und Worktree-Regeln](../../AGENTS.md) · [E2E-Runner](../../scripts/run-e2e.mjs)

### 2. Fachliche Bindungen aus IDs lösen

1. An den Engine-Producern die Bedeutung erfassen, die heute in
   `makeActionId`, `ChoiceRequest.source` und Option-ID-Präfixen steckt.
   Bekannte Fälle sind variable Rez-Parameter, Programmauswahl vor Install,
   Zahlungsquellen, Trace zum aktuellen Run, Schadensvermeidung und
   Subroutine-/Serverziele. Vorhandene Felder wie
   `variableRezKind` und `variableRezValue` direkt verwenden und fehlende
   Werte am Producer ergänzen. Zusammengehörige IDs, Beträge und Quotes
   werden typisierte Daten statt CSV- oder eingebetteter JSON-Strings.
   [Aktions-IDs](../../packages/engine/src/game/turn/action-builders.ts) · [Rez-Consumer](../../packages/ai/src/runtime/semantic-runtime-corp-effective-defense.ts) · [Installationsquotes](../../packages/engine/src/game/turn/corp-install-actions.ts)
2. Je Fortsetzung zwei Fälle abbilden. Ein historischer Ursprung wird
   durch Seite, StateVersion und ActionId im laufenden Verlauf bezeichnet.
   Eine erneut anzubietende Aktion erhält eine strukturierte Bindung an
   Typ, Quelle, Variante, Ziel und die benötigten Kostenvorgaben. Das
   geplante Angebot wird im neuen State erneut durch die Engine gebunden.
   Das betrifft insbesondere das Runner-Zahlungsfenster mit
   `originalActionId` und die Mehrschritt-Choices. [Fortsetzungsangebot](../../packages/engine/src/game/legal-actions.ts) · [Runner-Zahlungsfenster](../../packages/engine/src/game/payment/runner-payment-support.ts)
3. KI-Planowner, Execution Lease und Choice-Resolver konsumieren diese
   typisierten Engine-Fakten. Aktuelle Action-IDs bleiben an ihren
   aktuellen Route Head gebunden. Kampagnen und Linien über mehrere
   States nutzen den vorhandenen Invocation-/Fortsetzungsvertrag. Den
   fachlichen Preflight je betroffenem KI-Owner anwenden. [KI-Änderungskompass](ai/change-compass.md) · [Exakte Aktionsbindung](ai/planning-architecture.md#1511-exakte-bindung-der-aktuellen-action-variante)

**Abnahme.** Variable Rez-Varianten, Installationszahlung und eine
verdeckte Mehrschritt-Choice führen mit typisierten Fakten zum exakt
gebundenen Ziel. Fehlende Quote, falsche Variante und falsche Fortsetzung
scheitern am erzeugenden Vertrag.

### 3. Kartendefinitionen und Fähigkeiten nummerieren

1. Einmalig alle aktuellen CardSpecs in der kanonischen Ausgangsreihenfolge
   nummerieren. IDs explizit in den Spezifikationen binden. Neue Karten
   erhalten eine neue Nummer. Der AST-Generator übernimmt numerische
   Literale, prüft Eindeutigkeit und erzeugt die jeweiligen Importindizes.
   Ableitungen wie Source-Refs und Fingerprints verwenden diese Identität.
2. Adressierbare CardSpec-Fähigkeiten erhalten eine fortlaufende
   `CanonicalCapabilityId`. Der generierte Index bindet jede Nummer an
   Kartendefinition und lokalen `capabilityKey`. Neue Einträge werden
   angehängt. Frei gewordene Nummern bleiben reserviert. Engine, KI und Web
   verwenden dieselbe Nummer für die Bindung einer konkreten Fähigkeit.
   [Capability-Vertrag](../../packages/cards/src/capability-identity.ts) · [Generator](../../scripts/generate-card-capability-ids.mjs)
3. CardSpec-Projektionen, Catalog, `runtime-data`, Kartenpool,
   Standardsnapshots, Deckvalidator und Deck-Import/-Export umstellen.
   Deck- und Poolhashes aus dem neuen Zahlenformat ableiten. Verknüpfte
   aktuelle Karten-Support-Daten, KI-Hints und Szenarien aus ihren
   Quellen neu erzeugen. Aktuelle Kartenabstraktions- und KI-Guards
   auf numerische, typisierte Kartenbezüge umstellen. Die bisherigen
   Guards erkennen unter anderem das alte `onr_…`-Muster.
   [Deckmodell](../../packages/decks/src/index.ts) · [KI-Karten-ID-Guard](../../scripts/check-ai-generic-card-id-guards.mjs)

**Abnahme.** Vollständiger Katalog ohne fehlende oder doppelte
Zuordnungen. Dieselbe Karte hat in Entwicklungs- und Releaseprojektion
dieselbe Nummer. Freigabestände, Deckmengen, Agenda-Punkte, Zuordnung
von Druck und Bild sowie Rollen-/Capability-Projektionen sind fachlich
korrekt. Standarddecks lassen sich mit Originalset, Classic und Proteus
laden, speichern und zum Matchstart verwenden.

### 4. Instanzen, Ziele und Spielreferenzen nummerieren

1. Beim Matchaufbau eine dichte Tabelle verwenden. Instanz-ID `n`
   adressiert Eintrag `n − 1`; dadurch entfällt der wiederholte
   Instanzschlüssel im Tabellenobjekt. Karten werden beim Wechsel der Zone
   referenziert und behalten ihren Tabellenplatz bis Matchende. Die
   anfängliche Nummernzuordnung erfolgt per eigener deterministischer
   Permutation im Setup mit erfasstem Zufallszweck, unabhängig von
   Kartenart und Startposition im gemischten Deck. Schleifen mit
   fachlicher Reihenfolge erhalten einen expliziten Ordnungsvertrag.
   [Matchaufbau](../../packages/engine/src/game/create-game.ts) · [Zufallsaufzeichnung](../../packages/engine/src/game/state/draw-random.ts)
2. Zonen, Hosting, Access, Install, Zielanforderungen und Kostenquellen
   auf Zahlenreferenzen umstellen. Verdeckte Ansichten projizieren
   Slots je Bereich und sichtbarer Position. Eine Slotreferenz gilt
   für den Zustand, in dem die Auswahl angeboten wurde. Options- und
   Zieldaten geben an, ob die Engine eine Instanz oder einen Slot
   auflösen soll. Runtime-Grenzen wie
   `runtime-shared.ts`, Input-DTO, Sanitizer, Replay und Chronicle
   verwenden dieselben Typen. [Runtime-Vertrag](../../packages/engine/src/game/engine-runtime-internal/runtime-shared.ts) · [KI-Input](../../packages/ai/src/input-dto.ts)
3. Server-IDs als feste Nummern für Zentralen sowie fortlaufende Nummern
   für Remotes führen. Der Serverzustand trägt seinen fachlichen Typ.
   Run, Spiel-Trace, Fenster und Sequenz erhalten beim Öffnen ihre Nummer
   aus Engine-Zustand oder einer bereits eindeutigen Ereignis-/Zustandsfolge.
   Für Encounter-Subroutinen stehen Bindung an Encounter und Reihenfolge
   als Werte zur Verfügung. Chronicle adressiert Effekte über Ereignis
   und Effektposition. [Remote-Vergabe](../../packages/engine/src/game/state/remote-server-id.ts) · [Chronicle](../../apps/web/app/chronicle.ts)
4. Backend-Ereignisse ordnen Engine-Aktionen und den separaten
   Zeitablauf in derselben Match-Historie ein. Die Engine vergibt ihre
   Ereignisnummern in Übergangsreihenfolge. Der Server hängt den
   terminalen Zeitablauf mit der nächsten Nummer an. Snapshot-Referenzen
   unterscheiden Initialstand, Vor-Aktionsstand und KI-Fehlversuch
   eigenständig, da mehrere Snapshots dieselbe StateVersion beziehen
   können. Ein KI-Trace wird über Match und Entscheidungsnummer
   gelesen. Die Maintenance-Route nutzt die bestehende Abfrage nach
   beiden Werten. SQLite-Spalten und Fremdschlüssel wechseln zusammen
   mit ihren Producern und Lesern auf das numerische Schema.
   [Lifecycle und Snapshots](../../apps/server/src/multiplayer.ts) · [Trace-Abfrage](../../apps/server/src/storage-sqlite.ts)

**Abnahme.** Identitäten sowie mehrere Kopien einer Karte bleiben
eindeutig über Draw, Install, Hosting, Access, Trash und Undo. Remote-Abbau
und Neuanlage binden die jeweils richtige Instanz. Gedruckte, hinzugefügte
und gebrochene Subroutinen werden dem richtigen Encounter zugeordnet.
Initialsnapshot, erster Vor-Aktionsstand, KI-Fehlversuch und Zeitablauf
lassen sich mit eindeutigen Referenzen laden.

### 5. Aktionen, Choices und Spielupdates umstellen

1. LegalActions erst in der Engine fachlich vollständig aufbauen, dann
   die endgültige Liste pro Seite deterministisch nummerieren. Prüfung
   auf doppelte fachliche Varianten vor der Nummerierung beibehalten.
   Quotes, die ihre eigene ActionId enthalten, an das finalisierte
   Angebot binden. Zufallsauswahl aus mehreren Varianten verwendet
   dieselbe kanonische Kandidatenfolge wie die Anwendung und das Replay.
2. Eine geöffnete Choice erhält ihre Nummer einmal vom Engine-Owner.
   Die Optionen werden in ihrer erzeugten Reihenfolge nummeriert,
   unabhängig von ihrem Auswahlwert. `PlayerAction` übernimmt den
   eindeutigen Choice-/Optionsvertrag aus `LegalAction` und
   `ChoiceRequest`. Typ, Anzahl, Auswahlreihenfolge, sichtbare
   Zielreferenz, Mehrfachauswahl und Selektierbarkeit werden validiert.
   [Choice-Validierung](../../packages/engine/src/game/choices/choice-validation.ts)
3. HTTP- und WS-Aktionspfad übernehmen die gebundene MatchVersion.
   Undo-Anfragen binden ihre Ziel-Ereignisnummer an die MatchVersion
   der angezeigten Historie.
   Das vollständige side-sichere Update enthält Versionen, PlayerView,
   LegalActions, aktuellen Ereignisausschnitt und gegebenenfalls
   eine offene Choice jeweils einmal. Der Server verwendet für die
   Freigabe der LegalActions Matchstatus und tatsächliche Spielerseite.
   Lobby und eigenständige Status-/Uhrereignisse haben ihren eigenen
   Nachrichtenanlass. Der Webclient übernimmt Spielzustand und
   Aktionsangebot atomar und bindet Klicks an die erhaltenen Versionen.
   Änderungen der MatchVersion mit weiterhin aktiver Partie erreichen
   auch bei gleicher StateVersion den Webclient. Eine veraltete Anfrage
   erhält den aktuellen side-sicheren Stand zur erneuten Auswahl.
   [Payload-Erzeugung](../../apps/server/src/multiplayer-payload.ts) · [WS-Transport](../../apps/server/src/http-server.ts) · [Webclient](../../apps/web/features/match-session/client-payload-helpers.ts)

**Abnahme.** Gleicher Zustand und gleiche Seite erzeugen dasselbe
nummerierte Angebot. Bei Kosten-, Ziel- oder Variantenunterschieden
bleiben Aktionen einzeln adressierbar. Ein verspäteter Klick nach
Undo und erneut erreichter StateVersion wird abgelehnt. Idempotenz,
Reconnect, Join, offene Choice, Beobachtermodus und Spielende
funktionieren aus dem neuen Update-Vertrag.

Das Multiplayer-Angebot nummeriert die fertigen Engine-Aktionen einer Seite
ab `1`. Eine offene Choice erhält ihre StateVersion plus eins und behält die
von der Engine vorgegebene Optionsreihenfolge. WebSocket und HTTP geben
denselben Angebotsvertrag aus. Die Anzeige erhält bei Bedarf einen
Optionszweck, etwa `keep`, `pay` oder `bid`.

Der WebSocket nimmt Ganzzahlen an. Nach Authentifizierung und Prüfung der
MatchVersion und StateVersion bindet die Engine die Nummern unter dem
Match-Lock an genau die angebotene Aktion und ihre Optionen. `applyAction`
prüft anschließend wie beim Replay Timing, Kosten, Ziele und Auswahl. Die
internen Engine-Schlüssel und KI-Quotes verbleiben im Regel- und Replaypfad.
Eine automatische Zahlungsfortsetzung verwendet das gemeinsame Engine-Fenster
und genau eine dafür angebotene Fortsetzungsaktion.

### 6. SQLite und wiederholte Listen kompakt speichern

1. `game_states` ist die einzige Speicherquelle für den aktuellen
   Engine-Zustand. `matches.record_json` enthält die Match-Metadaten.
   Die Store-Lesewege für laufende Aktionen, Wiederöffnung und
   Maintenance verwenden diese Zuständigkeit. Vor-Aktionssnapshots
   dienen weiterhin Undo und Replay. [Heutiger SQLite-Lese- und Schreibpfad](../../apps/server/src/storage-sqlite.ts) · [Transaktionsvertrag](maintenance/action-persistence-contract.md)
2. Eine schemafeste Speicherdarstellung für die Instanzzeilen und
   Zufallsprotokolle verwenden. Die Position der Instanzzeile bestimmt ihre
   ID. Die Grundfelder der Karte stehen an festen Positionen, optionale
   Fachzustände in einer getypten Erweiterung. Eine Zufallszeile ist
   `[counter, purpose, value]`, ihr Zweck ist ein numerischer Code mit
   den nötigen typisierten Argumenten. Engine und Replay bilden daraus
   dieselbe kanonische Seed-Eingabe. Betroffene RNG-Aufrufe einschließlich
   des gesonderten KI-Planungszählers aktualisieren. [Zufallsaufzeichnung](../../packages/engine/src/game/state/draw-random.ts) · [StateHash](../../packages/engine/src/state-hash.ts)
3. Full Save, Delta-Save, Snapshots, Reopen, Undo-Truncate, Replay und
   Maintenance denselben SQLite-Codec für Spielstände verwenden lassen.
   StateHash über den fachlichen Zustand bilden und
   nach dem Lesen erneut prüfen. Schema- und Bindungsfehler liefern eine
   konkrete Storage-Diagnose. Atomare Baseline-Prüfung und Quittung nach
   Commit sind Teil der Abnahme.
4. Für den lokalen Schnitt eine frische Match-Datenbank und aktuelle
   Deckformate einsetzen. Den Matchpfad ausdrücklich konfigurieren.
   Der Accountpfad kann heute auf dieselbe SQLite-Datei zeigen und ist
   beim Schnitt getrennt zu prüfen. Kartenbilder und private Quellen
   haben eigene Pfade. Der Start mit einer alten Matchdatenbank erhält
   vor dem ersten Schreibzugriff eine Schema-Diagnose.
   [Runtime-Pfade](../../apps/server/src/runtime-paths.ts) · [Lokale Datenpfade](../runbooks/netgrid-local-transfer.md)

**Abnahme.** Neuer SQLite-Stand schreibt den aktuellen Zustand einmal.
Close/Reopen und Undo liefern denselben kanonischen Zustand wie der
jeweilige In-Memory-Pfad. Seed, beide Zufallszähler, Aufzeichnungen und
StateHash stimmen innerhalb frisch erzeugter Replays an jedem
Übergang. Beschädigte Zeilen und ein Versionskonflikt scheitern sichtbar.

### 7. Integrierte Abnahme und Übergabe

- **Gezielte Gates je Schritt.** Die vorhandenen Registry-, Deck-,
  LegalAction-, Choice-, Visibility-, Replay- und SQLite-Tests verwenden.
  Gezielt ergänzen, wo der neue Vertrag einen Gegenfall braucht.
  Vorrang haben doppelte Nummern, falscher Gültigkeitsbereich,
  Wiederverwendung einer StateVersion nach Undo, numerische Sortierung
  mit mehr als neun Optionen, Zeitablauf, Reopen und side-sichere
  Gegenproben für verdeckte Karten. Bei KI-Fällen dieselbe fachliche
  Variante, ihren Owner und Executor und die exakte aktuelle Bindung
  prüfen. [Teststrategie](test-tiers-and-package-boundaries-2026-07-10.md)
- **Verträge und Build am Integrationspunkt.** `corepack pnpm typecheck`,
  `corepack pnpm test:contracts`, die Pakettests der betroffenen
  Nicht-KI-Pakete, `corepack pnpm test:ai:shards` und
  `corepack pnpm build`. Struktur-, Katalog- und Produktgrenzen über
  `check:package-boundaries`, `check:engine-source-structure`,
  `check:cards-source-structure`, `check:card-spec-import-index`,
  `check:release-card-index`, `check:standard-deck-guides`,
  `check:engine-cardimplementation-architecture-target`,
  `check:card-function-abstraction`, `check:card-spec-ai-hints`,
  `check:card-spec-decision-checkpoints`, `check:ai` und
  `check:release-boundary` nachweisen. Windows-Testläufe
  über den NETGRID-Teststarter starten, sofern er vorhanden ist. Die
  Zeitfenster aus den Projektregeln gelten für die einzelnen Gates.
  [Verfügbare Befehle](../../package.json) · [Windows-Testbetrieb](../../AGENTS.md)
- **Echte Spielpfade im isolierten E2E.** `corepack pnpm test:e2e:multiplayer`
  und die einschlägigen Replay-, Zuschauer- und lokalen KI-Fälle
  prüfen. Eine neue Partie vom Deck bis zur Aktion und Choice in beiden
  Spielperspektiven durchlaufen, nach Verbindungsabbruch wieder aufnehmen,
  Undo plus erneutes Angebot ausführen und Replay aus dem neu geöffneten
  SQLite-Stand laden. Den Releaseoutput mit `build:windows-release-output`
  und `smoke:windows-release-output` prüfen. [Multiplayer-E2E](../../tests/e2e/netgrid-multiplayer-two-browser.spec.ts)
- **Übergabe.** `release-implementation-agent` übernimmt die Reihenfolge.
  Die abschließende Funktionsprüfung nutzt die Gegenfälle aus
  `test-quality-agent`. Nach lokaler Integration die gültigen Verträge in
  CardSpec-, Engine-, Transport- und Persistenzdokumentation übernehmen,
  die Buildkennung prüfen und den erledigten Plan nach Referenzprüfung
  entfernen. Abschließend `git diff --check` und die eigenen
  Worktree-Testartefakte prüfen. [Implementierungsrolle](../../agents/release-implementation-agent.md) · [Testrolle](../../agents/test-quality-agent.md) · [Dokumentationspflege](../decisions/docs-retention-current-state-policy-2026-07-08.md)
