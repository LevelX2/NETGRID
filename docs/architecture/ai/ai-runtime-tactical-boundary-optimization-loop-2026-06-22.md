# AI Runtime Tactical Boundary Optimization Loop

Status: `complete`

Datum: 2026-06-22

## Quelle und Vorgabe

Der Nutzer hat nach dem AI Source Structure Optimization Loop 2 beauftragt, das
dort benannte Restpotential mit eigenem Audit umzusetzen: Runtime-Facade-,
Tactical-Goal-Family- und Legacy-Grenzen sollen in einer Optimierungsschleife
mit Planungsteil und nachfolgendem Umsetzungsteil so lange verbessert werden,
bis kein sinnvolles Potential mehr sichtbar ist.

## Zielprüfung

Die Vorgabe ist ausführbar, wenn "kein Potential mehr" konservativ verstanden
wird: Es werden nur kleine, testbare und vertragserhaltende Boundary-Slices
umgesetzt. Der Loop endet, sobald die verbleibenden Kandidaten ein neues
Fachdesign, neue Gewichtung, breite Runtime-Orchestrierung oder eine Legacy-
Ablösung benötigen.

## Gesamtziel

`packages/ai/src/index.ts` bleibt öffentliche AI-Fassade, verliert aber weiter
diagnostische und boundary-fremde Implementierungsdetails. `tactical-plans.ts`
und `legacy/runner-plans.ts` werden nur dann berührt, wenn eine klare
Goal-Family- oder Typgrenze ohne Verhaltensänderung extrahierbar ist.

## Annahmen

- `main` ist sauber und lokaler Integrationsbranch.
- Umsetzung läuft in `C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_BOUNDARY_LOOP`
  auf Branch `codex/ai-runtime-tactical-boundary-loop`.
- Remote-Push gehört nicht zu diesem Loop.
- Bestehende Public Exports des Pakets bleiben stabil.
- Kein Slice darf AI-Verhalten fachlich neu gewichten; bestehende Scoring-,
  Debug- und Evidence-Werte werden nur verschoben und getestet.

## Nicht-Ziele

- Kein großer Rewrite von `packages/ai/src/index.ts`.
- Keine produktive KI-Strategieänderung, keine neuen Planner-Gewichte und kein
  Cutover.
- Keine Legacy-Entfernung.
- Keine Engine-, Server-, Web-, Replay-, StateHash-, Randomness- oder Hidden-
  Info-Änderung.
- Keine Änderungen an LegalActions oder `applyAction`.

## Controller-Invarianten

- AI konsumiert nur side-sichere Inputs und wählt ausschließlich LegalActions.
- Die Rules Engine bleibt alleinige Regelautorität.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und No-Candidate-Fallback bleiben
  erhalten.
- Debug- und Diagnoseausgaben bleiben redigiert.
- Extracted Boundary-Module dürfen keine neuen zirkulären Imports erzeugen.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktuellen Paket debuggt.
- Wenn ein Kandidat doch Runtime-Orchestrierung, Public API oder
  fachliche Gewichtung berührt, wird er als Restpotential dokumentiert und
  nicht umgesetzt.
- Wenn nach einem Paket nur noch breite Facade-/Goal-Family-/Legacy-Reworks
  sichtbar sind, endet der Loop mit Restpotentialbericht.

## Sicherheitsblocker

Stoppen, wenn:

- eine Änderung KI-Entscheidungsgewichtung fachlich verändert statt nur
  bestehende Logik zu verschieben;
- Hidden-Info-, Replay-, StateHash-, Engine- oder LegalAction-Verträge berührt
  werden;
- ein Split neue zirkuläre Imports oder inkompatible Public Exports erzeugt;
- der nächste Slice mehr als eine fachliche Familie gleichzeitig umbaut.

## State Machine

1. `package_active:AI-RTB-0`
2. `package_done:AI-RTB-0`
3. `package_done:AI-RTB-1`
4. `package_done:AI-RTB-2`
5. `package_done:AI-RTB-3`
6. `final_green_ready`
7. `merged_to_main`
8. `complete`
9. `blocked:<reason>`

## Paketfolge

### AI-RTB-0 Planung, Messung und Prozessartefakt

Ziel: Boundary-Loop begrenzen, aktuelle Struktur messen und erste sichere
Kandidaten festhalten.

