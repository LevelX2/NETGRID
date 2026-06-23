# AI Replay Acceptance Hygiene Process 2026-06-23

## Status

`in_progress`

Arbeitsbranch: `codex/ai-replay-acceptance-hygiene`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_REPLAY_ACCEPTANCE_HYGIENE`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Erkenntnissammlung vom 2026-06-23 zum bereits gemergten und gepushten Merge-Commit `d313e88f`. Die Bewertung lautet: Die erste AI-Replay-Mistake-Iteration ist technisch integriert, aber fachlich nur teilweise abgeschlossen.

Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`. Ein Push erfolgt nur auf ausdrücklichen Nutzerwunsch.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: aus dem technisch integrierten Minimalfix einen fachlich ehrlichen, reproduzierbaren und artefakthygienischen Stand machen.
- Reihenfolge: Statuskorrektur, Artefakthygiene, portable Repro-/Holdout-Abnahme, Risikohandoff, Abschlussprüfung.
- In-Scope: AI-Replay-Dokumente, AI-Evaluation-Skripte, AI-Tests, Activity-Handoff, Projektstatus.
- Nicht-Ziele: keine neue zweite KI-Optimierung, kein History-Rewrite, kein Force-Push, keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Randomness-Vertragsänderung.
- Abnahmekriterien: keine großen lokalen Runtime-Exports als normales versioniertes Artefakt, repository-seitig ausführbare Checks, ehrlicher Holdout-/Full-Test-Status, umsetzbare Folgepakete.

Konservative Annahmen:

- Da `main` bereits nach GitHub gepusht wurde, wird die Historie nicht automatisch umgeschrieben. Problematische Artefakte werden im aktuellen Stand entfernt oder durch kleinere Aggregate/Fixtures ersetzt.
- Wenn ein vollständig portabler Same-State-Repro aus vorhandenen versionierten Daten nicht rekonstruiert werden kann, wird kein künstlicher Fixture erfunden; stattdessen entsteht ein reproduzierbarer Harness mit lokalem SQLite-Eingang plus klarer Fixture-Lücke.
- Holdout-Validierung darf lokale Runtime-Daten nutzen, aber versionierte Berichte enthalten nur Aggregate, Case-Digests und redigierte Beispiele.

## Gesamtziel

Der Prozess stellt den AI-Replay-Mistake-Stand so um, dass spätere Iterationen aus dem Repository heraus nachvollziehbar, sicher und wiederholbar sind:

```text
Erkenntnisse
-> Statuskorrektur
-> Entfernung grosser Runtime-Exports
-> redigierte Minimalartefakte
-> portabler Abnahmeharness
-> Holdout-/Repro-Report
-> Folgeactivities
-> finaler lokaler Merge nach main
```

## Nicht-Ziele

- Keine neue Entscheidung über den `remote_contest`-/Creditbase-Cluster.
- Keine produktive Nutzung von FullState, Hidden Cards, Decklisten, lokalen Pfaden oder Runtime-DB-Inhalten.
- Kein MatchId-, TraceId-, Seed-, Deck- oder StateVersion-Sonderfall im Runtime-Scoring.
- Keine Testlockerung, nur Dokumentation vorbestehender roter Tests.
- Keine automatische GitHub-CI-Einrichtung, sofern dafür Repository-/Remote-Konfiguration oder Secrets nötig wären.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Jedes Paket endet mit Checks, `git diff --check` und Commit.
- Repository-Artefakte dürfen keine FullState-Snapshots, Hidden Cards, Tokens, privaten Decklisten oder lokalen Runtime-Pfade enthalten.
- AI-Entscheidungen nutzen weiter nur `PlayerView`, `LegalActions` und explizit erlaubte side-safe Metadaten.
- Discovery/Holdout-Trennung bleibt erhalten.
- Holdout ist Abnahme, nicht Fixableitung.
- Full-Test-Rot bleibt ein Gate-Risiko, solange es nicht grün oder als separat vorbestehend eindeutig erledigt ist.

