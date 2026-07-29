import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  CorpDefenseSignal,
  CorpEconomyNeedSignal,
  CorpGenericDefenseSignal,
} from "./corp-core-plan-modules";
import { assessFundingOnlyIceStaging } from "../runtime/corp-defense-staging-policy";
export { assessFundingOnlyIceStaging } from "../runtime/corp-defense-staging-policy";
import {
  buildCanonicalLegalActionInvocation,
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type CampaignValueClaim,
  type CanonicalLegalActionInvocation,
  type PlanningStateIdentity,
} from "./turn-planning-contracts";

export const CORP_DEFENSE_TURN_SLICE_VERSION =
  "corp-defense-turn-slice-v1" as const;

export type CorpDefenseLineDisposition =
  | "install_rez_ready"
  | "fund_then_install"
  | "stage_for_later_rez"
  | "bounded_bluff";

export type CorpDefenseTurnPlanningLine = {
  lineId: string;
  defenseId: string;
  targetServerId: string;
  disposition: CorpDefenseLineDisposition;
  currentActionId: string;
  nodes: Array<{
    nodeId: string;
    ownerModuleId: "corp.defend_servers" | "corp.economy";
    invocation: CanonicalLegalActionInvocation;
    projectedOnly: boolean;
  }>;
  fundingGapBefore: number;
  fundingGapAfter: number;
  rezReadyAfterLine: boolean;
  bluffValue: number;
  defenseValue: number;
  economyValue: number;
  totalValue: number;
  campaignQuote: CampaignMilestoneQuote;
  valueClaims: CampaignValueClaim[];
  evidenceCodes: string[];
};

export type CorpDefenseTurnPlanningSlice = {
  schemaVersion: typeof CORP_DEFENSE_TURN_SLICE_VERSION;
  lines: CorpDefenseTurnPlanningLine[];
  rejected: Array<{
    defenseId: string;
    actionId?: string;
    reasonCode: string;
  }>;
  selectedLineId?: string;
  evidenceCodes: string[];
};

export function buildCorpDefenseTurnPlanningSlice(params: {
  input: AiDecisionInput;
  defenseNeeds: readonly CorpDefenseSignal[];
  economyNeeds: readonly CorpEconomyNeedSignal[];
  candidates: readonly ActionSemanticCandidate[];
  stateIdentity: PlanningStateIdentity;
}): CorpDefenseTurnPlanningSlice {
  const genericInstalls = params.defenseNeeds.filter(
    (signal): signal is CorpGenericDefenseSignal =>
      signal.kind === "generic" &&
      signal.phase === "install_ice" &&
      signal.installRoute !== undefined,
  );
  const productiveExists = genericInstalls.some(
    (signal) =>
      signal.installRoute?.disposition === "productive" &&
      exactInstallCandidate(params.candidates, signal) !== undefined,
  );
  const rejected: CorpDefenseTurnPlanningSlice["rejected"] = [];
  const lines = genericInstalls.flatMap((signal) => {
    const route = signal.installRoute!;
    const installCandidate = exactInstallCandidate(params.candidates, signal);
    if (!installCandidate) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: route.projection.actionId,
        reasonCode: "exact_install_head_missing",
      });
      return [];
    }
    if (route.disposition === "productive") {
      return [
        createDefenseLine(params, signal, installCandidate, undefined, {
          disposition: route.projection.funded
            ? "install_rez_ready"
            : "stage_for_later_rez",
          bluffValue: 0,
        }),
      ];
    }

    const fundingNeed = exactFundingNeed(
      signal,
      params.economyNeeds,
      params.candidates,
    );
    if (fundingNeed) {
      return [
        createDefenseLine(
          params,
          signal,
          installCandidate,
          fundingNeed.candidate,
          {
            disposition: "fund_then_install",
            bluffValue: 0,
          },
        ),
      ];
    }
    const staging = assessFundingOnlyIceStaging({
      input: params.input,
      signal,
      productiveAlternativeExists: productiveExists,
      fundingAlternativeExists: hasExactFundingAlternative(
        signal,
        params.economyNeeds,
        params.candidates,
      ),
    });
    if (!staging.admissible) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: installCandidate.actionId,
        reasonCode: staging.reasonCode,
      });
      return [];
    }
    return [
      createDefenseLine(params, signal, installCandidate, undefined, {
        disposition: staging.disposition,
        bluffValue: staging.bluffValue,
      }),
    ];
  });
  lines.sort(compareDefenseLines);
  return {
    schemaVersion: CORP_DEFENSE_TURN_SLICE_VERSION,
    lines,
    rejected: rejected.sort(
      (left, right) =>
        left.defenseId.localeCompare(right.defenseId) ||
        (left.actionId ?? "").localeCompare(right.actionId ?? ""),
    ),
    ...(lines[0] ? { selectedLineId: lines[0].lineId } : {}),
    evidenceCodes: [
      `defense_line_count:${lines.length}`,
      `defense_rejected_count:${rejected.length}`,
      "ice_staging_owned_by_defense_plan",
      "bluff_value_bounded",
    ],
  };
}

