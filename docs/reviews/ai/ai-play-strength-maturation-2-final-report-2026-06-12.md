# AI Play-Strength Maturation II Final Report 2026-06-12

## Status

branch_packages_complete_pending_final_green

## GitHub / Local Sync

AI-MAT2 startete nach der gemeldeten lokalen `main`-Bereinigung als zweite Härtungsserie auf Branch `codex/ai-play-strength-maturation-2` im Worktree `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_2`.

AI-MAT2-0 hat den lokalen Stand, den sichtbaren Report-Drift und den Env-/Corpus-Status synchronisiert. Diese Serie pusht nichts nach GitHub und öffnet keinen PR; Remote-Sichtbarkeit bleibt bis zu einem expliziten Push ein separater Schritt.

## Umgesetzte Pakete

| Bereich | Pakete | Ergebnis |
| --- | --- | --- |
| Repo-/Corpus-Disziplin | AI-MAT2-0 bis AI-MAT2-3 | Final-Report-Status, Pilot-Env-Kontrakt, harte Corpus-Zählung und Fixture-Builder-Disziplin nachgezogen. |
| Pilot-/Run-Safety | AI-MAT2-4 bis AI-MAT2-8 | Pilot-Begriffe getrennt, Scope-Decision-Matrix ergänzt, strukturierte RunProjection eingeführt, RunnerSafeAccess ohne Evidence-only-Allow gehärtet, RemoteContest bleibt streng report-only. |
| Target/Doctrine | AI-MAT2-9 bis AI-MAT2-12 | TargetChoiceShadow nutzt taktischen Kontext und echte Engine-Ziele; DoctrineGoalSynthesis ist breiter und Boardstate bleibt stärker als Doctrine. |
| Shadow/Calibration/Selfplay | AI-MAT2-13 bis AI-MAT2-17 | ShadowLeague liest Corpus-Metadata, Corpus umfasst 50 Szenarien, Calibration-Metadata ist gelockt, Delta-Report und Selfplay-Snapshot-Mining sind diagnostisch ergänzt. |
| Semantik-Backlogs | AI-MAT2-18 bis AI-MAT2-19 | Originalset-Worklists und Proteus-Readiness sind prüfbar geschnitten; keine Proteus-KI-Freigabe. |
| Struktur/Contracts | AI-MAT2-20 bis AI-MAT2-22 | `semantic-runtime-debug.ts` extrahiert, Importgrenzen erweitert, Public-Export-Contract ergänzt. |

## Corpus-Metriken

Aktueller Shadow-League-Stand aus `semantic-shadow-league.test.ts`:

| Metrik | Wert |
| --- | ---: |
| Szenarien | 50 |
| Runner-Szenarien | 25 |
| Corp-Szenarien | 25 |
| `pilotEligibleCount` | 43 |
| `scopeCandidateCount` | 150 |
| `scopeAllowedCount` | 43 |
| `pilotWouldOverrideCount` | 43 |
| `pilotActualOverrideCount` | 0 |
| `pilotEligibilityRate` | 0.86 |
| `averageScoreGap` | 18.872 |
| `remoteContestPilotCandidateCount` | 2 |

## Pilot-Metriken

| Scope | Eligible | WouldOverride |
| --- | ---: | ---: |
| `basic_setup` | 22 | 22 |
| `runner_safe_access` | 18 | 18 |
| `corp_score_window` | 3 | 3 |

Runner: 25 Szenarien, 22 eligible, Rate 0.88. Corp: 25 Szenarien, 21 eligible, Rate 0.84. `pilotActualOverrideCount` bleibt 0, weil kein Runtime-Consumer existiert.

## Doctrine-Zielabdeckung

DoctrineGoalSynthesis deckt jetzt zusätzliche Linien ab: `runner.hq_pressure`, `runner.breaker_search`, `runner.survival`, `runner.economy_engine`, `corp.fast_advance`, `corp.ice_tax`, `corp.asset_economy`, `corp.hq_defense`, `corp.rnd_defense` und `corp.remote_ambush`.

Die Arbitration hält akute Boardstate-Signale vor Doctrine: Remote-Score-Threat, Flatline-Risk, niedrige Credits und konkrete Corp-Score-Windows dürfen nicht von generischen Doctrine-Gewichten überstimmt werden.

## TargetChoiceShadow-Abdeckung

TargetChoiceShadow bewertet Ziele nun goal-, threat-, opportunity- und utility-aware, bleibt aber Shadow/Diagnose. Tests sichern echte Engine-Zieloptionen, Multi-Choice-Fälle, TargetRequirements und Blocker für fehlende oder engine-only Optionen ab.

## Calibration-Baseline

Die Calibration-Profile tragen versionierte Metadata: `version`, `baselineReference`, `intendedScopes`, `createdFromBenchmark` und `lockedAgainstCorpus`. Das aktuelle Lock zeigt auf den 50er Real-Engine-Corpus; Baseline-Änderungen sollen nicht still passieren.

## `index.ts`-Schnitt

Der erste sichere Struktur-Schnitt ist umgesetzt: reine Semantic-Runtime-Debug-Projektionen liegen in `packages/ai/src/diagnostics/semantic-runtime-debug.ts`. `index.ts` orchestriert weiter die Runtime, enthält aber weniger reine Formatter-Logik.

Der Public-Export-Contract hält die neue Diagnose- und Evaluationstechnik intern. Bestehende öffentliche Fassaden wie `chooseAiAction`, `chooseRunnerAction`, `chooseCorpAction`, Selfplay-/Benchmark-Runner und Legacy-Baseline-Funktionen bleiben exportiert.

## Nicht geändert

- Keine Engine-Regeln.
- Keine LegalAction-Erzeugung durch KI.
- Kein produktiver RemoteContest-Cutover.
- Keine Hidden-Info-Allowlist-Erweiterung.
- Keine Proteus-KI-Freigabe.
- Keine Runtime-Nutzung der Originalset-/Proteus-Worklists.
- Kein Push und kein PR.

## Verifikation

Alle Paketchecks AI-MAT2-0 bis AI-MAT2-22 wurden vor den jeweiligen Paketcommits grün ausgeführt. Besonders relevante Abschlusschecks vor diesem Report:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league-delta.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/selfplay-decision-snapshot-mining.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/diagnostics/semantic-runtime-debug.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Offene nächste Schritte

1. FINAL-GREEN im Arbeitsbranch ausführen.
2. Bei grünem FINAL-GREEN lokal nach `main` integrieren.
3. Nach Main-Integration die AI-Suite auf `main` erneut ausführen.
4. Worktree entfernen, wenn `main` sauber ist.
5. GitHub-Push/PR nur auf ausdrücklichen Wunsch nachziehen.
