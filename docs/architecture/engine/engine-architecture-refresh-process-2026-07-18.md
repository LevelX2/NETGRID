# Engine Architecture Refresh Process 2026-07-18

Status: vollständig umgesetzt; E16-Abschlussintegration und Cleanup laufen
Branch: `codex/engine-architecture-refresh`
Worktree: `C:\Projekte\NETGRID_ENGINE_ARCHITECTURE_REFRESH`
Primary agent: `architecture-review-agent`

## Fortschritt

| Paket | Zustand     | Nachweis                                                                   |
| ----- | ----------- | -------------------------------------------------------------------------- |
| E00   | integriert  | Commit `6cfa0173e`, beidseitig mit `main` abgeglichen                      |
| E01   | integriert  | Commit `a13cf8bc4`; Architektur-Target 0 Findings; 1.732 Engine-Tests grün |
| E02   | integriert  | Commit `637c62a09`; Strukturguard und vier Fehlerklassen im Selftest grün  |
| E03   | integriert  | Commit `e9fbd63a5`; 144 Verträge in sechs zyklusfreien Familien            |
| E04   | integriert  | Commit `16928c90c`; 13 typisierte Portgruppen und Registry-Basis           |
| E05   | integriert  | Commit `2a0c68d9e`; 67 State-Service-Delegates statisch typisiert          |
| E06   | integriert  | Commit `5f44141cc`; weitere 177 Delegate-Signaturen typisiert              |
| E07   | integriert  | Commit `7f7d8a163`; letzte 186 Signaturen typisiert; Delegate-Schuld null  |
| E08   | integriert  | Commit `e24d17f39`, Main-Abgleich `e5d5a4f0d`; Runtime-Zyklus entfernt     |
| E09   | integriert  | Commit `17efeb4f3`, Main-Abgleich `84f3e075b`; Turn-Runtime geteilt        |
| E10   | integriert  | 1.736 Engine-, 2.723 KI- und 12 Shared-Tests; Web 633/635 nach Main-Sync   |
| E11   | integriert  | Damage-Domäne in sechs Module geteilt; 1.736 Engine-Tests und Gates grün   |
| E12   | integriert  | Access-Domäne geteilt; Hidden-Info-/Breach-Verträge und 1.736 Tests grün   |
| E13   | integriert  | Run-Hotspots geteilt; keine relativen Importzyklen; 1.736 Tests grün       |
| E14   | integriert  | Registry nach Set/Seite/Typ; Coverage geteilt; 1.739 Engine-Tests grün     |
| E15   | integriert  | 202 Dateien/1.741 Tests; Release-Smokes und Source-Verträge geteilt        |
| E16   | verifiziert | Abschlussgates, Final Review und Wissenspflege grün; Integration läuft     |

## Quelle und Vorgabe

Der Prozess setzt den vollständigen Engine-Strukturreview vom 18.07.2026 um.
Er reagiert auf die nach der ursprünglichen Engine-Entzerrung erneut gewachsene
Runtime-Komposition, untypisierte Delegate-Grenzen, große Domänenmodule,
versionierte Payload-Kompatibilität und aktuell rote Architektur-Gates.

Der Nutzer hat die direkte Umsetzung freigegeben und verlangt nach jedem
abgeschlossenen, geprüften Paket einen lokalen Merge nach `main`. Vor diesem
Merge wird der aktuelle `main`-Stand in den Arbeitsbranch integriert; nach dem
Merge wird `main` erneut in den Arbeitsbranch abgeglichen. Konflikte werden
inhaltlich gelöst, sodass beide kompatiblen Intentionen erhalten bleiben.

## Zielprüfung

Die Vorgabe ist ausführbar. Gesamtziel, Sicherheitsgrenzen, Reihenfolge,
Worktree, Branch, Integrationsmodell und Verifikationsstufen sind bestimmt.
Detailentscheidungen innerhalb eines Pakets werden konservativ anhand des
aktuellen Codes und der paketnahen Tests getroffen.

