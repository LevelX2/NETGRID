# Corp Purge/R&D Triage Final Report 2026-06-30

## Scope

Umgesetzt wurde die freigegebene Härtung aus `match_531f83839a16d260`: Purge-/Action-Debt-Verdrängung, R&D-Druck-Eskalation, dynamische Remote-ICE-Bewertung und Remote-Scoreline-Anschluss.

## Änderungen

- `semantic-runtime-corp-board-triage.ts`: Purge wird bei hoher/kritischer Triage als verzögernde Action-Debt-Aktion bewertet; harte Mismatch-Werte gelten jetzt auch für `score_now`, `force_scoreline_clock`, `fund_score_remote`, `protect_hq` und `protect_rd`. Kritischer R&D-Druck kann Remote-Schutz vorziehen; HQ wird nicht vorab vor Remote gezogen.
- `semantic-runtime-corp-central-pressure.ts`: sichtbare R&D-Virus-/Counter-Payoffs wie R&D-Counter/Multiaccess/Trash-Druck erhöhen R&D-Pressure side-safe aus Runner-Rig und öffentlichen Events.
- `semantic-runtime-corp-scoring-window.ts`: statische ICE, die eine dynamisch schwache bestehende Remote verbessert, verhindert nicht länger fälschlich den `build_remote_ice`-Anschluss.
- Regressionen ergänzen für Purge-Mismatch, kritisches R&D vor Remote, sichtbaren R&D-Virus-Druck, Bug-Zapper/Mastermind-Dynamik und statischen Remote-ICE-Ausbau.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-board-triage.test.ts --maxWorkers=1 --testTimeout=30000` grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-central-pressure.test.ts --maxWorkers=1 --testTimeout=30000` grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-scoring-window.test.ts --maxWorkers=1 --testTimeout=30000` grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-remote-score.test.ts --maxWorkers=1 --testTimeout=30000` grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000` grün.
- `corepack pnpm --filter @netgrid/ai test` grün: 273 Testdateien, 2205 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `git diff --check` grün.

## Auffälligkeiten

Der erste vollständige AI-Testlauf deckte alte Regressionserwartungen an den bisherigen schwachen Mismatch-Werten auf und zeigte, dass ein erster Central-Override auch HQ vor Remote gezogen hätte. Die Umsetzung wurde daraufhin auf kritisches R&D begrenzt; die Score-Komponententests wurden auf die bewusst härteren Werte aktualisiert.

## Nicht-Ziele

Die Änderung bewertet keine verdeckten Runner-Hand-/Stack-Informationen, erzeugt keine LegalActions und ändert keine Spielregeln. Ob die Korp danach im nächsten Playtest mehr scoret, bleibt ein Spielstärke-/Benchmark-Befund und kein behauptetes Ergebnis dieses Pakets.
