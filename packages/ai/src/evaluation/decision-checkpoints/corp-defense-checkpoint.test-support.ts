import type { AiDecisionInput } from "@netgrid/shared";

import type {
  ActionSemanticCandidate,
  LegalTarget,
} from "../../action-semantic-candidate-types";
import type {
  CorpCorePlanDomain,
  CorpDefenseSignal,
} from "../../plans/corp-core-plan-modules";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import type { KnownCorpFundedIceInstallRouteProjection } from "../../runtime/corp-funded-score-protection";

export function checkpointDefenseCandidate(
  actionId: string,
  serverId: string,
  sourceCardInstanceId: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: [],
    },
    stateVersion: 60,
    sourceKind: "card",
    sourceDefinitionId: `generic-defense-${sourceCardInstanceId}`,
    sourceCardInstanceId,
    abilityBindingMethod: "unresolved",
    semanticActionType: "install.card",
    visibilityScope: "actor_private",
    targetContext: checkpointTargetContext(serverId, "server"),
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 60,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

export function checkpointInstallDefenseSignal(params: {
  candidate: ActionSemanticCandidate;
  serverId: string;
  effect: "progress" | "satisfied";
  accessProbability: { numerator: number; denominator: number };
  runnerCreditsRemaining: number;
  totalCredits: number;
  urgent?: boolean;
  centralPressure?: "material" | "acute" | "terminal";
}): CorpDefenseSignal {
  return {
    kind: "generic",
    defenseId: `checkpoint-defense:${params.serverId}:${params.candidate.actionId}`,
    serverId: params.serverId,
    phase: "install_ice",
    sourceDefinitionIds: [params.candidate.sourceDefinitionId!],
    actionIds: [params.candidate.actionId],
    urgent: params.urgent ?? false,
    ...(params.centralPressure
      ? { centralPressure: params.centralPressure }
      : {}),
    installRoute: {
      disposition: "productive",
      progressKind: "engine_certified_access",
      rezFundingGap: 0,
      projection: checkpointInstallProjection({
        candidate: params.candidate,
        targetServerId: params.serverId,
        effect: params.effect,
        accessProbability: params.accessProbability,
        runnerCreditsRemaining: params.runnerCreditsRemaining,
        totalCredits: params.totalCredits,
      }),
    },
    value: params.effect === "satisfied" ? 20 : 10,
    evidenceCode: `checkpoint_engine_certified_defense:${params.serverId}`,
  };
}

export function checkpointRemoteSupportSignal(params: {
  candidate: ActionSemanticCandidate;
  parentNeedId: string;
  value: number;
  accessProbability?: { numerator: number; denominator: number };
  runnerCreditsRemaining?: number;
}): CorpDefenseSignal {
  return {
    kind: "generic",
    defenseId: `checkpoint-remote-support:${params.candidate.actionId}`,
    serverId: "remote_1",
    phase: "install_defense_support",
    sourceDefinitionIds: [params.candidate.sourceDefinitionId!],
    parentKind: "remote",
    parentProjectId: "strategic-score-remote",
    parentNeedId: params.parentNeedId,
    sourceCardInstanceId: params.candidate.sourceCardInstanceId!,
    actionIds: [params.candidate.actionId],
    urgent: false,
    installRoute: {
      disposition: "productive",
      progressKind: "engine_certified_access",
      rezFundingGap: 0,
      projection: checkpointInstallProjection({
        candidate: params.candidate,
        targetServerId: "remote_1",
        effect: "progress",
        accessProbability: params.accessProbability ?? {
          numerator: 1,
          denominator: 3,
        },
        runnerCreditsRemaining: params.runnerCreditsRemaining ?? 2,
        totalCredits: 0,
      }),
    },
    value: params.value,
    evidenceCode: `checkpoint_remote_support:${params.candidate.actionId}`,
  };
}

