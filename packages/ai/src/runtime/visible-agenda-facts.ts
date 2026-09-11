import {
  type AiDecisionInput,
  type CardDefinition,
  type VisibleCard,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { visibleKnownCardType } from "./visible-action-facts";
export function requireVisibleAgendaPoints(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  const definition = requireVisibleCardDefinition(input, card, "agenda");
  if (card.agendaPoints !== undefined && !Number.isFinite(card.agendaPoints))
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Project a finite agenda-point value for ${definition.id}.`,
    });
  const agendaPoints = card.agendaPoints ?? definition.agendaPoints;
  if (typeof agendaPoints !== "number" || !Number.isFinite(agendaPoints))
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide agenda points for ${definition.id}.`,
    });
  return agendaPoints;
}

export function requireVisibleAgendaAdvancementRequirement(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  const definition = requireVisibleCardDefinition(input, card, "agenda");
  if (
    card.advancementRequirement !== undefined &&
    !Number.isFinite(card.advancementRequirement)
  )
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Project a finite effective advancement requirement for ${definition.id}.`,
    });
  const requirement =
    card.advancementRequirement ?? definition.advancementRequirement;
  if (typeof requirement !== "number" || !Number.isFinite(requirement))
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide an advancement requirement for ${definition.id}.`,
    });
  return requirement;
}

export function requireVisibleCardDefinition(
  input: AiDecisionInput,
  card: VisibleCard,
  expectedType: "agenda" | "ice",
): CardDefinition {
  const actualType = visibleKnownCardType(input, card);
  if (actualType !== expectedType)
    throw new PlanResolutionFailure("step_capability_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind the ${expectedType} plan step to a visible ${expectedType} card.`,
    });
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId!];
  if (!definition)
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide an authoritative definition for ${card.definitionId}.`,
    });
  return definition;
}
