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
  "negative_hand",
  "unknown_hand",
])("does not admit a last-click install with %s", (variant) => {
  const input = structuredClone(cp.input);
  const action = input.legalActions.find(
    (a: { actionId: string }) =>
      a.actionId.includes("install_card") &&
      a.actionId.includes("hq-interface"),
  );
  const candidate = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: 52,
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
  if (variant === "negative_hand")
    evaluation.persistentInstallEvaluation!.handAfterInstall = -1;
  if (variant === "unknown_hand")
    evaluation.persistentInstallEvaluation!.handAfterInstall = Number.NaN;
  expect(
    runnerLastClickInstallPreservesHandBuffer(input, candidate, evaluation, 2),
  ).toBe(false);
});
