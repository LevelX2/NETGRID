# Windows-Release-Vorbedingungen

Status: `package_verified` (`WRP-00`)
Stand: 2026-09-03
Quelle: Nutzerauftrag zur Vorbereitung eines späteren geführten
Windows-Installers ohne vorgezogene Installerimplementierung

## Zielprüfung

Die Vorgabe ist für eine automatische, sequenzielle Umsetzung ausreichend
präzise. Der erwartete Endzustand ist ein installerneutraler,
reproduzierbarer Produktionsoutput mit harter Produkt-/Entwicklungsgrenze,
isolierbaren Datenpfaden und ausführbaren Inhalts- und Startgates. Der
eigentliche Windows-Installer bleibt ausdrücklich außerhalb dieses Prozesses.

Kleine Detailentscheidungen werden konservativ innerhalb der bestehenden
Architektur getroffen. Produktfunktionalität wie KI-vs-KI, Standarddecks,
lokalisierte Spieleroberfläche und lokale Maintenance darf nicht versehentlich
als Entwicklungsumfang entfernt werden.

## Gesamtziel

NETGRID erhält eine belastbare Releasegrenze, auf der ein späterer
Windows-Installer ohne Repository, Git, pnpm, `tsx`, Testdatenbanken,
Selfplay-Evidence oder private lokale Artefakte aufsetzen kann. Produktive
Datenautoritäten und Runtime-Entry-Points sind von Test-, Benchmark- und
Entwicklungsflächen getrennt. Veränderliche Daten liegen außerhalb des
unveränderlichen Produktoutputs. Ein maschinenlesbarer positiver
Auslieferungsvertrag und ein Negativgate verhindern, dass lokale oder
entwicklungsbezogene Inhalte in ein Release gelangen.

## Annahmen

- `main` bleibt der lokale Integrationsbranch.
- Der Arbeitsbranch heißt `codex/windows-release-preconditions`.
- Der Arbeits-Worktree liegt unter
  `C:\Projekte\NETGRID-worktrees\windows-release-preconditions`.
- Die sichtbare Produktreife bleibt `V0.9`; dieser Prozess ist kein neues
  Produktrelease.
- Deutsch, Englisch und Französisch bleiben die unterstützten UI-Locales.
- Ein Releaseoutput darf die zur normalen Produktfunktion erforderlichen
  statischen Katalog-, Karten-, Deck-, KI- und Locale-Daten enthalten.
- Versionierte synthetische Eigenassets werden nur aufgenommen, wenn ein
  produktiver Runtimepfad sie ausdrücklich benötigt und der
  Auslieferungsvertrag sie positiv zulässt.
- Persönliche Kartenbilder und IMG07-Pakete bleiben immer außerhalb des
  Hauptoutputs.
- Die engste belastbare Änderung ist einer großflächigen Paket- oder
  Datenreorganisation vorzuziehen.

## Nicht-Ziele

- kein WiX-, MSI-, MSIX- oder Burn-Projekt;
- kein Windows-Dienst, Launcher, Tray-Prozess oder Autostart;
- keine Firewallregel oder Netzwerkprofiländerung;
- keine Codesignatur, Store-Veröffentlichung oder Auto-Update-Funktion;
- keine Mitlieferung offizieller oder privater Kartenbilder;
- keine neue öffentliche Internetbereitstellung;
- keine unbegrenzte Rückwärtskompatibilität alter V0-Datenstände;
- keine Änderung von Spielregeln, KI-Strategie oder Kartenmechanik;
- kein pauschales Verschieben sämtlicher historischer Testdaten nur zur
  optischen Bereinigung des Repositorys.

## Controller-Invarianten

- Die Rules Engine bleibt die einzige Regelautorität.
- Releasegrenzen verändern weder `LegalActions`, `PlayerActions`, Replay,
  StateHash, RNG noch Hidden-Info-Projektionen.
- KI-vs-KI bleibt eine Produktfunktion; Benchmark-, Soak-, Mining- und
  Reportwerkzeuge sind Entwicklung.
- Produktive Entry-Points dürfen keine Test-Fixtures, lokalen Benchmarks oder
  Selfplay-Reports transitiv laden.
- Produktcode darf keine notwendige Laufzeitautorität aus einem als
  Testfixture klassifizierten Bereich beziehen.
