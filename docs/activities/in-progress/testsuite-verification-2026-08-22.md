# Vollständige Testsuite verifizieren und Fehlerursachen beseitigen

Status: in Bearbeitung  
Quelle: Nutzerauftrag vom 2026-08-22

## Zielprüfung

Der Auftrag ist ausführbar. Maßgeblicher vollständiger Testlauf ist
`corepack pnpm test`, weil das Root-Script alle paketlokalen Test-Scripts,
die Vitest-Discovery-Prüfung und die übergreifenden Specs umfasst.

## Gesamtziel

Die vollständige NETGRID-Testsuite läuft auf dem aktuellen lokalen
`main`-Stand fehlerfrei. Jeder reproduzierbare Fehler wird auf seine
verursachende Schicht zurückgeführt und ohne Abschwächung der ursprünglichen
fachlichen oder technischen Intention behoben. Der verifizierte Arbeitsstand
wird lokal nach `main` integriert; Worktree und Arbeitsbranch werden danach
verifiziert entfernt.

## Annahmen

- Der Nutzer hat mit dem Prüf- und Reparaturauftrag die direkte Umsetzung
  bereits eindeutig gewählt.
- `corepack pnpm test` ist der vollständige Testvertrag. Lint, Typecheck,
  Build und E2E sind nicht automatisch Teil dieses Testvertrags.
- Nach einer Reparatur werden zuerst der reproduzierende Test und unmittelbar
  angrenzende Tests ausgeführt, bevor der vollständige Testlauf wiederholt
  wird.
- Änderungen, die während des Prozesses neu auf `main` landen, werden vor der
  Integration fachlich geprüft und in den Arbeitsbranch eingebunden.

## Nicht-Ziele

- Keine breiten Refactorings oder Verbesserungen ohne Bezug zu einem
  reproduzierten Testfehler.
- Keine Änderung produktiver Regeln, um eine unzutreffende Testerwartung
  lediglich grün zu färben.
- Kein Push, keine Pull Request und keine Remote-Integration.
- Kein Start von Webclient oder Server.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Fehler werden an der verursachenden Schicht behoben; Fallbacks,
  `catch-and-continue` und stilles Ignorieren sind unzulässig.
- Engine-Korrektheit, Hidden-Info-Schutz, deterministisches Replay und die
  LegalAction-/PlayerAction-Grenzen bleiben unverändert verbindlich.
- Bei einer KI-Verhaltensänderung wird vor dem ersten Codepatch der
  vollständige KI-Architektur-Preflight ausgeführt.
- Fremde Worktrees, Branches, Prozesse und lokale Artefakte bleiben
  unangetastet.

## Automatische Fehlerbehandlung

1. Fehlgeschlagenen Test einzeln oder in der engsten passenden Teilmenge
   reproduzieren.
2. Erwartung, Produktionspfad und jüngste fachliche Intention anhand von Code,
   Tests, Architektur und Git-Historie abgleichen.
3. Ursache der falschen Information, Regel, Projektion, Zustandsänderung oder
   Entscheidung bestimmen.
4. Minimalen Ursachen-Fix samt Regressionstest umsetzen.
5. Engen Test, angrenzende Tests und anschließend die vollständige Testsuite
   ausführen.

## Sicherheitsblocker

Gestoppt wird bei einem Konflikt, der nur durch Aufweichung eines verbindlichen
NETGRID-Prinzips, Verlust fremder Änderungen oder eine nicht autorisierte
externe Aktion lösbar wäre. Der Blocker erhält eine konkrete Removal Condition.

## State Machine

`PREPARED -> BASELINE_RUNNING -> DIAGNOSING -> FIXING -> FOCUSED_GREEN -> FULL_GREEN -> INTEGRATING -> CLEANED`

Ohne Fehler geht `BASELINE_RUNNING` direkt in `FULL_GREEN` über. Jeder weitere
Fehler führt von `FULL_GREEN` oder `FOCUSED_GREEN` zurück nach `DIAGNOSING`.

## Paketfolge

### TV01 – Prozess und isolierten Arbeitsstrang vorbereiten

- Ziel: Verbindlichen Ablauf und sichere Git-Isolation herstellen.
- Eingang: Sauberer Hauptworkspace auf lokalem `main`.
- Arbeit: Worktree/Branch anlegen, dieses Artefakt erstellen, Abgrenzung zu
  fremden Arbeitssträngen prüfen.
- Kernartefakt: diese Datei.
- Checks: `git status --short`, `git diff --check`, Worktree-Zuordnung.
- Done-Gate: sauberer Prozessstart ist committed.
- Commit: `docs: define full test verification process`

### TV02 – Vollständigen Baseline-Testlauf ausführen