export function checkpointRemoteProject(
  parentNeedId: string,
): CorpCorePlanDomain["remoteProjects"][number] {
  return {
    projectId: "strategic-score-remote",
    purpose: "scoring_remote",
    purposes: ["scoreline"],
    target: {
      status: "bound",
      serverId: "remote_1",
      targetBindingRevision: 4,
    },
    serverId: "remote_1",
    protectionTarget: "taxing",
    buildTiming: "prebuild",
    targetRecoveryTurns: 2,
    phase: "harden_to_protection_target",
    maturity: {
      knowledge: "unknown",
      observedAtStateVersion: 60,
      unknownReasons: ["checkpoint_uses_bound_parent_need"],
    },
    need: {
      needId: parentNeedId,
      parentProjectId: "strategic-score-remote",
      targetServerId: "remote_1",
      observedAtStateVersion: 60,
      capability: "improve_remote_protection_path",
      minimum: 1,
    },
    cadence: {
      turnKey: "corp:decision-checkpoint",
      maximumActions: 1,
      actionsUsed: 0,
      open: true,
    },
    feasible: true,
    value: 20,
    evidenceCode: "remote_protection_below_target:remote_1",
  };
}

export function checkpointDefenseContext(params: {
  candidates: ActionSemanticCandidate[];
  defenseNeeds: CorpDefenseSignal[];
  remoteProjects?: CorpCorePlanDomain["remoteProjects"];
  centralDefenseAllocation?: CorpCorePlanDomain["centralDefenseAllocation"];
}): PlanSchedulerContext {
  const rezCreditsByActionId = new Map(
    params.defenseNeeds.flatMap((signal) => {
      const projection =
        signal.kind === "generic" && signal.phase === "install_ice"
          ? signal.installRoute?.projection
          : undefined;
      const selected = projection?.selectedRezCosts.find(
        (cost) => cost.iceInstanceId === projection.sourceCardInstanceId,
      );
      return projection && selected
        ? ([[projection.actionId, selected.credits]] as const)
        : [];
    }),
  );
  const domain: CorpCorePlanDomain = {
    scoreProjects: [],
    remoteProjects: params.remoteProjects ?? [],
    defenseNeeds: params.defenseNeeds,
    economyNeeds: [],
    ...(params.centralDefenseAllocation
      ? { centralDefenseAllocation: params.centralDefenseAllocation }
      : {}),
  };
  return {
    input: {
      side: "corp",
      legalActions: params.candidates.map((candidate) => {
        const serverId = candidate.targetContext!.selectedTargets[0]!.targetId;
        const rezCredits = rezCreditsByActionId.get(candidate.actionId) ?? 0;
        return {
          actionId: candidate.actionId,
          side: "corp",
          type: "install_card",
          label: candidate.actionId,
          source: candidate.sourceCardInstanceId,
          timingPoint: "corp_action.main",
          expiresAtStateVersion: 60,
          targetRequirements: [],
          choiceRequirements: [],
          costs: [{ clicks: 1, credits: 0 }],
          payload: {
            placement: "ice",
            serverId,
            cardId: candidate.sourceCardInstanceId,
            sourceDefinitionId: candidate.sourceDefinitionId,
            iceInstallBaseCost: 0,
            iceInstallAdditionalCost: 0,
            iceInstallReduction: 0,
            iceInstallTotalCost: 0,
            postInstallRezQuoteCardId: candidate.sourceCardInstanceId,
            postInstallRezQuoteTargetServerId: serverId,
            postInstallRezQuoteProjectedServerId: serverId,
            postInstallRezQuoteExpiresAtStateVersion: 60,
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteCostKind: "fixed",
            postInstallRezQuoteBaseCredits: rezCredits,
            postInstallRezQuoteFinalCredits: rezCredits,
            postInstallRezQuoteMandatoryAgendaPointCost: 0,
          },
          visibility: "private_to_actor",
        };
      }),
      playerView: {
        stateVersion: 60,
        timingPoint: "corp_action.main",
        servers: ["hq", "rd", "archives", "remote_1"].map((serverId) => ({
          id: serverId,
          label: serverId,
          ice: [],
          root: [],
        })),
        own: {
          credits: 11,
          clicks: 3,
          agendaPoints: 0,
          gripOrHq: params.candidates.map((candidate) => ({
            instanceId: candidate.sourceCardInstanceId!,
            definitionId: candidate.sourceDefinitionId!,
            type: "ice" as const,
            known: true,
            rezCost: 0,
            rulesText: "*End the run.",
          })),
        },
        opponent: { credits: 8, rig: [] },
      },
    } as unknown as AiDecisionInput,
    actionCandidates: params.candidates,
    turnKey: "corp:decision-checkpoint",
    domain,
  };
}

