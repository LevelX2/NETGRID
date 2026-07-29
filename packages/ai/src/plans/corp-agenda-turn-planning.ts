import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpScoreProjectSignal } from "./corp-core-plan-modules";
import {
  buildCanonicalLegalActionInvocation,
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type CampaignValueClaim,
  type CanonicalLegalActionInvocation,
  type PlanningRulesContext,
  type PlanningStateIdentity,
} from "./turn-planning-contracts";

export const CORP_AGENDA_TURN_SLICE_VERSION =
  "corp-agenda-turn-slice-v1" as const;

export type CorpAgendaLineFamily = "pure_rush" | "combined_rush" | "safe_setup";

export type CorpAgendaTurnPlanningLine = {
  lineId: string;
  family: CorpAgendaLineFamily;
  opportunityKey: string;
  currentActionId: string;
  nodes: Array<{
    nodeId: string;
    ownerModuleId: "corp.score_agenda" | "corp.defend_servers" | "corp.economy";
    invocation: CanonicalLegalActionInvocation;
    projectedOnly: boolean;
  }>;
  totalClickCost: number;
  totalCreditCost: number;
  remainingClicks: number;
  remainingCredits: number;
  evaluation: {
    agendaProgress: number;
    defense: number;
    economy: number;
    continuity: number;
    risk: number;
    worstCaseFloor: number;
    expectedValue: number;
  };
  campaignQuote: CampaignMilestoneQuote;
  valueClaims: CampaignValueClaim[];
  evidenceCodes: string[];
};

export type CorpAgendaTurnPlanningSlice = {
  schemaVersion: typeof CORP_AGENDA_TURN_SLICE_VERSION;
  opportunityKey: string;
  lines: CorpAgendaTurnPlanningLine[];
  pruned: Array<{ lineId: string; reasonCode: string }>;
  selectedFamily?: CorpAgendaLineFamily;
  selectionReason:
    | "opening_rush_admission"
    | "clear_line_dominance"
    | "best_expected_value"
    | "no_complete_line";
  campaignDisposition:
    | "continue"
    | "await_opponent_outcome"
    | "blocked_replan"
    | "abandon";
  randomizationEligibility?: {
    decisionScope: "opening_rush_posture";
    candidateFamilyKeys: CorpAgendaLineFamily[];
    candidateLineIds: string[];
    maxExpectedRegret: number;
    minimumWorstCaseFloor: number;
    rngDomain: "ai_turn_plan_selection";
    persistsUntil: "opportunity_invalidated";
  };
  evidenceCodes: string[];
};

