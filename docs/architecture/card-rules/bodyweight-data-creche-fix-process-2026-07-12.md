# Bodyweight Data Crèche – Runtimevertrags-Fixprozess

## Status

Umsetzung am 2026-07-12 abgeschlossen und für die lokale Integration
freigegeben. Arbeitsbranch: `codex/bodyweight-data-creche-fix`.

## Quelle und Vorgabe

Ein Playtest-Fund zeigt auf der installierten `Bodyweight™ Data Crèche` drei
wiederkehrende Credits, obwohl der bestätigte Kartentext ausschließlich
Installationskosten 3, `+1 MU`, einen einmal pro Zug angebotenen Bonus-Run nach
einem erfolgreichen Run und Deck-Einzigartigkeit vorsieht. Zusätzlich besteht
der Playtest-Verdacht, dass ein erfolgreicher Bodyweight-Bonus-Run erneut einen
Bonus-Run freigibt.

## Zielprüfung

Der Endzustand ist eindeutig bestimmbar. Die bestätigten Kartendaten unter
`data/cards/originalset-v1-cards.json` und die semantische Kartenimplementierung
sind führend. Die abweichende Shared-Runtime-Definition und fehlende
Regressionen sind der begrenzte Scope.

## Gesamtziel

`Bodyweight™ Data Crèche` erzeugt keine wiederkehrenden Credits, gewährt exakt
`+1 MU`, bleibt ein Hardware-Deck mit Installationskosten 3 und bietet einmal
pro Zug unmittelbar nach einem erfolgreichen Run einen Run ohne Aktionskosten
an. Ein erfolgreicher Bonus-Run darf im selben Zug keinen weiteren
Bodyweight-Bonus-Run erzeugen. Engine- und KI-Tests verhindern eine erneute
Phantom-Credit- oder Bonus-Run-Abweichung.

## Annahmen

- Die bestätigte Originalset-Kartenfassung bleibt unverändert.
- Bestehende Spiele und Replays werden in der Version-0-Umgebung nicht migriert.
- Der Bonus-Run-Resolver ist fachlich korrekt und wird nur regressiv geschützt.

## Nicht-Ziele

- Keine Änderung anderer Hardware-Decks oder wiederkehrender Credit-Familien.
- Keine allgemeine Migration der Shared-Kartendefinitionen.
- Keine Änderung an Trace-, Run- oder Zahlungsregeln.
- Kein Push und keine Remote-Integration.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Die Rules Engine bleibt einzige Regelautorität.
- PlayerActions bleiben aus LegalActions abgeleitet und werden erneut validiert.
- Keine Hidden-Info-, Replay- oder StateHash-Regel wird abgeschwächt.
- Jedes Paket erhält Checks, `git diff --check` und einen eigenen Commit.

## Automatische Fehlerbehandlung

Fokussierte Testfehler werden innerhalb des aktiven Pakets eng diagnostiziert
und behoben. Scope-fremde Fehler werden als bestehende Abweichung dokumentiert.
Ein Paket wird erst nach erfülltem Done-Gate abgeschlossen.

## Sicherheitsblocker

Ein Widerspruch zwischen bestätigtem Kartentext und einer aktuell führenden
Regelentscheidung, ein Hidden-Info-Risiko oder ein nicht defensiv auflösbarer
Mergekonflikt stoppt den Prozess. Removal Condition ist eine eindeutige
fachliche Entscheidung beziehungsweise ein konfliktfreier, erneut geprüfter
Vertrag.

## State Machine

`P0 Prozess-Freeze -> P1 Runtimevertrag und Engine-Regression -> P2 KI-Regression -> Final Verify -> Merge main -> Cleanup -> Complete`

## Paketfolge

### P0 – Prozess-Freeze

- Ziel: Scope, Invarianten, Checks und Git-Ablauf verbindlich festhalten.
- Kernartefakt: dieses Dokument.
- Checks: `git diff --check`.
- Done-Gate: Prozessartefakt committed.
- Commit: `docs(cards): define Bodyweight fix process`.

### P1 – Runtimevertrag und Engine-Regression

