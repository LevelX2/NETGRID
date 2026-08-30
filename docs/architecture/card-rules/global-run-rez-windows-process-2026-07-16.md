# Globale Asset-/Upgrade-Rezfenster während Runs – Paketprozess

Status: Abschlussprüfung
Stand: 2026-07-16
Arbeitsbranch: `codex/global-run-rez-windows`
Arbeits-Worktree: `C:\Projekte\NETGRID_GLOBAL_RUN_REZ_WINDOWS`

## Quelle und Vorgabe

Ausgangspunkt ist die Regelfrage zu `Hacker Tracker Central`: Die Karte liegt
unrezzed in Remote 2, während der Runner Remote 1 angreift. Die verbindliche
Run-Timingstruktur erlaubt der Corp in den mit `(R)` markierten Fenstern, ein
Asset oder Upgrade zu rezzen. Diese Erlaubnis ist nicht auf den angegriffenen
Server begrenzt. Hacker Tracker Central muss dabei vor Beginn eines
Trace-Versuchs aktiv sein; der Kartentext erlaubt kein nachträgliches Rezzen
während des bereits laufenden Trace-Versuchs.

Der aktuelle Engine-Pfad `buildCorpRunRootRezActions` betrachtet dagegen nur
den Root des angegriffenen Servers. Dadurch fehlt während eines Runs auf
Remote 1 die LegalAction für ein bezahlbares Asset oder Upgrade in Remote 2.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung präzise genug:

- Gesamtziel und erwarteter Endzustand sind aus Timingregel und Kartenfall
  bestimmbar.
- Der betroffene generische Engine-Pfad und vorhandene Testharnesses sind
  identifiziert.
- Die Änderung bleibt auf allgemeine Asset-/Upgrade-Rezfenster während Runs
  begrenzt.
- LegalActions und `applyAction` bleiben die einzigen Autoritäten; Replay,
  StateHash und Hidden-Info-Grenzen müssen unverändert halten.
- Lokale Integration nach `main` und anschließender Worktree-/Branch-Cleanup
  sind ausdrücklich Teil des gewählten Paketprozesses.

## Gesamtziel

/Goal Arbeite den Prozess „Globale Asset-/Upgrade-Rezfenster während Runs“
vollständig und sequenziell von GRR-0 bis GRR-3 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, `packages/engine/AGENTS.md`, die
verbindlichen Wiki-Einstiegsseiten und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree `C:\Projekte\NETGRID_GLOBAL_RUN_REZ_WINDOWS` auf
Branch `codex/global-run-rez-windows`; nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktiven Paket, führe dessen Checks aus,
dokumentiere das Ergebnis, führe `git diff --check` aus und committe das Paket,
bevor das nächste aktiviert wird. Stelle keine Zwischenfragen, solange die
konservativen Annahmen dieses Prozesses greifen. Stoppe bei einem
Sicherheitsblocker mit Blocker-Report und Removal Condition. Nach dem letzten
Paket: aktuelles `main` in den Arbeitsbranch integrieren, final verifizieren,
lokal nach `main` mergen, `main` prüfen, den sauberen Arbeits-Worktree
nachweislich entfernen und den vollständig gemergten Arbeitsbranch mit
`git branch -d` löschen. Das Goal ist erst danach vollständig.

## Annahmen

- Die bestehenden NETGRID-Run-Fenster bleiben in ihrer aktuellen Sequenz
  erhalten; dieser Prozess korrigiert die Serverreichweite der dort bereits
  vorgesehenen Asset-/Upgrade-Rez-Optionen.
- Alle installierten, unrezzed Assets und Upgrades in allen Corp-Server-Roots
  sind Kandidaten, sofern Kosten, Kartentext und bestehende Lifecycle-Gates das
  Rezzen erlauben.
- Die Reihenfolge der erzeugten LegalActions wird deterministisch über stabile
  Server- und Karten-IDs gehalten.
- Fortgebundene Sonderaktionen werden weiterhin nur für den angegriffenen
  Server erzeugt.

## Nicht-Ziele

- Keine Änderung der ICE-Rezregel: Nur das aktuell angegangene ICE kann über
  das normale Approach-Fenster gerezzt werden.
- Kein Rezzen von Hacker Tracker Central oder anderen normalen Assets mitten in
  einem Encounter, einer Subroutine oder einem bereits laufenden Trace.