export function buildCorpAgendaTurnPlanningSlice(params: {
  input: AiDecisionInput;
  project: CorpScoreProjectSignal;
  candidates: readonly ActionSemanticCandidate[];
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
}): CorpAgendaTurnPlanningSlice {
  const opportunityKey =
    params.project.openingRush?.status === "qualified"
      ? params.project.openingRush.quote.opportunityKey
      : `agenda:${params.project.projectId}:${params.stateIdentity.sideSafePlanningFingerprint}`;
  const agenda = exactAgendaHead(params.project, params.candidates);
  if (!agenda) {
    return {
      schemaVersion: CORP_AGENDA_TURN_SLICE_VERSION,
      opportunityKey,
      lines: [],
      pruned: [],
      selectionReason: "no_complete_line",
      campaignDisposition: campaignDisposition(params.input, params.project),
      evidenceCodes: ["agenda_slice_missing_exact_agenda_head"],
    };
  }

  const remoteId = params.project.serverId;
  const remoteIce =
    remoteId && remoteId !== "new_remote"
      ? bestIceInstall(params.candidates, remoteId)
      : undefined;
  const centralIce = ["rd", "hq"]
    .map((serverId) => bestIceInstall(params.candidates, serverId))
    .filter(
      (candidate): candidate is ActionSemanticCandidate =>
        candidate !== undefined,
    )
    .sort(compareCandidateCost)[0];
  const economy = params.candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "economy.gain_credit" &&
        exactCurrentCost(candidate) &&
        (candidate.economyProjection?.netLiquidCreditGain ?? 0) > 0,
    )
    .sort((left, right) => {
      const gain =
        (right.economyProjection?.netLiquidCreditGain ?? 0) -
        (left.economyProjection?.netLiquidCreditGain ?? 0);
      return gain || left.actionId.localeCompare(right.actionId);
    })[0];

  const lineCandidates = [
    createLine(params, {
      family: "pure_rush",
      opportunityKey,
      current: agenda,
      actions: [agenda],
      projectedAdvance: params.input.playerView.own.clicks > clickCost(agenda),
    }),
    ...(remoteIce && centralIce
      ? [
          createLine(params, {
            family: "combined_rush",
            opportunityKey,
            current: agenda,
            actions: [agenda, remoteIce, centralIce],
            projectedAdvance:
              params.input.playerView.own.clicks >
              clickCost(agenda) + clickCost(remoteIce) + clickCost(centralIce),
          }),
        ]
      : []),
    ...(centralIce
      ? [
          createLine(params, {
            family: "safe_setup",
            opportunityKey,
            current: centralIce,
            actions: economy ? [centralIce, economy] : [centralIce],
            projectedAdvance: false,
          }),
        ]
      : []),
  ].filter(
    (line) =>
      line.totalClickCost <= params.input.playerView.own.clicks &&
      line.totalCreditCost <= params.input.playerView.own.credits,
  );
  const pruned: Array<{ lineId: string; reasonCode: string }> = [];
  const lines = lineCandidates.filter((line, index, all) => {
    const dominator = all.find(
      (other, otherIndex) => otherIndex !== index && lineDominates(other, line),
    );
    if (!dominator) return true;
    pruned.push({
      lineId: line.lineId,
      reasonCode: `dominated_by:${dominator.lineId}`,
    });
    return false;
  });
  const rushLines = lines.filter((line) => line.family !== "safe_setup");
  const safeLines = lines.filter((line) => line.family === "safe_setup");
  const bestRush = [...rushLines].sort(compareLineValue)[0];
  const bestSafe = [...safeLines].sort(compareLineValue)[0];
  const maxExpectedRegret = 24;
  const randomizationEligible =
    bestRush !== undefined &&
    bestSafe !== undefined &&
    Math.abs(
      bestRush.evaluation.expectedValue - bestSafe.evaluation.expectedValue,
    ) <= maxExpectedRegret &&
    bestRush.evaluation.worstCaseFloor >= 0 &&
    bestSafe.evaluation.worstCaseFloor >= 0 &&
    params.project.openingRush?.status === "qualified";
  const admittedRush =
    params.project.openingRush?.status === "qualified"
      ? params.project.openingRush.admission
      : undefined;
  const selected =
    randomizationEligible && admittedRush
      ? admittedRush === "accepted"
        ? bestRush
        : bestSafe
      : [...lines].sort(compareLineValue)[0];

  return {
    schemaVersion: CORP_AGENDA_TURN_SLICE_VERSION,
    opportunityKey,
    lines,
    pruned,
    ...(selected ? { selectedFamily: selected.family } : {}),
    selectionReason: randomizationEligible
      ? "opening_rush_admission"
      : lines.length > 1 && pruned.length > 0
        ? "clear_line_dominance"
        : selected
          ? "best_expected_value"
          : "no_complete_line",
    campaignDisposition: campaignDisposition(params.input, params.project),
    ...(randomizationEligible
      ? {
          randomizationEligibility: {
            decisionScope: "opening_rush_posture",
            candidateFamilyKeys: [bestRush.family, bestSafe.family],
            candidateLineIds: [bestRush.lineId, bestSafe.lineId],
            maxExpectedRegret,
            minimumWorstCaseFloor: 0,
            rngDomain: "ai_turn_plan_selection",
            persistsUntil: "opportunity_invalidated",
          },
        }
      : {}),
    evidenceCodes: [
      `agenda_line_count:${lines.length}`,
      `agenda_pruned_count:${pruned.length}`,
      ...(randomizationEligible
        ? ["agenda_rush_randomization_admissible"]
        : ["agenda_rush_randomization_not_admissible"]),
    ],
  };
}

export function campaignDisposition(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
): CorpAgendaTurnPlanningSlice["campaignDisposition"] {
  if (
    project.serverId &&
    project.serverId !== "new_remote" &&
    !input.playerView.servers.some((server) => server.id === project.serverId)
  ) {
    return "abandon";
  }
  if (input.playerView.activeSide === "runner") {
    return "await_opponent_outcome";
  }
  if (
    !project.feasible &&
    (project.fundingGap ?? 0) > 0 &&
    project.openingRush?.status !== "qualified"
  ) {
    return "blocked_replan";
  }
  return "continue";
}

