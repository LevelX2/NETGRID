# The Shell Traders: MU- und Programmtrash-Korrektur

## Status

`implementing`

## Quelle und Vorgabe

- Nutzerbefund vom 2026-07-17 im aktiven Match
  `match_8107a9dffe8cd234`, State-Version 208.
- Livezustand: Runner bei 4/4 MU, `Rent-I-Con` mit 2 MU in der Grip,
  zwei installierte `The Shell Traders`; die Engine erzeugt keine
  Shell-Traders-Vorbereitungsaktion für `Rent-I-Con`.
- Gedruckter und erratierter Vertrag in
  `docs/source/Netrunner Errata 1.70.md`: Ein Programm oder Hardware darf aus
  der Hand beiseitegelegt werden; fehlende MU werden erst bei der
  verpflichtenden Installation nach Entfernung des letzten Shell-Counters
  durch Überschreiben installierter Programme aufgelöst.
- Bestehender Projektvertrag in
  `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/shell-traders-completion-review.md`.

## Zielprüfung

Die Vorgabe ist für eine automatische Umsetzung ausreichend präzise. Ursache,
fachlicher Sollvertrag, betroffene Engine-Familie und erwartete Tests sind
bestimmbar. Die Umsetzung bleibt auf den bestehenden Shell-Traders-Pfad und
die vorhandene Runner-Programmtrash-Choice begrenzt.

## Gesamtziel

`The Shell Traders` darf jedes grundsätzlich passende Runner-Programm oder
jede passende Runner-Hardware aus der Grip vorbereiten, ohne die aktuell freie
MU bereits beim Beiseitelegen vorauszusetzen. Wird der letzte Shell-Counter
von einem Programm entfernt und reicht die MU dann nicht aus, muss die Engine
eine verpflichtende, side-sichere Runner-Choice zum Überschreiben genügend
vieler installierter Programme öffnen und die vorbereitete Karte anschließend
kostenlos installieren.

## Annahmen

- Die bestehende generische Runner-Programmtrash-vor-Installations-Choice wird
  wiederverwendet oder eng erweitert; es entsteht keine zweite konkurrierende
  MU-Choice-Familie.
- Hardware benötigt keine MU und bleibt vom Programmtrash-Pfad unberührt.
- Unique- und sonstige zusätzliche Installationsbeschränkungen bleiben
  bestehen und werden erst am jeweils fachlich richtigen Zeitpunkt geprüft.
- Der aktuelle Version-0-Stand braucht keine Rückwärtskompatibilität für
  laufende alte Replay- oder lokale Runtime-Daten.

## Nicht-Ziele

- Kein UI-Redesign und keine clientseitige Legalitätslogik.
- Keine Änderung an Kartenwerten, Kartenpool, Decklegalität, KI-Bewertung oder
  Shell-Counter-Kosten.
- Keine Verbreiterung der modellierten Paid-Ability-Timingfenster.
- Keine allgemeine Neugestaltung aller Runner-Installationspfade.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt einzige Regelautorität.
- `LegalActions` und `applyAction` revalidieren Seite, State-Version, Quelle,
  Ziel, Timing, Kosten und Choices.
- Vor dem Beiseitelegen bleibt die Zielidentität runner-privat; nach Set Aside
  gelten die bestehenden öffentlichen Sichtbarkeitsregeln.
- Replay und StateHash bleiben deterministisch.
- Kein Paketabschluss ohne relevante Checks, `git diff --check` und eigenen
  Commit.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden innerhalb des aktiven Pakets eng analysiert
  und behoben.
- Fremde oder weitergelaufene `main`-Änderungen werden vor dem finalen Merge
  defensiv integriert; kompatible Intentionen bleiben erhalten.
- Follow-ups werden dokumentiert, erweitern aber nicht still den Scope.

## Sicherheitsblocker

Gestoppt wird, wenn die Korrektur nur durch Hidden-Info-Leaks, Aufweichen der
`applyAction`-Revalidierung, nicht deterministische Choices oder einen
fachlichen Konflikt mit einem neueren führenden Regelartefakt möglich wäre.
Die Removal Condition ist dann ein side-sicherer, deterministischer und
fachlich bestätigter Installationsvertrag.

## State Machine

`preflight -> contract_tests -> engine_fix -> final_verification -> main_sync -> main_merge -> cleanup -> complete`

Bei einem roten Done-Gate bleibt der Prozess im aktuellen Zustand.

## Paketfolge

| Paket | Titel | Ergebnis |
| --- | --- | --- |
| P0 | Prozess und Worktree | Verbindliches Artefakt, Goal, eigener Branch und Worktree |
| P1 | Regelvertrag und Regression | Rote Tests reproduzieren Vorbereitung trotz MU-Druck und verpflichtenden Programmtrash beim letzten Counter |
| P2 | Engine-Korrektur | Minimaler Resolver-/Choice-Schnitt erfüllt die neuen Tests |
| P3 | Abschluss und Dokumentation | Reviews/Status aktualisiert, fokussierte und finale Checks grün |

## Paketdetails

### P0 – Prozess und Worktree

- Ziel: kontrollierte Ausführungsgrundlage schaffen.
- Eingang: sauberer `main`, freier Zielbranch und Zielpfad.
- Arbeit: Goal, Worktree, Branch und dieses Prozessartefakt anlegen.
- Kernartefakt: diese Datei.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: Prozessartefakt committed, Worktree sauber.
- Commit: `docs: define Shell Traders MU fix process`.

