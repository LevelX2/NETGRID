import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";

export type ShellCoverageSubstitution = Readonly<{
  stateVersion: number;
  gapId: string;
  targetCardInstanceId: string;
  targetDefinitionId: string;
  shellActionId: string;
  shellCredits: number;
  replacedInstallActionIds: string[];
}>;

// The coverage owner already admits these current P4 installations. Completing
// the same prepared definition substitutes that development step; it certifies
// neither a whole access path nor an urgent run conversion.
export function shellCoverageSubstitution(
  input: AiDecisionInput,
  action: LegalAction,
  target: VisibleCard,
  gap: RunnerCoverageGapSignal | undefined,
  countersBefore: number,
  freeMemory: number,
  memoryCost: number,
): ShellCoverageSubstitution | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.run ||
    input.playerView.timingPoint !== "runner_action.main" ||
    gap?.priorityClass !== "P4" ||
    gap.sameTurnRunConversion ||
    gap.upgradeQuote ||
    (gap.needKind !== undefined && gap.needKind !== "missing_coverage") ||
    gap.recoveryMode === "install_visible_upgrade" ||
    !gap.answerInHand ||
    !target.definitionId ||
    gap.handAnswerDefinitionId !== target.definitionId ||
    target.type !== "program" ||
    !target.known ||
    target.owner !== "runner" ||
    target.controller !== "runner" ||
    action.side !== "runner" ||
    action.type !== "trigger_ability" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.payload?.delayedInstallAbility !== "remove_shell_counter" ||
    action.payload.targetCardId !== target.instanceId ||
    action.payload.targetCardDefinitionId !== target.definitionId ||
    !input.playerView.own.rig?.some(
      (c) =>
        c.known &&
        c.instanceId === action.source &&
        c.definitionId === action.payload?.sourceDefinitionId,
    ) ||
    countersBefore !== 1 ||
    action.payload?.remainingCountersBefore !== 1 ||
    target.counters?.shell !== 1 ||
    freeMemory < memoryCost ||
    input.playerView.own.clicks <= 0 ||
    input.playerView.own.rig?.some(
      (c) =>
        c.known &&
        c.type === "program" &&
        c.definitionId === target.definitionId,
    )
  )
    return undefined;
  const shellCost = quotedCost(action);
  if (
    !shellCost ||
    shellCost.clicks !== 0 ||
    shellCost.credits > input.playerView.own.credits
  )
    return undefined;
  const installs = input.legalActions.filter((install) => {
    const hand = input.playerView.own.gripOrHq.find(
      (c) => c.instanceId === install.source,
    );
    const cost = quotedCost(install);
    return (
      gap.installActionIds?.includes(install.actionId) &&
      install.side === "runner" &&
      install.type === "install_card" &&
      install.timingPoint === input.playerView.timingPoint &&
      install.expiresAtStateVersion === input.playerView.stateVersion &&
      hand?.known &&
      hand.type === "program" &&
      hand.definitionId === target.definitionId &&
      install.payload?.cardId === hand.instanceId &&
      !install.payload?.hostCardId &&
      !install.payload?.runnerProgramTrashBeforeInstall &&
      !install.choiceRequirements?.length &&
      cost &&
      cost.credits <= input.playerView.own.credits &&
      cost.clicks <= input.playerView.own.clicks &&
      cost.credits >= shellCost.credits &&
      cost.clicks > shellCost.clicks
    );
  });
  if (!installs.length) return undefined;
  return {
    stateVersion: input.playerView.stateVersion,
    gapId: gap.gapId,
    targetCardInstanceId: target.instanceId,
    targetDefinitionId: target.definitionId,
    shellActionId: action.actionId,
    shellCredits: shellCost.credits,
    replacedInstallActionIds: installs.map((a) => a.actionId),
  };
}

function quotedCost(
  action: LegalAction,
): { credits: number; clicks: number } | undefined {
  if (
    action.costs.some((c) =>
      Object.entries(c).some(
        ([key, value]) =>
          !["credits", "clicks"].includes(key) ||
          typeof value !== "number" ||
          !Number.isSafeInteger(value) ||
          value < 0,
      ),
    )
  )
    return undefined;
  return {
    credits: action.costs.reduce((s, c) => s + (c.credits ?? 0), 0),
    clicks: action.costs.reduce((s, c) => s + (c.clicks ?? 0), 0),
  };
}
