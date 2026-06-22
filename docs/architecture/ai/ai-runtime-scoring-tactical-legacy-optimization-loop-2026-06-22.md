# AI Runtime Scoring Tactical Legacy Optimization Loop

Status: `package_done:AI-RSL-3`

Datum: 2026-06-22

## Quelle und Vorgabe

Der Nutzer hat nach dem Runtime/Tactical-Boundary-Loop beauftragt, die dort
verbliebenen separaten Audits für Runtime-Scoring, Tactical-Goal-Family-Split
und Legacy-Isolation in einer Optimierungsschleife mit Planungsteil und
anschließendem Umsetzungsteil so lange zu iterieren, bis kein sinnvolles
Potential mehr sichtbar ist.

## Zielprüfung

Die Vorgabe ist ausführbar, wenn "kein Potential mehr" konservativ verstanden
wird: Es werden nur kleine, testbare und vertragserhaltende Slices umgesetzt,
die bestehende Gewichtungen, Scope-IDs, Evidence und Legacy-Fallback-Verträge
nicht verändern. Der Loop endet, sobald weitere Arbeit fachliche
Runtime-Scoring-Neukalibrierung, Tactical-Goal-Rearchitecture oder Legacy-
Ablösung verlangen würde.

## Gesamtziel

Die großen Restmodule werden dort weiter entlastet, wo klare Zielmodule
existieren:

- Runtime-Scoring-Kern in `runtime/semantic-runtime-score-components.ts`.
- Tactical-Goal-Family-Helfer in `plans/`.
- Legacy-Plan-Metadaten in `legacy/`.

## Annahmen

- Umsetzung läuft in `C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_LEGACY_AUDIT_LOOP`
  auf Branch `codex/ai-runtime-tactical-legacy-audit-loop`.
- Remote-Push gehört nicht zu diesem Loop.
- Bestehende Public Exports des Pakets bleiben stabil.
- Kein Slice darf Scoring-Gewichte, Planner-Prioritäten oder Legacy-
  Entscheidungsverhalten fachlich ändern.

## Nicht-Ziele

- Keine Runtime-Neukalibrierung.
- Kein TacticalPlan-Rewrite.
- Keine Legacy-Entfernung.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness-
  oder Hidden-Info-Änderung.

## Controller-Invarianten

- AI konsumiert nur side-sichere Inputs und wählt ausschließlich LegalActions.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und No-Candidate-Fallback bleiben
  erhalten.
- Extracted Helper bleiben reine Funktionen oder reine Metadaten.
- Tests müssen bestehende Zahlen und Evidence-Strings gegen Drift absichern.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktuellen Paket debuggt.
- Wenn ein Kandidat doch fachliche Gewichtung oder breite Orchestrierung
  berührt, wird er als Restpotential dokumentiert und nicht umgesetzt.
- Nach jedem Paket wird das Restpotential neu bewertet.

## Sicherheitsblocker

Stoppen, wenn:

- Scoring-Werte oder Planner-Prioritäten fachlich verändert werden müssten;
- Hidden-Info-, Replay-, StateHash-, Engine- oder LegalAction-Verträge berührt
  werden;
- neue zirkuläre Imports entstehen;
- der nächste Slice mehr als eine fachliche Familie gleichzeitig umbaut.

## State Machine

1. `package_active:AI-RSL-0`
2. `package_done:AI-RSL-0`
3. `package_done:AI-RSL-1`
4. `package_done:AI-RSL-2`
5. `package_done:AI-RSL-3`
6. `final_green_ready`
7. `merged_to_main`
8. `complete`
9. `blocked:<reason>`

## Paketfolge

### AI-RSL-0 Planung, Messung und Prozessartefakt

Ziel: Reststruktur nach Runtime/Tactical-Boundary-Loop messen und sichere
Schnittkandidaten festlegen.

Kernbefund:

- `packages/ai/src/index.ts`: 36.108 Zeilen.
- `packages/ai/src/tactical-plans.ts`: 4.230 Zeilen.
- `packages/ai/src/legacy/runner-plans.ts`: 8.838 Zeilen.
- `runtime/semantic-runtime-score-components.ts`: 46 Zeilen und damit klarer
  Zielort für Score-Summen- und Type-Priority-Helfer.
- `tactical-plans.ts` enthält eine kompakte Draw-Overflow-Familie mit
  Penalty-, Evidence-, Rationale- und Credit-Plan-Support-Helfern.
- `legacy/runner-plans.ts` enthält reine RunnerPlan-Metadaten wie Base-Score,
  Benefits, Risks, Uncertainty und Run-Plan-Klassifizierung.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-score-components.test.ts src/tactical-plans.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

Commit: `docs(ai): plan runtime tactical legacy optimization loop`

Ergebnis:

- Vorhandener Worktree
  `C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_LEGACY_AUDIT_LOOP` auf Branch
  `codex/ai-runtime-tactical-legacy-audit-loop` wurde wiederaufgenommen.
- Planungsmessung wurde auf den aktuellen Main-Stand korrigiert.
- Planungs-Gate grün:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-score-components.test.ts src/tactical-plans.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
    grün: 3 Testdateien, 561 Tests.
  - `git diff --check` grün.

### AI-RSL-1 Runtime-Scoring-Kern extrahieren