function checkpointInstallProjection(params: {
  candidate: ActionSemanticCandidate;
  targetServerId: string;
  effect: "progress" | "satisfied";
  accessProbability: { numerator: number; denominator: number };
  runnerCreditsRemaining: number;
  totalCredits: number;
}): KnownCorpFundedIceInstallRouteProjection {
  const protection = {
    knowledge: "known" as const,
    maximumRunnerAccessSuccessProbability: {
      numerator: 1,
      denominator: 2,
    },
    runnerAccessSuccessProbability: params.accessProbability,
    protectsScore: params.effect === "satisfied",
    requiredRandomBreakSuccesses: 0,
    randomBreaks: [],
    runnerCreditsRemainingOnBestAccessPath: params.runnerCreditsRemaining,
    evidence: [],
  };
  const beforeProtection = {
    ...protection,
    runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
    protectsScore: false,
    runnerCreditsRemainingOnBestAccessPath: 8,
  };
  const selectedRezCosts = [
    {
      iceInstanceId: params.candidate.sourceCardInstanceId!,
      iceDefinitionId: params.candidate.sourceDefinitionId!,
      credits: params.totalCredits,
      source: "engine_rez_cost_quote" as const,
    },
  ];
  const assessment = {
    knowledge: "known" as const,
    availableCorpCredits: 11,
    availableCorpClicks: 3,
    availableCorpAgendaPoints: 0,
    totalScoreReserveCredits: 0,
    hardClickReserve: 0,
    fundedProtection: true,
    scoreReserveFingerprint: "credits:;hardClicks:0",
    protection,
    selectedRezCosts,
    totalSelectedRezCost: params.totalCredits,
    totalSelectedAgendaPointCost: 0,
    creditsAfterDefense: 11 - params.totalCredits,
    agendaPointsAfterDefense: 0,
    clicksAfterDefense: 2,
    preservesScoreCreditReserve: true,
    preservesHardClickReserve: true,
    evidence: [],
  };
  const beforeAssessment = {
    ...assessment,
    protection: beforeProtection,
  };
  return {
    knowledge: "known",
    actionId: params.candidate.actionId,
    sourceCardInstanceId: params.candidate.sourceCardInstanceId!,
    sourceDefinitionId: params.candidate.sourceDefinitionId!,
    targetServerId: params.targetServerId,
    before: beforeAssessment,
    after: assessment,
    effect: params.effect,
    evidence: [],
    installCredits: 0,
    installClicks: 1,
    installCostSource: "legal_action_agreed_projection",
    selectedRezCosts,
    creditsAfterDefense: 11 - params.totalCredits,
    clicksAfterDefense: 2,
    preservesScoreCreditReserve: true,
    preservesHardClickReserve: true,
    preservesReserves: true,
    funded: true,
  };
}

function checkpointTargetContext(
  targetId: string,
  targetKind: LegalTarget["targetKind"],
) {
  return {
    selectedTargets: [
      {
        targetId,
        targetKind,
        targetSide: "corp" as const,
        visibilityScope: "public" as const,
        evidence: [],
      },
    ],
    targetKind,
    targetZones: [],
    targetSide: "corp" as const,
    hiddenInfoPolicy: "side_safe" as const,
    availableTargetsStatus: "engine_provided" as const,
    targetProfileMatches: [],
    targetConstraintResults: [],
  };
}
