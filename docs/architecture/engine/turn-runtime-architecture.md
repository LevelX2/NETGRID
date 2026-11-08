# Turn Runtime Architecture

Status: E09 produktiv

Direkte Runner-Ziehaktionen veröffentlichen dieselbe aktuelle Brutto-/Abgabe-/
Nettoquote für Basisdraw, Event und installierte Fähigkeit. Die Quote zählt
den begrenzten Stackbestand und die verpflichtende Ersatzkartenabgabe; der
Verbrauch einer gespielten Eventkarte bleibt ein zusätzlicher eigener Preis.
Nur gerezzte installierte Corp-Rootquellen zählen als sichtbare Drawsteuer.
Eine weitere separate Ziehsequenz hinter einer noch offenen Rücklegewahl
erhält keine erfundene exakte Gesamtquote und scheitert strukturiert.

## Ziel

Die Turn-Runtime bildet mehrere eigenständige Zustandsmaschinen ab. Sie darf
nicht wieder zu einem Resolver-Monolithen zusammenwachsen, weil Turn-Ende,
Discard, Corp-Turnstart, Runner-Turnstart und automatische Effekte
unterschiedliche Fortsetzungs- und Sicherheitsverträge besitzen.

## Aufteilung

| Modul                                    | Verantwortung                                                      |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `turn-runtime-resolvers.ts`              | kleiner Composition Root und öffentliche Port-Vollständigkeit      |
| `turn-effect-runtime-resolvers.ts`       | typisierte automatische Effekte und Public-Payload-Metadaten       |
| `turn-end-runtime-resolvers.ts`          | End-of-Turn, Tag-Fortsetzung, Discard und temporäre Rückgaben      |
| `turn-corp-start-runtime-resolvers.ts`   | Corp-Turnstart, wiederkehrende Corp-Effekte und Virus-Counter      |
| `turn-runner-start-runtime-resolvers.ts` | Runner-Turnstart, Delayed Access, Zufallseffekte und private Looks |
| `turn-runner-start-ordering.ts`          | konservative Automatik und Sicherheitsgrenze für Startquellen      |
| `turn-action-economy-runtime.ts`         | bereits separierte Aktionsökonomie und Restricted-Action-Grants    |
| `turn-start-tag-continuation.ts`         | persistierte Fortsetzung nach Tag-Präventionsfenstern              |

Der Composition Root baut alle Teilports über ein stabiles `TurnRuntimePort`-
Link-Objekt auf. Ein Teilresolver liest einen fachfremden Link erst bei der
späteren Ausführung einer Aktion. Während der Factory-Erzeugung wird kein Link
aufgerufen und keine Momentaufnahme des unvollständigen Ports angelegt.

## Invarianten

Die aktuelle Corp-Score-LegalAction einer Agenda mit verpflichtendem
Startdraw enthält eine StateVersion-gebundene Quote der bisherigen und
zusätzlichen Pflichtdraws sowie der tatsächlichen Punkte nach dem Score.
`mandatory-agenda-draw-sources.ts` und `corp-mandatory-virus-draw-count.ts`
speisen sowohl die wirkliche Startauflösung als auch diese Projektion.
Optionale Draws, weitere Ersatzwirkungen und gegnerische Folgeaktionen sind
damit nicht als sicher zertifiziert. Die Projektion verändert keine
Legalität, Karten oder Zufallszähler und erscheint nur in eigenen Corp-Actions.

- Turn-Ende schließt verzögerte Schäden, temporäre Installationen,
  Verpflichtungen und Discard in der bestehenden Reihenfolge ab.
- Tag-Präventionsfenster setzen nur über die persistierten Continuation-Verträge
  fort; Cursor und Quellenidentität werden erneut validiert.
- Automatische Effekte bleiben der gemeinsame typisierte Nachweis für
  Chronicle, Replay und öffentliche Payloads.
- Zufall am Turnstart verwendet weiterhin Seed, RandomCounter und die
  bestehenden RandomDrawRecords.
- Private Corp- oder Runner-Kartenauswahlen werden nicht durch automatische
  Effektmetadaten öffentlich gemacht.
- Mehrere Runner-Startquellen werden nur dann ohne Choice in sortierter
  Karteninstanz-Reihenfolge aufgelöst, wenn der deklarative Ability-Vertrag
  alle offenen Quellen als reihenfolgenneutrale Kopien derselben Definition
  ausweist und keine Quelle einen weiteren Startpfad besitzt. Vor jeder
  Auflösung gelten die bestehenden Fälligkeits- und Quellenprüfungen erneut.
- Die Teilmodule enthalten keine neue Kartenregel; sie verdrahten nur die
  bereits vorhandenen Turn-Verträge.

## Zusätzliche Aktionen und Zugbeginn

Project Venice speichert seinen Overadvance-Wert beim Scoren und gewährt
die daraus folgenden zusätzlichen Corp-Aktionen bereits im Score-Zug sowie
in späteren Corp-Zügen. Remote Facility gewährt beim Rezzen im eigenen
Corp-Zug sofort eine zusätzliche Aktion; die spätere Zugstartwirkung bleibt
erhalten. Bargain with Viacox beginnt im nächsten Runner-Zug nach seiner
Installation; Würfelergebnisse verwenden den deterministischen RNG-Vertrag
und erzwingen die jeweils regelgebundene Aktion. Diese Pfade sind in
`packages/engine/src/index-tests/proteus/action-economy-debt-suite.test.ts`
und den Originalset-Regressionen verankert.

## Wachstumsgrenzen

`turn-runtime-resolvers.ts` bleibt unter 150 Zeilen. Jedes fachliche Teilmodul
bleibt unter 1.000 Zeilen. Neue Turnmechaniken werden im besitzenden
Fachmodul ergänzt; ein neuer Cross-Domain-Link ist nur zulässig, wenn seine
Ausführungsreihenfolge und Continuation-Semantik hier nachvollziehbar bleiben.