- Der Releaseoutput entsteht ausschließlich aus einer positiven Allowlist.
  Repository-Copy, Glob-Copy oder nachträgliche Blocklistbereinigung sind
  unzulässig.
- `data/runtime`, `data/local`, private Assetpfade, Secrets, Datenbanken und
  Logs dürfen nie Bestandteil des Produktoutputs sein.
- Installierte und lokale Laufzeitdaten werden nicht unter einem
  unveränderlichen Programmverzeichnis erwartet.
- Fehlende Runtime-Daten oder inkonsistente Konfiguration scheitern sichtbar
  und strukturiert; es gibt keinen stillen Entwicklungsfallback.
- Der normale Entwicklerstart über `scripts/start-netgrid.ps1` bleibt bis zu
  einer späteren bewussten Betriebsumstellung funktionsfähig.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktiven Paket ursachenbezogen behoben.
- Unabhängige Baselinefehler werden mit identischem Befehl auf dem
  Ausgangsstand belegt und nicht in den Scope gezogen.
- Ein fehlender Produktvertrag wird explizit ergänzt, nicht durch Kopieren des
  gesamten Repositorybereichs umgangen.
- Erkenntnisse außerhalb des aktiven Pakets werden als Follow-up im
  Prozessartefakt notiert und erweitern das Paket nicht still.

## Sicherheitsblocker

Der Prozess stoppt ohne Fallback, wenn:

- die Trennung eines Entwicklungspfads eine zweite Regel- oder
  KI-Entscheidungsautorität erzeugen würde;
- ein produktiver Pfad nur durch Einbeziehung privater Daten oder nicht
  redistribuierbarer Assets lauffähig wäre;
- eine Pfadänderung auf fremde Runtime-Datenbanken oder laufende
  Hauptinstanzen zugreifen würde;
- ein Konflikt mit weitergelaufenem `main` denselben Release- oder
  Datenvertrag fachlich anders definiert;
- ein Release-Smoke keine isolierten Ports und keinen isolierten Datenroot
  nachweisen kann.

Ein Blockerbericht benennt Ursache, verantwortlichen Pfad und Removal
Condition.

## State Machine

```text
prepared
  -> package_active
  -> package_verified
  -> package_committed
  -> next_package | final_verification
  -> main_synchronized
  -> merged_to_main
  -> worktree_removed
  -> branch_removed
  -> complete
```

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Jedes Paket wird erst
nach fokussierten Checks, `git diff --check`, dokumentiertem Ergebnis und
eigenem Commit abgeschlossen.

## Paketfolge

| Paket | Titel | Ergebnis |
| --- | --- | --- |
| WRP-00 | Prozess und Releaseinventar | Klassifikation und belastbarer Ist-Nachweis |
| WRP-01 | Produktive Datenautoritäten | Laufzeitdaten sind von Test-/Analyseevidence getrennt |
| WRP-02 | Runtime-Entry-Points | Produktgraph lädt keine Benchmark-/Selfplay-Werkzeuge transitiv |
| WRP-03 | Testset- und Demo-Grenze | Entwicklungsinhalte sind im normalen Releaseprofil unerreichbar |
| WRP-04 | Datenroot und Pfadvertrag | Veränderliche Daten sind zentral und extern bindbar |
| WRP-05 | Installerneutraler Produktionsbuild | Web und Server laufen ohne Entwicklungswerkzeuge |
| WRP-06 | Positives Releasemanifest | Nur explizit erlaubte Inhalte gelangen in den Output |
| WRP-07 | Isolierter Produktions-Smoke | Frischer Datenroot und Produktfunktionen sind verifiziert |
| WRP-08 | Abschluss und Handoff | Current-State-Dokumentation und spätere Installergrenze sind konsolidiert |

## Paketdetails

### WRP-00 – Prozess und Releaseinventar

- Ziel: Aktuelle produktive, optionale, Entwicklungs-, Test-, lokale und
  private Daten-/Codeflächen maschinenlesbar klassifizieren.
- Eingangsvoraussetzungen: sauberer Arbeits-Worktree auf aktuellem `main`.
- Arbeit: Produktionsimporte, versionierte Daten, lokale Ignore-Grenzen,
  Assets, Paketexports und Startpfade inventarisieren; initialen
  Releasegrenzenvertrag und selbstprüfendes Inventargate anlegen.