### P1 – Regelvertrag und Regression

- Ziel: den Livebefund als präzisen Engine-Vertrag reproduzieren.
- Eingang: P0 abgeschlossen.
- Arbeit:
  - Eine installierte Shell-Traders-Kopie bietet bei voller MU ein Programm aus
    der Grip weiterhin als Vorbereitungsziel an.
  - Nach Set Aside darf ein nicht-finaler Counter unter MU-Druck fortschreiten.
  - Beim letzten Counter wird eine verpflichtende Runner-Programmtrash-Choice
    geöffnet; ausreichender Trash installiert das Ziel kostenlos.
  - Ungültige, stale und falsche Choice-Eingaben werden abgelehnt.
- Kernartefakte: fokussierte Engine-Tests in der bestehenden
  Shell-Traders-Testfamilie.
- Checks: betroffene Vitest-Dateien, `git diff --check`.
- Done-Gate: Tests schlagen aus der dokumentierten Ursache rot und sind als
  korrekter Sollvertrag reviewed.
- Commit: `test(engine): cover Shell Traders MU overwrite flow`.

### P2 – Engine-Korrektur

- Ziel: Sollvertrag ohne Neben-Refactoring erfüllen.
- Eingang: P1 committed.
- Arbeit:
  - MU-Prüfung aus der Vorbereitungsziel-Auswahl entfernen.
  - Beim letzten Counter erforderliche Programme über bestehende
    Installations-/Choice-Primitiven auswählen und trashen.
  - Quelle, Ziel und Pending-Choice-Kontext bei Auflösung vollständig
    revalidieren.
  - Set-Aside-Ziel erst nach erfolgreicher Choice final installieren.
- Kernartefakte: Shell-Traders-Resolver und eng benötigte generische
  Choice-/Installationshelfer.
- Checks: fokussierte Engine-Tests, Engine-Typecheck, `git diff --check`.
- Done-Gate: P1-Tests und bestehende Shell-Traders-Tests grün.
- Commit: `fix(engine): resolve Shell Traders installs under MU pressure`.

### P3 – Abschluss und Dokumentation

- Ziel: belastbarer, nachvollziehbarer Abschluss.
- Eingang: P2 committed.
- Arbeit: führenden Abschlussstand und Verifikationsergebnis aktualisieren;
  keine historische Rohreport-Sammlung anlegen.
- Kernartefakte: dieses Prozessartefakt, aktueller Shell-Traders-Review und
  bei Relevanz Projektlog.
- Checks: Engine-Test, Engine-Typecheck, Workspace-Typecheck/Test nach Risiko,
  `git diff --check`.
- Done-Gate: alle erforderlichen Checks grün oder nicht ausgeführte breite
  Checks mit belastbarer Begründung dokumentiert; Worktree sauber.
- Commit: `docs: close Shell Traders MU fix`.

## Verifikationsregeln

- P1/P2 fokussiert:
  `corepack pnpm --filter @netgrid/engine test -- <betroffene Testdateien>`.
- P2 mindestens:
  `corepack pnpm --filter @netgrid/engine typecheck`.
- P3 mindestens:
  `corepack pnpm --filter @netgrid/engine test` und
  `corepack pnpm --filter @netgrid/engine typecheck`.
- Nach Main-Abgleich werden die final relevanten Checks wiederholt.
- Vor jedem Commit: `git diff --check` und paketgenaues Staging.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree:
  `C:\Projekte\NETGRID_SHELL_TRADERS_MU_FIX`.
- Arbeitsbranch: `codex/shell-traders-mu-fix`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für den finalen lokalen Merge.
- Kein Push und kein Pull Request.
- Nach grünem Abschluss aktuelles `main` in den Arbeitsbranch integrieren,
  finale Checks wiederholen und bevorzugt per Fast-Forward nach `main` mergen.
- Danach sauberen Worktree ohne `--force` entfernen, Entfernung in Git und im
  Dateisystem verifizieren und den gemergten Branch mit `git branch -d`
  löschen.

## Controller-Prompt-Kern

Arbeite P0 bis P3 strikt sequenziell im festgelegten Worktree. Stelle keine
Zwischenfragen, solange konservative automatische Fortsetzung möglich ist.
Schließe jedes Paket nur mit dokumentierten Checks, `git diff --check` und
eigenem Commit ab. Stoppe bei Sicherheitsblockern. Markiere das Goal erst nach
erfolgreichem Main-Merge sowie verifizierter Worktree- und Branch-Entfernung
als vollständig.

## Abschlusskriterien

- Der Livebefund ist durch einen Regressionstest abgedeckt.
- Vorbereiten ist nicht mehr von aktuell freier MU abhängig.
- Der letzte Shell-Counter erzwingt bei MU-Mangel eine legale
  Programmtrash-Choice und anschließend die kostenlose Installation.
- Hidden-Info-, Replay-, StateHash-, stale- und illegal-action-Verträge sind
  geschützt.
- Alle Pakete sind einzeln committed.
- Arbeitsbranch ist lokal nach `main` gemergt.
- Arbeitsworktree und gemergter Branch sind verifiziert entfernt.
