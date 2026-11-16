import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type RunnerHqSuccessWindowSetup = {
  sourceDefinitionId: string;
  minimumIceTrashCost: number;
  evidence: string[];
};

export function runnerHqSuccessWindowSetupAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: string | undefined,
): RunnerHqSuccessWindowSetup | undefined {
  if (
    action.type !== "start_run" ||
    serverId !== "hq" ||
    input.playerView.run ||
    input.playerView.own.clicks < 2
  ) {
    return undefined;
  }
  const source = input.playerView.own.gripOrHq.find((card) => {
    if (!card.definitionId) return false;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    return (
      (hint?.conditions ?? []).some(
        (condition) => condition.kind === "requires_successful_hq_run",
      ) &&
      (hint?.effects ?? []).some(
        (effect) =>
          effect.kind === "ice_trash" &&
          "target" in effect &&
          effect.target === "pay_rez_cost_to_trash_rezzed_ice",
      )
    );
  });
  if (!source?.definitionId) return undefined;
  const hqServer = input.playerView.servers.find(
    (server) => server.id === "hq",
  );
  if (
    !hqServer ||
    hqServer.ice.some((ice) => !ice.known || ice.rezzed !== true)
  ) {
    return undefined;
  }
  const hqPath = assessKnownRezzedIcePath(
    hqServer.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    hqServer.root,
    input.playerView.opponent.credits,
  );
  if (!hqPath.canReachAccess || hqPath.visibleTraceTagHazardUnavoidable) {
    return undefined;
  }
  const minimumIceTrashCost = input.playerView.servers
    .flatMap((server) => server.ice)
    .filter((ice) => ice.rezzed === true && Number.isFinite(ice.rezCost))
    .map((ice) => Math.max(0, ice.rezCost ?? 0))
    .filter((rezCost) => rezCost <= input.playerView.own.credits)
    .sort((left, right) => left - right)[0];
  if (minimumIceTrashCost === undefined) return undefined;
  const creditsAfterHqPath =
    hqPath.creditsAfterAvoidingVisibleIceHazards ?? hqPath.creditsAfterPath;
  if (creditsAfterHqPath < minimumIceTrashCost) return undefined;
  return {
    sourceDefinitionId: source.definitionId,
    minimumIceTrashCost,
    evidence: [
      `success_window_source:${source.definitionId}`,
      `visible_affordable_rezzed_ice_cost:${minimumIceTrashCost}`,
      `credits_after_hq_path:${creditsAfterHqPath}`,
      `runner_clicks:${input.playerView.own.clicks}`,
    ],
  };
}
