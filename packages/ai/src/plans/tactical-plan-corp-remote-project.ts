import type { LegalAction } from "@netgrid/shared";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { corpRemoteProtectionPath } from "./tactical-plan-corp-helpers";
import { actionServerId } from "./tactical-plan-server-targets";
import type {
  PlanBlocker,
  PlanStep,
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";
import {
  assessCorpCentralProtectionFloor,
  assessCorpRemoteProject,
} from "./corp-remote-project-assessment";

export function buildCorpRemoteProjectPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  const doctrine = context.remoteDoctrine;
  if (!doctrine || !remoteProjectIsRequired(doctrine)) return [];
  const targetServerId = selectScoringRemoteTarget(context);
  if (!targetServerId) return [];
  const assessment = assessCorpRemoteProject({
    input: context.input,
    serverId: targetServerId,
    doctrine,
  });
  const centralFloor = assessCorpCentralProtectionFloor(context.input);
  const centralFloorActionIds = centralProtectionFloorActions(
    context,
    centralFloor.missingServerIds,
  );
  const protectionPath = corpRemoteProtectionPath(
    context.input,
    targetServerId,
  );
  const agendaInstallActionIds = scorelineInstallActions(
    context,
    targetServerId,
  ).map((action) => action.actionId);
  const blockers: PlanBlocker[] = [
    ...(!centralFloor.met
      ? [
          {
            blockerId: "remote_project_central_floor",
            kind: "central_protection_floor" as const,
            severity: "soft" as const,
            target: {
              kind: "server" as const,
              id: centralFloor.missingServerIds[0] ?? "hq",
            },
            removalStepKind: "protect_remote" as const,
            evidence: centralFloor.evidence,
          } satisfies PlanBlocker,
        ]
      : []),
    ...(!assessment.targetMet
      ? [
          {
            blockerId: `remote_project_protection:${targetServerId}`,
            kind: "missing_remote_protection",
            severity: "soft",
            target: { kind: "server", id: targetServerId },
            removalStepKind: "protect_remote",
            evidence: assessment.evidence,
          } satisfies PlanBlocker,
        ]
      : []),
  ];
  const currentStep = remoteProjectCurrentStep({
    context,
    targetServerId,
    centralFloorMet: centralFloor.met,
    centralFloorActionIds,
    targetMet: assessment.targetMet,
    agendaInstallActionIds,
    protectionPath,
  });
  const hasMappedAction = currentStep.actionCandidateIds.length > 0;
  return [
    createTacticalPlan({
      planId: `corp.establish_scoring_remote:${targetServerId}`,
      side: "corp",
      type: "corp.establish_scoring_remote",
      status:
        centralFloor.met && assessment.targetMet
          ? hasMappedAction
            ? "active"
            : "proposed"
          : hasMappedAction
            ? "progressing"
            : "blocked",
      priority:
        (doctrine.dependency === "primary" ? 690 : 590) +
        (assessment.targetMet ? 0 : 40),
      horizonTurns: 8,
      target: { kind: "server", id: targetServerId },
      blockers,
      currentStep,
      nextSteps: remoteProjectSequence(targetServerId),
      evidence: [
        "remote_project_source:deck_strategy_doctrine",
        `remote_project_dependency:${doctrine.dependency}`,
        `remote_project_purposes:${doctrine.purposes.join("|")}`,
        `remote_project_background_actions:${doctrine.investmentBudget.backgroundActionsPerTurn}`,
        ...assessment.evidence,
        ...centralFloor.evidence,
        ...protectionPath.evidence,
      ],
      scoreBreakdown: [
        {
          key: "remote_doctrine",
          label: "Remote doctrine",
          value: doctrine.dependency === "primary" ? 160 : 80,
          reason: `${doctrine.dependency}:${doctrine.protectionTarget}`,
        },
      ],
      stateVersion: context.input.playerView.stateVersion,
    }),
  ];
}

function remoteProjectIsRequired(
  doctrine: NonNullable<TacticalPlanBuildContext["remoteDoctrine"]>,
): boolean {
  return (
    (doctrine.dependency === "supporting" ||
      doctrine.dependency === "primary") &&
    doctrine.investmentBudget.backgroundActionsPerTurn > 0 &&
    doctrine.protectionTarget !== "none" &&
    doctrine.purposes.some(
      (purpose) => purpose === "scoreline" || purpose === "mixed",
    )
  );
}

function selectScoringRemoteTarget(
  context: TacticalPlanBuildContext,
): string | undefined {
  const remotes = context.input.playerView.servers.filter(
    (server) =>
      server.id.startsWith("remote_") &&
      server.root.every(
        (card) => card.known === false || card.type === "agenda",
      ),
  );
  const previousTarget = context.previousPlanPortfolio?.backgrounds.find(
    (entry) => entry.planType === "corp.establish_scoring_remote",
  )?.target?.id;
  if (
    previousTarget &&
    remotes.some((server) => server.id === previousTarget)
  ) {
    return previousTarget;
  }
  const ranked = [...remotes].sort(
    (left, right) =>
      remoteTargetValue(right) - remoteTargetValue(left) ||
      left.id.localeCompare(right.id),
  );
  if (ranked[0]) return ranked[0].id;
  return context.input.legalActions.some(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      actionServerId(action) === "new_remote",
  )
    ? "new_remote"
    : undefined;
}