## Gesamtziel

Die NETGRID Rules Engine besitzt nach Abschluss wieder eine nachvollziehbare,
statisch typisierte und wartungsfreundliche Struktur. Die öffentliche API
bleibt klein, Runtime-Abhängigkeiten werden über explizite Domänenports
komponiert, CardImplementation-Verträge sind nach Fachfamilien strukturiert,
Run-/Access-/Damage-/Turn-Hotspots sind aufgeteilt und aktuelle
Payload-/Replay-Verträge sind von unbegründeter Version-0-Kompatibilität
bereinigt.

## Nicht-Ziele

- Keine neue Karte und keine Kartenpromotion.
- Keine absichtliche Spielregeländerung in mechanischen Strukturpaketen.
- Kein Redesign von UI, Server oder KI.
- Keine historische Datenmigration ohne aktuellen Consumer.
- Kein Push und kein Pull Request.
- Keine pauschale Kommentierung selbsterklärenden Codes.

## Controller-Invarianten

- Die Rules Engine bleibt die einzige Regelautorität.
- `PlayerAction` wird weiterhin vollständig gegen aktuelle `LegalActions`
  revalidiert.
- Hidden-Info-Barrieren dürfen in Views, Events, Replays, Logs, Fehlern und
  Payloads nicht geschwächt werden.
- Replay, StateHash, Seed, RandomCounter und RandomDrawRecords bleiben
  deterministisch.
- Mechanische Extraktion und fachliche Regelkorrektur werden nicht im selben
  Paket vermischt.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Ein Paket wird nur bei grünem Done-Gate committed und integriert.

## Automatische Fehlerbehandlung

Bei einem roten Test wird die Ursache paketnah diagnostiziert und behoben. Ein
bekannter Baseline-Fehler darf nur dann dokumentiert übernommen werden, wenn er
außerhalb des Pakets liegt, auf `main` bereits vorhanden war und das Paket ihn
nicht verschlechtert. Architektur-Gates dieses Prozesses dürfen nicht als
Baseline-Ausnahme fortgeschrieben werden, wenn eine strukturelle Korrektur
möglich ist.

## Sicherheitsblocker

Der Prozess stoppt bei nicht sicher auflösbaren Konflikten in:

- LegalAction-Erzeugung oder `applyAction`-Revalidierung,
- Hidden-Info-/PublicEvent-/PlayerView-Projektion,
- Replay-, StateHash- oder Zufallsverträgen,
- gleichzeitig abweichenden Regelintentionen in `main` und Arbeitsbranch.

Removal Condition ist jeweils ein nachvollziehbarer gemeinsamer Vertrag mit
paketnahen Regressionstests.

## State Machine je Paket

1. `package_active`: Scope und Eingangsvoraussetzungen prüfen.
2. `implementation`: nur Paketumfang bearbeiten.
3. `verification`: Paketchecks und `git diff --check` ausführen.
4. `package_commit`: nur Paketdateien committen.
5. `sync_main_into_branch`: aktuelles lokales `main` in den Arbeitsbranch
   integrieren und Konflikte semantisch lösen.
6. `verify_after_sync`: relevante Paketchecks erneut ausführen.
7. `merge_package_to_main`: Hauptworkspace prüfen und Arbeitsbranch lokal nach
   `main` mergen.
8. `verify_main`: `git status --short`, `git diff --check` und relevante
   Paketchecks auf `main` ausführen.
9. `sync_main_back_to_branch`: aktualisiertes `main` in den Arbeitsbranch
   integrieren; beide Workspaces müssen sauber sein.
10. `package_done`: Progress aktualisieren und erst dann Folgepaket starten.

## Paketfolge

