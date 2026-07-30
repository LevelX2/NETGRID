import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  CorpDefenseSignal,
  CorpEconomyNeedSignal,
  CorpGenericDefenseSignal,
  CorpScoreProtectionDrawSignal,
  CorpScoreProtectionInstallSignal,
  CorpScoreProtectionStagingInstallSignal,
} from "./corp-core-plan-modules";
import type { PriorityClass } from "./plan-assessment";
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
  | "bounded_bluff"
  | "draw_for_ice";

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
  priorityClass?: PriorityClass;
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
  const scoreProtectionStagingInstalls = params.defenseNeeds.filter(
    (signal): signal is CorpScoreProtectionStagingInstallSignal =>
      signal.kind === "score_protection_staging_install" &&
      signal.phase === "install_ice",
  );
  const scoreProtectionInstalls = params.defenseNeeds.filter(
    (signal): signal is CorpScoreProtectionInstallSignal =>
      signal.kind === "score_protection_install" &&
      signal.phase === "install_ice",
  );
  const scoreProtectionDraws = params.defenseNeeds.filter(
    (signal): signal is CorpScoreProtectionDrawSignal =>
      signal.kind === "score_protection_draw" &&
      signal.phase === "draw_for_ice",
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
  for (const signal of scoreProtectionStagingInstalls) {
    const installCandidate = exactScoreProtectionStagingCandidate(
      params.candidates,
      signal,
    );
    if (!installCandidate) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: signal.actionId,
        reasonCode: "exact_score_protection_staging_head_missing",
      });
      continue;
    }
    lines.push(
      createScoreProtectionStagingLine(params, signal, installCandidate),
    );
  }
  for (const signal of scoreProtectionInstalls) {
    const installCandidate = exactScoreProtectionInstallCandidate(
      params.candidates,
      signal,
    );
    if (!installCandidate) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: signal.actionId,
        reasonCode: "exact_score_protection_install_head_missing",
      });
      continue;
    }
    lines.push(
      createScoreProtectionInstallLine(params, signal, installCandidate),
    );
  }
  for (const signal of scoreProtectionDraws) {
    const drawCandidate = exactScoreProtectionDrawCandidate(
      params.candidates,
      signal,
    );
    if (!drawCandidate) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: signal.actionId,
        reasonCode: "exact_score_protection_draw_head_missing",
      });
      continue;
    }
    lines.push(createScoreProtectionDrawLine(params, signal, drawCandidate));
  }
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

function exactScoreProtectionStagingCandidate(
  candidates: readonly ActionSemanticCandidate[],
  signal: CorpScoreProtectionStagingInstallSignal,
): ActionSemanticCandidate | undefined {
  return candidates.find(
    (candidate) =>
      candidate.actionId === signal.actionId &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
      candidate.sourceDefinitionId === signal.sourceDefinitionId &&
      candidateTargetIds(candidate).includes(signal.serverId),
  );
}

function exactScoreProtectionInstallCandidate(
  candidates: readonly ActionSemanticCandidate[],
  signal: CorpScoreProtectionInstallSignal,
): ActionSemanticCandidate | undefined {
  return candidates.find(
    (candidate) =>
      candidate.actionId === signal.actionId &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
      candidate.sourceDefinitionId === signal.sourceDefinitionId &&
      candidateTargetIds(candidate).includes(signal.serverId),
  );
}

function exactScoreProtectionDrawCandidate(
  candidates: readonly ActionSemanticCandidate[],
  signal: CorpScoreProtectionDrawSignal,
): ActionSemanticCandidate | undefined {
  return candidates.find(
    (candidate) =>
      candidate.actionId === signal.actionId &&
      (candidate.semanticActionType === "draw.card" ||
        (candidate.economyProjection?.cardsDrawn ?? 0) > 0),
  );
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
    (route.projection.effect === "satisfied"
      ? 30
      : route.projection.effect === "progress"
        ? 18
        : 0) +
    (route.progressKind === "scoreline_central_tax_allocation" ? 16 : 0) +
    (signal.evidenceCode.includes("visible_agenda_exposure_defense") ? 20 : 0);
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
      ...(route.progressKind
        ? [`defense_progress_kind:${route.progressKind}`]
        : []),
      "ice_decision_owned_by_corp_defend_servers",
    ],
  };
}

