# AI Source Structure Optimization Loop 2

Status: `package_done:AI-SRCOPT2-2`

Datum: 2026-06-22

## Quelle und Vorgabe

Der Nutzer hat nach Loop 1 beauftragt, die Source-Code-Strukturoptimierung mit
einem Planungs- und anschließendem Umsetzungsteil weiter zu iterieren, bis kein
sinnvolles Potential mehr sichtbar ist.

Loop 1 ist abgeschlossen und nach `main` integriert. Er hat Access-Projection,
Legacy-Access-Outcome-Memory und RunTarget-Guidance-Grundgewichte gekapselt.

## Zielprüfung

Die Vorgabe ist ausführbar, wenn "kein Potential mehr" konservativ verstanden
wird: Es wird so lange weitergearbeitet, wie ein weiterer kleiner, testbarer und
vertragserhaltender Source-Code-Schnitt ohne neuen Spezialaudit sichtbar ist.
Wenn nur noch große Facade-, Runtime-Orchestration-, TacticalPlans- oder
Evaluation-Splits übrig sind, stoppt der Loop mit Restpotentialbericht.

## Gesamtziel

Loop 2 soll die nach Loop 1 sichtbare RunTarget-Familie weiter schließen und
danach erneut bewerten, ob noch ein sicherer nächster Code-Slice existiert.

## Annahmen

- `main` ist sauber und mit `origin/main` synchron.
- Umsetzung läuft in `C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_OPT_LOOP_2` auf
  Branch `codex/ai-source-structure-optimization-loop-2`.
- Remote-Push gehört nicht zu diesem Loop.
- `packages/ai/src/index.ts` und `packages/ai/src/tactical-plans.ts` dürfen nur
  durch reine Helper-Extraktion berührt werden.
- Kein Slice darf AI-Verhalten fachlich neu gewichten; bestehende Zahlen und
  Klassifikationen werden nur verschoben und getestet.

## Nicht-Ziele

- Kein großer Rewrite von `packages/ai/src/index.ts`.
- Keine neue KI-Strategie, keine neuen Planner-Gewichte und kein Cutover.
- Keine Engine-, Server-, Web-, Replay-, StateHash- oder Hidden-Info-Änderung.
- Keine Änderungen an LegalActions oder `applyAction`.

## Controller-Invarianten

- AI konsumiert nur side-sichere Inputs und wählt nur LegalActions.
- Die Rules Engine bleibt alleinige Regelautorität.
- Extracted Helpers bleiben reine Funktionen ohne Runtime-, Engine- oder
  Public-Fassade-Abhängigkeit.
- Tests müssen alte Werte explizit gegen Drift absichern.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktuellen Paket debuggt.
- Wenn ein Kandidat doch Orchestration oder Public API betrifft, wird er als
  Restpotential dokumentiert und nicht umgesetzt.
- Wenn ein weiterer sicherer Slice nach Paketabschluss nicht mehr klar sichtbar
  ist, endet der Loop.

## Sicherheitsblocker

Stoppen, wenn:

- eine Änderung KI-Entscheidungsgewichtung fachlich verändert statt nur
  bestehende Logik zu verschieben;
- Hidden-Info-, Replay-, StateHash-, Engine- oder LegalAction-Verträge berührt
  werden;
- ein Split neue zirkuläre Imports oder Public-Exports erzeugt;
- der nächste Slice mehr als eine fachliche Familie gleichzeitig umbaut.

## State Machine

1. `package_active:AI-SRCOPT2-0`
2. `package_done:AI-SRCOPT2-0`
3. `package_done:AI-SRCOPT2-1`
4. `package_done:AI-SRCOPT2-2`
5. `final_green_ready`
6. `merged_to_main`
7. `complete`
8. `blocked:<reason>`

## Paketfolge

### AI-SRCOPT2-0 Planung, Messung und Prozessartefakt

Ziel: Loop 2 begrenzen, messbare Kandidaten festhalten und den Arbeitsrahmen
committed sichern.

Kernbefund:

- `packages/ai/src/index.ts`: 36.809 Zeilen, ca. 1,32 MB.
- `packages/ai/src/tactical-plans.ts`: 4.260 Zeilen.
- Nächster sicherer Kandidat ist weiterhin RunTarget-Familie, nicht ein breiter
  Runtime-Facade-Split.
- Konkrete Resthelper in `index.ts`:
  - `runnerMultiRunEvaluationPlausible`
  - `runnerMultiRunPayoffClass`
  - `runnerMultiRunHighPayoff`