| Paket | Ziel                                                    | Kernchecks                                                   | Commit-Vorschlag                                         |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| E00   | Prozess- und Auditbaseline                              | `git diff --check`                                           | `docs(engine): plan architecture refresh process`        |
| E01   | Rote Architektur-Gates reparieren                       | Engine-Typecheck, fokussierte Tests, beide Architekturchecks | `refactor(engine): restore architecture gates`           |
| E02   | Ausführbaren Strukturguard ergänzen                     | Guard + Selftest, Package Boundaries                         | `test(engine): enforce source structure boundaries`      |
| E03   | Ability-Verträge nach Familien teilen                   | Engine-Typecheck, Ability-/Coverage-Tests                    | `refactor(engine): split ability contracts by domain`    |
| E04   | Typisierte Runtime-Port-Grundlage                       | Engine-Typecheck, Runtime-Domain-Tests                       | `refactor(engine): introduce typed runtime ports`        |
| E05   | State/Economy/Counter/Zone-Cluster migrieren            | Cluster-Tests, Engine-Typecheck                              | `refactor(engine): type state runtime cluster`           |
| E06   | Turn/Action/Corp/Card-Lifecycle-Cluster migrieren       | Turn-/Action-/Lifecycle-Tests                                | `refactor(engine): type action runtime cluster`          |
| E07   | Run/Access/Choice/Hidden/Damage/Trace-Cluster migrieren | Hidden-Info-, Run-, Access-, Damage-Tests                    | `refactor(engine): type flow runtime cluster`            |
| E08   | Delegate-Store und Runtime-Zyklen entfernen             | Vollständige Engine-Suite, Strukturguard                     | `refactor(engine): remove runtime delegate store`        |
| E09   | Turn-Domäne aufteilen                                   | Turn-, Tag-, Discard-, Lifecycle-Tests                       | `refactor(engine): split turn runtime domains`           |
| E10   | Event-/Payload-Vertrag normalisieren                    | Chronicle, Hidden Info, Replay, AI-Signale                   | `refactor(engine): normalize event payload contracts`    |
| E11   | Damage-Domäne aufteilen                                 | Damage-/Prevention-/Replacement-Tests                        | `refactor(engine): split damage runtime domains`         |
| E12   | Access-Domäne aufteilen                                 | Access-/Breach-/Visibility-Tests                             | `refactor(engine): split access runtime domains`         |
| E13   | Run-Domäne und Window-Zyklus bereinigen                 | Run-/Window-/Replay-Tests                                    | `refactor(engine): split run window domains`             |
| E14   | Registry und Coverage semantisch strukturieren          | Registry-, Manifest-, Coverage-Checks                        | `refactor(engine): organize card registries by domain`   |
| E15   | Teststruktur und Quellverträge nachziehen               | Testdiscovery, Engine-Suite, Source-Contract-Report          | `test(engine): modularize suites and document contracts` |
| E16   | Vollständige Gates, Final Review und Wissenspflege      | alle Abschlusschecks                                         | `docs(engine): finalize architecture refresh`            |

## Paketdetails und Done-Gates

### E00 Prozessbaseline

Das Prozessartefakt und der Auditbericht liegen versioniert vor. Der Worktree
ist eindeutig, `main` war beim Anlegen sauber und alle Sicherheitsgrenzen sind
dokumentiert.

### E01 Gate-Reparatur

`turn-runtime-resolvers.ts` unterschreitet das bestehende Limit durch eine
fachlich benannte Extraktion. Shell-Traders- und Data-Fort-Reclamation-Reste
werden als generische Sequenz-/Continuation-Verträge benannt. Die Architektur-
und Abstraction-Gates sind ohne pauschale Baseline-Abnahme grün.

### E02 Strukturguard

Ein reproduzierbarer Guard prüft mindestens produktive `any`-Signaturen in der
Runtime-Komposition, zyklische relative Imports, Runtime-Fan-out, Modulgrößen
und verbotene Schichtkanten. Ein Selftest beweist jede Fehlerklasse.

### E03 Ability-Verträge