- Ziel: Den tatsächlichen Zustand der vollständigen Testsuite ermitteln.
- Eingang: TV01 abgeschlossen; Abhängigkeiten sind für den Worktree verfügbar.
- Arbeit: `corepack pnpm test` mit mindestens 600 Sekunden äußerem Zeitfenster
  ausführen und alle Fehler vollständig erfassen.
- Kernartefakte: Testausgabe und betroffene Test-/Produktionsdateien.
- Checks: vollständiger Root-Testlauf.
- Done-Gate: Entweder vollständiger Lauf ist grün oder jeder Fehler ist einem
  Ursachenpaket zugeordnet.
- Commit: nur wenn der Lauf eine versionierte Aktualisierung erfordert.

### TV03 – Fehlerursachen einzeln beseitigen

- Ziel: Jeden aus TV02 oder einem Folgelauf reproduzierten Fehler ursächlich
  beheben.
- Eingang: Ein reproduzierbarer Fehler mit identifiziertem Owner-Pfad.
- Arbeit: Pro fachlich zusammengehöriger Ursache einen minimalen Fix und
  Regressionstest umsetzen; bei KI-Bezug zuerst den Pflicht-Preflight lesen.
- Kernartefakte: ursächlicher Produktionspfad und direkt zugehörige Tests.
- Checks: reproduzierender Test, angrenzende Tests, `git diff --check`.
- Done-Gate: Ursachenpfad und angrenzende Regressionen sind grün; Paket ist
  separat committed. Das Paket wird für weitere unabhängige Ursachen wiederholt.
- Commit: ursachenspezifische Conventional-Commit-Message.

### TV04 – Gesamtverifikation und Integration

- Ziel: Vollständig grünen aktuellen Stand nach `main` integrieren und den
  Arbeitsstrang sauber entfernen.
- Eingang: Alle Ursachenpakete abgeschlossen.
- Arbeit: `corepack pnpm test` erneut vollständig ausführen; kurzlebiges
  Prozessartefakt entfernen; aktuelles `main` einbinden; bei berührtem Code
  relevante Tests wiederholen; lokal per Fast-Forward mergen; Main prüfen;
  Worktree und gemergten Branch entfernen.
- Kernartefakte: finaler Git-Stand und Testausgabe.
- Checks: vollständiger Root-Testlauf, `git diff --check`, saubere Status- und
  doppelte Worktree-Entfernungskontrolle.
- Done-Gate: Tests grün, lokaler `main` enthält alle Paketcommits, Worktree-Pfad
  und Branch sind entfernt.
- Commit: `docs: close full test verification process` (nur bei Entfernung des
  kurzlebigen Artefakts oder notwendiger Abschlussdokumentation).

## Verifikationsregeln

- Vollständiger Lauf: `corepack pnpm test`.
- Für fokussierte AI-Tests gilt mindestens 180 Sekunden äußeres Zeitfenster;
  für den vollständigen Lauf mindestens 600 Sekunden.
- Ein fortsetzbarer Prozess wird weiter abgefragt und nicht wegen eines kurzen
  Yield-Zeitfensters neu gestartet.
- Vor jedem Paketcommit: `git diff --check` und nur paketbezogene Dateien
  stagen.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_TESTSUITE_VERIFY_20260822`
- Branch: `codex/testsuite-verify-20260822`
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für den finalen Merge.
- `main` wird vor Integration in den Arbeitsbranch eingebunden, falls er
  weitergelaufen ist.
- Bevorzugter Merge: Fast-Forward.
- Cleanup erst nach erfolgreichem Main-Merge und sauberem Worktree; kein
  erzwungenes Entfernen und kein erzwungenes Branch-Löschen.

## Controller-Prompt-Kern

`/Goal Arbeite die vollständige Testsuite-Verifikation sequenziell von TV01 bis
TV04 ab. Arbeite ausschließlich im definierten Worktree, behebe jeden Fehler
an seiner Ursache unter Wahrung der ursprünglichen Intentionen, committe jedes
abgeschlossene Ursachenpaket, verifiziere abschließend corepack pnpm test,
merge lokal nach main und markiere das Goal erst nach verifiziertem Worktree-
und Branch-Cleanup als complete.`

## Abschlusskriterien

- `corepack pnpm test` ist auf dem integrierten Stand fehlerfrei.
- Jede gefundene Ursache besitzt eine intentionswahrende Reparatur und passende
  Regressionsevidence.
- Alle Prozesscommits liegen auf lokalem `main`.
- Hauptworkspace ist sauber.
- Arbeits-Worktree existiert weder in Git noch im Dateisystem.
- Der vollständig gemergte Arbeitsbranch ist gelöscht.
