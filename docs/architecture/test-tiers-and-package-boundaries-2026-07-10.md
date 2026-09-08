# Teststufen und Paketgrenzen

Stand: 2026-07-10

## Verbindliche Teststufen

NETGRID trennt lokale Rückmeldung von vollständiger Abschlussprüfung. Ein
kleiner Lauf ersetzt keinen paketnahen Test nach einer fachlichen Änderung.

| Stufe     | Befehl                                                                 | Zweck                                                    |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Paketnah  | `corepack pnpm --filter <paket> test`                                  | Direkt betroffene Unit- und Regressionstests             |
| Verträge  | `corepack pnpm test:contracts`                                         | Shared-Verträge sowie Phase-1- und Sichtbarkeitsverträge |
| AI-Shards | `corepack pnpm test:ai:shards`                                         | Vollständige AI-Suite in drei stabilen Vitest-Shards     |
| Full Gate | `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` | Projektweiter Abschluss vor Integration                  |

Der Sammelbefehl startet die drei festen AI-Shards im lokalen Normalfall
parallel. Jeder Shard bleibt intern auf genau einen Vitest-Worker begrenzt.
Damit nutzt der vollständige AI-Lauf mehrere CPU-Kerne, ohne die
Determinismus-, Speicher- und Zustandsrisiken einer beliebig hohen
Worker-Anzahl innerhalb eines Testprozesses einzugehen. Der Sammelbefehl wartet
alle drei Ergebnisse ab und schlägt fehl, sobald mindestens ein Shard rot ist.

Die Shards können zur Diagnose einzeln mit
`corepack pnpm --filter @netgrid/ai test:shard:1`, `:2` oder `:3` ausgeführt
werden. Für nachweislich speicherarme oder instabile Umgebungen gibt es den
bewussten Fallback `corepack pnpm test:ai:shards:serial`. Mehr als die drei
festen Parallelprozesse oder mehr als ein Worker je Shard werden erst nach
einer dokumentierten Laufzeit-, RAM- und Stabilitätsmessung zum neuen Standard.

Tests mit Timeout oder abgebrochene Prozesse gelten nicht als bestanden.
Ein grüner Testzähler reicht nicht: Auch der Sammelbefehl einschließlich
Prozessende und Cleanup muss erfolgreich abschließen. Temporäre Dateisperren
dürfen nach beendetem Testprozess begrenzt abgewartet werden; dauerhaft
gesperrte Artefakte und Teardown-Fehler werden nicht stillschweigend ignoriert.

## Stabiler Testvertrag statt historischer Momentaufnahme

Regressionstests müssen die fachlich oder technisch garantierte Eigenschaft
prüfen. Sie dürfen eine bei der Erstellung lediglich beobachtete Ausprägung
nicht stillschweigend zum Vertrag erklären.

- Wachsende Kataloge prüfen eine fachlich begründete Mindestmenge und danach
  die Vollständigkeit, Eindeutigkeit und Gültigkeit jedes aktuell enthaltenen
  Eintrags. Eine exakte Anzahl ist nur zulässig, wenn gerade die Kardinalität
  selbst ein versionierter Vertrag ist.
- Verhaltenssimulationen binden sich an semantische Ereignisse, Plan-Owner,
  Executor, Capability, Evidence und relative Reihenfolgen. Absolute
  Aktionsindizes, `stateVersion`, Endstände und `StateHash` gehören nur in
  Tests, deren ausdrücklicher Gegenstand Replay-, Zustands- oder
  Determinismusidentität ist.
- Decision-Checkpoints dürfen eine exakte Aktion verlangen, wenn diese Aktion
  fachlich zwingend ist. Delegiert ein Root-Plan einen zulässigen
  Finanzierung-, Schutz- oder Choice-Schritt, prüft der Test zusätzlich die
  Root-/Executor-Bindung und nicht den historisch vorher direkten Einzelschritt.
- Semantische Suche allein macht eine Vollspiel-Regression nicht stabil:
  Auch das Erreichen der gesuchten Karte, Choice oder Zuggrenze darf nicht von
  unabhängiger Spielstrategie, Draw-Reihenfolge oder einem historischen
  Aktionslimit abhängen. Eng umrissene Fortsetzungsfehler erhalten einen
  kontrollierten Engine-Zustand oder validierten Decision-Checkpoint und
  durchlaufen anschließend echte `LegalActions`/`applyAction`-Schritte.
  Trigger-Voraussetzung und erwartete Wirkung werden beide positiv geprüft;
  wesentliche Bindungen zusätzlich mit einem fehlenden/fremden Ursprung negativ.
  Vollspiele bleiben breite Systemtests, ersetzen aber nicht diesen gezielten
  Regressionsschutz. Eine bloße relative Indexverschiebung oder ein erhöhtes
  Aktions-/Zeitlimit ist kein Ursachenfix für einen nicht erreichten Trigger.
- Fokussierte LegalAction-Angebote dürfen unabhängige Strategieentscheidungen
  ausklammern, müssen aber den für den Pfad erforderlichen Planungskontext
  erhalten und seine Planning-State-Identität neu berechnen. Nach der
  Quellaktion werden aktuelle vollständige Engine-Angebote verwendet. Ein
  Finanzierungscheckpoint garantiert nur seinen gebundenen Bedarf, nicht eine
  spätere Schutz-/Installationsfolge ohne deren eigene Voraussetzungen.
- Berechnete Scores, Reserven und Diagnosewerte werden nur exakt fixiert, wenn
  ihre konkrete Berechnung Vertragsgegenstand ist. Sonst wird die stabile
  Klassifikation oder der verantwortliche Pfad geprüft.
- Funktionale Langsimulationen sind keine impliziten Performance-Gates. Ihre
  Timeouts erhalten ausreichenden, am parallelen Gate-Betrieb gemessenen
  Spielraum; Laufzeitgrenzen werden in gesonderten Performance-Tests geprüft.

Eine rote Erwartung wird erst geändert, nachdem Legalität, Runtime-/Replay-
Fehlerfreiheit und der aktuelle Fachvertrag das beobachtete Verhalten gemeinsam
tragen. Andernfalls bleibt der Test rot und der Produktfehler wird an seiner
Ursprungsschicht behoben.

## Abhängigkeitsrichtung

`corepack pnpm check:package-boundaries` prüft die produktiven TypeScript- und
JavaScript-Dateien fail-closed gegen folgende Schichten:

```text
shared
  ↑
catalog    engine
  ↑          ↑
decks ───────┘
  ↑
ai
```

- `shared` importiert kein anderes NETGRID-Paket.
- `catalog` importiert nur `shared`.
- `decks` importiert nur `catalog` und `shared`.
- `engine` importiert nur `shared`.
- `ai` importiert nur `catalog`, `decks`, `engine` und `shared`.
- Normale Webclient-Module importieren weder `engine` noch `ai` direkt.
  Server-Routen und das ausdrücklich isolierte Tutorial bleiben ausgenommen.

Der Check untersucht nur versionierte Produktionsdateien. Tests dürfen für
Vertrags- und Integrationsprüfungen breiter importieren. Neue Pakete müssen
vor ihrer Aufnahme eine explizite Richtung in diesem Dokument und im Gate
erhalten; unbekannte NETGRID-Imports innerhalb einer geregelten Schicht
schlagen fehl.

`corepack pnpm check:package-boundaries:selftest` belegt mit positiven und
negativen Beispielen, dass erlaubte Imports passieren und verbotene Shared-
oder Webclient-Abhängigkeiten das Gate tatsächlich rot schalten.
