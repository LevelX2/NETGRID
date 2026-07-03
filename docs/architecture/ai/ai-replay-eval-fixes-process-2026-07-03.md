# AI Replay Evaluation Fixes Process 2026-07-03

Status: in_progress

Quelle/Vorgabe: Analyse von `match_40a0a49ece59e6e9` aus `data/runtime/multiplayer/netgrid.sqlite` und Nutzerfreigabe zur Umsetzung.

## Gesamtziel

Die Corp-KI soll sichtbare Runner-Breaker-Coverage, Scoring-Window-Contestability, ICE-Install-/Rez-Konsistenz und `end_turn`-Fallbacks kohärent bewerten. Die Umsetzung bleibt side-safe, LegalActions-only und ändert keine Engine-Legalität.

## Annahmen

- Die analysierten Replay-Traces sind ausreichend, um die Fehlergruppen als Runtime-/Semantik-Fixes zu behandeln.
- `Early Worm` gegen Wall-ICE ist eine generische Coverage-Lücke für Breaker mit rollenloser Wall-Textcoverage, keine Kartensonderregel.
- Zentralserver-Triage bleibt grundsätzlich sinnvoll, muss aber bei fehlender sinnvoller Schutzaktion Economy/Draw gegenüber `end_turn` zulassen.

## Nicht-Ziele

- Keine Deckänderungen.
- Keine Engine-Regeländerungen.
- Keine Hidden-Info-Erweiterung.
- Keine breite Hint-/Taxonomie-Migration.
- Kein großer Benchmark als Paket-Gate.

## Controller-Invarianten

- KI verwendet nur `AiDecisionInput`, `PlayerView`, sichtbare Boarddaten, LegalActions und side-safe ActionSemantics.
- Keine FullState- oder verdeckte Runner-Hand-/Stack-Annahme.
- `applyAction` bleibt alleinige Regelautorität.
- Debug-Evidence darf keine verdeckten Identitäten gegnerseitig offenlegen.

## Paketfolge

### Paket 1: Preflight und Prozessartefakt

- Ziel: Worktree, Branch und Prozessvertrag festlegen.
- Artefakte: dieses Prozessdokument.
- Checks: `git status --short --branch`, `git diff --check`.
- Commit: `docs(ai): plan replay evaluation fixes`

### Paket 2: Replay-Evidence

- Ziel: konkrete Belege aus `match_40a0a49ece59e6e9` dauerhaft zusammenfassen.
- Artefakte: `docs/reviews/ai/corp-replay-eval-fixes-evidence-2026-07-03.md`.
- Checks: `git diff --check`.
- Commit: `docs(ai): record corp replay evaluation evidence`

### Paket 3: Breaker-Coverage und Scoring-Window

- Ziel: sichtbare Breaker mit Textcoverage wie `Early Worm` korrekt gegen Wall-ICE werten und Scoreline-Fenster mit Runner-Exposure zuverlässig contestable machen.
- Kernartefakte: `packages/ai/src/runtime/runner-visible-breaker-coverage.ts`, `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.ts`, fokussierte Tests.
- Checks: relevante Vitests.
- Commit: `fix(ai): align visible breaker coverage in corp windows`

### Paket 4: ICE-Placement/Rez-Konsistenz und End-Turn-Fallback

- Ziel: ICE-Installationen nicht als Schutz pushen, wenn dieselbe Lage beim Rez als `zero_effect` gilt; `end_turn` mit freien Klicks nicht durch Triage-Neutralität gewinnen lassen.
- Kernartefakte: Corp-ICE-Placement, Effective-Defense/Triage/Score-Tests.
- Checks: relevante Vitests.
- Commit: `fix(ai): keep corp protection and end-turn scoring coherent`

### Paket 5: Scoreline-Support-Remote-Gate

- Ziel: Scoreline-Support-Assets wie Advancement-Support nicht in contestable Remotes legen, wenn kein unmittelbarer Payoff oder belastbarer Schutz besteht.
- Kernartefakte: Corp-Score/Remote-Score Runtime und Tests.
- Checks: relevante Vitests.
- Commit: `fix(ai): gate corp scoreline support installs`

### Paket 6: Review, Finalisierung und Integration

- Ziel: Final-Report, Typecheck, Diff-Checks, lokale Main-Integration und Worktree-Aufräumen.
- Artefakte: `docs/reviews/ai/corp-replay-eval-fixes-final-2026-07-03.md`.
- Checks: fokussierte Tests, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.
- Commit: `docs(ai): review corp replay evaluation fixes`

## Worktree- und Git-Regeln

- Worktree: `C:\Projekte\NETGRID_AI_REPLAY_EVAL_FIXES`
- Branch: `codex/ai-replay-eval-fixes`
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen Merge nach `main`.
- Jeder Paketabschluss wird einzeln committed.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Sicherheitsblocker

Stoppe ohne Workaround, wenn ein Fix Hidden-Info benötigen würde, LegalActions erzeugen müsste, Engine-Korrektheit schwächt oder eine zentrale KI-/Replay-Side-Safety-Regel bricht.

## Abschlusskriterien

- Alle freigegebenen Fehlergruppen sind umgesetzt oder als Follow-up mit Blockergrund dokumentiert.
- Fokussierte Regressionen decken die Replay-Muster ab.
- AI-Typecheck besteht oder Abweichungen sind als nicht durch diesen Scope verursacht belegt.
- Arbeitsbranch ist lokal nach `main` integriert.