- Kernartefakte: dieses Prozessartefakt, Releaseklassifikation und Auditgate.
- Tests/Checks: Audit-Selbsttest, aktueller Auditlauf, `git diff --check`.
- Done-Gate: jeder relevante Top-Level-Datenbereich ist klassifiziert und die
  bekannten verbotenen lokalen Kategorien werden maschinell erkannt.
- Commit: `docs(release): define windows release preconditions`

### WRP-01 – Produktive Datenautoritäten

- Ziel: Produktiv benötigte JSON-Autoritäten besitzen einen eindeutig
  produktiven Ort und werden nicht aus Szenario-/Benchmarkflächen geladen.
- Eingangsvoraussetzungen: WRP-00 abgeschlossen.
- Arbeit: direkt produktiv importierte Support-, KI- und Deckdaten
  klassifizieren; irreführende Testpfade minimal umziehen oder über einen
  produktiven Datenentrypoint kapseln; Generatoren und Gates nachführen.
- Kernartefakte: betroffene Daten, Produktimporte und Erzeugungsskripte.
- Tests/Checks: betroffene Katalog-, KI-, Deck- und Generierungsgates.
- Done-Gate: normale Runtimeimporte verweisen nicht auf als Testfixture oder
  Entwicklungsanalyse klassifizierte Dateien.
- Commit: `refactor(release): separate product runtime data`

### WRP-02 – Runtime-Entry-Points

- Ziel: KI-vs-KI und Side-Safety bleiben produktiv verfügbar, ohne
  Benchmark-, Soak-, Mining- oder Reportmodule zu laden.
- Eingangsvoraussetzungen: WRP-01 abgeschlossen; KI-Architektur-Preflight
  gelesen.
- Arbeit: schmalen Produkt-Simulationseinstieg definieren; Serverimporte
  umstellen; bestehende Entwicklungs-Simulation als getrennten Einstieg
  erhalten; Reachability-Gate ergänzen.
- Kernartefakte: `packages/ai`, Serverimporte und Strukturgates.
- Tests/Checks: AI-Source-Reachability, fokussierte Server-Simulations- und
  Side-Safety-Tests, betroffene Typechecks.
- Done-Gate: der Server-Produktgraph erreicht nur die für Produkt-Simulation
  benötigten Module und Daten.
- Commit: `refactor(ai): isolate product simulation entrypoint`

### WRP-03 – Testset- und Demo-Grenze

- Ziel: Testkarten, synthetische Demo-Decks und zugehörige Assets werden in
  einem Releaseprofil nicht ausgeliefert oder aktiviert.
- Eingangsvoraussetzungen: WRP-02 abgeschlossen.
- Arbeit: Runtime- und Testentrypoints prüfen und minimal trennen;
  Releaseprofil fail-closed gegen Testkartenaktivierung machen; Demo- und
  Testasset-Abhängigkeiten im Releasemanifest verbieten; normale echte
  Originalset-Defaults erhalten.
- Kernartefakte: Shared-/Engine-/Cards-/Web-Grenzen und Releaseaudit.
- Tests/Checks: Testkartenverfügbarkeits-, Registry-, Matchstart- und
  Releaseaudit-Tests.
- Done-Gate: Testumfang bleibt für Entwicklung verfügbar, ist im erzeugten
  Produktoutput aber nachweislich abwesend und nicht aktivierbar.
- Commit: `refactor(runtime): harden test content boundary`

### WRP-04 – Datenroot und Pfadvertrag

- Ziel: Alle veränderlichen serverseitigen Pfade können zentral an einen
  absoluten, isolierten Datenroot gebunden werden.
- Eingangsvoraussetzungen: WRP-03 abgeschlossen.
- Arbeit: zentralen serverseitigen Pfadresolver einführen; SQLite, Backups,
  Logs, Maintenance-Auth und Kartenbilddaten konsistent binden;
  Repositorydefaults nur im Entwicklungsprofil erhalten; Roots und
  Dateisystemwurzeln fail-closed validieren.
- Kernartefakte: Serverpfadmodul, Storage-/Maintenance-/Log-Konfiguration und
  Runbook.
- Tests/Checks: Pfadauflösungs-, Storage-, Maintenance- und
  Internet-Hardening-Fokustests; Server-Typecheck.
