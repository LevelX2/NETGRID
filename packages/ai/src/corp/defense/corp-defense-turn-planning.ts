import { assessCorpTerminalAgendaDefense } from "./corp-terminal-agenda-defense";
import { exactBasicLiquidCreditCandidate } from "../../actions/action-candidate-facts";
import { corpEconomyCandidateHasExecutablePayload } from "../economy/economy-routes";
import type { CorpEconomyNeedSignal } from "../economy/economy-types";
import type {
  CorpDefenseSignal,
  CorpGenericDefenseSignal,
  CorpScoreProtectionDrawSignal,
  CorpScoreProtectionInstallSignal,
  CorpScoreProtectionStagingInstallSignal,
} from "../../plans/corp-defense-contracts";
import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";

import type { PriorityClass } from "../../plans/plan-assessment";
import { corpGenericDefensePriorityClass } from "../../plans/corp-defense-funding-contract";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { assessFundingOnlyIceStaging } from "./corp-defense-staging-policy";
import { hasExactNonNegativeCostProfile } from "../../runtime/exact-action-cost-facts";
export { assessFundingOnlyIceStaging } from "./corp-defense-staging-policy";
import {
  buildCanonicalLegalActionInvocation,
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type CampaignValueClaim,
  type CanonicalLegalActionInvocation,
  type PlanningStateIdentity,
} from "../../plans/turn-planning-contracts";

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
  /** Exact authority for this line's current provider node. */
  supportBinding?: {
    parentPlanInstanceId: string;
    parentNeedId: string;
  };
  disposition: CorpDefenseLineDisposition;
  currentActionId: string;
  nodes: Array<{
    nodeId: string;
    ownerModuleId: "corp.defend_servers" | "corp.economy";
    planInstanceId: string;
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
  const genericDraws = params.defenseNeeds.filter(
    (signal): signal is CorpGenericDefenseSignal =>
      signal.kind === "generic" && signal.phase === "draw_for_ice",
  );
  const productiveExists = genericInstalls.some(
    (signal) =>
      signal.installRoute?.disposition === "productive" &&
      exactInstallCandidate(params, signal) !== undefined,
  );
  const rejected: CorpDefenseTurnPlanningSlice["rejected"] = [];
  const lines = genericInstalls.flatMap((signal) => {
    const route = signal.installRoute!;
    const installCandidate = exactInstallCandidate(params, signal);
    if (!installCandidate) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: route.projection.actionId,
        reasonCode: "exact_install_head_missing",
      });
      return [];
    }
    const fundingSignal = exactDefenseFundingNeed(signal, params.economyNeeds);
    const fundingAlternatives = fundingSignal
      ? params.candidates.flatMap((candidate) => {
          const quote = exactDefenseFundingQuote(
            params.input,
            candidate,
            fundingSignal,
          );
          return quote ? [{ candidate, ...quote }] : [];
        })
      : [];
    const fundingHead =
      fundingSignal &&
      fundingAlternatives
        .filter(
          ({ gain, clickCost }) =>
            gain >= fundingSignal.gap &&
            clickCost + route.projection.installClicks <=
              params.input.playerView.own.clicks,
        )
        .sort((left, right) =>
          left.candidate.actionId.localeCompare(right.candidate.actionId),
        )[0];
    const fundingNeed =
      fundingSignal && fundingHead
        ? { signal: fundingSignal, candidate: fundingHead.candidate }
        : undefined;
    if (
      route.disposition === "productive" &&
      !route.projection.funded &&
      fundingNeed
    ) {
      return [
        createDefenseLine(params, signal, installCandidate, fundingNeed, {
          disposition: "fund_then_install",
          bluffValue: 0,
        }),
      ];
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

    if (fundingNeed) {
      return [
        createDefenseLine(params, signal, installCandidate, fundingNeed, {
          disposition: "fund_then_install",
          bluffValue: 0,
        }),
      ];
    }
    const staging = assessFundingOnlyIceStaging({
      input: params.input,
      signal,
      productiveAlternativeExists: productiveExists,
      fundingAlternativeExists: fundingAlternatives.length > 0,
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
    const installCandidate = exactBoundDefenseInstallCandidate(params, signal);
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
    const installCandidate = exactBoundDefenseInstallCandidate(params, signal);
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
    lines.push(createDefenseDrawLine(params, signal, drawCandidate));
  }
  for (const signal of genericDraws) {
    const drawCandidate = params.candidates.find(
      (candidate) =>
        signal.actionIds?.includes(candidate.actionId) &&
        candidate.semanticActionType === "draw.card" &&
        candidate.costProfile.costKnownStatus === "known" &&
        hasExactNonNegativeCostProfile(candidate),
    );
    if (!drawCandidate) {
      rejected.push({
        defenseId: signal.defenseId,
        reasonCode: "exact_draw_head_missing",
      });
      continue;
    }
    lines.push(createDefenseDrawLine(params, signal, drawCandidate));
  }
  for (const signal of params.defenseNeeds) {
    if (signal.kind !== "score_protection_terminal_install") continue;
    const quote = assessCorpTerminalAgendaDefense(
      params.input,
      signal.serverId,
      signal.parentProjectId,
    );
    const install = quote?.install;
    const candidate =
      install?.actionId === signal.actionId
        ? exactBoundDefenseInstallCandidate(params, {
            ...install,
            serverId: signal.serverId,
          })
        : undefined;
    if (!candidate || !quote) {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: signal.actionId,
        reasonCode: "terminal_protection_quote_drift",
      });
      continue;
    }
    const invocation = invocationFor(
      params.stateIdentity,
      candidate,
      signal.serverId,
    );
    const lineId = turnPlanningFingerprint("terminal-defense-line", {
      defenseId: signal.defenseId,
      invocation,
    });
    const fundingGapAfter = quote.preparationCreditClicks;
    const probability = quote.best.protection.runnerAccessSuccessProbability;
    const baseline = quote.need.baseline;
    if (baseline.knowledge !== "known") {
      rejected.push({
        defenseId: signal.defenseId,
        actionId: signal.actionId,
        reasonCode: "terminal_protection_baseline_unknown",
      });
      continue;
    }
    const beforeProbability =
      baseline.protection.runnerAccessSuccessProbability;
    const defenseValue =
      30 *
      Math.max(
        0,
        beforeProbability.numerator / beforeProbability.denominator -
          probability.numerator / probability.denominator,
      );
    const campaignId = "campaign:corp.defend_servers";
    lines.push({
      lineId,
      defenseId: signal.defenseId,
      targetServerId: signal.serverId,
      supportBinding: {
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: signal.parentProjectId,
        }),
        parentNeedId: signal.parentNeedId,
      },
      disposition:
        fundingGapAfter > 0 ? "stage_for_later_rez" : "install_rez_ready",
      currentActionId: signal.actionId,
      nodes: [
        {
          nodeId: `${lineId}:install`,
          ownerModuleId: "corp.defend_servers",
          planInstanceId: planInstanceIdForProposal({
            moduleId: "corp.defend_servers",
            dedupeKey: "server-defense-portfolio",
          }),
          invocation,
          projectedOnly: false,
        },
      ],
      fundingGapBefore: fundingGapAfter,
      fundingGapAfter,
      rezReadyAfterLine: fundingGapAfter === 0,
      bluffValue: 0,
      defenseValue,
      economyValue: 0,
      totalValue: defenseValue,
      priorityClass: signal.delegatedPriorityClass,
      campaignQuote: {
        quoteId: `${lineId}:after`,
        campaignId,
        quoteVersion: CORP_DEFENSE_TURN_SLICE_VERSION,
        basis: {
          kind: "projected_frame",
          baseStateVersion: params.stateIdentity.stateVersion,
          projectedFrameKey: turnPlanningFingerprint("terminal-defense-frame", {
            lineId,
            parent: signal.parentProjectId,
            need: signal.parentNeedId,
          }),
          linePrefixHash: turnPlanningFingerprint("defense-prefix", [
            invocation.invocationKey,
          ]),
        },
        currentMilestoneId: signal.phase,
        nextMilestoneId: "revalidate_terminal_defense_budget",
        commitment: "hard",
        remainingValue: defenseValue,
        expiresAt: "current_turn_end",
        revalidationCodes: [
          "parent_score_project_still_current",
          "parent_protection_need_still_current",
          "recompute_funded_ice_subset",
        ],
      },
      valueClaims: [
        {
          claimId: `${lineId}:defense`,
          campaignId,
          ownerModuleId: "corp.defend_servers",
          objectiveKey: `score-protection:${signal.parentProjectId}`,
          componentKey: "terminal_access_prevention",
          evaluationDimensionId: "defense",
          aggregationMode: "delta_from_previous_prefix",
          contributionKind: "risk_reduction",
          beforeQuoteId: `${lineId}:before`,
          afterQuoteId: `${lineId}:after`,
          amount: defenseValue,
          dependencyKeys: [signal.parentNeedId],
          conflictKeys: [`server:${signal.serverId}:defense`],
          status: "quoted",
        },
      ],
      evidenceCodes: [
        signal.evidenceCode,
        `score_protection_parent:${signal.parentProjectId}`,
        `score_protection_need:${signal.parentNeedId}`,
        `rez_funding_gap_after:${fundingGapAfter}`,
        "ice_decision_owned_by_corp_defend_servers",
      ],
    });
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