Kernbefund:

- `packages/ai/src/index.ts`: 35.666 Zeilen.
- `packages/ai/src/tactical-plans.ts`: 4.074 Zeilen.
- `packages/ai/src/legacy/runner-plans.ts`: 8.536 Zeilen.
- Bestehende Zielmodule:
  - `packages/ai/src/runtime/semantic-runtime.ts`
  - `packages/ai/src/runtime/semantic-runtime-types.ts`
  - `packages/ai/src/diagnostics/semantic-runtime-debug.ts`
  - `packages/ai/src/diagnostics/debug-format.ts`
  - `packages/ai/src/plans/tactical-plan-types.ts`
- Nächster sicherer Kandidat ist Runtime-Diagnostics: `index.ts` enthält noch
  reine Debug-/Evidence-Formatierung für TacticalPlan-Ranking, Doctrine-Goal-
  Items und Memory-Debug.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts src/public-export-contract.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

Commit: `docs(ai): plan runtime tactical boundary loop`

Ergebnis:

- Worktree `C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_BOUNDARY_LOOP` auf Branch
  `codex/ai-runtime-tactical-boundary-loop` angelegt.
- Dependencies im Worktree per `corepack pnpm install` installiert.
- Planungs-Gate grün:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts src/public-export-contract.test.ts --maxWorkers=1 --testTimeout=30000`
  - `git diff --check`

### AI-RTB-1 TacticalPlan-Debuggrenze schließen

Ziel: TacticalPlan-Debug-Item-Formatierung aus `index.ts` in die bestehende
Runtime-Diagnostics-Familie verschieben.

Arbeit:

- `tacticalPlanDebugItems` und reine Hilfsformatierer in
  `diagnostics/semantic-runtime-debug.ts` exportieren.
- `index.ts` auf den geteilten Diagnostics-Helper umstellen.
- Fokussierte Tests für Plan-Rank-Evidence und Mapping-/Previous-Plan-Items
  ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/semantic-runtime-debug.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): move tactical plan debug formatting`

Ergebnis:

- `semanticRuntimeDebugTacticalPlanItems` liegt jetzt in
  `diagnostics/semantic-runtime-debug.ts`.
- `index.ts` ruft nur noch den Diagnostics-Helper auf und enthält die
  TacticalPlan-Ranking-Formatierung nicht mehr lokal.
- `semantic-runtime-debug.test.ts` deckt Previous-Plan-, Mapping-,
  Blocked-Plan-, Evidence- und `plan_rank`-Items ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/semantic-runtime-debug.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `git diff --check`

### AI-RTB-2 Memory-Debuggrenze schließen oder Restpotential stoppen

Ziel: Nach AI-RTB-1 prüfen, ob Memory-Debug ohne breiten Runtime-Audit aus
`index.ts` in ein Diagnostics-Modul verschoben werden kann.

Arbeit:

- Wenn die Abhängigkeiten eng bleiben: `semanticRuntimeMemoryDebug` und
  zugehörige reine Summary-Helfer in `diagnostics/semantic-runtime-memory-debug.ts`
  verschieben und testen.
- Wenn die Abhängigkeiten zu breit sind: Stop-Entscheidung dokumentieren und
  kein Code-Slice erzwingen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/semantic-runtime-debug.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit: `refactor(ai): move semantic runtime memory debug`

Ergebnis:

- `semanticRuntimeMemoryDebug` liegt jetzt in
  `diagnostics/semantic-runtime-memory-debug.ts`.
- `index.ts` konsumiert nur noch die fertige Debugprojektion und enthält keine
  Belief-/Opponent-Memory-Formatierungsdetails mehr.
- `semantic-runtime-memory-debug.test.ts` deckt Runner- und Corp-Memory-
  Debugitems, Own-Hand-Redaction und Opponent-Model-Summaries ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/semantic-runtime-memory-debug.test.ts src/diagnostics/semantic-runtime-debug.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `git diff --check`

Commit: `refactor(ai): move semantic runtime memory debug`

### AI-RTB-3 Runtime-Debug-Item-Grenze schließen

Ziel: Die verbleibenden reinen Debug-Item-Formatter aus
`semanticRuntimeDecisionDebug` in die bestehende Runtime-Diagnostics-Familie
verschieben.

Arbeit:

- Shadow-Top-, Pilot-Scope-, Calibration-Profile-, Target-Choice-Shadow-,
  Doctrine-Goal- und Mistake-Summary-Item-Formatter nach
  `diagnostics/semantic-runtime-debug.ts` verschieben.
- `index.ts` auf die geteilten `semanticRuntimeDebug...`-Helper umstellen.
- Direkte Unit-Tests für Evidence-Filter, Calibration-Items, Doctrine-Reason-
  Parsing und Target-Choice-Leerfall ergänzen.

Ergebnis:

- `index.ts` enthält in `semanticRuntimeDecisionDebug` nur noch
  Debug-Orchestrierung und keine lokalen Evidence-Formatter mehr.
- `semantic-runtime-debug.test.ts` deckt die neuen Debug-Item-Gruppen direkt ab.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/semantic-runtime-debug.test.ts src/diagnostics/semantic-runtime-memory-debug.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `git diff --check`

Commit: `refactor(ai): move runtime debug item formatting`

## FINAL-GREEN

Restpotential nach AI-RTB-3:

- `packages/ai/src/index.ts`: 35.063 Zeilen. Die verbliebenen
  `semanticRuntime...`-Funktionen sind überwiegend Runtime-Scoring,
  Action-Alternatives, Coverage-Selection, Runner-/Corp-Scorekomponenten,
  Simulation-Diagnostik oder Entscheidungsevidence. Weitere Extraktion wäre
  kein reiner Formatter-Slice mehr, sondern ein eigener Runtime-Scoring- oder
  Simulation-Diagnostics-Audit.
- `packages/ai/src/tactical-plans.ts`: 4.074 Zeilen. Die verbliebenen
  Kandidaten liegen in Runner-Handentwicklung, Credit-Base, Draw-Overflow und
  Corp-/Runner-Plan-Buildern. Diese Logik sollte nach Goal-Familien geplant
  werden; opportunistische Extraktion ohne Fachschnitt würde Planner-Gewichte
  und Evidence-Kontext zu leicht vermischen.
- `packages/ai/src/legacy/runner-plans.ts`: 8.536 Zeilen. Legacy-Kandidaten
  sind Planentscheidung, Action-Selection und Profil-/Scoringlogik. Da Legacy-
  Notaus und Vergleichsbasis erhalten bleiben müssen, ist kein sicherer
  Micro-Slice ohne separaten Legacy-Ablöse- oder Isolation-Audit sichtbar.

Stop-Entscheidung: Der Boundary-Loop endet nach AI-RTB-3. Weiteres Potential
existiert nur noch als eigener Audit für Runtime-Scoring, Tactical-Goal-Family-
Split oder Legacy-Isolation, nicht als direkte Fortsetzung dieser
Diagnostics-/Boundary-Schleife.

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

Ergebnis:

- Arbeitsbranch `codex/ai-runtime-tactical-boundary-loop` wurde per
  Fast-Forward nach `main` integriert.
- Main-Abschlussstand: `c151c549`.
- Worktree `C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_BOUNDARY_LOOP` wurde nach
  erfolgreicher Main-Verifikation entfernt.
- Finalchecks:
  - `corepack pnpm --filter @netgrid/ai test`: 129 Testdateien, 1497 Tests grün.
  - `corepack pnpm --filter @netgrid/ai typecheck`: grün.
  - `git diff --check`: grün.

## Controller-Prompt-Kern

`/Goal Arbeite AI Runtime Tactical Boundary Optimization Loop vollständig und
sequenziell von AI-RTB-0 bis AI-RTB-3 plus FINAL-GREEN ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_AI_RUNTIME_TACTICAL_BOUNDARY_LOOP auf Branch
codex/ai-runtime-tactical-boundary-loop. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus,
committe jedes abgeschlossene Paket und stoppe, sobald nur noch riskante oder zu
breite Optimierungen übrig sind. Kein Push ohne separaten Nutzerauftrag.`

## Abschlusskriterien

- Mindestens die sichere Runtime-Diagnostics-Grenze ist verbessert oder ein
  Blocker ist dokumentiert.
- Full AI-Test und AI-Typecheck bestehen.
- Restpotential ist mit nächstem benötigtem Audit benannt.
- Branch ist lokal nach `main` gemerged und Worktree entfernt.
