# AI Source Follow-up Review Audit 2026-06-10

## Status

complete

## Git

- Arbeitsbranch: `codex/ai-source-followup-review-fixes`
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_SOURCE_FOLLOWUP_REVIEW_FIXES`
- Audit-HEAD: `ec19d6e74d0d93afaa328e7905af00fc239992ae`
- Geprüfter lokaler Ausgangsstand: `67f4c51c docs(ai): record action semantics final green`
- Remote-Sichtbarkeit: Der lokale `main` ist nicht vollständig auf `origin/main` sichtbar; `67f4c51c` bleibt ein lokaler Review-Stand.
- `git show --stat --oneline 67f4c51c`: zwei Dokumentationsdateien, 22 Insertions, 5 Deletions.
- `git show --name-status --oneline 67f4c51c`: geändert wurden `docs/architecture/ai/ai-source-followup-action-semantics-automation-process-2026-06-10.md` und `docs/reviews/ai/ai-source-followup-action-semantics-final-report-2026-06-10.md`.

## index.ts

- `packages/ai/src/index.ts` hat 34576 Zeilen.
- `rg --count "^(export )?(async )?(function|const|let|class) " packages/ai/src/index.ts`: 744 Treffer.
- Die Datei ist nach der Reorg weiter öffentliche Fassade und enthält zugleich noch erhebliche Restlogik.

Verbliebene Kategorien im Inventar:

- Runtime-Brücken: `semanticRuntimeChoices`, `bestSemanticRuntimeChoice`, `tacticalPlanMappedChoice`.
- Debug-Brücke: `semanticRuntimeDecisionDebug`.
- Legacy-Baseline-Brücken: `chooseCorpBaselineAction`, `chooseRunnerBaselineAction`, `decisionFromChoices`, `scoreActions`.
- Simulation-/Benchmark-Metriken und Report-Helfer verbleiben teilweise in `index.ts`.

Bewertung:

- Kein Must-Fix im Audit, weil der vollständige AI-Testlauf grün ist.
- AI-FUP-R3 sollte die verbliebene Restlogik gezielt prüfen und nur risikoarme Extraktionen durchführen.

## Action Identity

Gefundene Felder und Module:

- `sourceCardId` ist weiterhin vorhanden und wird als Legacy-/Kompatibilitätsfeld genutzt.
- `sourceCardInstanceId` und `sourceDefinitionId` sind in `packages/ai/src/action-semantic-candidate.ts` vorhanden.
- `cardSemanticProfilesByDefinitionId` ist vorhanden.
- `cardSemanticProfilesByCardId` existiert noch als Alias/Fallback.
- `packages/ai/src/actions/action-source-binding.ts` bindet `sourceCardInstanceId` aus `LegalAction.abilityRef.sourceCardInstanceId` und `sourceDefinitionId` aus Payload oder Ability-Binding.
- `packages/ai/src/actions/action-card-semantic-join.ts` joint Profile über `candidate.sourceDefinitionId`.

Risiko:

- Die Begriffe `sourceCardId`, `sourceCardInstanceId` und `sourceDefinitionId` sind noch nicht überall gleich stark vertraglich kommentiert.
- `sourceCardId` kann in älteren Consumers sowohl Definition- als auch Instanzbezug bedeuten.

Folge:

- AI-FUP-R1 soll den Vertrag durch Typkommentare und Tests härten, ohne öffentliche Exportnamen zu entfernen.

## Tests

Inventar:

- `packages/ai/src/index.test.ts`: 484 `describe`-/`it`-Treffer.
- `packages/ai/src/simulation/simulation-harness.test.ts`: 3 Treffer.
- `packages/ai/src/simulation/v143-fixtures.test.ts`: 3 Treffer.
- `packages/ai/src/simulation/benchmark-reports.test.ts`: 7 Treffer.
- `packages/ai/src/actions/action-semantic-coverage.test.ts`: 3 Treffer.

`index.test.ts` enthält weiterhin Querschnittsverträge für:

- öffentliche Entrypoints wie `chooseAiAction`, `chooseRunnerAction`, `chooseCorpAction`;
- Auswahl aus `legalActions`;
- Legacy-Modus über `NETGRID_SEMANTIC_AI_RUNTIME=legacy`;
- Hidden-Info-Redaction-Smokes;
- DecisionDebug-Scrubbing und Hidden-State-Invariance.

## Verification

- `corepack pnpm --filter @netgrid/ai test`: grün, 54 Testdateien, 1038 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.

## Findings

### Must Fix

- Keine Must-Fix-Befunde aus AI-FUP-R0.

### Should Fix

- `sourceCardId` sollte als Legacy-Alias explizit dokumentiert und nicht für CardSemanticProfile-Lookups genutzt werden.
- Echte Engine-LegalActions sollten zusätzlich zur synthetischen Coverage geprüft werden.
- `index.ts`-Restlogik sollte paketweise inventarisiert und nur bei geringem Risiko extrahiert werden.
- Der Testsplit-Vertrag sollte als eigenes Paket gegen versehentliche Ausdünnung abgesichert werden.

### No Action

- Kein Push erforderlich.
- Kein Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragswechsel erforderlich.
