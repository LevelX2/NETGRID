import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  corpSameTurnScoreConversionPaths,
  type CorpScoreConversionPath,
} from "../../plans/tactical-plan-corp-score-conversion";
import { corpVisibleCardEconomyWithdrawals } from "../economy/economy-signals";
import { corpRemoteContestabilityAssessment } from "../defense/corp-remote-contestability";
import { corpRezHostedCreditPayoutProfile } from "../../runtime/corp-canonical-card-facts";
import { corpAgendaInstallHasCertifiedNearTermScoreHorizon } from "./score-project-signals";
import { corpScorePriorityClass } from "./corp-score-priority";
import { canonicalTurnPlanningSerialize } from "../../plans/turn-planning-contracts";

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
    canonicalTurnPlanningSerialize(signature(left)) ===
      canonicalTurnPlanningSerialize(signature(right))
  );
}

/** Keep a protected next-turn score available while Economy empties its exact asset. */
export function withCorpCampaignSlotRelease(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): CorpScoreProjectSignal {
  if (
    !project.feasible ||
    project.phase !== "install_agenda" ||
    corpScorePriorityClass(project) !== "P4" ||
    project.sameTurnCloseout ||
    (project.fundingMilestone?.remainingGap ?? project.fundingGap ?? 0) > 0 ||
    input.playerView.own.clicks < 2 ||
    !project.serverId ||
    project.actionIds?.length !== 1
  ) {
    return project;
  }
  const serverId = project.serverId;
  const install = input.legalActions.find(
    (action) =>
      action.actionId === project.actionIds![0] &&
      actionMatchesCurrentDecision(input, action) &&
      action.type === "install_card" &&
      action.source === project.agendaInstanceId &&
      action.payload?.serverId === serverId,
  );
  const candidate = candidates.find(
    (entry) => entry.actionId === install?.actionId,
  );
  if (
    install?.payload?.rootReplacement !== "asset_to_agenda" ||
    !candidate ||
    !corpAgendaInstallHasCertifiedNearTermScoreHorizon(
      input,
      candidate,
      serverId,
    )
  ) {
    return project;
  }
  const root = input.playerView.servers.find(
    (server) => server.id === serverId,
  )?.root;
  const asset = root?.find((card) => card.type === "asset");
  const pool = asset?.counters?.bit;
  const profile = corpRezHostedCreditPayoutProfile(asset?.definitionId);
  if (
    !asset?.known ||
    !asset.rezzed ||
    asset.controller !== "corp" ||
    !profile?.trashesWhenEmpty ||
    typeof pool !== "number" ||
    !Number.isSafeInteger(pool) ||
    pool <= 0
  ) {
    return project;
  }
  const payouts = Math.ceil(pool / profile.payoutCredits);
  const installClicks = install.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const remainingClicks = input.playerView.own.clicks - payouts - installClicks;
  const requirement =
    install.payload.agendaInstallScoreHorizonQuoteAdvancementRequirement;
  const nextClicks =
    install.payload
      .agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks;
  if (
    remainingClicks < 0 ||
    typeof requirement !== "number" ||
    typeof nextClicks !== "number" ||
    requirement > remainingClicks + nextClicks ||
    corpRemoteContestabilityAssessment(input, serverId)?.contestable !== false
  ) {
    return project;
  }
  const expectedIncome = Math.min(pool, profile.payoutCredits);
  const currentPayout = input.legalActions.find(
    (action) =>
      actionMatchesCurrentDecision(input, action) &&
      action.type === "activated_card_ability" &&
      action.source === asset.instanceId &&
      action.payload?.hostedCreditTakeAmount === expectedIncome,
  );
  const withdrawal =
    currentPayout &&
    corpVisibleCardEconomyWithdrawals(input, candidates, {
      slotReleaseActionIds: new Set([currentPayout.actionId]),
    }).find((signal) => signal.actionIds[0] === currentPayout.actionId);
  if (
    !withdrawal ||
    withdrawal.conversion.clickCost !== 1 ||
    withdrawal.conversion.creditCost !== 0 ||
    withdrawal.conversion.payoutSource !== "hosted_credit_pool" ||
    withdrawal.conversion.hostedCreditTakeMode !== "up_to_amount_if_available"
  ) {
    return project;
  }
  return {
    ...project,
    feasible: false,
    routeAssessment: "corp_score_awaits_campaign_slot_release",
    campaignSlotRelease: {
      payoutActionId: withdrawal.actionIds[0],
      sourceCardInstanceId: asset.instanceId,
      stateVersion: input.playerView.stateVersion,
    },
    evidenceCode: `corp_score_awaits_campaign_slot_release:${serverId}:${payouts}`,
  };
}