- Done-Gate: zwei isolierte Roots können ohne Querverweise konfiguriert werden;
  kein installierter Pfad benötigt Schreibzugriff im Programmbaum.
- Commit: `refactor(server): centralize runtime data paths`

### WRP-05 – Installerneutraler Produktionsbuild

- Ziel: Ein reproduzierbarer Web-/Server-Produktoutput startet ohne pnpm,
  `tsx`, Git oder Repositoryquellen.
- Eingangsvoraussetzungen: WRP-04 abgeschlossen.
- Arbeit: Server-Emit-Build definieren; Next-Standalone-Output konfigurieren;
  notwendige statische Assets explizit übernehmen; Runtimekonfiguration von
  Buildmetadaten trennen; Buildskript für einen isolierten Stagingbereich
  erstellen.
- Kernartefakte: Paket-Buildkonfiguration, Produktionsstart und Buildskript.
- Tests/Checks: betroffene Typechecks, Server-Emit, Next-Produktionsbuild,
  Start aus verschobenem Outputverzeichnis.
- Done-Gate: Produktionsprozesse benötigen nur den Output, eine gebündelte
  kompatible Node-Laufzeit und externe Konfiguration/Datenpfade.
- Commit: `build(release): add installer-neutral production output`

### WRP-06 – Positives Releasemanifest

- Ziel: Der Produktionsoutput wird ausschließlich aus explizit erlaubten
  Dateien erzeugt und vollständig auditiert.
- Eingangsvoraussetzungen: WRP-05 abgeschlossen.
- Arbeit: maschinenlesbares Manifest, positive Copylogik, Hashinventar,
  Größenübersicht und Negativprüfungen ergänzen; verbotene Muster für DBs,
  lokale Daten, Tests, Reports, private Assets, Secrets und absolute Pfade
  sichern.
- Kernartefakte: Releasemanifest, Builder und Audit.
- Tests/Checks: Audit-Selbsttests mit absichtlich verbotenen Fixtures,
  tatsächlicher Outputaudit, `git diff --check`.
- Done-Gate: Hinzufügen einer beliebigen verbotenen Datei zum Staging führt zu
  einem reproduzierbaren Gatefehler.
- Commit: `build(release): enforce positive artifact manifest`

### WRP-07 – Isolierter Produktions-Smoke

- Ziel: Der Output funktioniert mit leerem temporären Datenroot auf isolierten
  Ports.
- Eingangsvoraussetzungen: WRP-06 abgeschlossen.
- Arbeit: Smoke-Harness für Start, Health, leere SQLite-Initialisierung,
  Standarddaten, Human-vs-KI-/KI-vs-KI-Kernpfad und Neustartpersistenz
  ergänzen; ausschließlich selbst gestartete Prozesse beenden.
- Kernartefakte: Smoke-Harness und fokussierte Produktfixtures.
- Tests/Checks: Releasebuild, Inhaltsaudit und Smoke auf freien Nichtstandardports.
- Done-Gate: kein Zugriff auf Repository-Runtime, lokale SQLite-Dateien oder
  Standardports; alle Smoke-Schritte grün und Cleanup verifiziert.
- Commit: `test(release): verify isolated production bundle`

### WRP-08 – Abschluss und Handoff

- Ziel: Der neue Current State ist dokumentiert und die verbleibende
  Windows-spezifische Arbeit eindeutig abgegrenzt.
- Eingangsvoraussetzungen: WRP-07 abgeschlossen.
- Arbeit: Architektur-/Runbookstatus konsolidieren; Prozessstatus und
  Abschlusskriterien aktualisieren; spätere Installerabhängigkeiten als
  kompakten Handoff festhalten.
- Kernartefakte: Windows-Releasearchitektur, Runbook und `CODEX_STATUS.md`.
- Tests/Checks: Dokumentlinks, relevante Releasegates, `git diff --check`.
- Done-Gate: ein späterer Installer konsumiert nur den geprüften
  Produktoutput und muss keine Fach-, Daten- oder Testgrenze neu definieren.
- Commit: `docs(release): finalize installer preconditions`

## Verifikationsregeln

- Während der Pakete nur direkt änderungsnahe Tests und Strukturchecks.
- AI-Fokustests erhalten ein äußeres Zeitfenster von mindestens 180 Sekunden.
- Breite Workspace-, Shard- und E2E-Läufe werden nicht vorsorglich gestartet.
- Produktionsbuild und isolierter Release-Smoke sind wegen ihres direkten
  Scopes für WRP-05 bis WRP-07 verpflichtend.
