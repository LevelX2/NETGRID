import {
  DEMO_CARDS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type EventVisibilityClass,
  type GameState,
  type Side,
} from "@netgrid/shared";

const VIRIZZ_BREAK_COST_MODIFIER_DEFINITION_ID = "onr_v1_277_virizz";

export type ActiveModifierDuration =
  | "encounter"
  | "run"
  | "turn"
  | "while_installed"
  | "while_rezzed"
  | "game";

export type ActiveModifierKind =
  | "max_hand_size"
  | "ice_strength"
  | "breaker_strength"
  | "rez_cost"
  | "install_cost"
  | "trash_cost"
  | "break_subroutine_cost"
  | "jack_out_cost";

export type ActiveModifier = {
  id: string;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  kind: ActiveModifierKind;
  side?: Side;
  amount: number;
  duration: ActiveModifierDuration;
  target?: {
    kind: "card" | "server" | "subtype" | "side" | "run";
    id?: string;
    subtype?: string;
  };
  visibility: EventVisibilityClass;
};

function positiveInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

export function collectActiveModifiers(state: GameState): ActiveModifier[] {
  const modifiers: ActiveModifier[] = [];

  for (const cardId of state.runner.rig.hardware.slice().sort()) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = DEMO_CARDS_BY_ID[instance.definitionId];
    const amount = positiveInteger(definition?.maxHandSizeBonus);
    if (amount <= 0) continue;
    modifiers.push({
      id: `installed.max_hand_size.${cardId}`,
      sourceCardInstanceId: cardId,
      sourceDefinitionId: instance.definitionId,
      kind: "max_hand_size",
      side: "runner",
      amount,
      duration: "while_installed",
      target: { kind: "side", id: "runner" },
      visibility: "public",
    });
  }

  const run = state.run;
  if (!run) return modifiers;

  const breakerBonuses = run.remainderStrengthBonusByBreaker ?? {};
  for (const [breakerId, rawAmount] of Object.entries(breakerBonuses).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const amount = positiveInteger(rawAmount);
    const instance = state.cardInstances[breakerId];
    if (amount <= 0 || !instance) continue;
    // Existing RunState records the affected breaker, not a distinct source instance.
    // Current writers use self-source breakers such as Krash/Grubb; keep the target explicit.
    modifiers.push({
      id: `run.breaker_strength.${breakerId}`,
      sourceDefinitionId: instance.definitionId,
      kind: "breaker_strength",
      side: "runner",
      amount,
      duration: "run",
      target: { kind: "card", id: breakerId },
      visibility: "public",
    });
  }

  const breakCostAmount = positiveInteger(run.breakSubroutineAdditionalCost);
  if (breakCostAmount > 0) {
    modifiers.push({
      id: `run.break_subroutine_cost.${VIRIZZ_BREAK_COST_MODIFIER_DEFINITION_ID}`,
      sourceDefinitionId: VIRIZZ_BREAK_COST_MODIFIER_DEFINITION_ID,
      kind: "break_subroutine_cost",
      side: "runner",
      amount: breakCostAmount,
      duration: "run",
      target: { kind: "run" },
      visibility: "public",
    });
  }

  return modifiers;
}
