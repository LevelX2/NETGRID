# AI-Match 7D14 Plan-/Discard-Remediation-Prozess 2026-07-16

## Status

Implementierung und Review sind im isolierten Worktree `C:\Projekte\NETGRID_AI_LAST_MATCH_PLAN_DISCARD_20260716` auf Branch `codex/ai-last-match-plan-discard-20260716` abgeschlossen; lokaler Main-Abgleich, Integration und Cleanup folgen als Paket 6. Ausgangspunkt ist der lokale `main`-Stand `d5e6c1353d51438e6ddb50ec7d175050c623356c`. Ein Push oder Pull Request ist nicht beauftragt.

## Quelle und freigegebener Scope

Quelle ist das abgeschlossene Match `match_7d14d0a3bc0ecd79` aus der lokalen SQLite-Runtime. Der Runner spielte mit `runner-ai-v0.9-hard`; die Corp gewann durch Flatline. Die vollständige Entscheidungsprüfung hat zwei umsetzungsreife Findings ergeben:

1. D105/SV190 hält einen bereits schwachen Handkarten-Finanzierungsplan absolut gegen einen klar positiven, erreichbaren und dringlichen R&D-Run fest. D106 ist die direkte Fortsetzung dieses Fehlers.
2. D152/SV256 wirft am Runner-Matchpoint gleichzeitig HQ Interface und unmittelbar verfügbare Liquidität ab. Der Keep-Score berücksichtigt Closeout-Ziel, reale Duplikate und Zeit bis zum Geld nicht ausreichend.

Die übrigen geprüften Entscheidungen, insbesondere D55, D158 und D172, sind keine Implementierungsziele. Die vier im Kartenhint-Audit gefundenen kompilierten Effektüberlappungen hatten keinen kausalen Bezug zu den zwei Findings und bleiben außerhalb dieses Prozesses.

## Ziel und Invarianten

- Beide historischen Entscheidungen werden zuerst auf aktuellem Code als side-sichere Decision-Checkpoints mit striktem Warmup erfasst.
- Nur ein rotes Ergebnis mit Code `behavior_regression` autorisiert einen Produktionsfix. Fixture-, Engine-, Runtime-, Redaction- oder Legalitätsdrift ist Infrastrukturarbeit und kein Fehlerbeweis.
- Jede rote Zielprobe erhält mindestens eine bereits auf der Ausgangsbasis grüne Gegenprobe.
- Änderungen bleiben generisch: keine Kartennamens-Sonderfälle, keine FullState-/Hidden-Info-Nutzung und ausschließlich Auswahl aus `LegalActions`.
- Der Red-Evidence-Stand wird vor Produktionsänderungen separat committet.
- Genau ein Paket ist aktiv; jedes Paket erhält fokussierte Checks, `git diff --check` und einen eigenen Commit.

## State Machine

`preflight -> checkpoints_red -> plan_revalidation -> matchpoint_discard -> final_review -> main_sync -> merged -> cleanup`

## Paketfolge

### Paket 1: Preflight und Prozessvertrag

- Worktree, Branch, Basisstand, Scope, Nicht-Ziele und Sicherheitsgrenzen dokumentieren.
- Checks: `git status --short --branch`, `git diff --check`.
- Commit: `docs(ai): plan match 7d14 remediation`.

### Paket 2: Checkpoints, Gegenproben und Red Evidence

- D105 als exakten Zielcheckpoint erfassen; D106 nur zusätzlich binden, wenn es für die früheste kausale Grenze nötig ist.
- D152 als exakten Choice-/Discard-Checkpoint erfassen.
- Pro Finding mindestens eine enge synthetische Gegenprobe festlegen.
- Strikten Warmup, Fixture-Validierung und Zielausführung dokumentieren. Rote Ziele müssen ausschließlich `behavior_regression` melden; Gegenproben müssen grün sein.
- Evidence-Report unter `docs/reviews/ai/` anlegen.
- Commit: `test(ai): capture match 7d14 red evidence`.

### Paket 3: Generische Plan-Revalidation