function createLine(
  params: {
    input: AiDecisionInput;
    project: CorpScoreProjectSignal;
    rulesContext: PlanningRulesContext;
    stateIdentity: PlanningStateIdentity;
  },
  line: {
    family: CorpAgendaLineFamily;
    opportunityKey: string;
    current: ActionSemanticCandidate;
    actions: ActionSemanticCandidate[];
    projectedAdvance: boolean;
  },
): CorpAgendaTurnPlanningLine {
  const nodes = line.actions.map((candidate, index) => ({
    nodeId: turnPlanningFingerprint("agenda-line-node", {
      opportunityKey: line.opportunityKey,
      family: line.family,
      index,
      semanticActionType: candidate.semanticActionType,
      sourceCardInstanceId: candidate.sourceCardInstanceId,
      targets: candidateTargetIds(candidate),
    }),
    ownerModuleId: ownerFor(candidate),
    invocation: invocationFor(params.stateIdentity, candidate),
    projectedOnly: index > 0,
  }));
  if (line.projectedAdvance && params.project.agendaInstanceId) {
    const invocation = buildCanonicalLegalActionInvocation({
      stateIdentity: params.stateIdentity,
      semanticActionType: "score.advance_card",
      sourceCardInstanceId: params.project.agendaInstanceId,
      boundTargets: [
        {
          slotId: "card",
          values: [{ kind: "card", id: params.project.agendaInstanceId }],
          ordering: "single",
        },
      ],
    });
    nodes.push({
      nodeId: turnPlanningFingerprint("agenda-line-node", {
        opportunityKey: line.opportunityKey,
        family: line.family,
        index: nodes.length,
        invocationKey: invocation.invocationKey,
      }),
      ownerModuleId: "corp.score_agenda",
      invocation,
      projectedOnly: true,
    });
  }
  const totalClickCost =
    line.actions.reduce((sum, candidate) => sum + clickCost(candidate), 0) +
    (line.projectedAdvance ? 1 : 0);
  const totalCreditCost =
    line.actions.reduce((sum, candidate) => sum + creditCost(candidate), 0) +
    (line.projectedAdvance ? 1 : 0);
  const economyGain = line.actions.reduce(
    (sum, candidate) =>
      sum + (candidate.economyProjection?.netLiquidCreditGain ?? 0),
    0,
  );
  const accessProbability =
    params.project.openingRush?.status === "qualified"
      ? params.project.openingRush.quote.runnerAccessSuccessProbability
      : { numerator: 1, denominator: 2 };
  const accessRisk =
    accessProbability.denominator > 0
      ? accessProbability.numerator / accessProbability.denominator
      : 1;
  const agendaProgress =
    line.family === "safe_setup"
      ? 8
      : 35 +
        Math.max(1, params.project.agendaPoints) * 10 +
        (line.projectedAdvance ? 8 : 0);
  const defense =
    line.family === "combined_rush"
      ? 25
      : line.family === "safe_setup"
        ? 18
        : 6;
  const risk =
    line.family === "safe_setup"
      ? 4
      : Math.round(accessRisk * 40) -
        (line.family === "combined_rush" ? 10 : 0);
  const continuity = line.family === "safe_setup" ? 12 : 16;
  const worstCaseFloor = agendaProgress + defense + economyGain - risk - 12;
  const expectedValue =
    agendaProgress + defense + economyGain + continuity - risk;
  const lineId = turnPlanningFingerprint("agenda-line", {
    opportunityKey: line.opportunityKey,
    family: line.family,
    nodeKeys: nodes.map((node) => node.invocation.invocationKey),
  });
  const beforeQuoteId = turnPlanningFingerprint("agenda-quote-before", {
    opportunityKey: line.opportunityKey,
    state: params.stateIdentity.sideSafePlanningFingerprint,
  });
  const afterQuoteId = turnPlanningFingerprint("agenda-quote-after", {
    lineId,
    nodeKeys: nodes.map((node) => node.invocation.invocationKey),
  });
  const campaignId = `campaign:${params.project.projectId}`;
  const campaignQuote: CampaignMilestoneQuote = {
    quoteId: afterQuoteId,
    campaignId,
    quoteVersion: CORP_AGENDA_TURN_SLICE_VERSION,
    basis: {
      kind: "projected_frame",
      baseStateVersion: params.stateIdentity.stateVersion,
      projectedFrameKey: turnPlanningFingerprint("agenda-projected-frame", {
        lineId,
        remainingClicks: params.input.playerView.own.clicks - totalClickCost,
        remainingCredits:
          params.input.playerView.own.credits - totalCreditCost + economyGain,
      }),
      linePrefixHash: turnPlanningFingerprint(
        "agenda-line-prefix",
        nodes.map((node) => node.invocation.invocationKey),
      ),
    },
    currentMilestoneId: params.project.phase,
    nextMilestoneId:
      line.family === "safe_setup"
        ? "opening_foundation_ready"
        : line.projectedAdvance
          ? "agenda_advanced"
          : "agenda_installed",
    commitment: line.family === "safe_setup" ? "soft" : "hard",
    remainingValue: Math.max(0, expectedValue),
    expiresAt: "next_own_turn",
    revalidationCodes: [
      "agenda_still_present",
      "score_window_still_viable",
      "protection_quote_current",
    ],
  };
  const valueClaims: CampaignValueClaim[] = [
    {
      claimId: `${lineId}:agenda`,
      campaignId,
      ownerModuleId: "corp.score_agenda",
      objectiveKey: campaignId,
      componentKey: "score_window_progress",
      evaluationDimensionId: "agenda_progress",
      aggregationMode: "delta_from_previous_prefix",
      contributionKind: "objective_payoff",
      beforeQuoteId,
      afterQuoteId,
      amount: agendaProgress,
      dependencyKeys: [],
      conflictKeys: [`${campaignId}:score_window_progress`],
      status: "quoted",
    },
    ...(defense > 0
      ? [
          {
            claimId: `${lineId}:defense`,
            campaignId,
            ownerModuleId: "corp.defend_servers" as const,
            objectiveKey: campaignId,
            componentKey: "incremental_protection",
            evaluationDimensionId: "defense",
            aggregationMode: "delta_from_previous_prefix" as const,
            contributionKind: "risk_reduction" as const,
            beforeQuoteId,
            afterQuoteId,
            amount: defense,
            dependencyKeys: [`${campaignId}:score_window_progress`],
            conflictKeys: [`${campaignId}:incremental_protection`],
            status: "quoted" as const,
          },
        ]
      : []),
    ...(economyGain > 0
      ? [
          {
            claimId: `${lineId}:economy`,
            campaignId,
            ownerModuleId: "corp.economy" as const,
            objectiveKey: campaignId,
            componentKey: "net_liquidity_delta",
            evaluationDimensionId: "economy",
            aggregationMode: "delta_from_previous_prefix" as const,
            contributionKind: "funding_gap_reduction" as const,
            beforeQuoteId,
            afterQuoteId,
            amount: economyGain,
            dependencyKeys: [],
            conflictKeys: [`${campaignId}:net_liquidity_delta`],
            status: "quoted" as const,
          },
        ]
      : []),
  ];

  return {
    lineId,
    family: line.family,
    opportunityKey: line.opportunityKey,
    currentActionId: line.current.actionId,
    nodes,
    totalClickCost,
    totalCreditCost,
    remainingClicks: params.input.playerView.own.clicks - totalClickCost,
    remainingCredits:
      params.input.playerView.own.credits - totalCreditCost + economyGain,
    evaluation: {
      agendaProgress,
      defense,
      economy: economyGain,
      continuity,
      risk,
      worstCaseFloor,
      expectedValue,
    },
    campaignQuote,
    valueClaims,
    evidenceCodes: [
      `agenda_line_family:${line.family}`,
      `agenda_line_action_count:${nodes.length}`,
      "agenda_payoff_owned_by_score_root",
      "defense_claim_incremental_only",
      "economy_claim_liquidity_only",
    ],
  };
}