## Automatische Fehlerbehandlung

- Wenn redigierte Artefakte nicht sicher erzeugbar sind, werden große Exporte entfernt und ein Blocker-Report statt Ersatzdaten committed.
- Wenn lokale SQLite-Daten fehlen, bleiben CLI-Tools und Tests auf synthetischen/minimalen Fixtures grün; Runtime-Auswertung wird als optionaler lokaler Schritt dokumentiert.
- Wenn ein Same-State-Fall ohne lokale DB nicht portabel reproduzierbar ist, wird das als Fixture-Gap dokumentiert und nicht als vollständig geschlossener Kreislauf behauptet.
- Wenn `main` während der Arbeit weiterläuft, wird `main` vor dem finalen Merge in den Arbeitsbranch integriert und Konflikte werden dateibezogen geprüft.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- ein versioniertes Artefakt verdeckte Karten, FullState, private Payloads, Tokens, Decklisten oder absolute lokale Runtime-Pfade enthalten müsste;
- ein Holdout- oder Repro-Runner eine Action außerhalb aktueller LegalActions erzeugt;
- eine Verbesserung Hidden-Info oder lokale DB-Daten für produktives Scoring benötigt;
- die Entfernung der großen Exporte ohne Ersatz den aktuellen Abnahmestand schlechter dokumentiert als vorher.

Removal Condition: Der betroffene Schritt ist wieder aufnehmbar, wenn die benötigte Information als Aggregate, Digest, minimales redigiertes Fixture oder lokaler nichtversionierter Eingabepfad dargestellt werden kann.

## State Machine

```text
process_prepared
  -> AH-0_process_and_preflight
  -> AH-1_artifact_hygiene
  -> AH-2_repro_holdout_harness
  -> AH-3_status_and_followups
  -> AH-4_final_review
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| `AH-0` | Prozess und Preflight | neues Prozessartefakt, Git-/Artefaktlage dokumentiert, Diffcheck grün | `docs(ai): define replay acceptance hygiene process` |
| `AH-1` | Artefakthygiene | große JSON-Runtime-Exports entfernt oder ersetzt, Skripte schreiben nicht mehr standardmäßig in versionierte Reviewpfade | `docs(ai): replace replay runtime exports with safe summaries` |
| `AH-2` | Repro-/Holdout-Harness | repository-seitig ausführbare Tests/CLI für redigierte Fixture-/Aggregate-Abnahme, lokale DB nur als expliziter Parameter | `feat(ai): add replay acceptance harness` |
| `AH-3` | Status und Folgeaufträge | alter Status korrigiert, Risiken und Activities für Full-Test, portable Fixture, Holdout und Ranking-Risiko angelegt | `docs(ai): correct replay iteration status and followups` |
| `AH-4` | Final Review | Abschlussbericht mit Checks, Grenzen und Merge-Empfehlung | `docs(ai): record replay acceptance hygiene review` |

## Paketdetails

### AH-0: Prozess und Preflight

Ziel: verbindlichen Zuschnitt festlegen.

Arbeit:

- Projekt- und Skill-Anweisungen lesen.
- Hauptworkspace sauber klassifizieren.
- Vorhandene AI-Replay-Artefakte, Skripte und JSON-Exports erfassen.
- Dieses Prozessartefakt erstellen.

Checks:

```bash
git status --short --branch
git diff --check
```

### AH-1: Artefakthygiene

Ziel: normale Repository-Historie ab jetzt frei von großen lokalen Runtime-Exports halten.

Arbeit:

- `ai-replay-decision-cases-2026-06-23.json` und `ai-replay-decision-candidate-clusters-2026-06-23.json` aus dem aktuellen Baum entfernen oder auf kleine redigierte Summary-Artefakte reduzieren.
- Skripte so ändern, dass große JSON-Ausgaben nur noch explizit in ein nichtversioniertes Output-Verzeichnis geschrieben werden.
- Redigierte Markdown-Summaries ohne absolute lokale Pfade und ohne Match-/Trace-Vollauszüge erhalten.
- `.gitignore` oder Guard ergänzen, falls erneute große Exportablage im Reviewpfad wahrscheinlich ist.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-decision-case-extraction.test.ts src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000
git diff --check
```

