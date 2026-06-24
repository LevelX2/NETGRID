import type { VisibleCard } from "@netgrid/shared";
import {
  visibleCardAdvancementRequirement as buildVisibleCardAdvancementRequirement,
  visibleCardType as buildVisibleCardType,
  visibleIceRezCost as buildVisibleIceRezCost,
  type VisibleCardDemoDefinition,
  type VisibleCardRuntimeDefinition,
} from "./visible-card-heuristics";

export type SemanticRuntimeVisibleCardContextDependencies = {
  runtimeDefinition: (
    definitionId: string,
  ) => VisibleCardRuntimeDefinition | undefined;
  demoDefinition: (definitionId: string) => VisibleCardDemoDefinition | undefined;
};

export type SemanticRuntimeVisibleCardContext = {
  semanticRuntimeVisibleCardType: (
    card: VisibleCard,
  ) => string | undefined;
  semanticRuntimeVisibleCardAdvancementRequirement: (
    card: VisibleCard,
  ) => number | undefined;
  semanticRuntimeVisibleIceRezCost: (
    card: VisibleCard,
  ) => number | undefined;
};

export function createSemanticRuntimeVisibleCardContext(
  dependencies: SemanticRuntimeVisibleCardContextDependencies,
): SemanticRuntimeVisibleCardContext {
  function semanticRuntimeVisibleCardType(
    card: VisibleCard,
  ): string | undefined {
    const definitionId = card.definitionId;
    return buildVisibleCardType(
      card,
      definitionId ? dependencies.runtimeDefinition(definitionId) : undefined,
      definitionId ? dependencies.demoDefinition(definitionId) : undefined,
    );
  }

  function semanticRuntimeVisibleCardAdvancementRequirement(
    card: VisibleCard,
  ): number | undefined {
    const definitionId = card.definitionId;
    return buildVisibleCardAdvancementRequirement(
      card,
      definitionId ? dependencies.runtimeDefinition(definitionId) : undefined,
      definitionId ? dependencies.demoDefinition(definitionId) : undefined,
    );
  }

  function semanticRuntimeVisibleIceRezCost(
    card: VisibleCard,
  ): number | undefined {
    const definitionId = card.definitionId;
    return buildVisibleIceRezCost(
      card,
      definitionId ? dependencies.runtimeDefinition(definitionId) : undefined,
      definitionId ? dependencies.demoDefinition(definitionId) : undefined,
    );
  }

  return {
    semanticRuntimeVisibleCardType,
    semanticRuntimeVisibleCardAdvancementRequirement,
    semanticRuntimeVisibleIceRezCost,
  };
}
