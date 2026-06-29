# AI 3DB62D Corp Fixes Prozess 2026-06-29

Status: abgeschlossen

## Anlass

Das Replay `match_3db62d5216ecde8d` zeigte nach der Corp-Board-Triage weiter drei belastbare Corp-Fehlmuster:

- `Project Zurich` wurde bei `sv97` trotz legalem `score_agenda` noch einmal advanced, ohne einen sinnvollen Overadvance-Schwellenwert zu erreichen.
- `Marine Arcology` wurde bei Runner-Endgame-Druck in eine als `durable` bewertete Remote gelegt, obwohl der sichtbare Runner mit `Krash`, `Broker` und Credits den kompletten Pfad bezahlen konnte.
- `corp_board_triage_mismatch` erkannte kritische Lagen, war aber durch Normalisierung zu schwach und teilweise auf `new_remote` statt die tatsächliche Score-Remote gebunden.

## Gesamtziel

Die Corp-KI soll konkrete Score-now-, Remote-Safety- und Triage-Lagen kohärenter bewerten, ohne Engine-Legalität, Hidden-Info-Grenzen oder LegalAction-Erzeugung zu verändern.

## Nicht-Ziele

- Keine Engine- oder Regeländerung.
- Keine Nutzung verdeckter Runner-Hand oder Runner-Stack-Daten.
- Keine neue Karten-Sonderregel-Liste.
- Keine große Semantikmigration.

## Paketfolge

1. Prozess- und Replay-Evidence festhalten.
2. Runtime-Anpassungen für Score-now, sichtbare Runner-Credit-Reachability, Remote-Durability und Triage-Mismatch umsetzen.
3. Fokussierte Regressionen ergänzen und relevante Checks ausführen.
4. Final-Report, Wissenslog, lokale Commits und Main-Merge abschließen.

## Verifikation

- Fokussierte Vitest-Tests für `semantic-runtime-corp-board-triage`, `semantic-runtime-corp-scoring-window`, `semantic-runtime-corp-remote-score` und `semantic-runtime-corp-score`.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Abschlussstand:

- Fokussierte Runtime-/Regressionstests: 6 Dateien, 166 Tests grün.
- Vollständiger `@netgrid/ai`-Testlauf: 272 Dateien, 2187 Tests grün.
- `@netgrid/ai`-Typecheck grün.
- `git diff --check` grün.

## Worktree

- Branch: `codex/ai-3db62d-corp-fixes`
- Worktree: `C:\Projekte\NETGRID_AI_3DB62D_CORP_FIXES`
- Integration: nach Abschluss lokal nach `main`, kein Push.