function exactAgendaHead(
  project: CorpScoreProjectSignal,
  candidates: readonly ActionSemanticCandidate[],
): ActionSemanticCandidate | undefined {
  return candidates.find(
    (candidate) =>
      project.phase === "install_agenda" &&
      project.actionIds?.includes(candidate.actionId) === true &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId === project.agendaInstanceId &&
      exactCurrentCost(candidate),
  );
}

function bestIceInstall(
  candidates: readonly ActionSemanticCandidate[],
  serverId: string,
): ActionSemanticCandidate | undefined {
  return candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "install.ice" &&
        candidateTargetIds(candidate).includes(serverId) &&
        exactCurrentCost(candidate),
    )
    .sort(compareCandidateCost)[0];
}

function compareCandidateCost(
  left: ActionSemanticCandidate,
  right: ActionSemanticCandidate,
): number {
  return (
    creditCost(left) - creditCost(right) ||
    clickCost(left) - clickCost(right) ||
    left.actionId.localeCompare(right.actionId)
  );
}

function exactCurrentCost(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    Number.isSafeInteger(candidate.costProfile.clickCost) &&
    Number.isSafeInteger(candidate.costProfile.creditCost) &&
    clickCost(candidate) >= 0 &&
    creditCost(candidate) >= 0
  );
}

