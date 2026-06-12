# AI108-AI114 Residual Action-Limit Mini-Sweep Prozess

Status: in Umsetzung

Datum: 2026-06-12

## Quelle und Vorgabe

Ausgangspunkt ist die Ergebnisanalyse nach AI101-AI107. Sie bestätigt den GitHub-Stand von AI101-AI107, weist aber darauf hin, dass der Integrationsstand inzwischen weitergelaufen ist. Der nächste Block soll klein bleiben und die verbliebenen Action-Limit-Restklassen gezielt prüfen:

- aktuellen Head rebaselinen,
- Late-Draw-Fall isolieren,
- Corp-No-Safe-Alternative-Fall prüfen,
- Runner-Reserve-Credit-Outcomes über Folgefenster bewerten,
- `<= 8` nur bei engem belegtem Fix experimentell versuchen,
- Guard-Kommentare konsistent halten,
- finalen Full Sweep ausführen.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel und Endzustand sind bestimmt.
- Paketfolge AI108 bis AI114 ist vorgegeben.
- Nicht-Ziele sind klar: keine pauschalen Credit-, Draw- oder Run-Strafen; keine Runtime-Änderung ohne klaren engen Beleg.
- Kernartefakte liegen unter `docs/reviews/ai/`.
- Kernmodule sind `packages/ai/src/simulation/selfplay-trace-mining.ts`, `packages/ai/src/index.ts`, `packages/ai/src/legacy/runner-plans.ts`, `packages/engine/src/game/abilities/runner-special-trigger-execution.ts` und ggf. `packages/ai/src/visible-run-analysis.ts`.
- Checks sind je Paket ableitbar.

## Gesamtziel

AI108-AI114 vollständig und sequenziell umsetzen, jeden Paketstand verifizieren und committen, den abgeschlossenen Arbeitsbranch lokal nach `main` integrieren und den Worktree anschließend entfernen.

## Annahmen

- Lokaler `main` ist der Integrationsbranch.
- Der lokale führende `main`-Stand beim Prozessstart ist `192a1cc6`.
- `origin/main` steht beim Prozessstart noch auf `c77ddb1e`; Push ist nicht Teil dieses Prozesses.
- Der vorherige AI107-Referenztrace bleibt `docs/reviews/ai/ai107-final-a-d-5seed-2026-06-12.json`.
- Der neue Alternate-Deck-Benchmark-Commit `192a1cc6` ist Teil des aktuellen lokalen `main` und muss bei AI108 berücksichtigt werden.

## Nicht-Ziele

- Keine Hidden-Info-, LegalAction-, Replay-, StateHash-, Randomness- oder Rules-Engine-Vertragsänderung.
- Keine breiten Heuristik-Strafen.
- Keine Anpassung offizieller Karten-, Artwork- oder Asset-Gates.
- Kein Push und kein PR.
- Kein kosmetisches Senken von Zielwerten.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- KI reicht nur aus `LegalActions` abgeleitete Actions ein.
- Diagnose- und Benchmark-Artefakte dürfen keine Hidden-Info-Daten leaken.
- `illegalActions = 0`, `replayFailures = 0`, `redactionSafe = true` bleiben harte Gates.
- `unsafeScoreChosen` darf nicht über 3 steigen.
- `mixed_unknown` und `continue_without_progress` dürfen nicht wieder als Restklasse auftauchen.

## Automatische Fehlerbehandlung

- Rote Tests werden eng debuggt und nur innerhalb des Paket-Scopes behoben.
- Wenn ein Runtime-Fix `unsafeScoreChosen`, Replay, Redaction oder IllegalActions verschlechtert, wird er verworfen und als No-Go dokumentiert.
- Wenn ein Fall keine sichere Alternative zeigt, wird nur ein Review-Artefakt erstellt.
- Bei unklarer Hidden-Info- oder Regelautoritätslage stoppt der Prozess mit Blocker-Report.

## State Machine

1. `process_defined`
2. `ai108_rebaseline`
3. `ai109_late_draw_review`
4. `ai110_corp_no_safe_alternative_review`
5. `ai111_runner_reserve_outcome_review`
6. `ai112_narrow_experiment_or_no_go`
7. `ai113_guard_comment_pass`
8. `ai114_final_sweep`
9. `merged_to_main`
10. `complete`

## Paketfolge

### AI108 Current Head Rebaseline

Ziel: Den aktuellen lokalen Integrationsstand erneut minimal vermessen.

Konkrete Arbeit:

- A-D-x5-Trace auf aktuellem Arbeitsbranch-Head.
- Vergleich gegen AI107.
- Klarstellen, ob `actionLimitReached = 9` weiterhin gilt.
- Einordnen, dass lokaler `main` nach GitHub-`c77ddb1e` bereits `192a1cc6` enthält.

Artefakte:

- `docs/reviews/ai/ai108-current-head-rebaseline-2026-06-12.md`
- `docs/reviews/ai/ai108-current-head-a-d-5seed-2026-06-12.json`

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- A-D-x5-Trace
- `git diff --check`

Commit: `test(ai): rebaseline current head after AI107`

### AI109 Late-Draw Without Coverage/Hand Goal Fixture

Ziel: Den einzelnen `late_draw_without_coverage_or_hand_goal`-Fall isolieren.

Konkrete Arbeit:

- Pair/Seed und Endfenster extrahieren.
- Letzte 40 bis 60 Actions prüfen.
- Klären, ob Draw wirklich ohne Coverage-/Handziel war und ob sichere Alternativen existierten.
- Nur bei klarem Beleg einen engen Malus oder Tie-Breaker testen.

