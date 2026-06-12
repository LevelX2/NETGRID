# AI Play-Strength Maturation II Preflight

Datum: 2026-06-13

Status: `AI-MAT2-0` audit-ready und lokal verifiziert.

## Lokaler Stand

- Hauptworkspace `C:\Projekte\NETGRID`: `main` sauber, `HEAD` = `4d2d2811 Fix Startup Immolator source trash`.
- Remote-Tracking: `origin/main` = `7e886eed Merge branch 'main' into codex/ai140-ai148-semantic-endgame-optimization`.
- Lokaler `main` ist gegenüber `origin/main` `ahead 1`; Push/PR ist nicht Teil dieses Prozesses.
- Arbeitsbranch: `codex/ai-play-strength-maturation-2`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_2`.
- Prozess-Setup-Commit: `d63f0d5e docs(ai): define play strength maturation two process`.

## Sync-Befund

Der vorherige AI-MAT-Final-Report war lokal inhaltlich teilweise veraltet: Er meldete noch, dass der lokale Main-Merge als separater Schritt folgt, obwohl die AI-MAT-Serie inzwischen im lokalen `main` enthalten ist. Zusätzlich nannte er mit `AI_PLAY_STRENGTH_PILOT_SCOPE` einen falschen Env-Namen. Der Code definiert den offiziellen Env-Vertrag in `packages/ai/src/decision/pilot/pilot-scope-common.ts` als `NETGRID_AI_PLAY_STRENGTH_PILOT`.

Die in der Analyse vermutete Corpus-Drift ist lokal nicht vorhanden: `REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS` enthält 30 IDs. Der bestehende Corpus-Test vergleicht bereits die ausgebauten Samples exakt mit dieser ID-Liste und fordert mindestens 30 Szenarien.

## Verifikation

- `corepack pnpm install`: erfolgreich, Lockfile unverändert; im neuen Worktree waren zuvor keine `node_modules` vorhanden.
- `corepack pnpm --filter @netgrid/ai test`: 80 Testdateien, 1236 Tests, grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `rg "AI_PLAY_STRENGTH_PILOT_SCOPE|NETGRID_AI_PLAY_STRENGTH_PILOT" docs packages/ai/src`: nur der alte Final Report nutzte den falschen Env-Namen.
- `rg "REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS|buildRealEngineDecisionCorpusScenarios" packages/ai/src/evaluation`: Corpus-ID- und Build-Pfade vorhanden.

## Schluss für AI-MAT2

AI-MAT2 läuft nicht als Reparatur eines fehlenden lokalen Merges, sondern als zweite Härtungsserie auf bereits integriertem AI-MAT-Stand. Die nächsten Pakete konzentrieren sich deshalb auf den Env-Vertrag, harte Corpus-Zählung, Fixture-Builder-Disziplin und präzisere Pilot-/Shadow-League-Messung.
