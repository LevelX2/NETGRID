import {
  RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
  type CardInstanceId,
  type GameState,
  type RunnerDrawProjection,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import { rezzedCorpRootCardIds } from "./card-implementation-modifiers";

/** Draw-only growth after mandatory disposition; source-card costs stay separate. */
type RunnerDrawProjectionPayload = Omit<
  RunnerDrawProjection,
  "schemaVersion"
> & {
  runnerDrawProjectionSchemaVersion: typeof RUNNER_DRAW_PROJECTION_SCHEMA_VERSION;
};

export function runnerDrawProjectionPayload(
  stackCount: number,
  drawAmounts: readonly number[],
  replacementActive: boolean,
  visibleDrawTaxSourceCount: number,
): RunnerDrawProjectionPayload {
  if (
    ![stackCount, visibleDrawTaxSourceCount, ...drawAmounts].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    )
  )
    throw Object.assign(
      new Error("Runner draw projection requires exact nonnegative counts."),
      { code: "invalid_runner_draw_projection_counts" },
    );
  if (replacementActive && drawAmounts.filter((n) => n > 0).length > 1)
    throw Object.assign(
      new Error(
        "Separate replaced draws require the intervening disposition before an exact aggregate quote.",
      ),
      { code: "runner_draw_projection_crosses_disposition_boundary" },
    );
  let available = stackCount;
  let gross = 0;
  let disposition = 0;
  for (const amount of drawAmounts) {
    if (amount === 0) continue;
    const drawn = Math.min(available, amount + (replacementActive ? 1 : 0));
    available -= drawn;
    gross += drawn;
    if (replacementActive && drawn > 0) disposition += 1;
  }
  return {
    runnerDrawProjectionSchemaVersion: RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
    projectedGrossDrawCount: gross,
    projectedPostDrawDispositionCount: disposition,
    projectedNetHandDelta: gross - disposition,
    visibleDrawTaxSourceCount,
  };
}

export function runnerDirectDrawProjectionPayload(
  state: GameState,
  drawAmounts: readonly number[],
) {
  const kind = (id: CardInstanceId) => {
    const card = state.cardInstances[id];
    if (!card)
      throw Object.assign(
        new Error("Runner draw projection source is missing."),
        { code: "runner_draw_projection_source_missing", sourceId: id },
      );
    return cardImplementationForDefinitionId(card.definitionId)
      ?.remainingReplacementLongtail?.kind;
  };
  return runnerDrawProjectionPayload(
    state.runner.stack.length,
    drawAmounts,
    state.runner.rig.resources.some(
      (id) => kind(id) === "hidden_draw_keep_or_top_replacement",
    ),
    rezzedCorpRootCardIds(state).filter(
      (id) => kind(id) === "runner_draw_tax_tag",
    ).length,
  );
}
