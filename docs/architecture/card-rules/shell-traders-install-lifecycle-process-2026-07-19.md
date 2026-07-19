# The Shell Traders: Installations-Lifecycle-Korrektur

## Status

`lifecycle_fixed`

## Quelle und Vorgabe

- Nutzerbefund vom 2026-07-19: Zwei installierte Kopien von `The Shell
Traders` entfernen zu Beginn des Runner-Zuges die letzten zwei
  Shell-Counter von `Cloak`. `Cloak` wird als Programmeinheit installiert,
  erhält aber nicht die drei aufgedruckten Credits.
- Aktiver Kartenvertrag:
  `data/cards/originalset-v1-cards.json` und
  `packages/engine/src/card-implementations/onr-v1/runner/programs/cloak.ts`.
- Regelreferenz:
  `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`,
  Regel 8.5.16f: Bei einer Installation erfüllen alle anwendbaren
  „When installed...“-Fähigkeiten ihre Triggerbedingungen, einschließlich
  der Fähigkeiten auf der installierten Karte.
- Ergänzende Errata:
  `docs/source/Netrunner Errata 1.70.md`: `The Shell Traders` installiert die
  vorbereitete Karte nach dem letzten Counter verpflichtend; „at no cost“
  erlässt nur die regulären Installations-Credits.
- Architekturvorgeschichte:
  `docs/architecture/engine/runner-install-finalizer-process-2026-06-28.md`
  dokumentierte ausdrücklich, dass der gemeinsame Runner-Rig-Finalizer den
  Zustandsabschluss kapselt, der Shell-Traders-Pfad damals aber noch keinen
  neuen `on_install`-Lifecycle erhielt.

## Zielprüfung

Die Vorgabe ist für eine automatische Umsetzung ausreichend präzise. Der
Regelvertrag, die reproduzierbare Codeursache, der betroffene Spezialpfad und
die notwendigen Tests sind bestimmbar. Die Korrektur bleibt auf die
Lifecycle-Vervollständigung echter Shell-Traders-Installationen begrenzt.

## Gesamtziel

Jede über `The Shell Traders` nach Entfernung des letzten Shell-Counters
erfolgreich installierte Programm- oder Hardwarekarte durchläuft genau einmal
ihren normalen `on_install`-Lifecycle. `Cloak` erhält dadurch unmittelbar bei
der Installation drei nutzungsbeschränkte Credits, unabhängig davon, ob der
letzte Counter bezahlt, zu Zugbeginn durch eine einzelne Shell-Traders-Kopie
oder zu Zugbeginn durch die zweite von mehreren Kopien entfernt wurde.

## Annahmen

- Die kostenlose Installation überspringt nur die regulären
  Installations-Credits, nicht Installationsfähigkeiten oder zusätzliche
  Kosten.
- `on_install` wird erst nach der erfolgreichen Bewegung in die Runner-Rig
  ausgeführt; bei einer offenen MU-Überschreibwahl noch nicht.
- Die vorhandene Immediate-Lifecycle-Runtime bleibt die einzige ausführende
  Instanz für deklarative `on_install`-Effekte.
- Der bestehende Shell-Traders-Payload, die Startzugfortsetzung und die
  Countersemantik bleiben erhalten, soweit die neue Lifecycle-Ausführung
  keine zusätzliche öffentliche Effektdokumentation verlangt.
- Version 0 benötigt keine Migration alter lokaler Matchzustände oder Replays.

## Nicht-Ziele

- Keine Änderung der Shell-Counter-Anzahl, Kosten oder Timingfenster.
- Keine Änderung an Cloaks Zahlungsfiltern oder Startzug-Refresh.
- Kein UI-Redesign, keine clientseitige Regellogik und keine KI-Anpassung.
- Keine allgemeine Neugestaltung aller Installationspfade oder des
  Runner-Rig-Finalizers.
- Keine Remote-Integration, kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt einzige Regelautorität.
- `LegalActions` und `applyAction` revalidieren weiterhin Seite, Action-ID,
  State-Version, Timing, Quelle, Ziel, Kosten und Choices.
- Hidden-Info-Grenzen, PublicEvents, Replay und StateHash bleiben
  deterministisch und side-sicher.
- Jede erfolgreiche Shell-Traders-Installation führt `on_install` genau
  einmal aus; eine noch nicht abgeschlossene MU-Wahl führt ihn nicht aus.
- Kein Paketabschluss ohne relevante Checks, `git diff --check`, paketgenaues
  Staging und eigenen Commit.

## Automatische Fehlerbehandlung

- Der neue Regressionstest darf in Paket STIL-01 ausschließlich wegen des
  nachgewiesenen fehlenden `on_install`-Aufrufs rot sein. Diese erwartete rote
  Reproduktion ist das Done-Gate des Testpakets.
