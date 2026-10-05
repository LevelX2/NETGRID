import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

// Development has no memory-sacrifice continuation. A direct search requires
// its exact source, target funding and known free MU before source selection.
export function runnerDevelopmentSearchTargetIsExecutable(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  targetDefinitionId: string,
): boolean {
  const fail = (reason: string): never => {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "plan_registry",
      removalCondition: reason,
    });
  };
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  if (
    !action ||
    action.side !== "runner" ||
    action.type !== candidate.actionType ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    candidate.functionalEffects === undefined
  ) {
    fail(
      "A development search requires its exact current source LegalAction and canonical effects.",
    );
  }
  const sourceCreditCost = action!.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (
    !Number.isSafeInteger(sourceCreditCost) ||
    sourceCreditCost < 0 ||
    !Number.isSafeInteger(input.playerView.own.credits)
  ) {
    fail(
      "A development search requires known nonnegative source and available credits.",
    );
  }
  const installEffects = candidate.functionalEffects!.filter(
    (effect) =>
      effect.kind === "install" &&
      effect.scope === "installed_card" &&
      effect.target === "program",
  );
  if (installEffects.length === 0) {
    // Staged searches into Grip do not install the target in this action.
    return sourceCreditCost <= input.playerView.own.credits;
  }
  const modes = new Set(installEffects.map((effect) => effect.installCost));
  if (modes.size !== 1 || (!modes.has("normal") && !modes.has("free"))) {
    fail(
      "A direct program-search installation requires one exact canonical install cost mode.",
    );
  }
  const target = CARD_DEFINITIONS_BY_ID[targetDefinitionId];
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  if (
    !target ||
    target.type !== "program" ||
    !Number.isSafeInteger(target.memoryCost) ||
    target.memoryCost! < 0 ||
    !Number.isSafeInteger(memoryUsed) ||
    memoryUsed! < 0 ||
    !Number.isSafeInteger(memoryLimit) ||
    memoryLimit! < 0
  ) {
    return fail(
      "A direct development search requires the canonical program MU cost and current known memory capacity.",
    );
  }
  if (
    modes.has("normal") &&
    (!Number.isSafeInteger(target.installCost) || target.installCost! < 0)
  ) {
    fail(
      "A normal search installation requires the exact canonical target install cost.",
    );
  }
  const targetCreditCost = modes.has("free") ? 0 : target.installCost!;
  return (
    sourceCreditCost + targetCreditCost <= input.playerView.own.credits &&
    memoryUsed! + target.memoryCost! <= memoryLimit!
  );
}
