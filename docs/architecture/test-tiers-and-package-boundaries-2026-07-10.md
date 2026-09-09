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
Browser-E2E übernimmt die Browserwahl aus `playwright.config.ts` (Firefox als
NETGRID-UI-Standard). Fachliche Szenarien setzen keinen eigenen `browserName`;
Locale und fachliche Fixtures dürfen lokal festgelegt werden. Der Nightly-Job
installiert Firefox sowie Chromium für den ausdrücklich eigenständigen
Zwei-Browser-Multiplayer-Helper. Neue Browserabhängigkeiten müssen zugleich im
CI-Setup deklariert werden; ein lokal vorhandener Browser ist keine CI-Garantie.
Ein bereits als erwarteter Fehler markierter Test ist separat auszuweisen und
kein Nachweis funktionierender Produktfunktion, auch wenn der Sammelbefehl grün ist.

Die GitHub-CI führt die serielle AI-Paketsuite und die übrigen Workspace-Pakete
in unabhängigen Jobs aus. `fail-fast: false` und `pnpm -r --no-bail` lassen
andere Testgruppen beziehungsweise Pakete auch nach einem Fehler auswerten;
kein Fehler wird dabei ignoriert. Discovery und Spec-Tests laufen auch nach
einem Paketfehler, sofern die Installation erfolgreich war. Der unveränderte
Gesamtcheck `Test suite` wird nur grün, wenn beide Gruppen erfolgreich sind.
So verdeckt ein früher AI- oder Webfehler nicht mehr die nachgelagerte
Serverdiagnose. Lokale Testbefehle und die AI-Workergrenze bleiben unverändert.
Der gefilterte Workspace-Job schließt auch das Root-Paket `netgrid-app`
explizit aus: Ein negativer pnpm-Filter würde dessen rekursives `test`-Script
sonst mit auswählen und die AI-Suite unbeabsichtigt nochmals starten.

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
  Für den aktiven CardSpec-/KI-Hint-Bestand ist 618 die etablierte Mindestmenge,
  keine Obergrenze. Compiler-, Artefakt- und Review-Partitionsprüfungen sichern
  daneben die exakte aktuelle ID-Menge, Eindeutigkeit und vollständige Abbildung;
  fehlende, fremde oder doppelte IDs bleiben Fehler.
  Eine Vollinventar-Prüfung unabhängiger API-Antworten erhält einen benannten
  parametrisierten Test je aktuellem Eintrag statt einer Schleife unter einem
  gemeinsamen Zeitlimit. Der gesamte Bestand bleibt geprüft, ohne dass allein
  Wachstum oder CI-Last einen funktionalen Vertrag zum Performance-Gate machen.
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
- Plattformübergreifende Eingabeverträge werden unabhängig vom Host geprüft.
  Ein „reiner Dateiname“ für den lokalen Benchmark-Import schließt POSIX- und
  Windows-Pfade aus; natives `path.basename` allein genügt dafür nicht.
  Tests bilden beide Pfadinterpretationen auch lokal ab und prüfen die
  Ablehnung vor dem Dateizugriff sowie das Zulassen gültiger Dateinamen.
- Host-native Speicherpfade verwenden host-native absolute Testfixtures.
  Ein hartcodierter Windows-Pfad ist unter Linux kein absoluter Pfad.
  Konfigurationsprüfungen sichern Override-Priorität, relative Auflösung und
  Normalisierung statt eine betriebssystemfremde Pfadschreibweise ab.
- Berechnete Scores, Reserven und Diagnosewerte werden nur exakt fixiert, wenn
  ihre konkrete Berechnung Vertragsgegenstand ist. Sonst wird die stabile
  Klassifikation oder der verantwortliche Pfad geprüft.
- Funktionale Langsimulationen sind keine impliziten Performance-Gates. Ihre
  Timeouts erhalten ausreichenden, am parallelen Gate-Betrieb gemessenen
  Spielraum; Laufzeitgrenzen werden in gesonderten Performance-Tests geprüft.
  Der funktionale SQLite-Lasttest mit 25 Match-Fixtures und kumulativ 36
  Aktionsbelegen behält alle drei Laststufen. Seine auf Linux CI gemessenen
  6,74 Sekunden überschritten nur den impliziten Vitest-Default von fünf
  Sekunden; ein explizites 30-Sekunden-Fenster begrenzt nun Setup, I/O und
  Prüfung ohne eine unbeauftragte Performance-SLA. Datenbankhandles und das
  eigene temporäre Verzeichnis werden auch bei Assertionsfehlern geschlossen
  beziehungsweise entfernt.

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
