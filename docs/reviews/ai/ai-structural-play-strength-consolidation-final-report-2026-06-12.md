# AI Structural Play-Strength Consolidation Final Report

Datum: 2026-06-12

Status: `AI-CONS-0` bis `AI-CONS-11` complete. `FINAL-GREEN` wurde ausgeführt; der lokale `main`-Merge erforderte anschließend eine Baseline-Anpassung für den erweiterten Real-Engine-Korpus.

## Ausgangslage

Die vorherige AI-Play-Strength-Activation-Serie war lokal auf `main` vorhanden, aber nicht remote sichtbar. Der neue Prozess wurde deshalb im separaten Worktree `C:\Projekte\NETGRID_AI_STRUCTURAL_PLAY_STRENGTH_CONSOLIDATION` auf Branch `codex/ai-structural-play-strength-consolidation` ausgeführt. Im Hauptworkspace vorhandene fremde AI022-Änderungen blieben unangetastet.

## Umgesetzte Pakete

| Paket | Ergebnis | Commit |
| --- | --- | --- |
| Prozess-Setup | Worktree-Prozess, Ziel, Invarianten und Paketfolge dokumentiert | `cad5d46b` |
| AI-CONS-0 | Lokaler Activation-Track-Audit mit Hauptworkspace-Fremdänderungen und AI-Status | `b36cf0a2` |
| AI-CONS-1 | Pfadbezogene Git-Disziplin und No-`git add .`-Regel im Prozess verankert | `6f843990` |
| AI-CONS-2 | Decision-/Evaluation-/Diagnostics-Modulgrenzen dokumentiert und Import-Guard ergänzt | `6ad6255e` |
| AI-CONS-3 | Play-Strength-Pilot-Scopes in Registry konsolidiert | `ec1ff597` |
| AI-CONS-4 | Pilot-Scopes gegen Real-Engine-Decision-Corpus validiert | `d1a7181f` |
| AI-CONS-5 | Shadow-League-Baseline 2026-06-12 versioniert | `923d1d81` |
| AI-CONS-6 | Calibration-Profile an Baseline, Version und Evidence gebunden | `c609a6c5` |
| AI-CONS-7 | DoctrineGoalSynthesis diagnostisch an DecisionFrame angebunden | `32c1e869` |
| AI-CONS-8 | TargetChoiceShadow mit echten LegalAction-Zielen und Determinismus gehärtet | `3a6bba5c` |
| AI-CONS-9 | DecisionTrace-Diagnostik side-safe in Debug/Report sichtbar gemacht | `418b3cfe` |
| AI-CONS-10 | Restliche `index.ts`-Debt-Map mit Zielmodulen und Testbedarf erstellt | `99d84c9c` |

## Wesentliche Schlüsse

1. Der Play-Strength-Spine ist jetzt besser in `decision/`, `diagnostics/` und `evaluation/` getrennt. Der neue Modulgrenzen-Test schützt die wichtigsten Rückwärtsabhängigkeiten.
2. Pilot-Scopes sind nicht mehr in einer wachsenden Einzelfassade versteckt, sondern zentral registriert, kalibriert und gegen Engine-nahe Korpusfälle testbar.
3. Shadow-League- und Calibration-Artefakte bleiben diagnostisch. Calibration-Profile ändern das Default-Runtime-Verhalten nicht.
4. DeckDoctrine-v2-Diagnostik kann neutrale Ziele synthetisieren, bleibt aber durch den Frame-Eingang explizit und nicht produktiv-autonom.
5. `TargetChoiceShadow` und DecisionTrace-Debug liefern sichtbare Diagnoseflächen, erzeugen aber keine produktiven `selectedChoices` und keine neue LegalAction-Autorität.
6. `index.ts` bleibt groß. Die nächste sinnvolle Strukturarbeit ist ein kleiner Debug-/Benchmark-/Legacy-Schnitt, nicht ein Big-Bang-Refactor.

## Nicht geändert

- Keine Engine-Regel wurde geändert.
- `applyAction`, Replay, StateHash, Randomness und LegalAction-Erzeugung wurden nicht verändert.
- Keine Hidden-Info-Allowlist wurde erweitert.
- Kein produktiver Big-Bang-Cutover auf Shadow/Calibration/TargetChoiceShadow wurde vorgenommen.
- Legacy-Fallbacks und No-Candidate-Fallbacks bleiben erhalten.
- Hauptworkspace-Fremdänderungen wurden nicht gestasht, committed oder reverted.

## Verifikation bis AI-CONS-11

- `corepack pnpm --filter @netgrid/ai test` in AI-CONS-0: grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: in den relevanten Source-Paketen grün, zuletzt nach AI-CONS-9 erneut grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`: 494 Tests grün nach AI-CONS-9.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`: 42 Tests grün nach AI-CONS-9.
- Fokustests für DecisionDebug, Shadow-Report, Module Boundaries, Pilot Registry, Real-Engine Corpus, Shadow League, Benchmark, Calibration, DoctrineGoalSynthesis und TargetChoiceShadow liefen paketbezogen grün.
- `git diff --check` war vor jedem Paketcommit grün.

## FINAL-GREEN und Main-Merge

- Vor dem `main`-Merge: `@netgrid/ai test`, `@netgrid/ai typecheck`, `src/index.test.ts`, `src/semantic-ai-runtime-cutover.test.ts` und `git diff --check` grün.
- Beim Merge von lokalem `main` gab es einen Importkonflikt in `semantic-ai-runtime-cutover.test.ts`; gelöst auf die neue `pilot-scope-registry`.
- Der lokale `main` erweiterte den Real-Engine-Decision-Corpus auf 18 Szenarien. Die Shadow-League-Pilot-Eligibility wurde deshalb von 9 auf 15 aktualisiert.

Nach der Baseline-Anpassung liefen `@netgrid/ai test` mit 1202 Tests, `@netgrid/ai typecheck`, `src/index.test.ts`, `src/semantic-ai-runtime-cutover.test.ts` mit 45 Tests und `git diff --check` erneut grün. Der Branch kann nach `main` fast-forwarded werden.