Artefakte:

- `docs/reviews/ai/ai109-late-draw-action-limit-case-2026-06-12.md`
- optional Detail-JSON.

Checks:

- gezielte AI-Regression, falls Code geändert wird.
- `@netgrid/ai typecheck`
- `git diff --check`

Commit: `test(ai): isolate late draw action-limit case`

### AI110 Corp No-Safe-Alternative Endwindow Audit

Ziel: Den einzelnen `corp_late_gain_credit_no_safe_alternative`-Fall prüfen.

Konkrete Arbeit:

- Detailtrace auswerten.
- Verfügbare LegalActions und Score-/Advance-/Install-/Rez-Alternativen prüfen.
- Falls keine sichere Alternative: Review.
- Falls sicherer Pfad: enger Endwindow-Tie-Breaker.

Artefakte:

- `docs/reviews/ai/ai110-corp-no-safe-alternative-endwindow-audit-2026-06-12.md`

Checks:

- `@netgrid/ai typecheck`
- `git diff --check`

Commit: `docs(ai): audit corp no-safe-alternative endwindow`

### AI111 Runner Reserve Credit Outcome Over Two Turns

Ziel: Die vier harten Runner-Reserve-Fälle über Folgefenster bewerten.

Konkrete Arbeit:

- B003, B005, C001, C005 oder aktuelle äquivalente Fälle prüfen.
- Credits, Coverage-Lücken und nächste 10 bis 20 Actions auswerten.
- Kategorien: `reserve_converted_to_progress`, `reserve_preserved_run_reachability`, `reserve_no_conversion`, `reserve_unknown`.
- Kein Runtime-Fix ohne `reserve_no_conversion`-Fixture.

Artefakte:

- `docs/reviews/ai/ai111-runner-reserve-credit-outcomes-2026-06-12.md`

Checks:

- `@netgrid/ai typecheck`
- `git diff --check`

Commit: `docs(ai): audit runner reserve credit outcomes over follow-up window`

### AI112 Action-Limit <=8 Experimental Branch

Ziel: Nur auf Basis von AI109-AI111 prüfen, ob ein enger Fix `<=8` sicher erreicht.

Konkrete Arbeit:

- Maximal ein enger Runtime-Fix.
- A-D-x5, optional A-D-x10.
- Sofort verwerfen bei Safety- oder Zielmetrikregression.
- Wenn kein Kandidat klar ist: No-Go-Entscheidung dokumentieren.

Artefakte:

- `docs/reviews/ai/ai112-action-limit-8-experiment-2026-06-12.md`
- optional Trace-JSON.

Checks:

- betroffene Regressionen
- A-D-x5
- `@netgrid/ai typecheck`
- `git diff --check`

Commit: `fix(ai): test narrow action-limit closure candidate` oder `docs(ai): record action-limit 8 no-go decision`

### AI113 Sourcecode Comment and Guard Consistency Pass

Ziel: Kommentarstandard für nicht-triviale Guards konsistent halten.

Scope:

- `packages/ai/src/simulation/selfplay-trace-mining.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/legacy/runner-plans.ts`
- `packages/engine/src/game/abilities/runner-special-trigger-execution.ts`
- ggf. `packages/ai/src/visible-run-analysis.ts`

Kommentarregel:

- Kurz, direkt am Guard, erklärt das Warum.
- Keine trivialen Syntaxkommentare.

Checks:

- `@netgrid/ai typecheck`
- `@netgrid/engine typecheck`
- `git diff --check`

Commit: `docs(code): clarify residual action-limit guard invariants`

### AI114 Full Sweep

Ziel: Vollständiger Abschluss des Mini-Blocks.

Pflichtchecks:

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `git diff --check`
- finaler A-D-x5-Trace

Artefakte:

- `docs/reviews/ai/ai114-final-mini-sweep-review-2026-06-12.md`
- `docs/reviews/ai/ai114-final-a-d-5seed-2026-06-12.json`

Commit: `test(ai): complete residual action-limit mini-sweep`

## Verifikationsregeln

- Vor jedem Commit relevante Paketchecks und `git diff --check`.
- Jeder Paketabschluss erhält einen eigenen Commit.
- Nur paketzugehörige Dateien werden gestaged.
- Vollständige Tests erst im finalen Paket, außer Codeänderungen verlangen frühere Breite.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI108_AI114_RESIDUAL_ACTION_LIMIT_MINI_SWEEP`
- Branch: `codex/ai108-ai114-residual-action-limit-mini-sweep`
- Hauptworkspace wird nur für finalen Merge nach `main` genutzt.
- Vor finalem Merge aktuellen `main` in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt.
- Worktree erst nach erfolgreichem Merge entfernen.
- Push nur auf ausdrücklichen Nutzerwunsch.

## /Goal-Kern

`/Goal Arbeite AI108-AI114 vollständig und sequenziell im Worktree C:\Projekte\NETGRID_AI108_AI114_RESIDUAL_ACTION_LIMIT_MINI_SWEEP auf Branch codex/ai108-ai114-residual-action-limit-mini-sweep ab, committe jedes Paket, integriere danach lokal nach main und entferne den Worktree. Stelle keine Zwischenfragen, solange die konservative Fortsetzung möglich ist.`

## Abschlusskriterien

- AI108 bis AI114 sind erledigt und committed.
- Finaler Trace und Review liegen vor.
- Safety-Gates sind grün.
- Lokaler `main` enthält den Arbeitsbranch.
- Worktree ist entfernt.
- Offene Fremdänderungen sind benannt.