- Einen nichtpositiven Handkarten-Finanzierungs- oder Fortsetzungsschritt gegen einen klar positiven, dringlichen und erreichbaren Payoff revalidieren.
- Den bestehenden Schutz sinnvoll positiver Finanzierung sowie Fälle ohne erreichbaren Payoff erhalten.
- Checkpoint, Gegenproben, fokussierte Plan-/Arbitration-Tests und angrenzende Tests ausführen.
- Commit: `fix(ai): revalidate runner funding plans`.

### Paket 4: Generische Matchpoint-Discard-Wertung

- Strategisches Closeout-Ziel, unmittelbare Liquidität und Zeit bis zur Nutzbarkeit im Keep-Score berücksichtigen.
- Nur echte vorhandene Äquivalenz oder Duplikate abwerten; bloße Rollenähnlichkeit darf eine erste Closeout-Kopie nicht als redundantes Backup behandeln.
- Frühe Nicht-Matchpoint-Situationen, echte Duplikate und bereits vorhandene Äquivalente als Gegenproben erhalten.
- Checkpoint, Gegenproben und fokussierte Discard-/Install-Fit-Tests ausführen.
- Commit: `fix(ai): preserve runner matchpoint resources`.

### Paket 5: Breite Verifikation und Review

- Beide Zielcheckpoints und alle Gegenproben gemeinsam ausführen.
- Fokussierte und angrenzende AI-Tests, AI-Typecheck, realistischen vollständigen AI-Testlauf und `git diff --check` ausführen.
- Final Review unter `docs/reviews/ai/` und bei dauerhaftem Vertrag den aktuellen Monatslog aktualisieren.
- Commit: `docs(ai): close match 7d14 remediation`.

### Paket 6: Integration und Cleanup

- Den Arbeitsbranch mit dem dann aktuellen lokalen `main` abgleichen und im Worktree erneut verifizieren.
- Den Branch lokal nach `main` integrieren und die relevanten Checks auf `main` wiederholen.
- Den sauberen Worktree entfernen, den vollständig gemergten Branch löschen und beides über Dateisystem und `git worktree list` prüfen.
- Kein Push und kein Pull Request.

## Automatische Fehlerbehandlung

- Rote Tests werden ausschließlich innerhalb des aktiven Pakets untersucht; kein `test.skip`, kein `test.only`, keine Testlöschung und keine pauschale Assertion-Lockerung.
- Bei Hidden-Info-, LegalAction-, Replay-, StateHash- oder Engine-Grenzverletzung stoppt der Prozess ohne AI-Workaround.
- Ist ein historischer Zielcheckpoint auf aktuellem Code bereits grün, wird das Finding als nicht reproduzierbar dokumentiert und nicht gefixt.
- Bei Warmup-Drift wird die Ursache getrennt geprüft; `rebase` ist nur mit dokumentierter, fachlich unabhängiger Drift zulässig.

## /Goal

/Goal Arbeite die zwei freigegebenen Findings aus `match_7d14d0a3bc0ecd79` vollständig und sequenziell von Paket 1 bis Paket 6 ab. Sichere D105/D106 Plan-Revalidation und D152 Matchpoint-Discard zuerst als spielgleiche Decision-Checkpoints mit Gegenproben. Implementiere ausschließlich auf aktuellem Code weiterhin rote `behavior_regression`-Fixes generisch, verifiziere fokussiert und breit, dokumentiere Evidence und Final Review, merge den Arbeitsbranch lokal nach `main` und entferne Worktree sowie gemergten Branch verifiziert.

## Abschlusskriterien

- Beide freigegebenen Findings sind als aktuelle, side-sichere Verhaltensverträge erfasst und behoben oder nachweislich nicht mehr reproduzierbar.
- Zielcheckpoints, Gegenproben, fokussierte Tests und AI-Typecheck sind grün; der breite AI-Testlauf enthält gegenüber dem unveränderten `main` keine zusätzlichen roten Verträge.
- Keine Engine-, LegalAction-, Hidden-Info-, Replay-, StateHash- oder Randomness-Grenze wurde abgeschwächt.
- Evidence, Final Review und erforderliche Wissenspflege sind vorhanden.
- Alle Paketcommits sind lokal nach `main` integriert; Worktree und gemergter Branch sind verifiziert entfernt.