function remoteTargetValue(server: {
  ice: readonly unknown[];
  root: readonly { known: boolean; type?: string }[];
}): number {
  return (
    server.ice.length * 100 +
    (server.root.some((card) => card.type === "agenda") ? 300 : 150)
  );
}

function scorelineInstallActions(
  context: TacticalPlanBuildContext,
  serverId: string,
): LegalAction[] {
  return context.input.legalActions.filter((action) => {
    if (
      action.type !== "install_card" ||
      action.payload?.placement === "ice" ||
      actionServerId(action) !== serverId
    ) {
      return false;
    }
    return (
      visibleCardByInstanceId(context.input.playerView, String(action.source))
        ?.type === "agenda"
    );
  });
}

function remoteProjectCurrentStep(params: {
  context: TacticalPlanBuildContext;
  targetServerId: string;
  centralFloorMet: boolean;
  centralFloorActionIds: string[];
  targetMet: boolean;
  agendaInstallActionIds: string[];
  protectionPath: ReturnType<typeof corpRemoteProtectionPath>;
}): PlanStep {
  if (!params.centralFloorMet) {
    return createPlanStep({
      stepId: `remote_project_central_floor:${params.targetServerId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "central_protection_floor"],
      actionCandidateIds: params.centralFloorActionIds,
      rationale: [
        "satisfy the one-ICE HQ/R&D floor before resuming remote investment",
      ],
    });
  }
  if (params.targetMet) {
    return createPlanStep({
      stepId: `remote_project_payload:${params.targetServerId}`,
      kind: "install_or_prepare_agenda",
      desiredActionSemantics: ["install.card", "scoreline"],
      actionCandidateIds: params.agendaInstallActionIds,
      rationale: [
        params.agendaInstallActionIds.length > 0
          ? "protected remote is ready for its scoring payload"
          : "keep the completed remote available for a later score window",
      ],
    });
  }
  if (params.protectionPath.immediateActionIds.length > 0) {
    return createPlanStep({
      stepId: `remote_project_protect:${params.targetServerId}`,
      kind:
        params.targetServerId === "new_remote"
          ? "build_remote"
          : "protect_remote",
      desiredActionSemantics: ["install.card", "remote_protection"],
      actionCandidateIds: params.protectionPath.immediateActionIds,
      rationale: [
        "add one effective protection layer to the bound scoring remote",
      ],
    });
  }
  if (params.protectionPath.fundingCandidate) {
    const candidate = params.protectionPath.fundingCandidate;
    return createPlanStep({
      stepId: `remote_project_fund:${params.targetServerId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      actionCandidateIds: params.context.input.legalActions
        .filter((action) => action.type === "gain_credit")
        .map((action) => action.actionId),
      requiredCapabilities: [
        {
          capabilityId: `remote_project_rez_reserve:${params.targetServerId}`,
          kind: "rez_reserve",
          side: "corp",
          minimumCredits: candidate.actionCreditCost + candidate.rezCost,
          evidence: [`protection_action:${candidate.actionId}`],
        },
      ],
      rationale: ["fund the next concrete protection layer"],
    });
  }
  return createPlanStep({
    stepId: `remote_project_find_protection:${params.targetServerId}`,
    kind: "find_remote_protection",
    desiredActionSemantics: ["draw.card", "search.deck", "remote_protection"],
    actionCandidateIds: params.protectionPath.acquisitionActionIds,
    rationale: ["find effective ICE instead of overprotecting central servers"],
  });
}

function centralProtectionFloorActions(
  context: TacticalPlanBuildContext,
  missingServerIds: readonly string[],
): string[] {
  const missing = new Set(missingServerIds);
  return context.input.legalActions
    .filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        missing.has(actionServerId(action) ?? ""),
    )
    .map((action) => action.actionId)
    .sort();
}

function remoteProjectSequence(serverId: string): PlanStep[] {
  return [
    createPlanStep({
      stepId: `remote_project_protect:${serverId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "remote_protection"],
      rationale: ["reach the doctrine protection band over multiple turns"],
    }),
    createPlanStep({
      stepId: `remote_project_reserve:${serverId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit"],
      rationale: ["hold enough credits to make installed ICE effective"],
    }),
    createPlanStep({
      stepId: `remote_project_payload:${serverId}`,
      kind: "install_or_prepare_agenda",
      desiredActionSemantics: ["install.card", "scoreline"],
      rationale: ["use the completed scoring remote"],
    }),
  ];
}
