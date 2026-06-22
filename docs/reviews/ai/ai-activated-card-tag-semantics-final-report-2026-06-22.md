# AI Activated Card Tag Semantics Final Report 2026-06-22

## Ergebnis

`AI-TAG-SEM-0` bis `AI-TAG-SEM-6` haben die semantische Projektion und Runtime-Bewertung für aktivierte Tag-Cleanup-Karten umgesetzt.

Der konkrete Playtest-Befund ist behoben: Wenn der Runner sichtbare Tags hat und `Danshi's Second ID` als legale `activated_card_ability` verfügbar ist, wird die Aktion generisch als `tag.remove` projiziert, in `tag_removal` geroutet und gegenüber einfacher Economy priorisiert.

## Implementierter Vertrag

- LegalActions bleiben einzige Aktionsquelle.
- Die AI nutzt nur side-safe LegalAction-Metadaten und sichtbare eigene PlayerView-Karten zur SourceDefinition-Bindung.
- `ActionSemanticCandidate` enthält optional `tagEffectProfile`.
- BasicAction `remove_tag` und sicher gebundene CardImplementation-`remove_tags`-Actions werden als `tag.remove` klassifiziert.
- Tag-Vermeidung und Tag-Clear-Credit-Quellen bleiben support-only, solange keine akute Tag-Entfernungs-LegalAction sichtbar ist.
- Runtime-Scoring bewertet akute Tag-Entfernung nur bei sichtbaren aktuellen Tags und konservativ nach erwarteter Reduktion.

## Abgedeckte Karten/Fälle

- `Danshi's Second ID`: aktivierte Kartenfähigkeit, bis zu 3 Tags entfernen.
- `Nomad Allies`: aktivierte Kartenfähigkeit, 1 Tag entfernen.
- `Open-Ended Mileage Program`: inventarisiert als `play_event` mit `remove_tags`.
- `Total Genetic Retrofit`: inventarisiert als `play_event` mit `remove_tags` und `avoid_next_tag`.
- `Fall Guy`: Gegenprobe, Tag-Vermeidung bleibt support-only.
- `Armadillo` und `Drifter`: Kosten-/Hosted-Credit-Support, keine eigene akute Tag-Entfernungsaktion.

## Geänderte Artefakte

- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-source-binding.ts`
- `packages/ai/src/actions/tag-effect-semantics.ts`
- `packages/ai/src/runtime/semantic-runtime.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/action-semantic-candidate.test.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- `docs/architecture/ai/ai-activated-card-tag-semantics-process-2026-06-22.md`
- `docs/architecture/ai/ai-activated-card-tag-semantics-contract-2026-06-22.md`
- `docs/reviews/ai/ai-activated-card-tag-semantics-inventory-2026-06-22.md`

## Nicht geändert

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, AI-Inputs, Debug, Reports oder Logs.
- Keine UI-Änderung.
- Keine Danish-Sonderregel im Runtime-Scoring.

## Verifikation

Paketchecks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`: grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.

Final Green folgt in `FINAL-GREEN` mit vollständigem AI-Testlauf.

## Rest-Gaps

- AI-Hints bleiben bei einzelnen Karten historisch heterogen formuliert. Das ist kein Blocker, weil die umgesetzte Projektion CardImplementation-/LegalAction-Metadaten bevorzugt.
- Tag-Vermeidungsfenster sind bewusst nicht als akute `tag_removal`-Entscheidung aktiviert.
