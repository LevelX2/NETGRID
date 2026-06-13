# AI Play-Strength Maturation IV Automation Process

Status: prepared_for_direct_execution

## Quelle/Vorgabe

Grundlage ist die GitHub-Prüfung und Ergebnisanalyse vom 2026-06-13 zum Abschlusscommit `f880da39`. Der sichtbare Repo-Stand bestätigt Maturation III als abgeschlossen, benennt aber strukturelle Restschuld in `packages/ai/src/index.ts`, fehlende lokale Default-Policy-Entscheidungen, report-only TargetChoice-/RemoteContest-Reife, Selfplay-Promotion-Lücken, Originalset-/Proteus-Semantikpakete und neue interne Modulgrenzen als nächste Arbeit.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel: AI Play-Strength Maturation IV vollständig umsetzen, final prüfen und lokal nach `main` integrieren.
- Sequenz: AI-MAT4-0 bis AI-MAT4-26, danach FINAL-GREEN.
- Scope: AI-interne Struktur, Evaluation, Report-only Diagnostik, Semantiktests und Dokumentation.
- Nicht-Ziele: keine Engine-Vertragsänderung, keine produktive TargetChoice-Auswahl, keine breite Pilot-Default-Aktivierung, keine Proteus-KI-Freigabe.
- Artefakte: `packages/ai/src/**`, `docs/architecture/ai/**`, `docs/reviews/ai/**`, `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`.
- Verifikation: paketnahe Vitest-Läufe, Typecheck, `git diff --check`, FINAL-GREEN.
- Branch/Worktree: `codex/ai-play-strength-maturation-4`, `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_4`.

## Gesamtziel

AI-MAT4-0 bis AI-MAT4-26 sequenziell umsetzen, je Paket verifizieren und committen, FINAL-GREEN ausführen, den Arbeitsbranch lokal nach `main` integrieren, `main` erneut prüfen, den Worktree entfernen und das Goal erst danach abschließen.

## Annahmen

- Der GitHub-sichtbare Report aus Maturation III ist Repo-Wahrheit, bis AI-MAT4-0 lokale Testzahlen erneut misst.
- Lean Local Mode gilt: nur echte Projektfehler stoppen die Serie.
- Dokumentarische Proteus-Arbeit bleibt diagnostisch und bewirkt keine Runtime-Freigabe.
- Neue Evaluation- und Reportmodule bleiben intern, solange kein expliziter Public-Facade-Schnitt begründet wird.

## Nicht-Ziele