- Konkrete Resthelper in `tactical-plans.ts`:
  - `runnerPressureProbeBasePriority`
  - `runnerPressureProbeTargetAllowed`

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts src/public-export-contract.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

Commit: `docs(ai): plan source structure optimization loop 2`

### AI-SRCOPT2-1 RunTarget-Payoff-Klassifizierung extrahieren

Ziel: Multi-Run-Payoff-Klassifizierung aus `index.ts` in die bestehende
RunTarget-Guidance-Familie ziehen.

Arbeit:

- `runnerRunTargetHighPayoff`, `runnerRunTargetPlausibleForMultiRun` und
  `runnerRunTargetMultiRunPayoffClass` in
  `packages/ai/src/runner-run-target-guidance.ts` ergänzen.
- Tests in `runner-run-target-guidance.test.ts` um Payoff-Klassen erweitern.
- `index.ts` auf die Helper umstellen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-guidance.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): share run target payoff classification`

Ergebnis:

- `runnerRunTargetHighPayoff`,
  `runnerRunTargetPlausibleForMultiRun` und
  `runnerRunTargetMultiRunPayoffClass` liegen jetzt in
  `packages/ai/src/runner-run-target-guidance.ts`.
- `packages/ai/src/index.ts` nutzt diese Helper statt lokaler Multi-Run-
  Klassifikationsfunktionen.
- `runner-run-target-guidance.test.ts` deckt Missing-/Blocked-/Low-/Unknown-/
  High-Payoff und Plausibility-Fälle ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-guidance.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `git diff --check`

### AI-SRCOPT2-2 Pressure-Probe-Guidance extrahieren

Ziel: Pure Pressure-Probe-RunTarget-Helfer aus `tactical-plans.ts` in die
RunTarget-Guidance-Familie ziehen.

Arbeit:

- Base-Priority und Allowed-Prädikat als reine Helper ergänzen.
- Tests gegen bestehende Prioritäten und Ausschlussbedingungen ergänzen.
- `tactical-plans.ts` auf die Helper umstellen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-guidance.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): share pressure probe run target helpers`

Ergebnis:

- `runnerPressureProbeBasePriority` und `runnerPressureProbeTargetAllowed`
  liegen jetzt in `packages/ai/src/runner-run-target-guidance.ts`.
- `packages/ai/src/tactical-plans.ts` nutzt die geteilten RunTarget-Guidance-
  Helper statt lokaler Pressure-Probe-Funktionen.
- `runner-run-target-guidance.test.ts` deckt Base-Priority sowie Target-Kind-,
  Payoff-, Path- und Credit-Ausschlüsse ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-guidance.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `git diff --check`

### AI-SRCOPT2-3 Restpotential bewerten und Abschluss dokumentieren

Ziel: Nach den sicheren RunTarget-Slices bewerten, ob noch ein weiterer
testbarer Slice ohne neuen Spezialaudit sichtbar ist.

Erwartete Stoplinie:

- Weitere `index.ts`-Splits betreffen Runtime-Orchestration, Debug-Evidence oder
  Public-Fassade und brauchen einen neuen Readiness-Audit.
- Weitere `tactical-plans.ts`-Splits sollen nach Goal-Familien geplant werden,
  nicht als opportunistische Extraktion.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts src/public-export-contract.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

Commit: `docs(ai): close source structure optimization loop 2`

## FINAL-GREEN

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Done-Gate:

- Arbeitsbranch ist sauber.
- Branch ist lokal nach `main` integriert.
- Hauptworkspace ist sauber.
- Worktree ist entfernt.

## Controller-Prompt-Kern

`/Goal Arbeite AI Source Structure Optimization Loop 2 vollständig und
sequenziell von AI-SRCOPT2-0 bis AI-SRCOPT2-3 plus FINAL-GREEN ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_OPT_LOOP_2 auf Branch
codex/ai-source-structure-optimization-loop-2. Nutze den Hauptworkspace nur für
den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus,
committe jedes abgeschlossene Paket und stoppe, sobald nur noch riskante oder zu
breite Optimierungen übrig sind. Kein Push ohne separaten Nutzerauftrag.`

## Abschlusskriterien

- Die sicheren RunTarget-Resthelper sind extrahiert oder ein Blocker ist
  dokumentiert.
- Full AI-Test und AI-Typecheck bestehen.
- Restpotential ist mit nächstem benötigtem Audit benannt.
- Branch ist lokal nach `main` gemerged und Worktree entfernt.