`definition-types.ts` ist nur noch ein kleiner kompatibler Exportknoten. Die
Vertragsfamilien liegen in klar benannten Modulen; Verhalten und erzeugtes
JavaScript bleiben unverändert.

### E04 bis E08 Runtime-Komposition

Domänenports werden zuerst parallel zur alten Verdrahtung eingeführt und dann
clusterweise produktiv geschaltet. Nach E08 existieren weder dynamischer
Delegate-Store noch untypisierte Delegate-Dateien oder Runtime-Importzyklen.

### E09 bis E13 Domänenmodule

Große Resolver werden entlang stabiler Zustandsmaschinen und
Sicherheitsgrenzen geteilt. Jede Extraktion erhält paketnahe Tests; fachliche
Änderungen sind ausgeschlossen.

### E10 Event-/Payload-Vertrag

Nur aktuelle Producer und Consumer werden erhalten. Versionierte Payloadfelder
ohne aktuellen Nutzen entfallen. PublicEvent, Chronicle, Replay und AI erhalten
einen gemeinsamen typisierten, side-sicheren Vertrag.

Nach dem Abgleich mit `main` auf `b668e339a` bleiben zwei Web-Katalogtests rot.
Beide Fehler sind auf diesem `main`-Stand identisch reproduzierbar und betreffen
die dort neu integrierten AI-Hint-Erwartungen, nicht den E10-Payload-Vertrag.
Engine, KI, Shared, Serverprojektionen und alle E10-fokussierten Webtests sind
auf dem kombinierten Stand grün.

### E11 Damage-Domäne

Der 3.236-zeilige Damage-Monolith ist in sechs azyklisch gerichtete Module mit
maximal 913 Zeilen geteilt. `damage-core.ts` bleibt als 158-zeilige öffentliche
Fassade bestehen; bestehende Aufrufer müssen keine Unterdomänen kennen. Finale
Mutation, Prevention-Quellen und -Kosten, Prevention-Fenster, Replacement sowie
der typisierte Host-/Hilfskontext besitzen getrennte Verantwortlichkeiten.

Die regelrelevante Fensterreihenfolge, der Zeitpunkt des ersten Zufallszugs und
die persistierte Kandidatenreihenfolge sind unmittelbar am Code dokumentiert.
Der Strukturguard verlangt alle sechs Module und begrenzt ihre Größe. Der
vollständige Engine-Lauf mit 1.736 Tests, Engine-Typecheck, Package Boundaries,
Strukturguard und dessen Selftest sind grün.

### E12 Access-Domäne

Die Access-Effect-Datei mit 1.900 Zeilen und der Access-Flow mit 1.441 Zeilen
sind in klar gerichtete Teilmodule aufgeteilt. Der größte produktive Baustein
liegt bei 1.099 Zeilen. Öffentliche Fassaden halten bestehende Runtime-Consumer
stabil; Breach-Lifecycle, Hidden-Info-Freigabe, Steal-/Trash-/Install-Auflösung,
deklarative CardImplementation-Effekte und begrenzte Legacy-Fallbacks besitzen
getrennte Verantwortlichkeiten.

Die Hidden-Info-Barriere am tatsächlichen Reveal und die Exklusivität zwischen
CardImplementation und Legacy-Fallback sind am Code dokumentiert. Der
Strukturguard verlangt die neuen Module und begrenzt ihre Größe. Engine-Suite
mit 1.736 Tests und Engine-Typecheck sind auf dem Paketstand grün.

### E13 Run-Domäne und Window-Zyklus

Der letzte geduldete relative Importzyklus zwischen Fort-Pass-,
After-Passing-Last-Ice- und Run-Window-Modulen ist durch einen niedrigeren
gemeinsamen Port entfernt. Der Strukturguard meldet damit null relative
Importzyklen und besitzt keine Cycle-Ausnahme mehr.

