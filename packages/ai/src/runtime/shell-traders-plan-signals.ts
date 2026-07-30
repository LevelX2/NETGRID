import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { delayedInstallAbilityForAction } from "../actions/delayed-install-action";
import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import {
  runnerCoverageRoleNeedles,
  type RunnerCoverageGapSignal,
  type RunnerShellTradersPipelineSignal,
} from "../plans/runner-core-plan-modules";
import type { RunnerHandDevelopmentEvaluation } from "../runner/hand-development/runner-hand-development-types";
import { rolesMatch } from "./role-match";
import { shellTradersTargetValue } from "./shell-traders-action";

const SHELL_TRADERS_DEFINITION_ID = "onr_v1_176_the-shell-traders" as const;

export type BuildRunnerShellTradersPipelineSignalsInput = Readonly<{
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  coverageGaps: readonly RunnerCoverageGapSignal[];
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
}>;

export function buildRunnerShellTradersPipelineSignals({
  input,
  candidates,
  coverageGaps,
  handDevelopment,
}: BuildRunnerShellTradersPipelineSignalsInput): RunnerShellTradersPipelineSignal[] {
  if (input.side !== "runner") return [];
  const installedSources = new Set(
    (input.playerView.own.rig ?? [])
      .filter(
        (card) =>
          card.known && card.definitionId === SHELL_TRADERS_DEFINITION_ID,
      )
      .map((card) => card.instanceId),
  );
  if (installedSources.size === 0) return [];

  const signals = candidates.flatMap((candidate) => {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    const ability = action ? delayedInstallAbilityForAction(action) : undefined;
    if (
      !action ||
      action.side !== "runner" ||
      action.type !== "trigger_ability" ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      !installedSources.has(action.source) ||
      candidate.sourceCardInstanceId !== action.source ||
      candidate.sourceDefinitionId !== SHELL_TRADERS_DEFINITION_ID ||
      (ability !== "set_aside_from_grip" && ability !== "remove_shell_counter")
    ) {
      return [];
    }
    const targetCardInstanceId = stringValue(action.payload?.targetCardId);
    if (!targetCardInstanceId) return [];
    const targetCard =
      ability === "set_aside_from_grip"
        ? input.playerView.own.gripOrHq.find(
            (card) => card.instanceId === targetCardInstanceId,
          )
        : input.playerView.specialZones?.setAside.find(
            (card) => card.instanceId === targetCardInstanceId,
          );
    if (
      !targetCard?.known ||
      (targetCard.type !== "program" && targetCard.type !== "hardware")
    ) {
      return [];
    }
    const targetDefinitionId =
      targetCard.definitionId ??
      stringValue(action.payload?.targetCardDefinitionId);
    if (!targetDefinitionId) return [];
    const roles = rolesForDeckDoctrineCard(targetDefinitionId);
    const coverageBinding = bestCoverageBinding(coverageGaps, roles);
    const development = handDevelopment.find(
      (evaluation) =>
        evaluation.cardInstanceId === targetCardInstanceId &&
        evaluation.definitionId === targetDefinitionId,
    );
    const shellCountersBefore =
      ability === "set_aside_from_grip"
        ? (nonNegativeInteger(action.payload?.shellCounterAmount) ??
          visibleInstallCost(targetCard))
        : (nonNegativeInteger(action.payload?.remainingCountersBefore) ??
          visibleShellCounters(targetCard));
    const shellCountersAfterAction =
      ability === "set_aside_from_grip"
        ? shellCountersBefore
        : Math.max(0, shellCountersBefore - 1);
    const targetInstallCost = visibleInstallCost(targetCard);
    const targetMemoryCost =
      targetCard.type === "program" ? visibleMemoryCost(targetCard) : 0;
    const freeMemory = Math.max(
      0,
      (input.playerView.own.memoryLimit ?? 0) -
        (input.playerView.own.memoryUsed ?? 0),
    );
    const targetValue = Math.max(
      shellTradersTargetValue([...roles], shellCountersBefore),
      development?.priority ?? 0,
      development?.persistentInstallEvaluation?.marginalUtilityScore ?? 0,
    );
    const replacementAssessment = assessShellTradersRigReplacement({
      input,
      targetCard,
      targetRoles: roles,
      targetValue,
      targetMemoryCost,
      freeMemory,
      coverageGaps,
      coverageBinding,
    });
    const redundantTarget =
      development?.persistentInstallEvaluation?.duplicateRole ===
        "redundant_duplicate" && coverageBinding === undefined;
    const targetRejected =
      targetValue <= 0 ||
      redundantTarget ||
      development?.strategicFit === "blocked";
    const completionWouldBeHarmful =
      ability === "remove_shell_counter" &&
      shellCountersBefore === 1 &&
      (replacementAssessment.status === "harmful" ||
        replacementAssessment.status === "unknown");
    const phase =
      targetRejected || completionWouldBeHarmful
        ? ("hold" as const)
        : ability === "set_aside_from_grip"
          ? ("prepare" as const)
          : ("progress" as const);
    const priorityClass =
      coverageBinding?.priorityClass ??
      (phase === "progress" && shellCountersBefore <= 1
        ? ("P4" as const)
        : ("P5" as const));
    const value = Math.max(
      0,
      targetValue +
        (coverageBinding ? 300 : 0) +
        (phase === "progress" ? 80 : 30) -
        shellCountersAfterAction * 8 -
        replacementAssessment.displacedValue,
    );
    const evidenceCodes = [
      `runner_shell_traders_phase:${phase}`,
      `runner_shell_traders_source:${action.source}`,
      `runner_shell_traders_target:${targetCardInstanceId}`,
      `runner_shell_traders_target_definition:${targetDefinitionId}`,
      `runner_shell_traders_counters:${shellCountersBefore}->${shellCountersAfterAction}`,
      `runner_shell_traders_memory:${targetMemoryCost}:${freeMemory}`,
      `runner_shell_traders_replacement:${replacementAssessment.status}`,
      `runner_shell_traders_target_roles:${roles.join(",") || "none"}`,
      ...(coverageBinding
        ? [
            `runner_shell_traders_coverage:${coverageBinding.requiredRole}:${coverageBinding.targetServerId ?? "no_server"}`,
          ]
        : []),
      ...(redundantTarget
        ? ["runner_shell_traders_rejected_redundant_target"]
        : []),
      ...(completionWouldBeHarmful
        ? ["runner_shell_traders_holds_harmful_completion"]
        : []),
    ];
    return [
      {
        pipelineId: `${action.source}:${targetCardInstanceId}`,
        phase,
        sourceCardInstanceId: action.source,
        sourceDefinitionId: SHELL_TRADERS_DEFINITION_ID,
        targetCardInstanceId,
        targetDefinitionId,
        targetCardType: targetCard.type,
        actionIds: phase === "hold" ? [] : [action.actionId],
        ...(phase === "hold" ? { rejectedActionIds: [action.actionId] } : {}),
        priorityClass,
        value,
        shellCountersBefore,
        shellCountersAfterAction,
        targetInstallCost,
        targetMemoryCost,
        freeMemory,
        replacementAssessment,
        ...(coverageBinding
          ? {
              coverageBinding: {
                gapId: coverageBinding.gapId,
                requiredRole: coverageBinding.requiredRole,
                ...(coverageBinding.targetServerId
                  ? { targetServerId: coverageBinding.targetServerId }
                  : {}),
              },
            }
          : {}),
        targetRoles: [...roles],
        evidenceCodes,
      } satisfies RunnerShellTradersPipelineSignal,
    ];
  });
  return uniqueSignals(signals);
}