function createScoreProtectionStagingLine(
  params: {
    input: AiDecisionInput;
    stateIdentity: PlanningStateIdentity;
  },
  signal: CorpScoreProtectionStagingInstallSignal,
  install: ActionSemanticCandidate,
): CorpDefenseTurnPlanningLine {
  const invocation = invocationFor(params.stateIdentity, install);
  const nodeId = turnPlanningFingerprint("defense-line-node", {
    defenseId: signal.defenseId,
    index: 0,
    invocationKey: invocation.invocationKey,
  });
  const lineId = turnPlanningFingerprint("defense-line", {
    defenseId: signal.defenseId,
    disposition: "stage_for_later_rez",
    nodes: [invocation.invocationKey],
  });
  const legalAction = params.input.legalActions.find(
    (action) => action.actionId === signal.actionId,
  );
  const installCredits =
    legalAction?.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ??
    install.costProfile.creditCost ??
    0;
  const creditsAfterInstall = Math.max(
    0,
    params.input.playerView.own.credits - installCredits,
  );
  const quotedRezCredits =
    legalAction?.payload?.postInstallRezQuoteComplete === true &&
    legalAction.payload.postInstallRezQuoteCardId ===
      signal.sourceCardInstanceId &&
    legalAction.payload.postInstallRezQuoteExpiresAtStateVersion ===
      params.stateIdentity.stateVersion &&
    typeof legalAction.payload.postInstallRezQuoteFinalCredits === "number"
      ? legalAction.payload.postInstallRezQuoteFinalCredits
      : undefined;
  const fundingGapAfter =
    quotedRezCredits === undefined
      ? 0
      : Math.max(0, quotedRezCredits - creditsAfterInstall);
  const rezReadyAfterLine =
    quotedRezCredits !== undefined && fundingGapAfter === 0;
  const defenseValue = rezReadyAfterLine ? 18 : 12;
  const totalValue = defenseValue - fundingGapAfter * 3;
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
      linePrefixHash: turnPlanningFingerprint("defense-prefix", [
        invocation.invocationKey,
      ]),
    },
    currentMilestoneId: signal.phase,
    nextMilestoneId: rezReadyAfterLine
      ? "score_remote_ice_staged_rez_ready"
      : "score_remote_ice_staged_for_later_rez",
    commitment: "soft",
    remainingValue: Math.max(0, totalValue),
    expiresAt: "next_own_turn",
    revalidationCodes: [
      "parent_score_project_still_current",
      "parent_protection_need_still_current",
      "staged_ice_still_installed",
      "rez_quote_current",
    ],
  };
  const valueClaims: CampaignValueClaim[] = [
    {
      claimId: `${lineId}:defense`,
      campaignId,
      ownerModuleId: "corp.defend_servers",
      objectiveKey: `score-protection:${signal.parentProjectId}`,
      componentKey: "staged_remote_defense",
      evaluationDimensionId: "defense",
      aggregationMode: "delta_from_previous_prefix",
      contributionKind: "risk_reduction",
      beforeQuoteId,
      afterQuoteId,
      amount: defenseValue,
      dependencyKeys: [signal.parentNeedId],
      conflictKeys: [`server:new_remote:ice:${signal.sourceCardInstanceId}`],
      status: "quoted",
    },
  ];
  return {
    lineId,
    defenseId: signal.defenseId,
    targetServerId: signal.serverId,
    disposition: "stage_for_later_rez",
    currentActionId: signal.actionId,
    nodes: [
      {
        nodeId,
        ownerModuleId: "corp.defend_servers",
        invocation,
        projectedOnly: false,
      },
    ],
    fundingGapBefore: fundingGapAfter,
    fundingGapAfter,
    rezReadyAfterLine,
    bluffValue: 0,
    defenseValue,
    economyValue: 0,
    totalValue,
    priorityClass: signal.delegatedPriorityClass,
    campaignQuote,
    valueClaims,
    evidenceCodes: [
      "defense_disposition:stage_for_later_rez",
      "defense_target:new_remote",
      `rez_funding_gap_after:${fundingGapAfter}`,
      signal.evidenceCode,
      `score_protection_parent:${signal.parentProjectId}`,
      `score_protection_need:${signal.parentNeedId}`,
      "score_protection_staging_delegated_to_defense_plan",
      "ice_decision_owned_by_corp_defend_servers",
    ],
  };
}

