import { DEMO_CARDS_BY_ID, type CardDefinitionId } from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";
import type { CardImplementationDefinition } from "../card-implementations/types";
import type { CardEffectImplementation } from "../ability-engine/definition-types";

function cardDefinitionFor(implementation: CardImplementationDefinition) {
  return DEMO_CARDS_BY_ID[implementation.cardDefinitionId];
}

function abilityEffects(
  implementation: CardImplementationDefinition,
): readonly CardEffectImplementation[] {
  return (
    implementation.abilities?.flatMap((ability) =>
      "effects" in ability ? [...ability.effects] : [],
    ) ?? []
  );
}

function lifecycleEffects(
  implementation: CardImplementationDefinition,
): readonly CardEffectImplementation[] {
  const lifecycle = implementation.lifecycle;
  if (!lifecycle) return [];
  return [
    ...(lifecycle.on_rez ?? []),
    ...(lifecycle.on_install ?? []),
    ...(lifecycle.on_score ?? []),
    ...(lifecycle.on_leave_play ?? []),
    ...(lifecycle.start_of_corp_turn?.flatMap((ability) => ability.effects) ??
      []),
    ...(lifecycle.start_of_runner_turn?.flatMap((ability) => ability.effects) ??
      []),
    ...(lifecycle.end_of_runner_turn?.flatMap((ability) => ability.effects) ??
      []),
    ...(lifecycle.on_runner_run_start?.flatMap((ability) => ability.effects) ??
      []),
  ];
}

function allEffects(
  implementation: CardImplementationDefinition,
): readonly CardEffectImplementation[] {
  return [...abilityEffects(implementation), ...lifecycleEffects(implementation)];
}

function hasEffectKind(
  implementation: CardImplementationDefinition,
  effectKinds: readonly CardEffectImplementation["kind"][],
): boolean {
  const wanted = new Set(effectKinds);
  return allEffects(implementation).some((effect) => wanted.has(effect.kind));
}

function cardIdsMatching(
  predicate: (implementation: CardImplementationDefinition) => boolean,
): Set<CardDefinitionId> {
  return new Set(
    CARD_IMPLEMENTATIONS.filter(predicate).map(
      (implementation) => implementation.cardDefinitionId,
    ),
  );
}

function isCorpCardType(
  implementation: CardImplementationDefinition,
  type: "asset" | "operation" | "upgrade",
): boolean {
  const definition = cardDefinitionFor(implementation);
  return definition?.side === "corp" && definition.type === type;
}

type FortRunWindowKind = NonNullable<
  CardImplementationDefinition["fortRunWindows"]
>[number]["kind"];

function hasFortRunWindowKind(
  implementation: CardImplementationDefinition,
  kinds: readonly FortRunWindowKind[],
): boolean {
  const wanted = new Set(kinds);
  return (implementation.fortRunWindows ?? []).some((window) =>
    wanted.has(window.kind),
  );
}

export const CORP_ADVANCEMENT_COUNTER_OPERATION_CARD_IDS = cardIdsMatching(
  (implementation) =>
    isCorpCardType(implementation, "operation") &&
    hasEffectKind(implementation, [
      "distribute_advancement_counters",
      "move_advancement_counters",
    ]),
);

export const CORP_FORT_RUN_WINDOW_UPGRADE_CARD_IDS = cardIdsMatching(
  (implementation) =>
    isCorpCardType(implementation, "upgrade") &&
    (implementation.fortRunWindows?.length ?? 0) > 0,
);

export const CORP_TRACE_ASSET_CARD_IDS = cardIdsMatching(
  (implementation) =>
    isCorpCardType(implementation, "asset") &&
    hasEffectKind(implementation, ["trace"]),
);

export const CORP_RUN_TAX_UPGRADE_CARD_IDS = cardIdsMatching(
  (implementation) =>
    isCorpCardType(implementation, "upgrade") &&
    hasFortRunWindowKind(implementation, [
      "temporary_hq_ice_encounter_after_successful_run",
      "block_stealth_bits_during_runs_on_this_fort",
    ]),
);
