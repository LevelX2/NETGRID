# AI Replay Match 731b Final Report

Status: Paketabschluss vor lokalem Main-Merge

## Ergebnis

Die fünf freigegebenen Fehlergruppen aus `match_731b436e85fb2484` sind im Arbeitsbranch `codex/ai-replay-match-731b` umgesetzt.

Die Änderung bleibt auf Corp Semantic Runtime, ICE-Placement, Trace-Analyse-Guard und fokussierte AI-Tests begrenzt. Es gibt keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness-, Kartenpool- oder Hidden-Info-Vertragsänderung.

## Analysiertes Match

- Match: `match_731b436e85fb2484`
- Mode: `human_runner_vs_corp_ai`
- Corp-KI: `corp-ai-v0.9-hard`
- Speicher: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Winner: Runner
- End-StateVersion: `328`
- Events: `329`
- State-Snapshots: `329`
- `ai_decision_traces`: `0`
- Evidence-Artefakt: `docs/reviews/ai/ai-replay-match-731b-evidence-2026-07-05.md`

## Umgesetzte Anpassungen

### Kritische HQ-Agenda-Conversion

`semantic-runtime-corp-board-triage.ts` erkennt jetzt einen engen Emergency-Pfad: HQ-Agenda-Druck, Runner-Scoreline-Gefahr, vorbereitetes Remote, keine konkrete Remote-Protection-LegalAction und ein ScoringWindow, das sonst nur Funding empfiehlt. In diesem Fall wird Agenda-Commit in das vorbereitete Remote als `force_scoreline_clock`-Conversion bewertet; passives Funding ist dann kein Triage-Match mehr.

### Score-Remote-Pipeline mit Conversion-Schritt

Die neue Regression in `semantic-runtime-corp-score.test.ts` belegt, dass ein game-ending HQ-Agenda-Risiko nicht weiter in Basic-Credit driftet, wenn ein vorbereitetes Remote die Agenda aufnehmen kann und keine bessere Schutzaktion legal ist.

### R&D-Matchpoint-ICE-Disziplin

`corp-ice-placement.ts` berücksichtigt bei ICE-Installationen nun sichtbare Breaker-Coverage, sichtbare Break-Kosten und Zero-Effect-Risiken. Ein ICE, das gegen sichtbare Breaker keine Stop-/Tax-Wirkung erzeugt, erhält einen harten Placement-Malus.

### Post-Install-Rez-Reserve

Der ICE-Placement-Evaluator bewertet jetzt zusätzlich, ob eine zentrale Matchpoint-/Pressure-Installation die Corp-Credits unter eine minimale post-install Reserve drückt. Zero-Effect-Risiko verschärft diese Reservebewertung.

### Trace-Analyse-Guard

`scripts/build-ai-replay-decision-cases.ts` meldet AI-Matches ohne Rows in `ai_decision_traces` jetzt explizit als Trace-Coverage-Warnung im lokalen Markdown-Report und als Konsolenwarnung. Der Guard nutzt nur Match-/Event-/Trace-Metadaten und keine FullState- oder Hidden-Info-Inhalte.

## Neue Regressionen

Ergänzte Tests:

- `semantic-runtime-corp-score.test.ts`: kritischer HQ-Agenda-Druck konvertiert in vorbereitetes Remote statt passives Funding.
- `corp-ice-placement.test.ts`: R&D-Matchpoint-ICE mit Zero-Effect gegen sichtbare Breaker und leerer post-install Reserve wird deferiert.

## Verifikation

Gelaufen im Worktree `C:\Projekte\NETGRID_AI_MATCH_731B`:

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm exec vitest run packages/ai/src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000`
  - Ergebnis: 1 Datei, 68 Tests grün.
- `corepack pnpm exec vitest run packages/ai/src/runtime/corp-ice-placement/corp-ice-placement.test.ts --maxWorkers=1 --testTimeout=30000`
  - Ergebnis: 1 Datei, 21 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - Ergebnis: grün.
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai-replay-decision-cases.ts --db C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite --run-id match-731b-trace-guard --out-dir data/local/ai-replay/match-731b-trace-guard`
  - Ergebnis: grün; Warnsample enthält `match_731b436e85fb2484`.
- `git diff --check`
  - Ergebnis: grün.

## Grenzen und Nicht-Ziele

- Keine Replay-Neuberechnung oder Runtime-DB-Migration.
- Keine kartennamenspezifische Sonderregel für `Tycho Extension`.
- Keine Änderung an Decklisten, Engine-Regeln oder LegalActions.
- Keine Hidden-Info-Verwertung: alle neuen Signale beruhen auf eigener Corp-Hand, sichtbarer Runner-Rig-/Score-Lage, PublicEvents, LegalActions und PlayerView-Fakten.
- Der Trace-Guard ersetzt keine fehlenden historischen Decision-Traces; er verhindert nur, dass Trace-Lücken im Analysepfad unbemerkt bleiben.

## Integrationsstatus

Der Arbeitsbranch ist nach Paketabschluss für den lokalen Merge nach `main` vorgesehen. Der finale Merge und erneute Checks erfolgen nach dem letzten Paket-Commit gemäß Prozessartefakt.