Zusätzlich wurden die Run-Host-Komposition von 1.535 auf 1.168 Zeilen, der
Run-End-Cleanup von 1.553 auf 796 Zeilen und die Successful-Run-Interventionen
von 1.494 auf 898 Zeilen reduziert. Verträge, Counter-/Virus-Trigger und
Followups liegen in klar gerichteten Modulen. Die regelrelevante
Cleanup-Reihenfolge ist am Code dokumentiert; Modulgrenzen und Größen sind im
Strukturguard ausführbar. Engine-Suite mit 1.736 Tests, Engine-Typecheck,
Package Boundaries und Strukturguard sind grün.

### E14 Registry und Coverage

Die 27 nummerierten CardImplementation-Sammelgruppen sind durch 27 fachliche
Subregistries nach Set, Seite und Kartentyp ersetzt. Der Katalog besitzt eine
explizite deterministische Gruppenreihenfolge und erzeugt seine flache Registry
aus genau dieser Quelle. 29 überholte Sammel-/Aggregatdateien wurden entfernt.

Ein neuer Strukturtest beweist Gruppenreihenfolge, Flattening-Parität,
Duplikatfreiheit sowie Set-/Seite-/Typ-Abgleich gegen die Shared CardDefinitions.
Die Coverage-Regelableitung umfasst noch 528 Zeilen; die 855-zeilige explizite
Source-Location-Ausnahmekarte liegt als reines Datenmodul separat. Der
Strukturguard verbietet neue nummerierte Registry-Gruppen und begrenzt beide
Coverage-Module. Die vollständige Engine-Suite umfasst nach dem Main-Abgleich
1.739 grüne Tests.

### E15 Teststruktur und Quellverträge

Zwei Release-Sammeltests mit 8.648 und 4.205 Zeilen sind mechanisch und ohne
Testfalländerung in elf releasebezogene Dateien geteilt. Auf dem nach E14 mit
`main` kombinierten Stand bleiben alle 1.739 Engine-Tests erhalten; die Zahl
physischer Testdateien steigt von 192 auf 201.

Ein neuer Test-Quellvertrag verbietet die alten Sammeldateien, begrenzt die
Release-Smokes auf 3.000 und alle Engine-Testdateien auf 7.000 Zeilen. Mit dem
Vertragstest umfasst der integrierte Stand 202 Testdateien und 1.741 grüne
Tests. Der Source-Contract-Report fasst produktive Modul-, Zyklus-, Port-,
Registry-, Kommentar- und Testverträge samt ausführbaren Gates zusammen.

### Paketdefinition E14: Registry und Coverage

Nummerierte Kartenblöcke werden durch Set-/Side-/Type-Strukturen oder eine
deterministisch generierte äquivalente Registry ersetzt. Parität, Reihenfolge
und Duplikatfreiheit sind ausführbar geprüft.

### Paketdefinition E15: Tests und Kommentare

Große Sammeltests werden mechanisch geteilt. Kommentare dokumentieren nur
Autorität, Sichtbarkeit, Determinismus, Mutationsreihenfolge und andere nicht
offensichtliche Verträge.

### Paketdefinition E16: Abschluss

Audit und Wissensstand zeigen den neuen Current State. Arbeitsbranch und
`main` sind vollständig verifiziert. Nach dem letzten Merge werden Worktree und
gemergter Branch nach den Cleanup-Regeln entfernt.

### E16 Final Review und Abschlussgates

Das Final Review bestätigt die vollständige Umsetzung der Pakete E00 bis E16:
998 produktive Engine-Quellen besitzen null relative Importzyklen und 430
statisch typisierte Runtime-Port-Bindings. Die Engine-Suite umfasst 202
Testdateien mit 1.741 Tests. Architekturziel, Card-Function-Abstraction,
Package Boundaries, Strukturguard samt Selftest, Testdiscovery sowie Engine-,
Shared- und Root-Typecheck sind grün.