- Keine Änderung an `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Verträgen.
- Keine produktive Erzeugung von `selectedChoices` oder `selectedTargets`.
- Keine automatische lokale Pilot-Aktivierung ohne separate Codeentscheidung.
- Keine Engine-Änderung, um AI-Tests grün zu bekommen.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Paketabschluss nur mit erfülltem Done-Gate, dokumentierten Checks und Commit.
- Rote Tests werden eng behoben, nicht übersprungen oder gelockert.
- `index.ts` bleibt Public Facade; neue Logik wandert nur in fachlich passende interne Module.

## Automatische Fehlerbehandlung

Bei roten Tests:

1. Testdatei und Assertion lesen.
2. Ursache bestimmen.
3. Eng beheben.
4. Einzeltest ausführen.
5. Betroffene Testdatei ausführen.
6. Vollständigen relevanten Paketlauf wiederholen.

Bei Merge-Konflikten:

1. Konfliktdateien vollständig lesen.
2. Beide fachlichen Intentionen erhalten, sofern kompatibel.
3. Bei Vertragskonflikt Blocker-Report schreiben.
4. Relevante Tests nach Konfliktlösung wiederholen.

## Sicherheitsblocker

- KI würde nicht-legale Actions erzeugen oder wählen.
- Hidden-Info-Leak in AI-Inputs, Reports, Debug, Replay, Public Events, WebSocket oder Logs.
- Engine-, Replay-, StateHash- oder Randomness-Vertrag würde unbeabsichtigt geändert.
- Tests oder Typecheck bleiben rot.
- Fremde offene Änderungen im Hauptworkspace verhindern einen sauberen finalen Merge.

## State Machine

`prepared -> worktree_created -> package_active -> package_verified -> package_committed -> next_package -> final_green -> branch_synced_with_main -> main_merged -> main_verified -> worktree_removed -> complete`

## Paketfolge

AI-MAT4-0 Preflight und Testzahl-Sync
AI-MAT4-1 Developer Placement Guide
AI-MAT4-2 `index.ts` Schnitt 4: Semantic Runtime Score Families
AI-MAT4-3 `index.ts` Schnitt 5: Simulation Metrics Aggregation
AI-MAT4-4 Restschuldkarte nach Schnitt 4/5
AI-MAT4-5 BasicSetup Local-Default Pilot Dry-Run
AI-MAT4-6 RunnerSafeAccess Local-Default Pilot Dry-Run
AI-MAT4-7 CorpScoreWindow Env-Gated Rationale
AI-MAT4-8 Local Default Policy V0
AI-MAT4-9 TargetChoice SelectedChoices Readiness
AI-MAT4-10 TargetChoice TopChoice Dry-Run
AI-MAT4-11 TargetChoice Real Engine Dry-Run Corpus
AI-MAT4-12 DoctrineGoal to CandidateFit Coverage
AI-MAT4-13 DoctrineGoal ActionFit in ShadowLeague
AI-MAT4-14 Runner Breaker/Search Worklist Paket 1
AI-MAT4-15 Runner Survival/Risk Worklist Paket 1
AI-MAT4-16 Corp Score/Advance Worklist Paket 1
AI-MAT4-17 Corp Tag/Punish Worklist Paket 1
AI-MAT4-18 Corp Damage/Ambush Worklist Paket 1
AI-MAT4-19 Proteus Random/Bad Publicity Readiness
AI-MAT4-20 Proteus Hidden Resource/Ambush/Virus Readiness
AI-MAT4-21 Selfplay Mining Promotion Queue
AI-MAT4-22 Real-Engine Corpus Promotion
AI-MAT4-23 ShadowLeague Delta gegen Maturation III
AI-MAT4-24 Module-Boundary-Guard erweitern
AI-MAT4-25 Public Export Contract erweitern
AI-MAT4-26 Abschlussbericht
FINAL-GREEN

## Verifikationsregeln

- Jedes Paket führt mindestens paketnahe Tests oder begründet nur dokumentarische Checks aus.
- Jedes Paket führt `git diff --check` aus.
- FINAL-GREEN führt aus:
  - `corepack pnpm --filter @netgrid/ai test`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`
  - `git diff --check`
- Wenn außerhalb `packages/ai` produktiver Code berührt wird, werden Engine/Server/Web Tests und Typechecks ergänzt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-play-strength-maturation-4`.
- Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_4`.
- Umsetzung ausschließlich im Worktree.
- Hauptworkspace nur für finalen Merge nach `main`.
- Pro Paket ein Commit mit der vorgegebenen oder eng passenden Message.
- Vor finalem Merge `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Merge nach `main` bevorzugt per Fast-Forward.
- Worktree erst nach erfolgreichem Merge und Main-Verify entfernen.

## Controller-Prompt-Kern

Arbeite AI Play-Strength Maturation IV vollständig und sequenziell von AI-MAT4-0 bis AI-MAT4-26 plus FINAL-GREEN ab. Lies Projektanweisungen, Agentenvorgabe und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_4` auf Branch `codex/ai-play-strength-maturation-4`. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Committe jedes abgeschlossene Paket. Stoppe nur bei Sicherheitsblocker. Nach Abschluss final verifizieren, lokal nach `main` mergen, `main` prüfen, Worktree entfernen und Goal erst danach abschließen.

## Abschlusskriterien

- AI-MAT4-0 bis AI-MAT4-26 sind umgesetzt, geprüft und committed.
- FINAL-GREEN ist grün.
- Abschlussbericht und Wissenslog sind aktualisiert.
- Arbeitsbranch ist lokal in `main` integriert.
- `main` ist sauber und geprüft.
- Worktree ist entfernt.