function createScoreProtectionInstallLine(
  params: {
    input: AiDecisionInput;
    stateIdentity: PlanningStateIdentity;
  },
  signal: CorpScoreProtectionInstallSignal,
  install: ActionSemanticCandidate,
): CorpDefenseTurnPlanningLine {
  const genericSignal: CorpGenericDefenseSignal = {
    kind: "generic",
    defenseId: signal.defenseId,
    serverId: signal.serverId,
    phase: "install_ice",
    sourceDefinitionIds: [signal.sourceDefinitionId],
    actionIds: [signal.actionId],
    urgent:
      signal.delegatedPriorityClass === "P1" ||
      signal.delegatedPriorityClass === "P2",
    installRoute: {
      disposition: "productive",
      progressKind: "engine_certified_access",
      rezFundingGap: 0,
      projection: signal.projection,
    },
    value: signal.effect === "satisfied" ? 30 : 18,
    evidenceCode: signal.evidenceCode,
  };
  const line = createDefenseLine(params, genericSignal, install, undefined, {
    disposition: signal.projection.funded
      ? "install_rez_ready"
      : "stage_for_later_rez",
    bluffValue: 0,
  });
  return {
    ...line,
    priorityClass: signal.delegatedPriorityClass,
    valueClaims: line.valueClaims.map((claim) =>
      claim.ownerModuleId === "corp.defend_servers"
        ? {
            ...claim,
            objectiveKey: `score-protection:${signal.parentProjectId}`,
            dependencyKeys: [signal.parentNeedId],
          }
        : claim,
    ),
    evidenceCodes: [
      ...line.evidenceCodes,
      signal.evidenceCode,
      `score_protection_parent:${signal.parentProjectId}`,
      `score_protection_need:${signal.parentNeedId}`,
      "score_protection_install_delegated_to_defense_plan",
    ],
  };
}

function createScoreProtectionDrawLine(
  params: {
    input: AiDecisionInput;
    stateIdentity: PlanningStateIdentity;
  },
  signal: CorpScoreProtectionDrawSignal,
  draw: ActionSemanticCandidate,
): CorpDefenseTurnPlanningLine {
  const invocation = invocationFor(params.stateIdentity, draw);
  const nodeId = turnPlanningFingerprint("defense-line-node", {
    defenseId: signal.defenseId,
    index: 0,
    invocationKey: invocation.invocationKey,
  });
  const lineId = turnPlanningFingerprint("defense-line", {
    defenseId: signal.defenseId,
    disposition: "draw_for_ice",
    nodes: [invocation.invocationKey],
  });
  const economyValue =
    Math.max(0, draw.economyProjection?.netLiquidCreditGain ?? 0) * 2;
  const defenseValue = 12;
  const totalValue = defenseValue + economyValue;
  const campaignId = "campaign:corp.defend_servers";
  const beforeQuoteId = turnPlanningFingerprint("defense-before", {
    defenseId: signal.defenseId,
    state: params.stateIdentity.sideSafePlanningFingerprint,
  });
  const afterQuoteId = turnPlanningFingerprint("defense-after", {
    lineId,
    observationBoundary: "own_draw_identity",
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
        observationBoundary: "own_draw_identity",
      }),
      linePrefixHash: turnPlanningFingerprint("defense-prefix", [
        invocation.invocationKey,
      ]),
    },
    currentMilestoneId: signal.phase,
    nextMilestoneId: "replan_after_score_protection_draw",
    commitment:
      signal.delegatedPriorityClass === "P1" ||
      signal.delegatedPriorityClass === "P2"
        ? "hard"
        : "soft",
    remainingValue: totalValue,
    expiresAt: "current_turn_end",
    revalidationCodes: [
      "own_draw_resolved",
      "replan_remaining_turn_after_private_observation",
      "parent_score_project_still_current",
      "parent_protection_need_still_current",
    ],
  };
  return {
    lineId,
    defenseId: signal.defenseId,
    targetServerId: signal.serverId,
    disposition: "draw_for_ice",
    currentActionId: signal.actionId,
    nodes: [
      {
        nodeId,
        ownerModuleId: "corp.defend_servers",
        invocation,
        projectedOnly: false,
      },
    ],
    fundingGapBefore: 0,
    fundingGapAfter: 0,
    rezReadyAfterLine: false,
    bluffValue: 0,
    defenseValue,
    economyValue,
    totalValue,
    priorityClass: signal.delegatedPriorityClass,
    campaignQuote,
    valueClaims: [
      {
        claimId: `${lineId}:defense`,
        campaignId,
        ownerModuleId: "corp.defend_servers",
        objectiveKey: `score-protection:${signal.parentProjectId}`,
        componentKey: "ice_search_opportunity",
        evaluationDimensionId: "defense",
        aggregationMode: "delta_from_previous_prefix",
        contributionKind: "option_preservation",
        beforeQuoteId,
        afterQuoteId,
        amount: defenseValue,
        dependencyKeys: [signal.parentNeedId],
        conflictKeys: [`score-protection-draw:${signal.parentProjectId}`],
        status: "quoted",
      },
    ],
    evidenceCodes: [
      "defense_disposition:draw_for_ice",
      `defense_target:${signal.serverId}`,
      signal.evidenceCode,
      `score_protection_parent:${signal.parentProjectId}`,
      `score_protection_need:${signal.parentNeedId}`,
      "observation_boundary_after_draw",
      "score_protection_draw_delegated_to_defense_plan",
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