Ziel: Reine Runtime-Score-Helfer aus `index.ts` in
`runtime/semantic-runtime-score-components.ts` verschieben.

Arbeit:

- `semanticRuntimeScoreFromComponents` und `semanticRuntimeTypePriority`
  exportieren.
- `index.ts` auf die Runtime-Score-Helper umstellen.
- Tests für Summe, Rundung, Confidence und Type-Priority ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-score-components.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): move semantic runtime score helpers`

Ergebnis:

- `semanticRuntimeScoreFromComponents` und `semanticRuntimeTypePriority`
  liegen jetzt in `packages/ai/src/runtime/semantic-runtime-score-components.ts`.
- `packages/ai/src/index.ts` importiert die Score-Helfer aus dem Runtime-
  Score-Modul und enthält keine lokalen Duplikate mehr.
- `semantic-runtime-score-components.test.ts` sichert Score-Summe, Confidence,
  Evidence-Scrubbing und Type-Priority-Werte direkt ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-score-components.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
    grün: 2 Testdateien, 522 Tests.
  - `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - `git diff --check` grün.

### AI-RSL-2 Tactical Draw-Overflow-Familie extrahieren

Ziel: Die reine Runner-Draw-Overflow-Bewertung aus `tactical-plans.ts` in ein
Plan-Family-Modul verschieben.

Arbeit:

- `RunnerDrawOverflowAssessment`-Berechnung, Penalty-, Reason-, Rationale-,
  Evidence- und Credit-Boost-Helfer nach `plans/runner-draw-overflow.ts`
  verschieben.
- `tactical-plans.ts` auf das neue Modul umstellen.
- Tests für Severity, Penalty, Reasons und Credit-Boost ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/plans/runner-draw-overflow.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): move runner draw overflow planning`

Ergebnis:

- Die Runner-Draw-Overflow-Familie liegt jetzt in
  `packages/ai/src/plans/runner-draw-overflow.ts`.
- `packages/ai/src/tactical-plans.ts` importiert nur noch die Plan-Family-
  Helfer und enthält die Assessment-, Penalty-, Reason-, Evidence- und
  Credit-Boost-Logik nicht mehr lokal.
- `runner-draw-overflow.test.ts` sichert Severity, Penalty-Bounds,
  Reason-Sortierung, Rationale, Evidence, Credit-Plan-Support und
  Hand-Development-Bonus ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/plans/runner-draw-overflow.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
    grün: 2 Testdateien, 46 Tests.
  - `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - `git diff --check` grün.
- Nachhärtung:
  - `runner-draw-overflow.test.ts` wurde von reinen Helper-Fixtures auf
    kontextnahe Assessment-Fixtures für Overdraw-Fodder, Score-Threat-Urgency
    und Credit-Plan-Promotion umgestellt.
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/plans/runner-draw-overflow.test.ts --maxWorkers=1 --testTimeout=30000`
    grün: 1 Testdatei, 3 Tests.
  - `git diff --check` grün.

### AI-RSL-3 Legacy-RunnerPlan-Metadaten isolieren

Ziel: Reine statische Legacy-RunnerPlan-Metadaten aus
`legacy/runner-plans.ts` in ein Legacy-Untermodul verschieben.

Arbeit:

- Base-Score, sichtbare Benefits, Unsicherheit und Run-Plan-Klassifizierung
  nach `legacy/runner-plan-metadata.ts` verschieben.
- `legacy/runner-plans.ts` auf die Metadaten-Helper umstellen.
- Tests für alle `RunnerPlanKind`-Werte ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/legacy/runner-plan-metadata.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): isolate legacy runner plan metadata`

Ergebnis:

- `packages/ai/src/legacy/runner-plan-metadata.ts` kapselt statische
  `RunnerPlanKind`-Metadaten: Kindliste, Base-Score, sichtbare Benefits,
  sichtbare Risiken, Unsicherheit und Run-Plan-Klassifizierung.
- `packages/ai/src/legacy/runner-plans.ts` re-exportiert den Typ und nutzt die
  Legacy-Metadaten-Helper statt lokaler statischer Funktionen.
- `runner-plan-metadata.test.ts` sichert vollständige Kind-Abdeckung,
  Scorewerte, Benefit-/Risk-Strings, Uncertainty und Run-Plan-Klassifizierung.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/legacy/runner-plan-metadata.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
    grün: 2 Testdateien, 521 Tests.
  - `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - `git diff --check` grün.

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

`/Goal Arbeite AI Runtime Scoring Tactical Legacy Optimization Loop vollständig
und sequenziell von AI-RSL-0 bis AI-RSL-3 plus FINAL-GREEN ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_LEGACY_AUDIT_LOOP auf Branch
codex/ai-runtime-tactical-legacy-audit-loop. Nutze den Hauptworkspace nur für
den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus,
committe jedes abgeschlossene Paket und stoppe, sobald nur noch fachlich breite
oder riskante Optimierungen übrig sind. Kein Push ohne separaten Nutzerauftrag.`

## Abschlusskriterien

- Sichere Runtime-Scoring-, Tactical-Goal-Family- und Legacy-Metadaten-Slices
  sind umgesetzt oder bewusst gestoppt.
- Full AI-Test und AI-Typecheck bestehen.
- Restpotential ist mit nächstem benötigtem Audit benannt.
- Branch ist lokal nach `main` gemerged und Worktree entfernt.