function exactInstallCandidate(
  candidates: readonly ActionSemanticCandidate[],
  signal: CorpGenericDefenseSignal,
): ActionSemanticCandidate | undefined {
  const route = signal.installRoute;
  if (!route) return undefined;
  return candidates.find(
    (candidate) =>
      candidate.actionId === route.projection.actionId &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId ===
        route.projection.sourceCardInstanceId &&
      candidate.sourceDefinitionId === route.projection.sourceDefinitionId &&
      candidateTargetIds(candidate).includes(signal.serverId),
  );
}

function exactFundingNeed(
  signal: CorpGenericDefenseSignal,
  economyNeeds: readonly CorpEconomyNeedSignal[],
  candidates: readonly ActionSemanticCandidate[],
):
  | {
      signal: Extract<CorpEconomyNeedSignal, { kind: "parent_funding" }>;
      candidate: ActionSemanticCandidate;
    }
  | undefined {
  const projection = signal.installRoute?.projection;
  if (!projection) return undefined;
  const gap =
    projection.after.minimumAdditionalCreditsToSatisfy ??
    signal.installRoute?.rezFundingGap;
  if (gap === undefined) return undefined;
  const expectedNeedId = `defense-reserve:${signal.serverId}:${projection.sourceCardInstanceId}`;
  const funding = economyNeeds.find(
    (
      need,
    ): need is Extract<CorpEconomyNeedSignal, { kind: "parent_funding" }> =>
      need.kind === "parent_funding" &&
      need.needId === expectedNeedId &&
      need.gap === gap &&
      need.parentPlanInstanceId ===
        "plan:corp.defend_servers:server-defense-portfolio" &&
      need.parentNeedId === signal.defenseId &&
      need.immediateDefenseConversion === true &&
      need.incrementalDefenseReserve?.serverId === signal.serverId &&
      need.incrementalDefenseReserve.iceInstanceId ===
        projection.sourceCardInstanceId,
  );
  if (!funding) return undefined;
  const candidate = candidates
    .filter(
      (entry) =>
        funding.actionIds.includes(entry.actionId) &&
        entry.semanticActionType === "economy.gain_credit" &&
        entry.economyProjection?.kind === "immediate_liquid" &&
        entry.economyProjection.timing === "immediate" &&
        entry.economyProjection.creditRestriction === "general" &&
        (entry.economyProjection?.netLiquidCreditGain ?? 0) >= funding.gap,
    )
    .sort((left, right) => left.actionId.localeCompare(right.actionId))[0];
  return candidate ? { signal: funding, candidate } : undefined;
}

