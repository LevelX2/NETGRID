# AI Play-Strength Maturation 4 Final Report

Datum: 2026-06-13

## Ergebnis

AI-MAT4-0 bis AI-MAT4-26 wurden im Arbeitsbranch `codex/ai-play-strength-maturation-4` umgesetzt. Die Serie bleibt eine AI-interne Play-Strength-, Diagnose- und Strukturserie.

Keine Änderung an:

- Engine-Regelautorität
- `LegalActions`-/`PlayerActions`-Vertrag
- `applyAction`-Revalidation
- Replay, StateHash oder Randomness
- Hidden-Info-Redaction
- Pilot-Default-Aktivierung
- Proteus-KI-Freigabe

## Umgesetzte Schwerpunkte

- Preflight- und Testzahl-Sync für den lokalen Maturation-IV-Start.
- Placement Guide für künftige AI-Fixes statt weiterer Fachlogik in `packages/ai/src/index.ts`.
- Extraktion von Runtime-Score-Komponenten und Simulation-Metrikaggregation aus `index.ts`.
- Aktualisierte `index.ts`-Restschuldkarte nach den neuen Schnitten.
- Lokale Default-Dry-Runs für `basic_setup`, `runner_safe_access` und `corp_score_window`.
- Policy-Vertrag: keine lokal aktivierten Default-Scopes; Env-Override bleibt erforderlich.
- TargetChoice-Readiness mit `wouldSelect`-Dry-Run ohne `selectedChoices` oder `selectedTargets`.
- DoctrineGoal-ActionFit-Metriken in Corpus und ShadowLeague.
- Originalset-Worklist-Regressionen für Runner-Search/Breaker, Runner-Risk, Corp-Score, Corp-Tag und Corp-Damage.
- Proteus-Pakete weiterhin diagnostisch klassifiziert, keine Support-Freigabe.
- Selfplay-Mining-Promotion-Queue und separater Selfplay-Promotion-Corpus-Slice.
- ShadowLeague-Delta um Szenario-, Fehler-, Pilot-Readiness-, TargetChoice-, DoctrineFit- und RemoteContest-Deltas erweitert.
- Module-Boundary-Guards und Public-Export-Contract für neue interne MAT4-Module gehärtet.

## Wichtige Folgeentscheidungen

`runner_safe_access` und `basic_setup` bleiben Default-off-Kandidaten, aber nicht automatisch aktiv. `corp_score_window` bleibt env-gated. TargetChoice-Dry-Runs dürfen Empfehlungen berichten, erzeugen aber weiterhin keine Auswahlpayloads. Proteus-Varianten bleiben ohne AI-Support-Freigabe, bis Engine- und Sichtbarkeitsverträge explizit erweitert sind.

## Verifikation der Paketserie

Die Einzelpakete wurden jeweils mit fokussierten Tests, `@netgrid/ai`-Typecheck und `git diff --check` geprüft. Nach dem konfliktfreien Merge von `main` in den Arbeitsbranch wurde das vollständige FINAL-GREEN-Gate erneut grün ausgeführt. Drei lang laufende Simulation-Smokes erhielten dabei nur erweiterte Testzeitbudgets; die fachlichen Assertions blieben unverändert.

Relevante fokussierte Paketchecks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/real-engine-decision-corpus.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league-delta.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/decision/module-boundaries.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

FINAL-GREEN:

- `corepack pnpm --filter @netgrid/ai test`: 97 Testdateien, 1334 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`: 506 Tests.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`: 49 Tests.
- `corepack pnpm --filter @netgrid/engine test`: 171 Testdateien, 1509 Tests.
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/server test`: 6 Testdateien, 127 Tests.
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test`: 33 Testdateien, 417 Tests.
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`
