import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  corpSameTurnScoreConversionPaths,
  type CorpScoreConversionPath,
} from "../../plans/tactical-plan-corp-score-conversion";
import { corpVisibleCardEconomyWithdrawals } from "../economy/economy-signals";

/** Score owns route dominance; Economy only supplies certified current payouts. */
export function corpAssetPreservingSameTurnScoreRoutes(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  projects: readonly CorpScoreProjectSignal[],
): { dominatedProjectIds: Set<string>; preservingProjectIds: Set<string> } {
  const dominatedProjectIds = new Set<string>();
  const preservingProjectIds = new Set<string>();
  const eligible = projects.filter(
    (project) =>
      project.phase === "install_agenda" &&
      project.feasible &&
      !project.terminalScore &&
      project.sameTurnCloseout &&
      project.sameTurnConversionProof === "engine_quoted_path",
  );
  if (eligible.length < 2) return { dominatedProjectIds, preservingProjectIds };
  const payouts = corpVisibleCardEconomyWithdrawals(input, candidates);
  const paths = corpSameTurnScoreConversionPaths(input, candidates).filter(
    (path) =>
      !path.fundingPrefix && path.steps[0]?.kind === "install_score_target",
  );
  const actionById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const projectFor = (path: CorpScoreConversionPath) =>
    eligible.find(
      (project) =>
        project.agendaInstanceId === path.agendaCardId &&
        project.serverId === path.targetServerId &&
        project.actionIds?.includes(path.steps[0]!.actionId!),
    );
  for (const path of paths) {
    const project = projectFor(path);
    const action = actionById.get(path.steps[0]!.actionId!);
    if (!project || action?.payload?.rootReplacement !== "asset_to_agenda")
      continue;
    const server = input.playerView.servers.find(
      (server) => server.id === path.targetServerId,
    );
    const destroysProductivePool = server?.root.some(
      (card) =>
        card.known &&
        card.type === "asset" &&
        payouts.some(
          (payout) =>
            payout.sourceZone === "installed_root" &&
            payout.sourceInstanceId === card.instanceId &&
            payout.conversion.payoutSource === "hosted_credit_pool" &&
            payout.withdrawalCampaign !== undefined &&
            payout.withdrawalCampaign.remainingPoolCredits > 0,
        ),
    );
    if (!destroysProductivePool) continue;
    for (const sibling of paths) {
      const siblingProject = projectFor(sibling);
      const siblingAction = actionById.get(sibling.steps[0]!.actionId!);
      if (
        !siblingProject ||
        !siblingAction ||
        sibling.targetServerId === path.targetServerId ||
        siblingAction.payload?.rootReplacement !== undefined ||
        !equivalentSameTurnScoreResources(path, sibling)
      )
        continue;
      dominatedProjectIds.add(project.projectId);
      preservingProjectIds.add(siblingProject.projectId);
    }
  }
  return { dominatedProjectIds, preservingProjectIds };
}

/** Only installation location may differ; source consumption and all obligations stay equal. */
export function equivalentSameTurnScoreResources(
  left: CorpScoreConversionPath,
  right: CorpScoreConversionPath,
): boolean {
  const signature = (path: CorpScoreConversionPath) => ({
    agenda: path.agendaCardId,
    points: path.agendaPoints,
    requirement: path.advancementRequirement,
    initial: path.initialAdvancementCounters,
    desired: path.desiredAdvancementCounters,
    clicks: path.clicksRequired,
    generated: path.clicksGenerated,
    credits: path.creditsRequired,
    counters: Object.entries(path.reservedAdvancementCounters).sort(
      ([a], [b]) => a.localeCompare(b),
    ),
    overadvance: path.overadvanceReason,
    funding: path.fundingPrefix,
    steps: path.steps.map(
      ({
        targetServerId: _server,
        evidence: _evidence,
        actionId,
        ...step
      }) => ({
        ...step,
        ...(step.kind === "install_score_target" ? {} : { actionId }),
      }),
    ),
  });
  return (
    left.sameTurnGuaranteed &&
    right.sameTurnGuaranteed &&
    JSON.stringify(signature(left)) === JSON.stringify(signature(right))
  );
}
