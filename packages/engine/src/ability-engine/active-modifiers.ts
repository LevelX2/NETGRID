import {
  type CardDefinitionId,
  type CardInstanceId,
  type EventVisibilityClass,
  type GameState,
  type Side,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  activeCardImplementationModifiersForScoredCorpAgendas,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  isPublicScoredCorpAgendaModifier,
} from "./card-implementation-modifiers";

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
  | "memory_units"
  | "agenda_difficulty"
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

  for (const active of activeCardImplementationModifiersForRunnerInstalled(
    state,
    "hand_size",
  )) {
    if (!isPublicRunnerInstalledModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `installed.max_hand_size.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "max_hand_size",
      side: active.modifier.side,
      amount,
      duration: "while_installed",
      target: { kind: "side", id: active.modifier.side },
      visibility: "public",
    });
  }
  for (const active of activeCardImplementationModifiersForScoredCorpAgendas(
    state,
    "hand_size",
  )) {
    if (!isPublicScoredCorpAgendaModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `scored.max_hand_size.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "max_hand_size",
      side: active.modifier.side,
      amount,
      duration: "game",
      target: { kind: "side", id: active.modifier.side },
      visibility: "public",
    });
  }
  for (const active of activeCardImplementationModifiersForCorpRoot(
    state,
    "hand_size",
  )) {
    if (!isPublicRezzedCorpRootModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `rezzed.max_hand_size.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "max_hand_size",
      side: active.modifier.side,
      amount,
      duration: "while_rezzed",
      target: { kind: "side", id: active.modifier.side },
      visibility: "public",
    });
  }
  for (const active of activeCardImplementationModifiersForRunnerInstalled(
    state,
    "memory_units",
  )) {
    if (!isPublicRunnerInstalledModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `installed.memory_units.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "memory_units",
      side: "runner",
      amount,
      duration: "while_installed",
      target: { kind: "side", id: "runner" },
      visibility: "public",
    });
  }
  for (const active of activeCardImplementationModifiersForScoredCorpAgendas(
    state,
    "agenda_difficulty",
  )) {
    if (!isPublicScoredCorpAgendaModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `scored.agenda_difficulty.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "agenda_difficulty",
      side: "corp",
      amount: active.modifier.operation === "reduce" ? -amount : amount,
      duration: "game",
      target: {
        kind: "subtype",
        ...(active.modifier.appliesTo.subtype
          ? { subtype: active.modifier.appliesTo.subtype }
          : {}),
      },
      visibility: "public",
    });
  }
  for (const active of activeCardImplementationModifiersForCorpRoot(
    state,
    "agenda_difficulty",
  )) {
    if (!isPublicRezzedCorpRootModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `rezzed.agenda_difficulty.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "agenda_difficulty",
      side: "corp",
      amount: active.modifier.operation === "reduce" ? -amount : amount,
      duration: "while_rezzed",
      target: {
        kind: active.modifier.appliesTo.sameServerAsSource ? "server" : "subtype",
        ...(active.modifier.appliesTo.subtype
          ? { subtype: active.modifier.appliesTo.subtype }
          : {}),
      },
      visibility: "public",
    });
  }
  for (const active of activeCardImplementationModifiersForCorpRoot(
    state,
    "break_subroutine_cost",
  )) {
    if (!isPublicRezzedCorpRootModifier(active.modifier)) continue;
    const amount = positiveInteger(active.modifier.amount);
    if (amount <= 0) continue;
    modifiers.push({
      id: `rezzed.break_subroutine_cost.${active.sourceCardInstanceId}`,
      sourceCardInstanceId: active.sourceCardInstanceId,
      sourceDefinitionId: active.sourceDefinitionId,
      kind: "break_subroutine_cost",
      side: "runner",
      amount,
      duration: "while_rezzed",
      target: {
        kind: active.modifier.sameServerAsSource ? "server" : "subtype",
      },
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
