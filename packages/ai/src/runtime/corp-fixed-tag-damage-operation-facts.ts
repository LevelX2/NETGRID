import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";
import { corpFixedOperationPlayCredits } from "./corp-canonical-card-facts";
import { mergedPublicHistory } from "../public-event-history";

export type FixedTagOperation = {
  trigger:
    | { kind: "run_attempts"; minimumRuns: number; traceLimit: number }
    | { kind: "agenda_stolen" };
  tags: number;
  credits: number;
};

export type FixedTaggedDamageOperation = {
  credits: number;
  damage: number;
  minimumTags: number;
};

/** Simple canonical operation facts, independent of any current LegalAction. */
export function fixedTagOperation(
  definitionId: number,
): FixedTagOperation | undefined {
  const credits = corpFixedOperationPlayCredits(definitionId);
  if (credits === undefined) return undefined;
  const card = cardSpecPlanningCardByDefinitionId(definitionId)?.planning;
  if (card?.engine.corpUtility?.kind === "encounter_tag")
    return { trigger: { kind: "agenda_stolen" }, tags: 1, credits };
  for (const ability of card?.engine.abilities ?? []) {
    if (
      ability.kind !== "on_play" ||
      ability.costs !== "printed" ||
      ability.condition?.kind !== "runner_attempted_run_last_turn" ||
      ability.effects.length !== 1
    )
      continue;
    const [effect] = ability.effects;
    if (effect?.kind !== "trace" || effect.onSuccess.length !== 1) continue;
    const [tag] = effect.onSuccess;
    if (
      tag?.kind === "add_tags" &&
      tag.recipient === "runner" &&
      tag.visibility === "public" &&
      tag.amount > 0
    ) {
      return {
        trigger: {
          kind: "run_attempts",
          minimumRuns: ability.condition.minimumRuns,
          traceLimit: effect.traceLimit,
        },
        tags: tag.amount,
        credits,
      };
    }
  }
  return undefined;
}

export function fixedTaggedDamageOperation(
  definitionId: number,
): FixedTaggedDamageOperation | undefined {
  const credits = corpFixedOperationPlayCredits(definitionId);
  if (credits === undefined) return undefined;
  const card = cardSpecPlanningCardByDefinitionId(definitionId)?.planning;
  for (const ability of card?.engine.abilities ?? []) {
    if (
      ability.kind !== "on_play" ||
      ability.costs !== "printed" ||
      ability.effects.length !== 1
    )
      continue;
    const condition = ability.condition;
    const [effect] = ability.effects;
    if (
      (condition?.kind === "runner_is_tagged" ||
        condition?.kind === "runner_tags_at_least") &&
      effect?.kind === "damage" &&
      effect.recipient === "runner" &&
      effect.damageType === "meat" &&
      effect.visibility === "public" &&
      effect.amount > 0
    ) {
      return {
        credits,
        damage: effect.amount,
        minimumTags:
          condition.kind === "runner_is_tagged" ? 1 : condition.amount,
      };
    }
  }
  return undefined;
}

/** A run event and its resolved start effect count as one public attempt. */
export function publicRunnerTurnObservations(
  input: AiDecisionInput,
  turn: number | undefined,
) {
  if (turn === undefined) return { runs: 0, stoleAgenda: false };
  let runs = 0;
  let stoleAgenda = false;
  for (const event of mergedPublicHistory(input)) {
    if (
      event.turnSerial !== turn ||
      event.stateVersionAfter > input.playerView.stateVersion ||
      event.publicPayload.actor !== "runner"
    )
      continue;
    if (event.type === "steal_agenda") stoleAgenda = true;
    if (
      event.type === "start_run" ||
      event.publicPayload.resolvedEffects?.some(
        (effect) => effect.kind === "start_run" && effect.side === "runner",
      )
    ) {
      runs += 1;
    }
  }
  return { runs, stoleAgenda };
}
