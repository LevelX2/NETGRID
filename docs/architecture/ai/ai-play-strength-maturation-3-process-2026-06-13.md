# AI Play-Strength Maturation III Prozess

Status: `active`

Quelle/Vorgabe: Ergebnisprüfung vom 2026-06-13 zu Commit `7e16c165` und Maturation-II-Abschluss. Der wichtigste Befund ist Report-/Verifikationsdrift trotz sichtbarem Code- und Artefaktstand. Die Folgearbeit schärft Status, Calibration, ShadowLeague-Readiness, `index.ts`-Struktur, TargetChoice, DoctrineCoverage, Pilot-Default-Kandidaten, Selfplay-Mining sowie Originalset-/Proteus-Arbeitslisten.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Gesamtziel, Paketfolge, Arbeitsbranch, Worktree, Kernartefakte, Checks, Nicht-Ziele und FINAL-GREEN sind benannt. Kleine Lücken werden konservativ behandelt: Diagnose- und Reportmodule bleiben intern, Runtime-Defaults bleiben unverändert, und neue Metriken dürfen bestehende Produktivpfade nicht erweitern.

## Gesamtziel

AI Play-Strength Maturation III wird sequenziell von AI-MAT3-0 bis AI-MAT3-22 umgesetzt, pro Paket verifiziert und committed, danach vollständig geprüft und lokal nach `main` integriert.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Arbeitsbranch: `codex/ai-play-strength-maturation-3`.
- Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_3`.
- Alle neuen Evaluation-, Diagnose-, Coverage- und Reportmodule bleiben interne Implementierungsdetails.
- Pilot-Scopes bleiben ohne explizite spätere Entscheidung default-off beziehungsweise env-gated.
- Proteus bleibt KI-seitig klassifiziert und zurückgestellt; keine Proteus-Runtime-Freigabe.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Kein produktiver RemoteContest-Cutover.
- Keine Aktivierung lokaler Pilot-Defaults.
- Keine Hidden-Info-Allowlist-Erweiterung ohne belegte Side-Safety.
- Keine Public-API-Erweiterung für neue Maturation-Diagnostik.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- AI arbeitet nur aus LegalActions, PlayerViews und side-sicheren Projektionen.
- TargetChoiceShadow, DoctrineCoverage, ShadowLeague, Selfplay-Mining und Readiness-Matrix sind diagnostisch.
- Runtime-Entscheidungen werden nur über bereits legale RuntimeChoices getroffen.
- Öffentliche Exporte bleiben durch `public-export-contract.test.ts` geschützt.

## Automatische Fehlerbehandlung

Bei roten Tests wird eng debuggt: Testdatei und Assertion lesen, Ursache bestimmen, minimal beheben, Einzeltest, betroffene Suite und danach erforderliche Paketchecks wiederholen. Kein `test.skip`, kein `test.only`, keine Testlöschung, keine pauschale Assertion-Lockerung.

## Sicherheitsblocker

Stop ohne Weiterarbeit, wenn eine Änderung Hidden-Info-Leaks, Engine-Autoritätsverschiebung, nicht deterministische Runtime-Entscheidungen, neue Public-API ohne Contract oder produktive Pilot-Aktivierung erzwingt. Blocker werden mit Removal Condition dokumentiert.

## State Machine

`preflight` -> `package_active` -> `package_checks` -> `package_commit` -> `next_package` -> `final_green` -> `main_merge` -> `main_verify` -> `worktree_cleanup` -> `complete`.

## Paketfolge

- AI-MAT3-0: Final-Status und GitHub/Local Sync korrigieren.
- AI-MAT3-1: Calibration-Baseline-Begriffe klären.
- AI-MAT3-2: ShadowLeague Cutover Readiness Matrix.
- AI-MAT3-3: ShadowLeague Failures als DecisionSnapshot-Kandidaten exportieren.
- AI-MAT3-4: `index.ts` Schnitt 2, Legacy Baseline Debug herauslösen.
- AI-MAT3-5: `index.ts` Schnitt 3, Simulation/Benchmark Report Formatter.
- AI-MAT3-6: `index.ts` Restschuld nach Schnitt 2/3 neu messen.
- AI-MAT3-7: TargetChoiceShadow Scorecard V2.
- AI-MAT3-8: TargetChoiceShadow Candidate Coverage Report.
- AI-MAT3-9: Real-Engine TargetChoice Corpus.
- AI-MAT3-10: DoctrineGoal Coverage Report.
- AI-MAT3-11: DoctrineGoalSynthesis für HQ/R&D-Defense differenzieren.
- AI-MAT3-12: Runner Search / Breaker Coverage Goal Synthesis.
- AI-MAT3-13: RemoteContest V3, keine Runtime-Aktivierung.
- AI-MAT3-14: SafeAccess-Pilot Local Default Candidate Report.
- AI-MAT3-15: BasicSetup-Pilot Local Default Candidate Report.
- AI-MAT3-16: CorpScoreWindow-Pilot Local Default Candidate Report.
- AI-MAT3-17: Local Default Selector vorbereiten, nicht aktivieren.
- AI-MAT3-18: Selfplay Mining mit Clusterung.
- AI-MAT3-19: Originalset Worklists in konkrete Paketvorschläge schneiden.
- AI-MAT3-20: Proteus Readiness in konkrete No-Go/Ready-Klassen.
- AI-MAT3-21: Public Export Contract erweitern.
- AI-MAT3-22: Abschlussbericht.
- FINAL-GREEN: vollständige Paket- und Main-Verifikation.

## Paketdetails

Jedes Paket folgt diesem Done-Gate: Scope umgesetzt, relevante Tests grün, `git diff --check` grün, `git status --short` geprüft, nur paketzugehörige Pfade gestaged, Paketcommit erstellt.

Die Paket-Commit-Messages entsprechen der Vorgabe:

- `docs(ai): mark play strength maturation two complete`
- `docs(ai): clarify calibration corpus references`
- `test(ai): add pilot cutover readiness matrix`
- `test(ai): export shadow league followup candidates`
- `refactor(ai): extract legacy baseline debug formatting`
- `refactor(ai): extract simulation report formatters`
- `docs(ai): update index rest debt after debug cuts`
- `feat(ai): add target choice shadow scorecard`
- `test(ai): report target choice shadow coverage`
- `test(ai): expand real engine target choice corpus`
- `test(ai): report doctrine goal coverage`
- `feat(ai): refine doctrine central defense goals`
- `feat(ai): connect breaker search to coverage goals`
- `test(ai): refine remote contest readiness diagnostics`
- `docs(ai): assess runner safe access local default candidate`
- `docs(ai): assess basic setup local default candidate`
- `docs(ai): assess corp score window local default candidate`
- `feat(ai): prepare local default pilot policy`
- `test(ai): cluster selfplay decision mining findings`
- `docs(ai): split originalset semantic worklists into packages`
- `docs(ai): classify proteus play strength readiness`
- `test(ai): keep maturation diagnostics internal`
- `docs(ai): record play strength maturation three`

## Verifikationsregeln

Paketchecks werden aus der Vorgabe übernommen. FINAL-GREEN umfasst mindestens:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
```