function hasExactFundingAlternative(
  signal: CorpGenericDefenseSignal,
  economyNeeds: readonly CorpEconomyNeedSignal[],
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  const projection = signal.installRoute?.projection;
  const gap =
    projection?.after.minimumAdditionalCreditsToSatisfy ??
    signal.installRoute?.rezFundingGap;
  if (!projection || gap === undefined) return false;
  const expectedNeedId = `defense-reserve:${signal.serverId}:${projection.sourceCardInstanceId}`;
  const funding = economyNeeds.find(
    (need) =>
      need.kind === "parent_funding" &&
      need.needId === expectedNeedId &&
      need.gap === gap &&
      need.parentPlanInstanceId ===
        "plan:corp.defend_servers:server-defense-portfolio" &&
      need.parentNeedId === signal.defenseId &&
      need.immediateDefenseConversion === true &&
      need.incrementalDefenseReserve?.serverId === signal.serverId &&
      need.incrementalDefenseReserve.iceInstanceId ===
        projection.sourceCardInstanceId,
  );
  return (
    funding?.actionIds.some((actionId) =>
      candidates.some(
        (candidate) =>
          candidate.actionId === actionId &&
          candidate.semanticActionType === "economy.gain_credit" &&
          candidate.economyProjection?.kind === "immediate_liquid" &&
          candidate.economyProjection.timing === "immediate" &&
          candidate.economyProjection.creditRestriction === "general" &&
          (candidate.economyProjection.netLiquidCreditGain ?? 0) > 0,
      ),
    ) === true
  );
}

function createDefenseLine(
  params: {
    input: AiDecisionInput;
    stateIdentity: PlanningStateIdentity;
  },
  signal: CorpGenericDefenseSignal,
  install: ActionSemanticCandidate,
  funding: ActionSemanticCandidate | undefined,
  classification: {
    disposition: CorpDefenseLineDisposition;
    bluffValue: number;
  },
): CorpDefenseTurnPlanningLine {
  const route = signal.installRoute!;
  const ordered = funding ? [funding, install] : [install];
  const nodes = ordered.map((candidate, index) => {
    const ownerModuleId =
      candidate === funding
        ? ("corp.economy" as const)
        : ("corp.defend_servers" as const);
    const invocation = invocationFor(params.stateIdentity, candidate);
    return {
      nodeId: turnPlanningFingerprint("defense-line-node", {
        defenseId: signal.defenseId,
        index,
        invocationKey: invocation.invocationKey,
      }),
      ownerModuleId,
      invocation,
      projectedOnly: index > 0,
    };
  });
  const fundingGain = funding?.economyProjection?.netLiquidCreditGain ?? 0;
  const fundingGapBefore =
    route.projection.after.minimumAdditionalCreditsToSatisfy ??
    route.rezFundingGap ??
    0;
  const fundingGapAfter = Math.max(0, fundingGapBefore - fundingGain);
  const rezReadyAfterLine = route.projection.funded || fundingGapAfter === 0;
  const defenseValue =
    route.projection.effect === "satisfied"
      ? 30
      : route.projection.effect === "progress"
        ? 18
        : 0;
  const economyValue = Math.min(fundingGain, fundingGapBefore) * 4;
  const totalValue =
    defenseValue +
    economyValue +
    classification.bluffValue -
    fundingGapAfter * 3;
  const lineId = turnPlanningFingerprint("defense-line", {
    defenseId: signal.defenseId,
    disposition: classification.disposition,
    nodes: nodes.map((node) => node.invocation.invocationKey),
  });
  const campaignId = "campaign:corp.defend_servers";
  const beforeQuoteId = turnPlanningFingerprint("defense-before", {
    defenseId: signal.defenseId,
    state: params.stateIdentity.sideSafePlanningFingerprint,
  });
  const afterQuoteId = turnPlanningFingerprint("defense-after", {
    lineId,
    fundingGapAfter,
    rezReadyAfterLine,
  });
  const campaignQuote: CampaignMilestoneQuote = {
    quoteId: afterQuoteId,
    campaignId,
    quoteVersion: CORP_DEFENSE_TURN_SLICE_VERSION,
    basis: {
      kind: "projected_frame",
      baseStateVersion: params.stateIdentity.stateVersion,
      projectedFrameKey: turnPlanningFingerprint("defense-frame", {
        lineId,
        targetServerId: signal.serverId,
        fundingGapAfter,
      }),
      linePrefixHash: turnPlanningFingerprint(
        "defense-prefix",
        nodes.map((node) => node.invocation.invocationKey),
      ),
    },
    currentMilestoneId: signal.phase,
    nextMilestoneId: rezReadyAfterLine
      ? "ice_installed_rez_ready"
      : "ice_installed_funding_reserved",
    commitment:
      signal.urgent || signal.centralPressure === "acute" ? "hard" : "soft",
    remainingValue: Math.max(0, totalValue),
    expiresAt: "next_own_turn",
    revalidationCodes: [
      "ice_still_installed",
      "target_server_still_relevant",
      "rez_quote_current",
      "funding_reservation_intact",
    ],
  };
  const valueClaims: CampaignValueClaim[] = [
    {
      claimId: `${lineId}:defense`,
      campaignId,
      ownerModuleId: "corp.defend_servers",
      objectiveKey: `server:${signal.serverId}`,
      componentKey: "incremental_defense",
      evaluationDimensionId: "defense",
      aggregationMode: "delta_from_previous_prefix",
      contributionKind: "risk_reduction",
      beforeQuoteId,
      afterQuoteId,
      amount: defenseValue + classification.bluffValue,
      dependencyKeys: [],
      conflictKeys: [
        `server:${signal.serverId}:ice:${route.projection.sourceCardInstanceId}`,
      ],
      status: "quoted",
    },
    ...(fundingGain > 0
      ? [
          {
            claimId: `${lineId}:economy`,
            campaignId,
            ownerModuleId: "corp.economy" as const,
            objectiveKey: `defense-funding:${signal.defenseId}`,
            componentKey: "funding_gap_reduction",
            evaluationDimensionId: "economy",
            aggregationMode: "delta_from_previous_prefix" as const,
            contributionKind: "funding_gap_reduction" as const,
            beforeQuoteId,
            afterQuoteId,
            amount: Math.min(fundingGain, fundingGapBefore),
            dependencyKeys: [`server:${signal.serverId}:defense`],
            conflictKeys: [`defense-funding:${signal.defenseId}`],
            status: "quoted" as const,
          },
        ]
      : []),
  ];
  return {
    lineId,
    defenseId: signal.defenseId,
    targetServerId: signal.serverId,
    disposition: classification.disposition,
    currentActionId: ordered[0]!.actionId,
    nodes,
    fundingGapBefore,
    fundingGapAfter,
    rezReadyAfterLine,
    bluffValue: classification.bluffValue,
    defenseValue,
    economyValue,
    totalValue,
    campaignQuote,
    valueClaims,
    evidenceCodes: [
      `defense_disposition:${classification.disposition}`,
      `defense_target:${signal.serverId}`,
      `rez_funding_gap_after:${fundingGapAfter}`,
      "ice_decision_owned_by_corp_defend_servers",
    ],
  };
}