- Keine neue UI-Regelautorität, keine KI-Sonderlogik und keine Karten-ID-
  Verzweigung für Hacker Tracker Central.
- Keine allgemeine Neuordnung der Run-Phasen und keine Legacy-Migration.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine erzeugt LegalActions und revalidiert die gewählte Action in
  `applyAction`.
- Card-Lifecycle-, Kosten-, Side-, `stateVersion`- und Zielprüfungen bleiben
  wirksam.
- Fortgebundene Registry-Aktionen erhalten den angegriffenen Server als
  Kontext; globale normale Rez-Aktionen erhalten den tatsächlichen Server der
  Zielkarte im Payload.
- Öffentliche Payloads dürfen keine Identität anderer unrezzed Karten leaken.
- Replay und StateHash bleiben für identische Eingaben deterministisch.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden eng im aktiven Paket debuggt; es wird nicht zum
  nächsten Paket gewechselt.
- Fehlen Abhängigkeiten im frischen Worktree, werden vorhandene lokale
  Workspace-Abhängigkeiten nur über den projektüblichen Paketmanagerpfad
  hergestellt; es werden keine generierten Artefakte committed.
- Neue, nicht zum Scope gehörende Findings werden als Follow-up notiert und
  erweitern das aktive Paket nicht stillschweigend.
- Konflikte mit neuer `main`-Arbeit werden inhaltlich gelöst; keine Seite wird
  blind bevorzugt und es erfolgt kein `git reset --hard`.

## Sicherheitsblocker

Der Prozess stoppt, wenn eine der folgenden Bedingungen eintritt:

- Die Änderung würde Rez- oder Kartenidentitäten an den Runner leaken.
- Eine serverübergreifende Zielkarte lässt sich bei `applyAction` nicht
  vollständig gegen aktuellen State, Server, Rezstatus und Kosten
  revalidieren.
- Fortgebundene Sondertexte müssten ohne belastbaren Regelvertrag auf andere
  Server ausgeweitet werden.
- Der finale Merge oder Cleanup würde fremde offene Änderungen verwerfen.

Removal Condition: Der betroffene Vertrag ist durch eine engere generische
Lösung oder eine explizite aktuelle Regelentscheidung geklärt und die
entsprechenden Safety-Regressionen sind grün.

## State Machine

`GRR-0 done -> GRR-1 done -> GRR-2 done -> GRR-3 done -> final_verify active -> merge_main -> cleanup -> complete`

Fehlerzustände:

- `package_failed -> diagnose -> retry_same_package`
- `safety_blocker -> blocker_report -> stopped`
- `merge_conflict -> understand_both_intents -> resolve_and_reverify`
- `cleanup_failed -> diagnose_without_force -> verify_removal`

## Paketfolge

| Paket | Titel                                             | Status | Abhängigkeit |
| ----- | ------------------------------------------------- | ------ | ------------ |
| GRR-0 | Prozessvertrag und Worktree-Controller            | done   | Preflight    |
| GRR-1 | Globaler Rez-Aktionsvertrag und Unit-Regressionen | done   | GRR-0        |
| GRR-2 | Hacker-Tracker-End-to-End- und Safety-Regression  | done   | GRR-1        |
| GRR-3 | Abschlussreview und Wissensrückführung            | done   | GRR-2        |

## Paketdetails

### GRR-0 – Prozessvertrag und Worktree-Controller

Ziel: Verbindlichen Scope, Controller, Pakete und Abschlussregeln festhalten.

Eingangsvoraussetzungen:

- sauberer Hauptworkspace auf `main`;
- freier Branch und freier Zielpfad;
- eigener Worktree wurde aus aktuellem `main` angelegt.

Konkrete Arbeit:

- dieses Prozessartefakt anlegen;
- `/Goal`, Annahmen, Nicht-Ziele, Safety-Gates und Paketfolge festhalten.

Kernartefakt:

- `docs/architecture/card-rules/global-run-rez-windows-process-2026-07-16.md`

Checks und Done-Gate:

- Dokument vollständig und widerspruchsfrei;
- `git diff --check` grün;
- Paketcommit vorhanden.

Commit-Vorschlag: `docs(engine): define global run rez window process`

