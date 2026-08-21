# Startzug-Reihenfolgenneutralität

Status: in_progress

## Quelle/Vorgabe

Playtest-Fund vom 2026-08-21: Zwei installierte `Streetware Distributor`
verlangen am Beginn des Runner-Zuges eine Reihenfolgeauswahl, obwohl beide
Auszahlungen im aktuellen Regelstand beobachtbar dasselbe Ergebnis erzeugen.
Der Nutzer möchte bedeutungslose Reihenfolgefragen automatisch überspringen
und nur bei tatsächlich oder möglicherweise relevanter Reihenfolge wählen.

## Zielprüfung

Die Vorgabe ist für eine konservative automatische Umsetzung präzise genug.
Die Engine kennt bereits die gleichzeitig fälligen Runner-Startquellen, ihre
deterministische Standardsortierung, die erneute Validierung vor jeder
Auflösung sowie die manuelle Auswahl für mehrere Quellen.

## Gesamtziel

NETGRID löst mehrere nachweislich reihenfolgenneutrale Kopien desselben
Runner-Startzugeffekts automatisch in stabiler Reihenfolge auf. Unmarkierte,
gemischte oder anderweitig sensitive Quellen behalten die regelkonforme
Spielerwahl. `Streetware Distributor` nutzt diesen generischen Vertrag.

## Annahmen

- Direkte Umsetzung in diesem Chat ist durch „sinnvoll hier umsetzen“
  freigegeben.
- Die erste Ausbaustufe automatisiert ausschließlich mehrere fällige Kopien
  derselben Kartendefinition.
- Jede fällige Startzugfähigkeit dieser Definition muss den neuen Vertrag
  ausdrücklich tragen.
- Quellen mit zusätzlichen Startzug-Longtails, Zufall, Choices oder anderen
  Turnstartpfaden bleiben manuell.
- Die bestehende sortierte Karteninstanz-ID ist die replay-stabile
  Standardreihenfolge.

## Nicht-Ziele

- Keine allgemeine automatische Äquivalenzanalyse beliebiger Effekte.
- Keine Simulation aller Auflösungspermutationen.
- Keine Nutzereinstellung „immer automatisch“, die relevante Entscheidungen
  verdecken könnte.
- Keine Änderung an Corp-Start-, Run-Start-, KI- oder Serververhalten.
- Keine Karten-ID-Sonderbehandlung in der Runtime.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Reihenfolge- und Regelautorität.
- Fehlt der ausdrückliche Vertrag oder ist eine Quelle nicht eindeutig sicher,
  wird weiterhin die bestehende Runner-Choice erzeugt.
- Vor jeder automatischen Einzelauflösung werden Fälligkeit und Quelle über
  den bestehenden Resolverpfad erneut validiert.
- Automatische Auflösung erzeugt dieselben typisierten Effekte, PublicEvents,
  Replaydaten und StateHash-Mutationen wie manuelle Auflösung.
- Keine Hidden-Info-Fläche wird erweitert.

## Automatische Fehlerbehandlung

- Typ- oder Vertragstest rot: im aktiven Paket eng am CardSpec-/Engine-Vertrag
  korrigieren.
- Regressionstest rot: automatische Klassifizierung enger machen; keinen
  Fallback auf Karten-ID oder stilles Ignorieren einführen.
- Fremde Main-Änderung am selben Vertrag: beide Intentionen prüfen und nur bei
  kompatibler Semantik integrieren.

## Sicherheitsblocker

Ein Blocker liegt vor, wenn die Engine eine Quelle nur durch Karten-ID,
unvollständige Effektinspektion oder eine nicht deterministische Reihenfolge
als sicher einstufen könnte. Removal Condition: ausdrücklicher generischer
Vertrag plus ausführbare Negativtests für unmarkierte und gemischte Quellen.

## State Machine

`prepared -> contract -> runtime -> evidence -> integrated -> cleaned`

Genau ein Zustand beziehungsweise Paket ist aktiv. Bei rotem Done-Gate bleibt
der Prozess im aktuellen Paket.

## Paketfolge

### STOR-00 – Prozess und Vertragsgrenze

- Ziel: Scope, Annahmen und Sicherheitsgrenze versioniert festhalten.
- Eingang: Wiki-, Agenten-, Engine- und Skill-Preflight abgeschlossen.
- Arbeit: dieses Prozessartefakt erstellen und Worktree-Zustand prüfen.
- Kernartefakte: diese Datei.
- Checks: `git diff --check`, `git status --short`.
- Done-Gate: Artefakt vollständig, Worktree eindeutig und sauber bis auf
  Prozessänderungen.
- Commit: `docs: define start-turn order-neutrality process`

