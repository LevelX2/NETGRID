import type { AiDecisionInput } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";
import { runnerLastClickInstallPreservesHandBuffer } from "./last-click-install-admission";

const cp = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep633-last-click-payoff-hand-floor-d53.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

it.each([
  "missing_quote",
  "wrong_action",
  "missing_clicks",
  "negative_clicks",
  "fractional_clicks",
  "negative_hand",
  "unknown_hand",
])("does not admit a last-click install with %s", (variant) => {
  const input: AiDecisionInput = structuredClone(cp.input);
  const source = input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === 341,
  );
  expect(source).toBeDefined();
  const offers = input.legalActions.filter(
    (action) =>
      action.type === "install_card" && action.source === source!.instanceId,
  );
  expect(offers).toHaveLength(1);
  const action = offers[0]!;
  const candidate = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
  })[0]!;
  const evaluation = {
    persistentInstallEvaluation: {
      actionId: action.actionId,
      handAfterInstall: 2,
    },
  } as RunnerHandDevelopmentEvaluation;
  if (variant === "missing_quote")
    delete evaluation.persistentInstallEvaluation;
  if (variant === "wrong_action")
    evaluation.persistentInstallEvaluation!.actionId = "another-action";
  if (variant === "missing_clicks") delete candidate.costProfile.clickCost;
  if (variant === "negative_clicks") candidate.costProfile.clickCost = -1;
  if (variant === "fractional_clicks") candidate.costProfile.clickCost = 0.5;
  if (variant === "negative_hand")
    evaluation.persistentInstallEvaluation!.handAfterInstall = -1;
  if (variant === "unknown_hand")
    evaluation.persistentInstallEvaluation!.handAfterInstall = Number.NaN;
  expect(
    runnerLastClickInstallPreservesHandBuffer(input, candidate, evaluation, 2),
  ).toBe(false);
});