- Sonstige rote fokussierte Tests werden innerhalb des aktiven Pakets eng
  analysiert und behoben; kein Wechsel zum nächsten Paket.
- Weitergelaufenes `main` wird vor der finalen Integration defensiv in den
  Arbeitsbranch eingebunden. Kompatible Intentionen bleiben erhalten.
- Follow-ups werden dokumentiert und erweitern den aktuellen Scope nicht
  stillschweigend.

## Sicherheitsblocker

Der Prozess stoppt, wenn der Fix nur durch eine zweite Lifecycle-Engine,
abgeschwächte Revalidierung, Hidden-Info-Leaks, nicht deterministische
Startzugreihenfolge oder doppelte Installationsauslösung möglich wäre. Die
Removal Condition ist ein einzelner, side-sicherer und deterministischer
Lifecycle-Einstieg nach erfolgreicher Shell-Traders-Installation.

## State Machine

`preflight -> process_committed -> regression_reproduced -> lifecycle_fixed -> final_review -> main_sync -> main_merge -> cleanup -> complete`

Bei einem nicht erfüllten Done-Gate bleibt der Prozess im aktuellen Zustand.

## Paketfortschritt

- STIL-00: abgeschlossen mit Prozessartefakt, Goal, Branch und Worktree.
- STIL-01: Der fokussierte Lauf umfasst 33 Tests. 30 bestehende Tests sind
  grün; genau die drei neuen Lifecycle-Verträge reproduzieren den Defekt mit
  `Cloak`-Credits `0` statt `3`. Startzug mit zwei Shell-Traders-Kopien,
  bezahlter letzter Counter und MU-Choice sind gleichermaßen betroffen.
- STIL-02: Der Shell-Traders-Abschluss ruft nach erfolgreicher
  Rig-Installation den bestehenden deklarativen `on_install`-Interpreter auf.
  Der automatische Startzugpfad übernimmt dessen sichtbare Effekte in den
  bestehenden Collector; Paid- und Choice-Pfade dokumentieren sie auf ihrer
  LegalAction. 43 fokussierte Tests, Engine-Typecheck, Paketgrenzen, Format und
  Diff-Check sind grün.

## Paketfolge

| Paket   | Titel                         | Ergebnis                                                                                 |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| STIL-00 | Prozess und Worktree          | Verbindliches Artefakt, Goal, eigener Branch und Worktree                                |
| STIL-01 | Regelvertrag und Regressionen | Reproduzierter Cloak-Fehler für Startzug- und Paid-Pfad sowie Schutz des MU-Choice-Pfads |
| STIL-02 | Lifecycle-Korrektur           | Erfolgreiche Shell-Traders-Installationen führen genau einmal `on_install` aus           |
| STIL-03 | Abschluss und Dokumentation   | Final Review, Wissenslog und breite Verifikation sind abgeschlossen                      |

## Paketdetails

### STIL-00 – Prozess und Worktree

- Ziel: kontrollierte Ausführungsgrundlage schaffen.
- Eingangsvoraussetzungen: sauberer `main`, freier Zielbranch und Zielpfad.
- Konkrete Arbeit: Goal, Worktree, Branch und dieses Prozessartefakt anlegen.
- Kernartefakt: diese Datei.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: Prozessartefakt committed, Worktree sauber.
- Commit: `docs(engine): plan Shell Traders install lifecycle fix`.

### STIL-01 – Regelvertrag und Regressionen

- Ziel: den Nutzerbefund und die kritischen Auflösungswege als präzisen
  Engine-Vertrag reproduzieren.
- Eingangsvoraussetzungen: STIL-00 abgeschlossen.
- Konkrete Arbeit:
  - Zwei Shell-Traders-Kopien entfernen zu Beginn eines Zuges die letzten
    zwei Counter; `Cloak` wird installiert und erhält sofort drei Credits.
  - Die bezahlte Entfernung des letzten Counters installiert `Cloak` und
    führt denselben Lifecycle aus.
  - Bei MU-Mangel bleibt der Lifecycle bis nach einer erfolgreichen
    Programmtrash-Choice aus und wird anschließend genau einmal ausgeführt.
  - Replay und StateHash bleiben für mindestens den Startzugpfad stabil.
- Kernartefakte: bestehende Shell-Traders-Testfamilie unter
  `packages/engine/src/index-tests/originalset/`.
- Checks: fokussierter Vitest-Lauf, `git diff --check`.
- Done-Gate: Der neue Sollvertrag ist vollständig testbar; vor STIL-02 ist
  ausschließlich die erwartete fehlende Credit-Befüllung rot.
- Commit: `test(engine): cover Shell Traders install lifecycle`.

### STIL-02 – Lifecycle-Korrektur

- Ziel: den normalen deklarativen `on_install`-Lifecycle in den bestehenden
  Shell-Traders-Abschluss einbinden.
