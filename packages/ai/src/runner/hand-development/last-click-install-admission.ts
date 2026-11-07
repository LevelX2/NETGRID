import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";

/** Consume the bound install evaluation, not an unrelated income projection. */
export function runnerLastClickInstallPreservesHandBuffer(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  evaluation: RunnerHandDevelopmentEvaluation,
  minimumHandBuffer: number,
): boolean {
  if (candidate.semanticActionType !== "install.card") return true;
  const clicks = candidate.costProfile.clickCost;
  if (clicks === undefined) return false;
  if (clicks < input.playerView.own.clicks) return true;
  const install = evaluation.persistentInstallEvaluation;
  if (
    !install ||
    install.actionId !== candidate.actionId ||
    !Number.isSafeInteger(install.handAfterInstall) ||
    install.handAfterInstall < 0
  )
    return false;
  return (
    install.handAfterInstall >=
    Math.min(input.playerView.own.gripOrHq.length, minimumHandBuffer)
  );
}