function invocationFor(
  stateIdentity: PlanningStateIdentity,
  candidate: ActionSemanticCandidate,
): CanonicalLegalActionInvocation {
  const targets = candidateTargetIds(candidate);
  return buildCanonicalLegalActionInvocation({
    stateIdentity,
    semanticActionType: candidate.semanticActionType,
    ...(candidate.sourceCardInstanceId
      ? { sourceCardInstanceId: candidate.sourceCardInstanceId }
      : {}),
    ...(targets.length
      ? {
          boundTargets: [
            {
              slotId: "server",
              values: targets.map((id) => ({ kind: "server" as const, id })),
              ordering: "unordered" as const,
            },
          ],
        }
      : {}),
  });
}

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  return [
    ...(candidate.targetContext?.selectedTargets ?? []),
    ...(candidate.targetContext?.availableTargets ?? []),
  ]
    .map((target) => target.targetId)
    .filter((targetId): targetId is string => typeof targetId === "string");
}

function compareDefenseLines(
  left: CorpDefenseTurnPlanningLine,
  right: CorpDefenseTurnPlanningLine,
): number {
  return (
    right.totalValue - left.totalValue ||
    Number(right.rezReadyAfterLine) - Number(left.rezReadyAfterLine) ||
    left.fundingGapAfter - right.fundingGapAfter ||
    left.lineId.localeCompare(right.lineId)
  );
}