### AH-2: Repro-/Holdout-Harness

Ziel: Abnahme als Tooling statt nur als Bericht verfügbar machen.

Arbeit:

- CLI-Parameter für DB-Pfad, Cutoff, Run-ID und Output-Verzeichnis ergänzen.
- Standard-Output außerhalb versionierter Reviewpfade legen.
- Minimalen, synthetischen oder redigierten Fixture-Test ergänzen, der die Akzeptanzlogik ohne lokale SQLite prüft.
- Optionalen lokalen Holdout-Runner so dokumentieren, dass er dieselben 283 Holdout-DecisionPoints nur bei vorhandener DB auswertet.

Checks:

```bash
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/semantic-ai-runtime-cutover.test.ts src/evaluation/replay-decision-case-extraction.test.ts src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000
git diff --check
```

### AH-3: Status und Folgeaufträge

Ziel: falsche Abschlussaussagen korrigieren und verbleibende Arbeit klein schneiden.

Arbeit:

- altes Prozessdokument auf tatsächlichen Stand aktualisieren oder klar als historisch markieren.
- Abschlussstatus auf "Iteration 1 implementiert, Abnahme unvollständig" korrigieren.
- Activities für portable Same-State-Fixture, echten Holdout-Runner, Shell-Traders-Full-Test-Gate und Coverage-Direct-Action-Risiko anlegen oder bestehende Activity erweitern.
- Projektstatus/Wissenslog nur bei dauerhaft relevantem Status aktualisieren.

Checks:

```bash
git diff --check
```

### AH-4: Final Review

Ziel: ehrlichen Abschlussstand dokumentieren.

Arbeit:

- Review mit geänderten Artefakten, entfernten Risiken, verbleibenden Lücken und ausgeführten Checks erstellen.
- Eindeutig festhalten, dass `main` erst nach diesem Prozess wieder als fachlich bereinigter AI-Replay-Stand gilt.
- Final prüfen und lokal nach `main` integrieren.

Checks:

```bash
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/semantic-ai-runtime-cutover.test.ts src/evaluation/replay-decision-case-extraction.test.ts src/evaluation/replay-decision-case-clustering.test.ts --maxWorkers=1 --testTimeout=30000
git diff --check
```

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_AI_REPLAY_ACCEPTANCE_HYGIENE`.
- Branch: `codex/ai-replay-acceptance-hygiene`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push ohne ausdrücklichen Nutzerwunsch.
- Vor finalem Merge aktuellen `main` in den Arbeitsbranch integrieren.
- Arbeits-Worktree erst nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den AI Replay Acceptance Hygiene Process vollständig und sequenziell von AH-0 bis AH-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, die NETGRID-Wissensbasis und docs/architecture/ai/ai-replay-acceptance-hygiene-process-2026-06-23.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_REPLAY_ACCEPTANCE_HYGIENE auf Branch codex/ai-replay-acceptance-hygiene.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Die problematischen großen JSON-Exports sind im aktuellen `main` nicht mehr als normale Review-Artefakte vorhanden.
- Ersatzberichte enthalten nur Aggregate, Digests oder minimierte redigierte Beispiele.
- Repro-/Holdout-Abnahme ist als Tooling oder klarer lokaler Runner ausführbar.
- Der Projektstatus behauptet keinen vollständig geschlossenen Optimierungskreislauf mehr.
- Verbleibende Risiken sind als kleine Activities dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert und geprüft.