function clickCost(candidate: ActionSemanticCandidate): number {
  return candidate.costProfile.clickCost ?? 0;
}

function creditCost(candidate: ActionSemanticCandidate): number {
  return candidate.costProfile.creditCost ?? 0;
}

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  return [
    ...(candidate.targetContext?.selectedTargets ?? []),
    ...(candidate.targetContext?.availableTargets ?? []),
  ]
    .map((target) => target.targetId)
    .filter((targetId): targetId is string => typeof targetId === "string");
}

function invocationFor(
  stateIdentity: PlanningStateIdentity,
  candidate: ActionSemanticCandidate,
): CanonicalLegalActionInvocation {
  const targetIds = candidateTargetIds(candidate);
  return buildCanonicalLegalActionInvocation({
    stateIdentity,
    semanticActionType: candidate.semanticActionType,
    ...(candidate.sourceCardInstanceId
      ? { sourceCardInstanceId: candidate.sourceCardInstanceId }
      : {}),
    ...(candidate.abilityId ? { sourceAbilityId: candidate.abilityId } : {}),
    ...(targetIds.length > 0
      ? {
          boundTargets: [
            {
              slotId: "target",
              values: targetIds.map((id) => ({
                kind:
                  id === "hq" ||
                  id === "rd" ||
                  id === "archives" ||
                  id.startsWith("remote_")
                    ? ("server" as const)
                    : ("value" as const),
                id,
              })),
              ordering: "unordered" as const,
            },
          ],
        }
      : {}),
  });
}

function ownerFor(
  candidate: ActionSemanticCandidate,
): "corp.score_agenda" | "corp.defend_servers" | "corp.economy" {
  if (candidate.semanticActionType === "install.ice")
    return "corp.defend_servers";
  if (candidate.semanticActionType.startsWith("economy."))
    return "corp.economy";
  return "corp.score_agenda";
}

function lineDominates(
  left: CorpAgendaTurnPlanningLine,
  right: CorpAgendaTurnPlanningLine,
): boolean {
  const leftValues = [
    left.evaluation.agendaProgress,
    left.evaluation.defense,
    left.evaluation.economy,
    left.evaluation.continuity,
    left.evaluation.worstCaseFloor,
    left.remainingClicks,
    left.remainingCredits,
    -left.evaluation.risk,
  ];
  const rightValues = [
    right.evaluation.agendaProgress,
    right.evaluation.defense,
    right.evaluation.economy,
    right.evaluation.continuity,
    right.evaluation.worstCaseFloor,
    right.remainingClicks,
    right.remainingCredits,
    -right.evaluation.risk,
  ];
  return (
    leftValues.every((value, index) => value >= rightValues[index]!) &&
    leftValues.some((value, index) => value > rightValues[index]!)
  );
}

function compareLineValue(
  left: CorpAgendaTurnPlanningLine,
  right: CorpAgendaTurnPlanningLine,
): number {
  return (
    right.evaluation.expectedValue - left.evaluation.expectedValue ||
    right.evaluation.worstCaseFloor - left.evaluation.worstCaseFloor ||
    left.lineId.localeCompare(right.lineId)
  );
}
