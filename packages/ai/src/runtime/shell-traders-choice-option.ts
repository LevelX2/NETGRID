import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import {
  rolesHaveBreakerRole,
  rolesHaveUnmatchedBreakerRole,
} from "./breaker-role-match";
import { rolesMatch } from "./role-match";
import { shellTradersTargetValue } from "./shell-traders-action";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

export function selectedShellTradersStartTurnChoiceOptionId(
  choice: PendingChoice,
  context?: {
    input: AiDecisionInput;
    rolesForCardId: (definitionId: string | undefined) => readonly string[];
  },
): string | undefined {
  return (
    choice.options.slice().sort((left, right) => {
      const leftCounter = delayedInstallRemainingCounters(left);
      const rightCounter = delayedInstallRemainingCounters(right);
      const leftScore = context
        ? shellTradersStartTurnOptionScore(left, leftCounter, context)
        : 0;
      const rightScore = context
        ? shellTradersStartTurnOptionScore(right, rightCounter, context)
        : 0;
      const leftProgramBias = left.card?.type === "program" ? -1 : 0;
      const rightProgramBias = right.card?.type === "program" ? -1 : 0;
      return (
        rightScore - leftScore ||
        leftCounter - rightCounter ||
        leftProgramBias - rightProgramBias ||
        left.label.localeCompare(right.label, "de")
      );
    })[0] ?? choice.options[0]
  )?.id;
}

function shellTradersStartTurnOptionScore(
  option: PendingChoice["options"][number],
  remainingCounters: number,
  context: {
    input: AiDecisionInput;
    rolesForCardId: (definitionId: string | undefined) => readonly string[];
  },
): number {
  const target = shellTradersChoiceTarget(option, context.input);
  const roles = context.rolesForCardId(target?.definitionId);
  const rig = context.input.playerView.own.rig ?? [];
  const installedRoles = new Set(
    rig.flatMap((card) => context.rolesForCardId(card.definitionId)),
  );
  const completesNow = remainingCounters <= 1;
  const freeMemory = Math.max(
    0,
    (context.input.playerView.own.memoryLimit ?? 0) -
      (context.input.playerView.own.memoryUsed ?? 0),
  );
  const memoryCost = Math.max(0, target?.memoryCost ?? 0);
  const requiresReplacement =
    completesNow && target?.type === "program" && memoryCost > freeMemory;
  const hasSameRoleReplacement = rig.some((installed) => {
    const installedCardRoles = context.rolesForCardId(installed.definitionId);
    return (
      installed.type === "program" &&
      installedCardRoles.some((role) => rolesMatch(roles, [role]))
    );
  });
  const onlyUniqueBreakerSacrifices =
    requiresReplacement &&
    rig
      .filter((card) => card.type === "program" && (card.memoryCost ?? 0) > 0)
      .every((card) =>
        installedProgramHasUniqueBreakerRole(card, rig, context.rolesForCardId),
      );
  return (
    shellTradersTargetValue([...roles], remainingCounters) +
    (rolesHaveUnmatchedBreakerRole(roles, installedRoles) ? 240 : 0) +
    (completesNow && !requiresReplacement ? 80 : 0) +
    (requiresReplacement && hasSameRoleReplacement ? 30 : 0) -
    (requiresReplacement && onlyUniqueBreakerSacrifices ? 420 : 0) -
    Math.min(60, Math.max(0, remainingCounters - 1) * 10)
  );
}

function shellTradersChoiceTarget(
  option: PendingChoice["options"][number],
  input: AiDecisionInput,
): VisibleCard | undefined {
  if (option.card) return option.card;
  const instanceId =
    typeof option.value === "string"
      ? option.value
      : option.id.startsWith("card_")
        ? option.id.slice("card_".length)
        : undefined;
  return input.playerView.specialZones?.setAside.find(
    (card) => card.instanceId === instanceId,
  );
}

function installedProgramHasUniqueBreakerRole(
  card: VisibleCard,
  rig: readonly VisibleCard[],
  rolesForCardId: (definitionId: string | undefined) => readonly string[],
): boolean {
  const roles = rolesForCardId(card.definitionId);
  if (!rolesHaveBreakerRole(roles)) return false;
  return rig
    .filter((candidate) => candidate.instanceId !== card.instanceId)
    .every((candidate) => {
      const candidateRoles = rolesForCardId(candidate.definitionId);
      return !roles.some((role) => rolesMatch(candidateRoles, [role]));
    });
}

function delayedInstallRemainingCounters(
  option: PendingChoice["options"][number],
): number {
  const value = option.metadata?.delayedInstallRemainingCounters;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number.MAX_SAFE_INTEGER;
}
