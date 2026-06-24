# AI Corp Tag-Punish Endgame Final Report 2026-06-24

## Ergebnis

Der Prozess `AI Corp Tag-Punish Endgame` ist auf dem Arbeitsbranch `codex/ai-corp-tag-punish-endgame` fachlich abgeschlossen und bereit für die lokale Integration nach `main`.

Aus dem letzten gespeicherten Human-Runner-vs-Corp-AI-Spiel wurden die offenen Fehlergruppen nicht als Kartensonderfälle umgesetzt, sondern in generische, side-safe KI-Verträge überführt:

- Die Corp erkennt einen Tag-Punish-Endgame-Kontext aus sichtbaren Runner-Tags, Runner-Agenda-Druck, ScoreArea-Count und Handcount.
- Sichtbare Runner-Ressourcen werden im getaggten Endgame differenziert als Trash-Ziele bewertet, wenn sie Tag-/Trace-Verteidigung, R&D-Informationsdruck oder riskante Runner-Economy tragen.
- Basic-Economy erhält nur dann zusätzlichen Tag-Punish-Druck, wenn ein sichtbarer Payoff oder Damage-Payoff vorhanden ist und ein konkreter Credit-Zielwert noch fehlt.
- Langsame Setup-Aktionen wie ICE-/Remote-/Archives-Aufbau werden bei aktivem Tag-Punish-Fenster gedämpft.
- Tag-Quellen wie `Trojan Horse` sind nicht mehr falsch als Economy-Hinweis modelliert, bleiben aber über den generischen Legacy-Plananker `create_tag_window` als Tag-Fenster-Enabler auswählbar.

## Umgesetzte Artefakte

- `packages/ai/src/index.ts`
  - neue Semantic-Runtime-Komponenten `corp_tag_punish_endgame_resource_trash`, `corp_tag_punish_payoff_funding` und `corp_tag_punish_endgame_slow_setup_penalty`
  - generische Klassifikation sichtbarer Runner-Ressourcen nach Tag-/Trace-Verteidigung, R&D-Information und High-Risk-Economy
  - sichtbarer Funding-Zielwert für Tag-Punish-Payoffs statt pauschaler Economy-Priorität
- `packages/ai/src/legacy/corp-plans.ts`
  - neuer Plananker `create_tag_window` für legale Tag-Source-Actions mit Timing- oder Payoff-Kontext
  - `tag_trace_punish` wird auf diesen Plananker gemappt statt auf generischen Bait-/Economy-Ersatz
- `data/ai/ai-card-hints-active.json` und generierte Ableitungen
  - `Trojan Horse` bleibt ohne falsches `recover_economy`, erhält aber `punish_tagged_runner` plus `bait_runner`
  - vorgelagerte CTPE-2-Korrekturen für Damage-Prevention- und Tag-Punish-Hints bleiben gültig
- `packages/ai/src/index.test.ts`
  - Regression: Endgame-Resource-Trash gewinnt gegen Basic-Economy und langsames ICE-Setup
  - Regression: Tag-Punish-Funding gewinnt gegen langsames ICE-Setup, wenn ein sichtbarer Payoff unterfinanziert ist
  - bestehende Gegenproben für `Schlaghund`, `Diplomatic Immunity` und ungetaggten Runner bleiben grün
- `packages/ai/src/simulation/benchmark-reports.test.ts`
  - Opt-in Action-Alternative-Snapshot-Test nutzt einen expliziten Diagnose-Snapshot, statt von einem fragilen Action-Limit-Ausgang abhängig zu sein

## Verifikation

Ausgeführt im Worktree `C:\Projekte\NETGRID_AI_CORP_TAG_PUNISH_ENDGAME`:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t tag-punish --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t Schlaghund --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t Diplomatic --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "agenda-theft tag enablers" --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "action alternative snapshots" --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-hint-inspector-index`
- `git diff --check`

Der vollständige `@netgrid/ai`-Testlauf war grün: 141 Testdateien, 1590 Tests.

## Grenzen

- Keine Änderung an Engine-Regeln, `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Kartenmechanik.
- Keine Nutzung verdeckter Runner-Hand-, Stack-, R&D- oder Future-Information.
- Keine vollständige mehrzügige Kill-Line-Simulation; die Umsetzung bleibt eine konservative, sichtzustandsbasierte Bewertungs- und Plananker-Härtung.
- Main-Integration erfolgt nach diesem Review-Commit als separater Controller-Schritt. Falls der Hauptworkspace durch fremde Änderungen blockiert, bleibt der Arbeitsbranch vollständig committed.