function exactBoundDefenseInstallCandidate(
  params: {
    input: AiDecisionInput;
    candidates: readonly ActionSemanticCandidate[];
  },
  binding: {
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    serverId: string;
    placement?: "ice" | "root";
  },
): ActionSemanticCandidate | undefined {
  const action = params.input.legalActions.find(
    (entry) => entry.actionId === binding.actionId,
  );
  if (
    action?.type !== "install_card" ||
    action.side !== "corp" ||
    action.timingPoint !== params.input.playerView.timingPoint ||
    action.expiresAtStateVersion !== params.input.playerView.stateVersion ||
    action.source !== binding.sourceCardInstanceId ||
    action.payload?.placement !== (binding.placement ?? "ice") ||
    action.payload.cardId !== binding.sourceCardInstanceId ||
    action.payload.serverId !== binding.serverId
  )
    return undefined;
  return params.candidates.find(
    (candidate) =>
      candidate.actionId === binding.actionId &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId === binding.sourceCardInstanceId &&
      candidate.sourceDefinitionId === binding.sourceDefinitionId &&
      candidate.targetContext?.selectedTargets.some(
        (target) =>
          target.targetKind === "server" &&
          target.targetId === binding.serverId,
      ) === true &&
      candidate.targetContext.selectedTargets.every(
        (target) =>
          target.targetKind !== "server" ||
          target.targetId === binding.serverId,
      ),
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
  params: Parameters<typeof exactBoundDefenseInstallCandidate>[0],
  signal: CorpGenericDefenseSignal,
): ActionSemanticCandidate | undefined {
  const projection = signal.installRoute?.projection;
  if (!projection || projection.targetServerId !== signal.serverId)
    return undefined;
  return exactBoundDefenseInstallCandidate(params, {
    actionId: projection.actionId,
    sourceCardInstanceId: projection.sourceCardInstanceId,
    sourceDefinitionId: projection.sourceDefinitionId,
    serverId: signal.serverId,
  });
}

type ParentFunding = Extract<CorpEconomyNeedSignal, { kind: "parent_funding" }>;

function exactDefenseFundingNeed(
  signal: CorpGenericDefenseSignal,
  economyNeeds: readonly CorpEconomyNeedSignal[],
): ParentFunding | undefined {
  const projection = signal.installRoute?.projection;
  if (!projection) return undefined;
  const gap =
    projection.after.minimumAdditionalCreditsToSatisfy ??
    signal.installRoute?.rezFundingGap;
  if (!Number.isSafeInteger(gap) || gap! <= 0) return undefined;
  const expectedNeedId = `defense-reserve:${signal.serverId}:${projection.sourceCardInstanceId}`;
  return economyNeeds.find(
    (need): need is ParentFunding =>
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
}

function exactDefenseFundingQuote(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  funding: ParentFunding,
): { gain: number; clickCost: number } | undefined {
  const projection = candidate.economyProjection;
  const gain = projection?.netLiquidCreditGain;
  const clickCost = projection?.clickCost;
  if (
    !funding.actionIds.includes(candidate.actionId) ||
    candidate.semanticActionType !== "economy.gain_credit" ||
    projection?.kind !== "immediate_liquid" ||
    projection.timing !== "immediate" ||
    projection.creditRestriction !== "general" ||
    projection.reliability !== "guaranteed" ||
    typeof clickCost !== "number" ||
    !Number.isSafeInteger(clickCost) ||
    clickCost < 0 ||
    clickCost > input.playerView.own.clicks ||
    typeof gain !== "number" ||
    !Number.isSafeInteger(gain) ||
    gain <= 0 ||
    !(
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high") ||
      exactBasicLiquidCreditCandidate(candidate)
    ) ||
    !corpEconomyCandidateHasExecutablePayload(input, candidate)
  )
    return undefined;
  return { gain, clickCost };
}

function createDefenseLine(
  params: {
    input: AiDecisionInput;
    stateIdentity: PlanningStateIdentity;
  },
  signal: CorpGenericDefenseSignal,
  install: ActionSemanticCandidate,
  funding:
    | {
        signal: Extract<CorpEconomyNeedSignal, { kind: "parent_funding" }>;
        candidate: ActionSemanticCandidate;
      }
    | undefined,
  classification: {
    disposition: CorpDefenseLineDisposition;
    bluffValue: number;
  },
): CorpDefenseTurnPlanningLine {
  if (
    signal.parentKind === "remote" &&
    (!signal.parentProjectId?.trim() || !signal.parentNeedId?.trim())
  )
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: params.input.side,
      stateVersion: params.input.playerView.stateVersion,
      timingPoint: params.input.playerView.timingPoint,
      legalActionTypes: params.input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "A parent-bound remote defense line requires its exact current project and need.",
    });
  const route = signal.installRoute!;
  const fundingCandidate = funding?.candidate;
  const ordered = fundingCandidate ? [fundingCandidate, install] : [install];
  const defensePlanInstanceId = planInstanceIdForProposal({
    moduleId: "corp.defend_servers",
    dedupeKey: "server-defense-portfolio",
  });
  const fundingPlanInstanceId = funding
    ? planInstanceIdForProposal({
        moduleId: "corp.economy",
        dedupeKey: funding.signal.needId,
      })
    : undefined;
  const nodes = ordered.map((candidate, index) => {
    const ownerModuleId =
      candidate === fundingCandidate
        ? ("corp.economy" as const)
        : ("corp.defend_servers" as const);
    const planInstanceId =
      candidate === fundingCandidate
        ? fundingPlanInstanceId!
        : defensePlanInstanceId;
    const invocation = invocationFor(
      params.stateIdentity,
      candidate,
      candidate === install ? signal.serverId : undefined,
    );
    return {
      nodeId: turnPlanningFingerprint("defense-line-node", {
        defenseId: signal.defenseId,
        index,
        invocationKey: invocation.invocationKey,
      }),
      ownerModuleId,
      planInstanceId,
      invocation,
      projectedOnly: index > 0,
    };
  });
  const fundingGain =
    fundingCandidate?.economyProjection?.netLiquidCreditGain ?? 0;
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
    (signal.visibleAgendaExposureDefense ? 20 : 0);
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
    ...(funding
      ? {
          supportBinding: {
            parentPlanInstanceId: funding.signal.parentPlanInstanceId!,
            parentNeedId: funding.signal.parentNeedId!,
          },
        }
      : signal.parentKind === "remote"
        ? {
            supportBinding: {
              parentPlanInstanceId: planInstanceIdForProposal({
                moduleId: "corp.establish_scoring_remote",
                dedupeKey: signal.parentProjectId!,
              }),
              parentNeedId: signal.parentNeedId!,
            },
          }
        : {}),
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
    priorityClass: corpGenericDefensePriorityClass([signal]),
    campaignQuote,
    valueClaims,
    evidenceCodes: [
      `defense_disposition:${classification.disposition}`,
      `defense_target:${signal.serverId}`,
      `rez_funding_gap_after:${fundingGapAfter}`,
      ...(route.progressKind
        ? [`defense_progress_kind:${route.progressKind}`]
        : []),
      ...(fundingPlanInstanceId
        ? [`defense_funding_support_instance:${fundingPlanInstanceId}`]
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
  const invocation = invocationFor(
    params.stateIdentity,
    install,
    signal.serverId,
  );
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
  const mandatoryAgendaPoints =
    legalAction?.payload?.postInstallRezQuoteMandatoryAgendaPointCost;
  if (
    !legalAction ||
    legalAction.expiresAtStateVersion !== params.stateIdentity.stateVersion ||
    legalAction.payload?.postInstallRezQuoteTargetServerId !==
      signal.serverId ||
    !Number.isSafeInteger(quotedRezCredits) ||
    Number(quotedRezCredits) < 0 ||
    !Number.isSafeInteger(mandatoryAgendaPoints) ||
    Number(mandatoryAgendaPoints) < 0 ||
    legalAction.payload.postInstallRezQuoteMandatoryAdditionalCostKind !==
      (Number(mandatoryAgendaPoints) > 0 ? "agenda_point" : undefined)
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: params.input.side,
      stateVersion: params.input.playerView.stateVersion,
      timingPoint: params.input.playerView.timingPoint,
      legalActionTypes: params.input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "A score-protection staging line requires its current source/target-bound complete Engine credit and mandatory agenda-point quote.",
    });
  }
  const rezReadyAfterLine =
    quotedRezCredits !== undefined &&
    fundingGapAfter === 0 &&
    Number(mandatoryAgendaPoints) <= params.input.playerView.own.agendaPoints;
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
    supportBinding: {
      parentPlanInstanceId: planInstanceIdForProposal({
        moduleId: "corp.score_agenda",
        dedupeKey: signal.parentProjectId,
      }),
      parentNeedId: signal.parentNeedId,
    },
    disposition: "stage_for_later_rez",
    currentActionId: signal.actionId,
    nodes: [
      {
        nodeId,
        ownerModuleId: "corp.defend_servers",
        planInstanceId: planInstanceIdForProposal({
          moduleId: "corp.defend_servers",
          dedupeKey: "server-defense-portfolio",
        }),
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
    supportBinding: {
      parentPlanInstanceId: planInstanceIdForProposal({
        moduleId: "corp.score_agenda",
        dedupeKey: signal.parentProjectId,
      }),
      parentNeedId: signal.parentNeedId,
    },
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

function createDefenseDrawLine(
  params: {
    input: AiDecisionInput;
    stateIdentity: PlanningStateIdentity;
  },
  signal: CorpScoreProtectionDrawSignal | CorpGenericDefenseSignal,
  draw: ActionSemanticCandidate,
): CorpDefenseTurnPlanningLine {
  const binding =
    signal.kind === "score_protection_draw"
      ? {
          parentPlanInstanceId: planInstanceIdForProposal({
            moduleId: "corp.score_agenda",
            dedupeKey: signal.parentProjectId,
          }),
          parentNeedId: signal.parentNeedId,
        }
      : undefined;
  const priorityClass =
    signal.kind === "score_protection_draw"
      ? signal.delegatedPriorityClass
      : corpGenericDefensePriorityClass([signal]);
  const objectiveKey =
    signal.kind === "score_protection_draw"
      ? `score-protection:${signal.parentProjectId}`
      : `server:${signal.serverId}:defense-discovery`;
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
    nextMilestoneId: binding
      ? "replan_after_score_protection_draw"
      : "replan_after_defense_draw",
    commitment:
      priorityClass === "P1" || priorityClass === "P2" ? "hard" : "soft",
    remainingValue: totalValue,
    expiresAt: "current_turn_end",
    revalidationCodes: [
      "own_draw_resolved",
      "replan_remaining_turn_after_private_observation",
      ...(binding
        ? [
            "parent_score_project_still_current",
            "parent_protection_need_still_current",
          ]
        : ["central_defense_need_still_current"]),
    ],
  };
  return {
    lineId,
    defenseId: signal.defenseId,
    targetServerId: signal.serverId,
    ...(binding ? { supportBinding: binding } : {}),
    disposition: "draw_for_ice",
    currentActionId: draw.actionId,
    nodes: [
      {
        nodeId,
        ownerModuleId: "corp.defend_servers",
        planInstanceId: planInstanceIdForProposal({
          moduleId: "corp.defend_servers",
          dedupeKey: "server-defense-portfolio",
        }),
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
    priorityClass,
    campaignQuote,
    valueClaims: [
      {
        claimId: `${lineId}:defense`,
        campaignId,
        ownerModuleId: "corp.defend_servers",
        objectiveKey,
        componentKey: "ice_search_opportunity",
        evaluationDimensionId: "defense",
        aggregationMode: "delta_from_previous_prefix",
        contributionKind: "option_preservation",
        beforeQuoteId,
        afterQuoteId,
        amount: defenseValue,
        dependencyKeys: binding ? [binding.parentNeedId] : [],
        conflictKeys: [
          signal.kind === "score_protection_draw"
            ? `score-protection-draw:${signal.parentProjectId}`
            : `server:${signal.serverId}:defense-draw`,
        ],
        status: "quoted",
      },
    ],
    evidenceCodes: [
      "defense_disposition:draw_for_ice",
      `defense_target:${signal.serverId}`,
      signal.evidenceCode,
      ...(signal.kind === "score_protection_draw"
        ? [
            `score_protection_parent:${signal.parentProjectId}`,
            `score_protection_need:${signal.parentNeedId}`,
          ]
        : []),
      "observation_boundary_after_draw",
      binding
        ? "score_protection_draw_delegated_to_defense_plan"
        : "generic_defense_draw_owned_by_defense_plan",
    ],
  };
}

function invocationFor(
  stateIdentity: PlanningStateIdentity,
  candidate: ActionSemanticCandidate,
  exactServerId?: string,
): CanonicalLegalActionInvocation {
  const targets = exactServerId
    ? [exactServerId]
    : (candidate.targetContext?.selectedTargets ?? [])
        .filter((target) => target.targetKind === "server")
        .map((target) => target.targetId);
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
