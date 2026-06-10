# AI Source Structure Reorg Automation Process 2026-06-10

## Status

`complete`

Arbeitsbranch: `codex/ai-source-structure-reorg`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_REORG`

Hauptworkspace: `C:\Projekte\NETGRID`

## Finaler Stand

STRUCT-0 bis STRUCT-7 sind umgesetzt. `packages/ai/src/index.ts` bleibt öffentliche Fassade, während Runtime-Orchestrierung, Action-Semantik-Bausteine, Run-/Risk-Projektionen, Runner-Economy-Posture, TacticalPlan-Typen/Memory, Legacy-Planer und Simulation-Basistypen enger getrennt sind.

Abschlussbericht: `docs/reviews/ai/ai-source-structure-reorg-final-report-2026-06-10.md`

## Quelle/Vorgabe

Quelle ist der angehängte Review `AI Source Structure Review` vom aktuellen Codex-Auftrag. Der Review bewertet die bestehende AI-Struktur als teilweise zielnah, aber weiterhin zu stark um `packages/ai/src/index.ts`, `action-semantic-candidate.ts` und `tactical-plans.ts` konzentriert.

Die Umsetzung folgt dem Skill `paketprozess-worktree-goal`: kleine sequenzielle Pakete, eigener Worktree, je Paket Checks und Commit, finaler lokaler Merge nach `main`.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: AI-Source-Struktur schrittweise in Fassade, Runtime, Actions, Runner, Plans, Legacy und Simulation trennen.
- Reihenfolge: STRUCT-0 bis STRUCT-7.
- Scope: `packages/ai/src/**`, fokussierte Tests und diese Prozessdokumentation.
- Nicht-Ziele: keine Engine-, Server-, Web-, Replay-, StateHash-, LegalAction-, Randomness- oder Hidden-Info-Vertragsänderung.
- Abnahmekriterien: pro Paket explizit aus der Vorgabe ableitbar.
- Verifikation: `corepack pnpm --filter @netgrid/ai typecheck`, fokussierte Vitest-Läufe, am Ende AI-Testlauf und `git diff --check`.
- Branch-/Worktree-Erwartung: eigener `codex/`-Branch, final lokal nach `main`.

## Gesamtziel

`packages/ai/src/index.ts` bleibt öffentliche API-Fassade, verliert aber schrittweise produktive Implementierungsverantwortung. Runtime-Orchestrierung, Semantic-Ranking, Legacy-Baseline, Action-Semantik-Bausteine, Run-/Risk-Projektion, Runner-Bewertungen, TacticalPlan-Interna und Simulation werden enger gekapselt, ohne Verhalten absichtlich zu ändern.

## Annahmen

- Der Hauptworkspace `main` ist zu Prozessstart sauber.
- Bestehende öffentliche Exporte bleiben kompatibel oder werden über Fassaden/Re-Exports erhalten.
- STRUCT-0 darf bekannte rote Tests dokumentieren, falls der Ausgangsstand nicht vollständig grün ist.
- Tests dürfen nur dann aus `index.test.ts` entfernt oder verschoben werden, wenn gleichwertige fokussierte Abdeckung existiert oder im selben Paket ergänzt wird.
- Mechanische Pfadverschiebungen sind erlaubt, wenn Importpfade kontrolliert angepasst und Re-Exports erhalten werden.

## Nicht-Ziele

- Keine produktive KI-Verhaltensänderung.
- Keine neue Legalität und keine neue Action-Erzeugung.
- Keine Änderung an `applyAction`, Engine-Regeln, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, KI-Inputs, Debug-Ausgaben, Logs oder Reconnect-Payloads.
- Keine Löschung von Legacy-Planern, Legacy-Baseline, Force-Legacy-Modus oder No-Candidate-Fallback.
- Keine neue Karten-Sonderlogik als Struktur-Nebenprodukt.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn das Done-Gate erfüllt oder ein Blocker mit Removal Condition dokumentiert ist.
- Finale AI-Actions müssen weiterhin aus `input.legalActions` stammen.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` bleibt vertragsgemäß nutzbar.
- No-Candidate-Fallback bleibt nutzbar.
- Debug- und Diagnoseausgaben bleiben redigiert.
- `index.ts` bleibt Paket-Exportgrenze für `@netgrid/ai`.

## Automatische Fehlerbehandlung

- Bei roten Tests zuerst prüfen, ob der Fehler durch das aktive Paket verursacht wurde.
- Paketlokale Regressionen eng debuggen und im selben Paket beheben.
- Ausgangsrote oder fremde Fehler nur dokumentieren, wenn sie reproduzierbar nicht aus der Paketänderung stammen.
- Bei Konflikten mit parallel weitergelaufenem `main` beide Intentionen lesen und erhalten, sofern fachlich kompatibel.
- Kein `git reset --hard`, kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn eines eintritt:

- Strukturänderung verlangt neue LegalAction-Erzeugung oder Engine-Vertragsänderung.
- Hidden-Info-Grenze würde breiter als bisher.
- Legacy-Fallback kann nicht erhalten werden.
- Finale Action-Auswahl kann nicht mehr auf aktuelle `input.legalActions` zurückgeführt werden.
- Import-/Export-Kompatibilität des Pakets kann nicht mit vertretbarem Aufwand erhalten werden.

Removal Condition: Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierten Check belegt ist.

## State Machine

```text
process_prepared
  -> struct_0_preflight
  -> struct_1_runtime_entrypoints
  -> struct_2_action_semantic_candidate_split
  -> struct_3_run_risk_projection
  -> struct_4_runner_modules
  -> struct_5_tactical_plans_split
  -> struct_6_legacy_isolation
  -> struct_7_simulation_and_index_test
  -> final_verify
  -> merge_to_main
  -> complete
```

## Paketfolge

1. STRUCT-0: Rote Tests stabilisieren.
2. STRUCT-1: Runtime-Entrypoints aus `index.ts`.
3. STRUCT-2: `ActionSemanticCandidate` zerlegen.
4. STRUCT-3: RunActionProjection und RiskProjection bündeln.
5. STRUCT-4: Runner-Bewertungsmodule sortieren.
6. STRUCT-5: TacticalPlans splitten.
7. STRUCT-6: Legacy isolieren.
8. STRUCT-7: Simulation und `index.test.ts` ausdünnen.

## Paketdetails

### STRUCT-0: Rote Tests stabilisieren

Ziel: Ausgangsstand für `@netgrid/ai` prüfen und bekannte rote Tests isolieren.

Konkrete Arbeit:

- `corepack pnpm --filter @netgrid/ai typecheck` ausführen.
- `corepack pnpm --filter @netgrid/ai test` ausführen.
- Falls rot: Ursache prüfen und entweder eng beheben oder als Ausgangsabweichung dokumentieren.

Kernartefakte: Prozessdokument, optional kurzer Preflight-Review unter `docs/reviews/ai/`.

Checks:

```bash
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test
git diff --check
```

Done-Gate: Ausgangslage ist grün oder rote Abweichung ist isoliert und nicht durch Strukturänderung verursacht.

Commit: `docs(ai): prepare ai source structure process`

### STRUCT-1: Runtime-Entrypoints aus `index.ts`

Ziel: `chooseAiAction`, `chooseCorpAction`, `chooseRunnerAction` und Semantic-Runtime-Orchestrierung aus `index.ts` in Runtime-/Ranking-/Diagnostics-/Legacy-Fallback-Module ziehen.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/diagnostics/decision-debug.ts`
- `packages/ai/src/legacy/legacy-runtime-fallback.ts`
- `packages/ai/src/index.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Runtime-Modi, Legacy-Mode, No-Candidate-Fallback und Public Exports bleiben kompatibel.

Commit: `refactor(ai): extract semantic runtime entrypoints`

### STRUCT-2: ActionSemanticCandidate zerlegen

Ziel: `action-semantic-candidate.ts` als Typ-/Fassaden-Datei behalten und Builder-Schritte in `actions/` auslagern.

Kernartefakte:

- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-semantic-builder.ts`
- `packages/ai/src/actions/basic-action-semantics.ts`
- `packages/ai/src/actions/action-source-binding.ts`
- `packages/ai/src/actions/action-target-context.ts`
- `packages/ai/src/actions/action-cost-timing.ts`
- `packages/ai/src/actions/action-card-semantic-join.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Candidate-Schema, Gate-IDs, Basic-Semantik, Evidence-Redaction und Konsumentenverhalten bleiben unverändert.

Commit: `refactor(ai): split action semantic candidate builder`

### STRUCT-3: RunActionProjection und RiskProjection bündeln

Ziel: Run- und Risiko-Projektion aus `runner-run-target-evaluation.ts` herauslösen.

Kernartefakte:

- `packages/ai/src/runner-run-target-evaluation.ts`
- `packages/ai/src/actions/run-action-projection.ts`
- `packages/ai/src/actions/risk-action-projection.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-golden-deck-debug.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: RunTarget-Empfehlungen und Risk-Modell bleiben funktional gleich und generisch.

Commit: `refactor(ai): extract run and risk projections`

### STRUCT-4: Runner-Bewertungsmodule sortieren

Ziel: Runner-spezifische Bewertung in fokussierte Module für Economy, Reserve, Handentwicklung und Install-Marginal-Utility trennen.

Kernartefakte:

- `packages/ai/src/runner-run-target-evaluation.ts`
- `packages/ai/src/runner-economy-posture.ts`
- `packages/ai/src/runner-credit-reserve.ts`
- `packages/ai/src/runner-hand-development.ts`
- `packages/ai/src/runner-install-marginal-utility.ts`
- `packages/ai/src/runner-tactical-goals.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-hand-development.test.ts src/runner-tactical-goals.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Goal-Namen, Recommendation-Namen, Scoring-Schwellen und finale Action-Auswahl bleiben unverändert.

Commit: `refactor(ai): organize runner evaluation modules`

### STRUCT-5: TacticalPlans splitten

Ziel: `tactical-plans.ts` als Fassade behalten und Typen, Memory, Debug, Builder und PlanStep-Fit auslagern.

Kernartefakte:

- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/plans/tactical-plan-types.ts`
- `packages/ai/src/plans/plan-memory.ts`
- `packages/ai/src/plans/plan-debug.ts`
- `packages/ai/src/plans/runner-tactical-plan-builder.ts`
- `packages/ai/src/plans/corp-tactical-plan-builder.ts`
- `packages/ai/src/actions/plan-step-action-fit.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: PlanMemory-Isolation, TTL-/Progressionsverhalten, PlanStep-Mapping und LegalAction-Auswahl bleiben unverändert.

Commit: `refactor(ai): split tactical plan internals`

### STRUCT-6: Legacy isolieren

Ziel: Legacy-Code sichtbar kapseln, ohne Fallbacks zu löschen.

Kernartefakte:

- `packages/ai/src/legacy/runner-plans.ts`
- `packages/ai/src/legacy/corp-plans.ts`
- `packages/ai/src/legacy/legacy-baseline.ts`
- `packages/ai/src/legacy/legacy-plan-weights.ts`
- Fassaden/Re-Exports für alte Importpfade.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Alte Importpfade oder kontrolliert angepasste Importe funktionieren; Legacy-Mode und No-Candidate-Fallback bleiben grün.

Commit: `refactor(ai): isolate legacy planners`

### STRUCT-7: Simulation und `index.test.ts` ausdünnen

Ziel: Simulation aus der Live-Fassade lösen und `index.test.ts` nur dort ausdünnen, wo fokussierte Tests übernehmen.

Kernartefakte:

- `packages/ai/src/simulation/simulation-harness.ts`
- `packages/ai/src/simulation/simulation-metrics.ts`
- `packages/ai/src/simulation/selfplay-league.ts`
- `packages/ai/src/simulation/benchmark-reports.ts`
- fokussierte Tests nach Zielmodul.

Checks:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Done-Gate: Benchmarkdaten, Seed-/Determinismusannahmen, Regressionserwartungen und Hidden-Info-Vertragsprüfungen bleiben erhalten.

Commit: `refactor(ai): separate simulation exports`

## Verifikationsregeln

- Nach jedem Paket mindestens die paketbezogenen fokussierten Tests und `git diff --check`.
- Nach STRUCT-7 vollständiger `@netgrid/ai`-Testlauf und Typecheck.
- Vor finalem Merge Arbeitsbranch sauber, dann `main` integrieren, final erneut prüfen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_REORG`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für den finalen lokalen Merge nach `main`.
- Branch: `codex/ai-source-structure-reorg`.
- Jeder abgeschlossene Paketstand erhält genau einen thematischen Commit.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.
- Beim finalen Merge Fast-Forward bevorzugen; Merge-Commit nur mit dokumentierter Begründung.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Source Structure Reorg vollständig und sequenziell von STRUCT-0 bis STRUCT-7 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Projektstartseiten und docs/architecture/ai/ai-source-structure-reorg-automation-process-2026-06-10.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_REORG auf Branch codex/ai-source-structure-reorg.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte nur, wenn sie wiederverwendbar oder prüfrelevant sind.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- STRUCT-0 bis STRUCT-7 sind entweder umgesetzt oder mit begründetem Sicherheitsblocker gestoppt.
- Alle Paketcommits liegen auf `codex/ai-source-structure-reorg`.
- Finale AI-Checks sind ausgeführt und dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