### STOR-01 – Deklarativer Fähigkeitsvertrag

- Ziel: eine eng benannte, rein deklarative Kennzeichnung für zwischen Kopien
  reihenfolgenneutrale Lifecycle-Fähigkeiten schaffen.
- Eingang: STOR-00 abgeschlossen.
- Arbeit: CardSpec-/Engine-Typ ergänzen, Projektion und Deskriptoren durch
  fokussierte Tests absichern.
- Kernartefakte: `packages/cards/src/engine/`, CardSpec-Vertragstests,
  Engine-Definitionstests.
- Checks: direkt betroffene Cards-/Engine-Tests und betroffene Typechecks.
- Done-Gate: markierte und unmarkierte Lifecycle-Fähigkeiten bleiben typisiert
  und korrekt projiziert; keine ausführbare Kartenlogik im Vertrag.
- Commit: `feat(cards): declare copy-order-neutral lifecycle effects`

### STOR-02 – Konservative Runner-Startautomatik und Streetware

- Ziel: sichere identische Quellen automatisch, alle anderen Quellen manuell
  auflösen.
- Eingang: STOR-01 abgeschlossen.
- Arbeit: generischen Safe-Classifier und stabilen Resolverpfad ergänzen,
  Streetware markieren, positive und negative Regressionen schreiben.
- Kernartefakte: Runner-Turnstart-Runtime, Streetware-CardSpec, fokussierte
  Engine-Tests.
- Checks: Streetware-Doppelkopie, unmarkierte Doppelkopie, gemischte Quellen,
  relevante bestehende Startreihenfolgetests, Typechecks falls Typoberfläche
  berührt.
- Done-Gate: Streetware erzeugt bei zwei fälligen Kopien keine Order-Choice;
  beide zahlen aus; unklare oder gemischte Fälle erzeugen weiterhin Choice;
  Reihenfolge und Effekte sind deterministisch.
- Commit: `feat(engine): auto-resolve safe duplicate start effects`

### STOR-03 – Dauerhafter Vertrag und Abschluss-Evidence

- Ziel: Current-State-Architektur und Wissenslog knapp nachziehen, temporäres
  Prozessartefakt nach erfüllten Gates entfernen.
- Eingang: STOR-02 abgeschlossen.
- Arbeit: Ability-/Turn-Runtime-Vertrag aktualisieren, Monatslog ergänzen,
  direkt relevante Abschlusschecks dokumentieren und diese Activity entfernen.
- Kernartefakte: `docs/architecture/engine/ability-contract-structure.md`,
  `docs/architecture/engine/turn-runtime-architecture.md`,
  `KI-Wissen-NETGRID/03 Betrieb/Log 2026-08.md`.
- Checks: fokussierte Regressionen erneut, `git diff --check`.
- Done-Gate: wiederverwendbares Wissen liegt dauerhaft im Current State;
  Prozessartefakt hat keine Restfunktion.
- Commit: `docs: record safe start-effect auto-ordering`

## Verifikationsregeln

- Pro Paket nur direkt änderungsnahe Tests und Checks.
- Tests müssen Ergebnis und Sicherheitsgrenze prüfen.
- Kein voller Workspace-, Build-, E2E- oder AI-Lauf ohne neue breite Wirkung.
- Vor jedem Paketcommit `git diff --check`.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_START_TURN_ORDER_NEUTRALITY`
- Branch: `codex/start-turn-order-neutrality`
- Hauptworkspace nur für den finalen lokalen Merge nach `main` verwenden.
- Jedes Paket erhält einen eigenen Commit.
- Vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls es
  weitergelaufen ist.
- Nach erfolgreichem Merge Worktree entfernen, Entfernung in Git und
  Dateisystem verifizieren und den gemergten Branch mit `git branch -d`
  löschen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite Startzug-Reihenfolgenneutralität vollständig und sequenziell
von STOR-00 bis STOR-03 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Lies AGENTS.md, packages/engine/AGENTS.md und dieses Artefakt.
Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen
Paket. Verifiziere und committe jedes Paket. Stoppe bei Sicherheitsblockern
fail-closed. Integriere danach aktuelles main, führe direkt änderungsnahe
Checks aus, merge lokal, prüfe main und entferne Worktree sowie Branch
verifiziert.`

## Abschlusskriterien

- STOR-00 bis STOR-03 sind mit erfülltem Done-Gate committed.
- Zwei fällige Streetware-Kopien lösen ohne Spielerwahl deterministisch aus.
- Unmarkierte, gemischte und sensitive Startquellen bleiben manuell geordnet.
- Direkt relevante Tests, Typechecks und Diff-Hygiene sind grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und gemergter Arbeitsbranch sind nachweislich entfernt.