type ShellTradersReplacementInput = Readonly<{
  input: AiDecisionInput;
  targetCard: VisibleCard;
  targetRoles: readonly string[];
  targetValue: number;
  targetMemoryCost: number;
  freeMemory: number;
  coverageGaps: readonly RunnerCoverageGapSignal[];
  coverageBinding:
    | (RunnerCoverageGapSignal & {
        priorityClass: RunnerCoverageGapSignal["priorityClass"];
      })
    | undefined;
}>;

export function assessShellTradersRigReplacement({
  input,
  targetCard,
  targetRoles,
  targetValue,
  targetMemoryCost,
  freeMemory,
  coverageGaps,
  coverageBinding,
}: ShellTradersReplacementInput): RunnerShellTradersPipelineSignal["replacementAssessment"] {
  const requiredMemory = Math.max(0, targetMemoryCost - freeMemory);
  if (targetCard.type !== "program" || requiredMemory === 0) {
    return {
      status: "not_needed",
      requiredMemory,
      selectedProgramInstanceIds: [],
      freedMemory: 0,
      displacedValue: 0,
    };
  }
  const programs = (input.playerView.own.rig ?? [])
    .filter(
      (card) =>
        card.known &&
        card.type === "program" &&
        card.instanceId !== targetCard.instanceId,
    )
    .map((card) => {
      const roles = rolesForDeckDoctrineCard(card.definitionId ?? "");
      const memory = visibleMemoryCost(card);
      const protectsOtherGap = coverageGaps.some(
        (gap) =>
          gap.gapId !== coverageBinding?.gapId &&
          rolesCoverGap(roles, gap.requiredRole),
      );
      const overlapsTarget = targetRoles.some((role) => roles.includes(role));
      const displacedValue =
        (protectsOtherGap ? 1_000 : 0) +
        (roles.some((role) => role.startsWith("breaker_")) ? 260 : 40) +
        (overlapsTarget ? -120 : 0);
      return {
        card,
        memory,
        displacedValue: Math.max(0, displacedValue),
        protectsOtherGap,
      };
    })
    .filter((entry) => entry.memory > 0)
    .sort(
      (left, right) =>
        left.displacedValue - right.displacedValue ||
        right.memory - left.memory ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  const selected: typeof programs = [];
  let freedMemory = 0;
  for (const program of programs) {
    if (freedMemory >= requiredMemory) break;
    selected.push(program);
    freedMemory += program.memory;
  }
  if (freedMemory < requiredMemory) {
    return {
      status: "unknown",
      requiredMemory,
      selectedProgramInstanceIds: selected.map(
        (entry) => entry.card.instanceId,
      ),
      freedMemory,
      displacedValue: selected.reduce(
        (sum, entry) => sum + entry.displacedValue,
        0,
      ),
    };
  }
  const displacedValue = selected.reduce(
    (sum, entry) => sum + entry.displacedValue,
    0,
  );
  const harmful =
    selected.some((entry) => entry.protectsOtherGap) ||
    (coverageBinding === undefined && displacedValue >= targetValue);
  return {
    status: harmful ? "harmful" : "available",
    requiredMemory,
    selectedProgramInstanceIds: selected.map((entry) => entry.card.instanceId),
    freedMemory,
    displacedValue,
  };
}

function bestCoverageBinding(
  gaps: readonly RunnerCoverageGapSignal[],
  roles: readonly string[],
):
  | (RunnerCoverageGapSignal & {
      priorityClass: RunnerCoverageGapSignal["priorityClass"];
    })
  | undefined {
  return gaps
    .filter((gap) => rolesCoverGap(roles, gap.requiredRole))
    .sort(
      (left, right) =>
        priorityRank(left.priorityClass) - priorityRank(right.priorityClass) ||
        left.gapId.localeCompare(right.gapId),
    )[0];
}

function rolesCoverGap(
  roles: readonly string[],
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  return (
    roles.includes("breaker_universal") ||
    rolesMatch([...roles], runnerCoverageRoleNeedles(requiredRole))
  );
}

function priorityRank(value: RunnerCoverageGapSignal["priorityClass"]): number {
  if (value === "P2") return 2;
  if (value === "P4") return 4;
  return 5;
}

function visibleInstallCost(card: VisibleCard): number {
  return Math.max(
    0,
    card.installCost ??
      (card.definitionId
        ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.installCost
        : undefined) ??
      card.cost ??
      0,
  );
}

function visibleMemoryCost(card: VisibleCard): number {
  return Math.max(
    0,
    card.memoryCost ??
      (card.definitionId
        ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.memoryCost
        : undefined) ??
      0,
  );
}

function visibleShellCounters(card: VisibleCard): number {
  return Math.max(
    0,
    card.counters?.shell ??
      card.counterDisplays?.find((display) => display.displayKind === "shell")
        ?.amount ??
      0,
  );
}

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function uniqueSignals(
  signals: readonly RunnerShellTradersPipelineSignal[],
): RunnerShellTradersPipelineSignal[] {
  const byId = new Map<string, RunnerShellTradersPipelineSignal>();
  for (const signal of signals) {
    const current = byId.get(signal.pipelineId);
    if (
      !current ||
      priorityRank(signal.priorityClass) <
        priorityRank(current.priorityClass) ||
      signal.value > current.value
    ) {
      byId.set(signal.pipelineId, signal);
    }
  }
  return [...byId.values()].sort(
    (left, right) =>
      priorityRank(left.priorityClass) - priorityRank(right.priorityClass) ||
      right.value - left.value ||
      left.pipelineId.localeCompare(right.pipelineId),
  );
}