Der kombinierte Workspace-Lauf bestätigt zusätzlich 2.760/2.760 KI-Tests,
173/173 Server-Tests und 8/8 Root-Spezifikationstests. Ein nach dem Main-Sync
neu hinzugekommener Servertest prüft nun ausdrücklich, dass die fachliche
Corp-Entscheidung öffentlich bleibt, der interne Ability-Discriminator aber
nicht in `PublicEvents` leakt. Die bereits in E10 dokumentierten zwei
Web-Katalog-Hint-Fehler bleiben mit 633/635 grünen Tests unverändert und sind
auf aktuellem `main` identisch reproduzierbar; sie gehören nicht zum
Engine-Refresh.

Die E16-Dokumente entsprechen Prettier und `git diff --check` ist grün. Der
bestehende 8.000-Zeilen-Servertest bleibt außerhalb einer rein mechanischen
Gesamtformatierung: Eine fünfzeilige Vertragskorrektur rechtfertigt keinen
8.500-Zeilen-Formatierungsdiff in einem fremden Monolithen.

`public-context.ts`, der eingefrorene Runtime-Integrations-Fan-out, der knapp
unter dem Gate liegende Per-Card-Longtail-Test und die manuelle
Coverage-Source-Location-Karte sind im Final Review als begrenzte Folgepunkte
dokumentiert. Sie schwächen weder Regelautorität noch Hidden Info, Replay,
StateHash oder Determinismus und blockieren den Architekturabschluss nicht.

## Verifikationsregeln

Paketstandard:

```text
corepack pnpm --filter @netgrid/engine typecheck
corepack pnpm --filter @netgrid/engine test -- <paketnahe Tests>
git diff --check
```

Milestone- und Abschlusschecks ergänzen:

```text
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/shared typecheck
corepack pnpm check:package-boundaries
corepack pnpm check:engine-cardimplementation-architecture-target
corepack pnpm check:card-function-abstraction
corepack pnpm check:engine-source-structure
corepack pnpm check:engine-source-structure:selftest
corepack pnpm check:test-discovery
corepack pnpm typecheck
```

Bei Payload-/Consumer-Änderungen kommen Chronicle-, AI- und passende
Server-/Webchecks hinzu.

## Worktree-, Git- und Integrationsregeln

- Hauptworkspace: `C:\Projekte\NETGRID`
- Arbeits-Worktree: `C:\Projekte\NETGRID_ENGINE_ARCHITECTURE_REFRESH`
- Integrationsbranch: `main`
- Arbeitsbranch: `codex/engine-architecture-refresh`
- Ein Commit je abgeschlossenem Paket.
- Nach jedem Paket bidirektionaler, verifizierter Abgleich mit `main` gemäß
  State Machine.
- Kein `reset --hard`, kein pauschales Revert fremder Änderungen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

Arbeite E00 bis E16 vollständig und sequenziell im festgelegten Worktree ab.
Arbeite immer nur am aktuellen Paket, verifiziere und committe es. Integriere
danach aktuelles `main` in den Arbeitsbranch, verifiziere, merge das Paket nach
`main`, prüfe `main` und gleiche `main` wieder in den Arbeitsbranch ab. Erhalte
bei Konflikten beide kompatiblen fachlichen Intentionen. Stoppe nur bei einem
Sicherheitsblocker. Markiere den Prozess erst nach vollständigen Abschlussgates,
Main-Merge und verifiziertem Worktree-/Branch-Cleanup als abgeschlossen.

## Abschlusskriterien

- Alle Pakete E00 bis E16 sind einzeln committed und nach `main` integriert.
- Alle Architektur-, Typ-, Test-, Hidden-Info-, Replay- und StateHash-Gates
  sind grün.
- Runtime-Komposition besitzt keine dynamischen, untypisierten Delegate-Grenzen.
- Erkannte Runtime-Zyklen und neue Domänenmonolithen sind beseitigt.
- Current-State-Dokumentation und Final Review sind aktualisiert.
- Arbeits-Worktree und gemergter Branch sind entfernt und die Entfernung ist
  in Git und Dateisystem verifiziert.