Wenn Dateien außerhalb `packages/ai` geändert werden, werden zusätzlich ausgeführt:

```bash
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/engine typecheck
corepack pnpm --filter @netgrid/server test
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm --filter @netgrid/web test
corepack pnpm --filter @netgrid/web typecheck
```

## Worktree-, Git- und Integrationsregeln

Die Umsetzung läuft ausschließlich im Worktree `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_3` auf Branch `codex/ai-play-strength-maturation-3`. Der Hauptworkspace wird nur für finalen Merge und Main-Verifikation genutzt. Kein pauschales Staging. Vor jedem Commit `git status --short`; nur Paketpfade stagen. Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls `main` weitergelaufen ist. Push oder PR nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite AI Play-Strength Maturation III vollständig und sequenziell von AI-MAT3-0 bis AI-MAT3-22 plus FINAL-GREEN ab. Lies zuerst AGENTS.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_3 auf Branch codex/ai-play-strength-maturation-3. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus, committe jedes abgeschlossene Paket, stoppe bei Sicherheitsblockern mit Blocker-Report. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- AI-MAT3-0 bis AI-MAT3-22 sind committed.
- FINAL-GREEN ist grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- `main` ist geprüft und sauber.
- Arbeitsworktree ist entfernt.
- Goal ist als complete markiert.
