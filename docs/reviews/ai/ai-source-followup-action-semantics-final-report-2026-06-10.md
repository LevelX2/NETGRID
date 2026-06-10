# AI Source Follow-up Action Semantics Final Report 2026-06-10

## Status

`ready_for_final_green`

## Ergebnis

Der Follow-up-Prozess `AI Source Follow-up - Strukturabschluss und Action-Semantik-Fundament` ist in den Umsetzungspaketen AI-FUP-0 bis AI-SEM-2 abgeschlossen. Der Arbeitsbranch ist `codex/ai-source-followup-action-semantics`.

Umgesetzt:

- `packages/ai/src/index.ts` wurde weiter zur Fassade reduziert: Semantic-Runtime-Typen und Plan-Mapping-/Choice-Ranking liegen jetzt in `packages/ai/src/runtime/semantic-runtime-types.ts` und `packages/ai/src/runtime/semantic-choice-ranking.ts`.
- Zwei klare Testgruppen wurden aus `packages/ai/src/index.test.ts` in fokussierte Simulationstests verschoben.
- Action-Card-Semantik trennt jetzt Instanz-ID und Definition-ID: `sourceCardInstanceId` und `sourceDefinitionId` sind explizit, `sourceCardId` bleibt als Kompatibilitätsalias erhalten.
- CardSemanticProfiles werden nur noch über side-safe `sourceDefinitionId` gejoint; reine Instanz-IDs lösen keinen Profil-Join aus.
- Eine neue Coverage-Matrix in `packages/ai/src/actions/action-semantic-coverage.test.ts` prüft Candidate-Erzeugung, LegalActionRef, HardGates, Visibility, Timing, Cost, ProjectionStatus und Evidence.

## Nicht Geändert

- Keine Änderung an `packages/engine/**`.
- Keine Änderung an LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Erweiterung von PlayerView-, AIInput-, Debug-, Log- oder Payload-Hidden-Info-Grenzen.
- Kein DeckDoctrine-v2-Cutover, kein neuer KI-Spieler, kein Shadow-Mode-Cutover und keine produktive Gewichtsanpassung.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und No-Candidate-Fallback bleiben erhalten.

## Verifikation

Grün im Follow-up-Stand:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Der letzte vollständige `@netgrid/ai`-Testlauf bestand mit 54 Testdateien und 1030 Tests.

Zusätzlich grün:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts src/action-doctrine-goal-diagnostics.test.ts src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts src/action-semantic-candidate.test.ts src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/simulation/v143-fixtures.test.ts src/simulation/simulation-harness.test.ts
```

## Paketcommits

- `21deb542 docs(ai): document action semantics follow-up preflight`
- `8ab555ba refactor(ai): finish index facade extraction`
- `b2d94f03 test(ai): split focused tests from index suite`
- `c31e6a9c fix(ai): resolve action card semantics by definition id`
- `9a5e6fca test(ai): cover action semantic projection contracts`

## Restpunkte

- FINAL-GREEN muss noch den vollständigen Schlusslauf wiederholen, lokal nach `main` integrieren, `main` verifizieren und den Arbeits-Worktree entfernen.
- Weitere spätere Strukturarbeit kann Debug-/Diagnosefunktionen aus `packages/ai/src/index.ts` auslagern; das ist kein Blocker für diesen Abschluss.
