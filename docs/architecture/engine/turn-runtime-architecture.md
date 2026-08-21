# Turn Runtime Architecture

Status: E09 produktiv

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

## Wachstumsgrenzen

`turn-runtime-resolvers.ts` bleibt unter 150 Zeilen. Jedes fachliche Teilmodul
bleibt unter 1.000 Zeilen. Neue Turnmechaniken werden im besitzenden
Fachmodul ergänzt; ein neuer Cross-Domain-Link ist nur zulässig, wenn seine
Ausführungsreihenfolge und Continuation-Semantik hier nachvollziehbar bleiben.