- Eingangsvoraussetzungen: STIL-01 committed und Defekt reproduziert.
- Konkrete Arbeit:
  - `RunnerSpecialTriggerExecutionHost` erhält einen engen Lifecycle-Port.
  - `installDelayedPreparedCardForFree` führt nach erfolgreicher
    Rig-Installation genau einmal `on_install` aus.
  - Paid-, Startzug- und MU-Choice-Pfad verwenden denselben Abschluss.
  - Keine duplizierte Cloak-Sonderlogik und kein neuer Kartenname im
    generischen Resolver.
- Kernartefakte:
  `packages/engine/src/game/abilities/runner-special-trigger-execution.ts`
  und die zugehörige Runtime-Host-Verdrahtung.
- Checks: fokussierte Regressionen, Engine-Typecheck, Paketgrenzen,
  `git diff --check`.
- Done-Gate: Alle STIL-01-Tests und bestehenden Shell-Traders-Tests sind grün;
  Lifecycle wird nachweislich genau einmal ausgeführt.
- Commit: `fix(engine): run install lifecycle for Shell Traders targets`.

### STIL-03 – Abschluss und Dokumentation

- Ziel: belastbaren und nachvollziehbaren Abschluss herstellen.
- Eingangsvoraussetzungen: STIL-02 abgeschlossen.
- Konkrete Arbeit: Final Review anlegen, Prozessstand und Projektlog
  aktualisieren, breite risikogerechte Checks ausführen.
- Kernartefakte: dieses Prozessartefakt,
  `docs/reviews/engine/shell-traders-install-lifecycle-final-review-2026-07-19.md`
  und `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`.
- Checks: vollständige Engine-Tests, Engine-Typecheck, Format-/Boundary-Checks,
  `git diff --check`.
- Done-Gate: erforderliche Checks sind grün oder ein vorbestehender,
  reproduzierbarer Fremdfehler ist mit Baselinevergleich dokumentiert;
  Abschlussartefakte sind committed und der Worktree ist sauber.
- Commit: `docs(engine): close Shell Traders install lifecycle fix`.

## Verifikationsregeln

- STIL-01/STIL-02 fokussiert:
  `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/runner-events-hardware-programs-resources.test.ts --maxWorkers=1`.
- STIL-02 mindestens:
  `corepack pnpm --filter @netgrid/engine typecheck` und
  `corepack pnpm check:package-boundaries`.
- STIL-03 mindestens:
  `corepack pnpm --filter @netgrid/engine test`,
  `corepack pnpm --filter @netgrid/engine typecheck`,
  `corepack pnpm format:changed`,
  `corepack pnpm check:package-boundaries` und `git diff --check`.
- Nach einem Main-Abgleich werden die fokussierten Regressionen und der
  Engine-Typecheck erneut ausgeführt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree:
  `C:\Projekte\NETGRID_SHELL_TRADERS_INSTALL_LIFECYCLE`.
- Arbeitsbranch: `codex/shell-traders-install-lifecycle`.
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für den finalen
  lokalen Merge.
- Nach jedem Paket werden nur paketzugehörige Dateien gestaged und committed.
- Vor dem finalen Merge wird aktuelles `main` in den Arbeitsbranch integriert,
  falls es weitergelaufen ist.
- Der Arbeitsbranch wird bevorzugt per Fast-Forward nach `main` gemergt.
- Nach erfolgreichem Merge werden Worktree und Branch ohne Force entfernt;
  Git-Registrierung und Dateisystem werden separat geprüft.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite die The-Shell-Traders-Installations-Lifecycle-Korrektur vollständig und sequenziell von STIL-00 bis STIL-03 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis, packages/engine/AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_SHELL_TRADERS_INSTALL_LIFECYCLE auf Branch codex/shell-traders-install-lifecycle. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe einen Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, aktuelles main integrieren, lokal nach main mergen, main prüfen, den sauberen Arbeits-Worktree verifiziert entfernen, den gemergten Branch löschen und das Goal erst dann als complete markieren.`

## Abschlusskriterien

- Der konkrete Zwei-Shell-Traders-/Cloak-Nutzerbefund ist testgedeckt.
- Paid-, Startzug- und MU-Choice-Auflösung führen bei erfolgreicher
  Installation genau einmal den normalen `on_install`-Lifecycle aus.
- `Cloak` erhält unmittelbar drei Credits und wartet nicht auf den nächsten
  Startzug-Refresh.
- Hidden-Info-, LegalAction-, Replay- und StateHash-Verträge bleiben geschützt.
- Alle Pakete sind einzeln committed.
- Der Arbeitsbranch ist lokal nach `main` gemergt.
- Arbeitsworktree und gemergter Branch sind verifiziert entfernt.