- Jeder Paketabschluss enthält `git diff --check`.
- Bestehende unabhängige Baselinefehler werden getrennt nachgewiesen.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich im festgelegten Arbeits-Worktree arbeiten.
- Genau ein Paket aktiv halten und jedes Paket separat committen.
- Fremde Änderungen und andere Worktrees nicht verändern.
- Vor dem finalen Merge aktuelles `main` in den Arbeitsbranch integrieren,
  sofern es weitergelaufen ist.
- Konflikte inhaltlich und unter Erhalt kompatibler Intentionen lösen.
- Nach finaler fokussierter Verifikation lokal nach `main` mergen.
- Danach Status und Diff auf `main` prüfen, den sauberen Arbeits-Worktree
  entfernen, Git- und Dateisystementfernung verifizieren und den gemergten
  Branch mit `git branch -d` löschen.
- Kein Push und keine Pull-Request-Erstellung.

## Controller-Prompt-Kern

```text
/Goal Arbeite die Windows-Release-Vorbedingungen vollständig und sequenziell
von WRP-00 bis WRP-08 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, docs/codex/CODEX_STATUS.md, die
paketlokalen Agentenanweisungen und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree
C:\Projekte\NETGRID-worktrees\windows-release-preconditions auf Branch
codex/windows-release-preconditions. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe
änderungsnahe Checks aus, dokumentiere den Stand und committe jedes
abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe ohne Fallback und
schreibe einen Blockerbericht mit Removal Condition. Nach Abschluss gleiche
aktuelles main ab, verifiziere die direkt betroffenen Pfade, merge lokal nach
main, prüfe main, entferne den sauberen Worktree und verifiziere seine
Entfernung in Git und Dateisystem, lösche den gemergten Arbeitsbranch und
markiere das Goal erst dann als complete.
```

## Abschlusskriterien

- WRP-00 bis WRP-08 sind in Reihenfolge abgeschlossen und je Paket committed.
- Produktive Runtime- und Datenautoritäten sind von Entwicklungsflächen
  getrennt.
- Persönliche Spieldaten, Testspiele, Selfplay-Evidence, private Assets,
  Secrets und lokale Pfade sind im Produktoutput nachweislich abwesend.
- Produktive KI-vs-KI-Funktion lädt keine Benchmark-/Selfplay-Werkzeuge.
- Testset und Demo-Inhalte sind im Entwicklungsprofil nutzbar, aber im
  Releaseoutput nicht vorhanden oder aktivierbar.
- Veränderliche Daten können vollständig außerhalb des Produktbaums liegen.
- Web und Server besitzen einen installerneutralen Produktionsoutput.
- Positives Manifest, Negativgate und isolierter Produktions-Smoke sind grün.
- Spätere Windows-spezifische Arbeit ist dokumentiert, aber nicht vorgezogen.
- Arbeitsbranch ist lokal in `main` integriert.
- Arbeits-Worktree und gemergter Branch sind entfernt und doppelt verifiziert.

## Fortschritt

- [x] WRP-00 – Prozess und Releaseinventar
- [ ] WRP-01 – Produktive Datenautoritäten
- [ ] WRP-02 – Runtime-Entry-Points
- [ ] WRP-03 – Testset- und Demo-Grenze
- [ ] WRP-04 – Datenroot und Pfadvertrag
- [ ] WRP-05 – Installerneutraler Produktionsbuild
- [ ] WRP-06 – Positives Releasemanifest
- [ ] WRP-07 – Isolierter Produktions-Smoke
- [ ] WRP-08 – Abschluss und Handoff

### Paketnachweise

- WRP-00: Der maschinenlesbare Vertrag
  `scripts/release-product-boundary.json` klassifiziert aktuell 12 produktive
  Runtime-Daten, 70 optionale Produktassets und 484 Entwicklungsartefakte.
  `check:release-boundary` bestätigt, dass weder lokale Runtimepfade noch
  SQLite-Dateien oder private Scans versioniert sind. Der zugehörige
  Negativ-Selbsttest erkennt eine verbotene Runtime-Datenbank und eine
  unklassifizierte Datendatei zuverlässig.
