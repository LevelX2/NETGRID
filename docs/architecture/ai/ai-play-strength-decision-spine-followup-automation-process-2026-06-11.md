# AI Play-Strength Decision Spine Follow-up Automation Process 2026-06-11

## Status

`complete`

Arbeitsbranch: `codex/ai-play-strength-followup-fixes`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_FOLLOWUP`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Ergebnisanalyse `Review AI Play-Strength Decision Spine` vom 2026-06-11. Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`, kein Push.

## Schlussfolgerung aus der Ergebnisanalyse

Der AI Play-Strength Decision Spine ist fachlich richtig geschnitten: DecisionFrame, TacticalGoalUtility, ActionGoalFit, HardGates, Threat-/Opportunity-Projektionen, SemanticShadowDecision, Mistake-Suite, enger Basic-/Setup-Pilot und Diagnostics-Extraktion schaffen eine erklärbare Entscheidungsachse ohne neue Engine-Autorität.

Die Review benennt aber echte Folgearbeit:

- Der opt-in Pilotpfad hat eine Inkonsistenz zwischen `reasonCode` und `reason`.
- Final-Report und Prozessstatus müssen den lokalen `main`-Abschluss wahrheitsgemäß abbilden.
- Der Pilot braucht einen Integrationstest über den echten Runtime-Entrypoint.
- `ActionGoalFit` soll im Shadow-/Pilotpfad side-sichere Economy-Daten nutzen können.
- Die Mistake-Suite braucht einen breiteren Snapshot-Korpus.
- Shadow-vs-Runtime-Vergleiche sollen als Diagnosebericht auswertbar werden.
- Heuristiken sollen messbar kalibriert, aber nicht produktiv umgewichtet werden.
- `index.ts` soll weiter nur über pure, risikoarme Debug-/Report-Helfer entlastet werden.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Folgefixes und Optimierungen zum Decision Spine ohne neue Legalitäts- oder Engine-Autorität.
- Reihenfolge: Must-Fixes zuerst, danach Tests/Diagnostik/EconomyContext/Korpus/Report/Kalibrierung/Extraktion, dann FINAL-GREEN.
- Scope: `packages/ai/src/runtime/**`, `packages/ai/src/decision/**`, `packages/ai/src/evaluation/**`, `packages/ai/src/diagnostics/**`, `packages/ai/src/index.ts` und AI-Dokumentation.
- Nicht-Ziele: keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Abnahme: paketbezogene Vitest-Läufe, Typecheck, `git diff --check`, am Ende vollständiger `@netgrid/ai`-Testlauf.
- Branch-/Worktree-Erwartung: eigener Branch `codex/ai-play-strength-followup-fixes`, final lokal nach `main`.

Konservative Annahme: Falls ein NEXT-Paket für eine sichere Umsetzung zu breit wird, wird der pure diagnostische Kern umgesetzt und der produktiv riskante Anteil als dokumentierter Follow-up-Gap stehen gelassen. Keine Paketarbeit darf den Pilot-Scope still erweitern.

## Gesamtziel

Der Prozess schließt die Review-Befunde und erweitert den Decision Spine in Richtung messbarer Spielstärke:

```text
Pilot consistency
-> final report sync
-> runtime integration guard
-> economy-aware shadow scoring
-> broader mistake corpus
-> shadow/runtime comparison report
-> calibration baseline
-> smaller pure diagnostics/report helpers
-> final green and local main integration
```

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`.
- Keine Änderung an LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, AI-Inputs, Debug, Logs, Reports, Reconnect-Payloads oder Simulationstraces.
- Keine produktive CardId-Sonderlogik.
- Keine Ausweitung von `NETGRID_AI_PLAY_STRENGTH_PILOT=basic_setup`.
- Kein breiter Cutover und kein neuer KI-Spieler.
- Keine neue produktive Gewichtung aus Kalibrierungsdaten.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- Finale AI-Actions stammen weiterhin aus `input.legalActions`.
- Die KI erzeugt keine Legalität.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert.
- Shadow- und Benchmark-Reports haben keine Runtime-Wirkung.
- Pilot-Runtime-Wirkung bleibt default-off und nur per explizitem lokalem Flag aktiv.
- Konkrete Kartenfälle sind Regressionen/Testanker, nicht Produktiv-Sonderregeln.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktiven Paket eingegrenzt und eng behoben.
- Kein `test.skip`, `test.only`, pauschales Löschen von Tests oder breites Lockern von Assertions.
- Keine Hidden-Info-Allowlist-Erweiterung ohne konkreten, side-safe Vertrag.
- Wenn ein sinnvoller Score nur über Hidden-Info oder Engine-Änderungen möglich wäre, wird der Fall als Blocker oder Follow-up dokumentiert.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn fachlich kompatibel.
- Kein `git reset --hard` und kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht aus `input.legalActions` stammt;
- eine Änderung neue LegalAction-Erzeugung oder Engine-Vertragsänderung verlangt;
- Hidden-Info-Grenzen breiter werden müssten;
- Replay, StateHash oder Randomness beeinflusst würden;
- Legacy- oder No-Candidate-Fallback nicht erhalten werden kann;
- Debug-/Trace-/Reportdaten verdeckte Gegnerinformationen leaken;
- der Basic-/Setup-Pilot ohne explizites Flag Runtime-Wirkung bekommt;
- NEXT-Pakete eine produktive Gewichtungsänderung statt nur Diagnose/Kalibrierung verlangen.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> ai_play_fix_1_pilot_reason
  -> ai_play_fix_2_report_sync
  -> ai_play_fix_3_runtime_integration_test
  -> ai_play_next_1_economy_context
  -> ai_play_next_2_snapshot_corpus
  -> ai_play_next_3_shadow_runtime_report
  -> ai_play_next_4_calibration_baseline
  -> ai_play_next_5_debug_report_extraction
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessartefakt | Artefakt existiert, Worktree sauber, `git diff --check` grün | `docs(ai): define play strength followup process` |
| `AI-PLAY-FIX-1` | Pilot-Reason-Konsistenz | Pilotpfad nutzt `selectedChoice` konsistent; fokussierte Tests grün | `fix(ai): align pilot decision reason with selected choice` |
| `AI-PLAY-FIX-2` | Final-Report mit lokalem Main-Stand synchronisieren | Status steht auf `complete`; finale Main-Checks dokumentiert | `docs(ai): mark play strength spine complete on main` |
| `AI-PLAY-FIX-3` | Pilot-Integrationstest über Runtime-Entrypoint | echter Runtimefluss deckt Flag-off, Flag-on, Evidence, Reason und Redaction ab | `test(ai): cover basic setup pilot through semantic runtime` |
| `AI-PLAY-NEXT-1` | EconomyContext im DecisionFrame | side-safe EconomyContext fließt in Shadow/Fit ein; CostGate real nutzbar | `feat(ai): add economy context to decision frame` |
| `AI-PLAY-NEXT-2` | Snapshot-Korpus erweitern | neue Mistake-Fixtures und Review-Artefakt vorhanden | `test(ai): expand play strength decision snapshot corpus` |
| `AI-PLAY-NEXT-3` | Shadow-vs-Runtime Decision Report | report-only Vergleich mit Redaction und Tests | `feat(ai): add semantic shadow runtime comparison report` |
| `AI-PLAY-NEXT-4` | Heuristik-Kalibrierung vorbereiten | Benchmark misst Komponenten ohne produktive Gewichtung | `test(ai): add play strength calibration benchmark` |
| `AI-PLAY-NEXT-5` | Weitere pure Debug-/Report-Helfer extrahieren | `index.ts` nur risikoarm entlastet; Contracts grün | `refactor(ai): extract debug score component builder` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf | vollständiger `@netgrid/ai test`, Typecheck, Diffcheck und Runtime-Contract-Tests grün; lokal nach `main` integriert | `docs(ai): record play strength followup final green` |

## Paketdetails

### AI-PLAY-FIX-1: Pilot-Reason-Konsistenz

Ziel: Der opt-in Pilotpfad gibt `reason`, `reasonCode`, `explanation`, Evidence und DecisionDebug aus derselben `selectedChoice` zurück.

Betroffene Dateien:

- `packages/ai/src/runtime/semantic-runtime.ts`
- `packages/ai/src/decision/semantic-basic-setup-pilot.test.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`

Kernänderung: `reason: choice.reasonCode` wird im Return auf `selectedChoice.reasonCode` umgestellt.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/semantic-basic-setup-pilot.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-PLAY-FIX-2: Final-Report mit lokalem Main-Stand synchronisieren

Ziel: Dokumentation und Wissensbasis bilden den final integrierten lokalen `main`-Stand ab.

Betroffene Dateien:

- `docs/reviews/ai/ai-play-strength-decision-spine-final-report-2026-06-11.md`
- `docs/architecture/ai/ai-play-strength-decision-spine-automation-process-2026-06-11.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Checks:

```bash
git diff --check
```

### AI-PLAY-FIX-3: Pilot-Integrationstest über Runtime-Entrypoint

Ziel: Der echte Runtimefluss belegt Flag-off-Verhalten, opt-in Pilot-Übernahme, Reason-Konsistenz, Pilot-Evidence, PlanMemory-Wirkung und Redaction.

Betroffene Dateien:

- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- `packages/ai/src/decision/semantic-basic-setup-pilot.test.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-PLAY-NEXT-1: EconomyContext in DecisionFrame aufnehmen

Ziel: `ActionGoalFit` und HardGates sollen im Shadow-/Pilotpfad verfügbare Credits und Creditdruck side-safe berücksichtigen können.

Neue Struktur:

```ts
type SemanticDecisionEconomyContext = {
  availableCredits?: number;
  clicksRemaining?: number;
  creditPressure?: "low" | "medium" | "high";
  evidence: string[];
};
```

Betroffene Dateien:

- `packages/ai/src/decision/semantic-decision-frame.ts`
- `packages/ai/src/decision/action-goal-fit.ts`
- `packages/ai/src/decision/hard-gates.ts`
- `packages/ai/src/decision/semantic-shadow-decision.ts`
- zugehörige Tests

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/semantic-decision-frame.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/action-goal-fit.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/semantic-shadow-decision.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-PLAY-NEXT-2: Snapshot-Korpus erweitern

Ziel: Die Mistake-Taxonomy bekommt reproduzierbare Spielstärke-Szenarien für Runner- und Corp-Fehlerklassen.

Betroffene Dateien:

- `packages/ai/src/evaluation/decision-snapshot-suite.ts`
- `packages/ai/src/evaluation/decision-snapshot-suite.test.ts`
- `packages/ai/src/evaluation/decision-snapshot.ts`
- `docs/reviews/ai/ai-play-strength-snapshot-corpus-2026-06-11.md`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/decision-snapshot-suite.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/semantic-shadow-decision.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-PLAY-NEXT-3: Shadow-vs-Runtime Decision Report

Ziel: Der Spine wird report-only gegen die bestehende Semantic Runtime vergleichbar, ohne Verhalten zu ändern.

Betroffene Dateien:

- `packages/ai/src/evaluation/semantic-shadow-report.ts`
- `packages/ai/src/evaluation/semantic-shadow-report.test.ts`
- `packages/ai/src/decision/semantic-shadow-decision.ts`
- `packages/ai/src/runtime/semantic-runtime.ts`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-report.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/decision-snapshot-suite.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-PLAY-NEXT-4: Heuristik-Kalibrierung vorbereiten

Ziel: Score-Komponenten und Snapshot-Mistakes werden messbar, aber keine neuen produktiven Gewichte aktiviert.

Betroffene Dateien:

- `packages/ai/src/decision/action-goal-fit.ts`
- `packages/ai/src/decision/score-components.ts`
- `packages/ai/src/evaluation/play-strength-benchmark.ts`
- `packages/ai/src/evaluation/play-strength-benchmark.test.ts`
- `docs/reviews/ai/ai-play-strength-weight-calibration-notes-2026-06-11.md`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/play-strength-benchmark.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/decision/action-goal-fit.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-PLAY-NEXT-5: Weitere sichere `index.ts`-Extraktion

Ziel: Nur pure Debug-/Report-Helfer aus `index.ts` extrahieren, ohne Auswahl-, Fallback- oder Runtime-Logik zu bewegen.

Betroffene Dateien:

- `packages/ai/src/index.ts`
- `packages/ai/src/diagnostics/decision-debug.ts`
- `packages/ai/src/diagnostics/decision-debug.test.ts`
- gegebenenfalls `packages/ai/src/simulation/**`

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/decision-debug.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### FINAL-GREEN

Pflichtchecks:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
```

Kernartefakt:

- `docs/reviews/ai/ai-play-strength-decision-spine-followup-final-report-2026-06-11.md`

## Verifikationsregeln

- Nach jedem Paket paketbezogene Vitest-Dateien und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Am Ende vollständiger `corepack pnpm --filter @netgrid/ai test`.
- Wenn Dateien außerhalb `packages/ai` geändert werden, betroffene Paketchecks ergänzen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree.
- Hauptworkspace nur für finalen lokalen Merge.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und grün.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt; falls nicht möglich, Ursache prüfen und dokumentieren.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite die Paketserie AI-PLAY-FIX-1 bis AI-PLAY-NEXT-5 plus FINAL-GREEN vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAY_STRENGTH_FOLLOWUP auf Branch codex/ai-play-strength-followup-fixes.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- Alle Folgepakete und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Alle Paketcommits liegen auf `codex/ai-play-strength-followup-fixes`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Default-Runtime bleibt unverändert; lokaler Pilot bleibt default-off.
- Vollständiger `@netgrid/ai`-Testlauf, Typecheck und `git diff --check` sind grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.

## Abschlussnachtrag 2026-06-12

Der Status wurde nachträglich von `final_green_passed_pending_local_main_merge` auf `complete` korrigiert. Der lokale Merge nach `main`, die Hauptworkspace-Prüfungen und die Worktree-Entfernung waren abgeschlossen; der Follow-up-Final-Report dokumentiert die nachgezogenen Main-Checks mit 65 AI-Testdateien und 1117 Tests.