### GRR-1 – Globaler Rez-Aktionsvertrag und Unit-Regressionen

Ziel: Normale Asset-/Upgrade-Rez-Aktionen in bestehenden Run-Rezfenstern über
alle Corp-Server erzeugen, ohne fortgebundene Sonderfenster zu globalisieren.

Eingangsvoraussetzung: GRR-0 abgeschlossen.

Konkrete Arbeit:

- generischen Run-Root-Rez-Builder über alle Corp-Server führen;
- stabile Reihenfolge und korrekten tatsächlichen `serverId`-/Label-Payload
  sichern;
- angegriffenen Server für Fort-Pass-/Registry-Aktionen beibehalten;
- Unit-Regressionen für angegriffenen und anderen Server, Kosten-/Rezfilter
  und deterministische Reihenfolge ergänzen.

Kernartefakte:

- `packages/engine/src/game/run/run-rez-window.ts`
- `packages/engine/src/game/run/run-rez-window.test.ts`

Checks und Done-Gate:

- fokussierter `run-rez-window`-Test grün;
- Engine-Typecheck grün;
- `git diff --check` grün;
- Paketcommit vorhanden.

Commit-Vorschlag: `fix(engine): allow global root rez actions during runs`

### GRR-2 – Hacker-Tracker-End-to-End- und Safety-Regression

Ziel: Den Nutzerfall über echte LegalActions und `applyAction` bis in einen
Trace beweisen und negative Timing-/Sicherheitsgrenzen erhalten.

Eingangsvoraussetzung: GRR-1 abgeschlossen.

Konkrete Arbeit:

- Hacker Tracker Central unrezzed in einem anderen Remote als das Runziel
  aufbauen;
- Rez-LegalAction im Runfenster wählen und Kosten, tatsächlichen Server sowie
  sichtbaren Rezstatus prüfen;
- nachfolgenden Trace mit Counter-Zuwachs/-Verbrauch prüfen;
- sicherstellen, dass während Encounter/Trace kein allgemeines Rezfenster neu
  entsteht;
- Replay/StateHash und Runner-View auf Hidden-Info-Leaks prüfen.

Kernartefakte:

- `packages/engine/src/index-tests/mechanics/trace-tags-resources.test.ts`
- bei Bedarf ein eng benannter weiterer bestehender Run-/Rez-Test.

Checks und Done-Gate:

- fokussierte Hacker-Tracker-/Trace-Suite grün;
- angrenzende Run-/Rez-Suite grün;
- Engine-Typecheck grün;
- `git diff --check` grün;
- Paketcommit vorhanden.

Commit-Vorschlag: `test(engine): cover cross-server Hacker Tracker rez timing`

### GRR-3 – Abschlussreview und Wissensrückführung

Ziel: Regelvertrag, Umsetzung, Verifikation und Restpunkte dauerhaft
dokumentieren.

Eingangsvoraussetzung: GRR-2 abgeschlossen.

Konkrete Arbeit:

- Final Review unter `docs/reviews/engine/` erstellen;
- aktuellen Projektstatus und Juli-Log nach Wissensregel knapp aktualisieren;
- Prozessstatus und Paketmatrix abschließen;
- finale fokussierte Tests, Engine-Typecheck und Diff-Hygiene ausführen.

Kernartefakte:

- `docs/reviews/engine/global-run-rez-windows-final-review-2026-07-16.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`
- dieses Prozessartefakt.

Checks und Done-Gate:

- alle GRR-Akzeptanzkriterien nachvollziehbar belegt;
- fokussierte Engine-Suites und Engine-Typecheck grün;
- `git diff --check` grün;
- sauberer Arbeits-Worktree und Paketcommit vorhanden.

Commit-Vorschlag: `docs(engine): close global run rez window fix`

## Verifikationsregeln

- Tests werden aus dem Arbeits-Worktree ausgeführt.
- Primär gelten direkte Vitest-Aufrufe für die betroffenen Dateien sowie
  `corepack pnpm --filter @netgrid/engine typecheck`.
