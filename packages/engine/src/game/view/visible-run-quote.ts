import {
  DEMO_CARDS_BY_ID,
  type CardInstanceId,
  type GameState,
  type SubroutineDefinition,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import {
  additionalSubroutinesForIce,
  dynamicSubroutineAttributionFor,
} from "../../ability-engine/additional-subroutine-modifiers";
import { quoteBreakSubroutineCostModifiers } from "../../ability-engine/break-subroutine-cost-modifiers";
import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";

export function visibleEffectiveIceRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
): VisibleEffectiveIceRunQuote | undefined {
  if (!visibleIce.known || visibleIce.rezzed !== true || !visibleIce.definitionId)
    return undefined;
  const definition = DEMO_CARDS_BY_ID[visibleIce.definitionId];
  if (!definition || definition.type !== "ice") return undefined;
  const printedSubroutines =
    printedSubroutinesForCardImplementation(definition) ??
    definition.subroutines ??
    [];
  const subroutines = [
    ...printedSubroutines,
    ...runDurationAdditionalSubroutinesForIce(state, iceId),
    ...additionalSubroutinesForIce(state, iceId),
  ].map(visibleEffectiveSubroutine);
  const breakCostQuote = quoteBreakSubroutineCostModifiers(state, iceId, 1);
  const runBreakCost = iceIsOnCurrentRunServer(state, iceId)
    ? Math.max(0, Math.floor(state.run?.breakSubroutineAdditionalCost ?? 0))
    : 0;
  const breakSubroutineAdditionalCostPerSubroutine =
    runBreakCost + breakCostQuote.perSubroutineAdditionalCost;

  return {
    iceInstanceId: visibleIce.instanceId,
    iceDefinitionId: visibleIce.definitionId,
    effectiveStrength: Math.max(0, Math.floor(visibleIce.strength ?? 0)),
    subroutines,
    ...(breakSubroutineAdditionalCostPerSubroutine > 0
      ? { breakSubroutineAdditionalCostPerSubroutine }
      : {}),
    ...(breakCostQuote.modifiers.length > 0
      ? {
          breakSubroutineCostSourceDefinitionIds: breakCostQuote.modifiers.map(
            (modifier) => modifier.sourceDefinitionId,
          ),
          breakSubroutineCostSourceTitles: breakCostQuote.modifiers.map(
            (modifier) => modifier.sourceTitle,
          ),
        }
      : {}),
  };
}

function runDurationAdditionalSubroutinesForIce(
  state: GameState,
  iceId: CardInstanceId,
): SubroutineDefinition[] {
  const sourceIceId = state.run?.futureEncounterEndTheRunSourceIceId;
  if (!sourceIceId || sourceIceId === iceId) return [];
  if (!iceIsOnCurrentRunServer(state, iceId)) return [];
  const sourceDefinitionId = state.cardInstances[sourceIceId]?.definitionId;
  const sourceTitle = sourceDefinitionId
    ? DEMO_CARDS_BY_ID[sourceDefinitionId]?.title
    : undefined;
  return [
    {
      id: "v1922_tutor_future_end_the_run",
      type: "end_the_run",
      ...(sourceDefinitionId
        ? {
            dynamicSubroutine: {
              internalId: `run_duration.${sourceDefinitionId}.additional_subroutine.${sourceIceId}`,
              publicId: `run_duration.${sourceDefinitionId}.additional_subroutine`,
              sourceCardInstanceId: sourceIceId,
              sourceDefinitionId,
              sourceTitle: sourceTitle ?? sourceDefinitionId,
              modifierKind: "additional_subroutine",
              subroutineKind: "end_the_run",
            },
          }
        : {}),
    } as SubroutineDefinition,
  ];
}

function iceIsOnCurrentRunServer(
  state: GameState,
  iceId: CardInstanceId,
): boolean {
  const run = state.run;
  const zone = state.cardInstances[iceId]?.zone;
  return (
    Boolean(run) &&
    zone?.side === "corp" &&
    zone.zone === "serverIce" &&
    zone.serverId === run?.attackedServerId
  );
}

function visibleEffectiveSubroutine(
  subroutine: SubroutineDefinition,
): VisibleEffectiveSubroutine {
  const dynamic = dynamicSubroutineAttributionFor(subroutine);
  return {
    id: subroutine.id,
    type: subroutine.type,
    ...(subroutine.amount !== undefined ? { amount: subroutine.amount } : {}),
    ...(subroutine.breakTags ? { breakTags: subroutine.breakTags.slice() } : {}),
    ...(dynamic
      ? {
          sourceDefinitionId: dynamic.sourceDefinitionId,
          sourceTitle: dynamic.sourceTitle,
          dynamicSourceKind:
            subroutine.id === "v1922_tutor_future_end_the_run"
              ? "run_duration_additional_subroutine"
              : "additional_subroutine",
        }
      : {}),
  };
}