- Eingang: P0 abgeschlossen.
- Arbeit: falsche MU-, Recurring-Credit-, Link-Credit- und Textmetadaten aus der
  Shared-Definition entfernen beziehungsweise korrigieren; den vorhandenen
  Kartentest auf exaktes `+1 MU`, null Credit-Counter, keine Credit-Anzeige,
  Installkosten 3, Deckersetzung und einen einzigen Bonus-Run pro Zug härten;
  insbesondere einen erfolgreichen Bonus-Run vollständig abschließen und
  nachweisen, dass kein weiterer Bodyweight-Bonus-Run angeboten wird. Normale
  und kostenlose Runs auf dasselbe Data Fort müssen verschiedene stabile
  `actionId`s besitzen, damit die Revalidierung die ausgewählte Run-Art anwendet.
- Kernartefakte: `packages/shared/src/card-definitions.ts` und der fokussierte
  Originalset-Kartentest.
- Checks: fokussierter Engine-Test, Engine-Typecheck, `git diff --check`.
- Done-Gate: Installation erzeugt keine Credits, exakt ein Bonus-Run kann pro
  Zug verbraucht werden und alle bisherigen Bodyweight-Funktionen bleiben grün.
- Commit: `fix(engine): remove Bodyweight phantom credits`.

### P2 – KI-Regression

- Eingang: P1 abgeschlossen.
- Arbeit: fokussierte KI-Abdeckung ergänzen, die für Bodyweight kein
  wiederkehrendes Link-Budget annimmt. Ein sichtbarer Hunter-Trace muss mit
  Bodyweight und nur zwei normalen Credits weiterhin als nicht abdeckbar gelten.
- Kernartefakt: passender Test im AI-Paket.
- Checks: fokussierter AI-Test, AI-Typecheck, `git diff --check`.
- Done-Gate: Die KI kalkuliert kein Phantom-Link-Budget für Bodyweight.
- Commit: `test(ai): guard Bodyweight trace budget`.

## Verifikationsregeln

Nach jedem Paket laufen die engsten betroffenen Tests und der passende
Typecheck. Vor der Integration laufen beide Regressionstests, Engine- und
AI-Typecheck sowie `git diff --check` erneut.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_BODYWEIGHT_DATA_CRECHE_FIX`.
- Arbeitsbranch: `codex/bodyweight-data-creche-fix`.
- Hauptworkspace nur für den finalen lokalen Merge.
- Vor dem Merge aktuelles lokales `main` in den Arbeitsbranch integrieren,
  sofern es weitergelaufen ist.
- Bevorzugter Merge nach `main`: Fast-Forward.
- Worktree erst nach erfolgreicher Main-Verifikation entfernen.

## Controller-Prompt-Kern

`/Goal Arbeite den Bodyweight-Data-Crèche-Fix vollständig und sequenziell von P0 bis P2 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies AGENTS.md, die relevanten Paket-AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen Paket. Führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe nur bei einem Sicherheitsblocker. Verifiziere final, merge lokal nach main, prüfe main, entferne den Worktree und markiere das Goal erst dann als complete.`

## Abschlusskriterien

- Keine Bodyweight-Credit-Counter oder entsprechende Anzeige nach Installation.
- Exakt `+1 MU`, Installationskosten 3, Deckersetzung und höchstens ein
  Bodyweight-Bonus-Run pro Zug bestätigt.
- Kein KI-Phantom-Link-Budget.
- Alle Paketcommits und finalen Checks grün.
- Arbeitsbranch lokal nach `main` integriert und Worktree entfernt.

## Umsetzungs- und Verifikationsnachweis

- P0 `d313e2810`: Prozess-Freeze erstellt.
- P1 `4cae43a1b`: Shared-Runtimevertrag korrigiert, Phantom-Credits entfernt,
  normale und kostenlose Runs über eindeutige `actionId`s getrennt und der
  Bodyweight-End-to-End-Test auf exakt einen Bonus-Run pro Zug gehärtet.
- P2 `29e9e2724`: KI-Regression gegen Phantom-Link-Budget ergänzt.
- Verify-Follow-up `aa6d55bb0`: bestehende Multi-Server-Sequenz-Assertion auf
  den eindeutigen Bonus-Run-ID-Vertrag angeglichen.
- Engine: 183 Testdateien und 1.639 Tests grün.
- AI: drei vollständige Shards mit zusammen 292 Testdateien und 1.924 Tests
  grün.
- Shared-, Engine- und AI-Typechecks sowie die vier fokussierten Regressionen
  sind auch nach dem finalen Main-Abgleich grün.