- Jeder Paketabschluss enthält `git diff --check`.
- Nicht ausgeführte breite Checks werden im Final Review ausdrücklich genannt.
- Vor dem Merge werden die fokussierten Tests und der Typecheck erneut
  ausgeführt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/global-run-rez-windows`
- Arbeits-Worktree: `C:\Projekte\NETGRID_GLOBAL_RUN_REZ_WINDOWS`
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für finalen lokalen Merge.
- Pro abgeschlossenem Paket genau ein klarer Commit; nur paketzugehörige
  Änderungen werden gestaged.
- Vor dem finalen Merge wird neues lokales `main` defensiv in den Arbeitsbranch
  integriert und bei Änderungen erneut verifiziert.
- Bevorzugter Main-Merge: `git merge --ff-only`.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.
- Nach erfolgreichem Main-Merge: sauberen Worktree ohne `--force` entfernen,
  Entfernung in `git worktree list --porcelain` und Dateisystem prüfen,
  `git worktree prune` nur bei sicher diagnostiziertem Cleanup-Bedarf, danach
  Branch mit `git branch -d` löschen.

## Controller-Prompt-Kern

Arbeite ausschließlich am aktiven GRR-Paket. Prüfe zuerst dessen
Eingangsvoraussetzungen, ändere nur die benannten Verträge, führe die
Paketchecks aus, dokumentiere Warnungen und nicht ausgeführte Checks, führe
`git diff --check` aus, committe nur Paketdateien und aktiviere erst danach das
nächste Paket. Bei Safety- oder fachlichem Vertragsblocker stoppe mit
Blocker-Report und Removal Condition. Nach GRR-3 führe Final Verify, lokalen
Main-Merge und den vollständig verifizierten Worktree-/Branch-Cleanup aus.

## Paketfortschritt

- GRR-0: Prozessvertrag in Commit `4161a0e9b` angelegt; Diff-Hygiene grün.
- GRR-1: Commit `b85339ec8` lässt den normalen Run-Rez-Builder nun alle
  Corp-Server in
  stabiler ID-Reihenfolge und hält Registry-/Fort-Pass-Aktionen am
  angegriffenen Server. Der fokussierte `run-rez-window`-Test ist mit 6 Tests
  grün, ebenso Engine-Typecheck und `git diff --check`. Ein versehentlich
  breiter erster Testlauf hat zwei bestehende Sequenz-Fixtures identifiziert,
  die das neue globale Rezfenster noch nicht passieren; diese eng angrenzenden
  Anpassungen gehören zu GRR-2.
- GRR-2: Der echte Remote-2-/Remote-1-Hacker-Tracker-Fall läuft durch
  LegalAction und `applyAction`, verbraucht zwei vorhandene Bits im folgenden
  Fang-Trace, legt danach wieder einen Bit auf und bietet während des laufenden
  Trace-Versuchs kein normales Rezfenster. Runner-View, Replay, StateHash und
  `validateGameState` sind geprüft. Vier fokussierte/angrenzende Testdateien
  sind mit 163 Tests grün; die vollständige Engine-Suite ist mit 187 Dateien
  und 1.701 Tests grün, ebenso Typecheck und Diff-Hygiene.
- GRR-3: Final Review, aktueller Projektstatus und Juli-Log führen den
  korrigierten Regelvertrag, die Engine-Ursache und die Safety-Evidence zurück.
  Der abschließende Paketlauf bestätigt erneut 187 von 187 Testdateien und
  1.701 von 1.701 Tests sowie einen grünen Engine-Typecheck; Diff-Hygiene ist
  grün. Damit sind alle Pakete abgeschlossen und der Controller befindet sich
  in der finalen Integrations- und Cleanup-Prüfung.

## Abschlusskriterien

- Hacker Tracker Central in Remote 2 kann über eine Engine-LegalAction in
  einem allgemeinen Run-Rezfenster während eines Runs auf Remote 1 gerezzt
  werden.
- Dieselbe Regel gilt generisch für bezahlbare Assets und Upgrades in allen
  Corp-Servern.
- ICE- und fortgebundene Sonderfenster bleiben servergebunden.
- Encounter und laufender Trace öffnen kein zusätzliches normales Rezfenster.
- LegalAction, `applyAction`, Replay, StateHash und Hidden-Info-Grenzen sind
  durch fokussierte Regressionen belegt.
- Alle Pakete sind committed, der Arbeitsbranch ist lokal nach `main` gemergt,
  `main` ist geprüft, Worktree und gemergter Branch sind nachweislich entfernt.
