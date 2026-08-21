import { type AiDecisionInput } from "@netgrid/shared";

import { type ServerFeatures } from "./ai-feature-server";

export type AiFeatures = {
  credits: number;
  memoryRemaining: number;
  hasInstalledNonNoisyIcebreaker: boolean;
  rigRoles: Set<string>;
  rigDefinitionIds: Set<string>;
  gripDefinitionCounts: Map<string, number>;
  serverFeaturesById: Map<string, ServerFeatures>;
};

export type AiFeaturesDependencies = {
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly buildServerFeatures: (
    input: AiDecisionInput,
  ) => Map<string, ServerFeatures>;
};

export function extractAiFeatures(
  input: AiDecisionInput,
  dependencies: AiFeaturesDependencies,
): AiFeatures {
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      dependencies.rolesForCardId(card.definitionId),
    ),
  );
  const hasInstalledNonNoisyIcebreaker = (input.playerView.own.rig ?? []).some(
    (card) => {
      const subtypes = new Set(
        (card.subtypes ?? []).map((subtype) =>
          subtype.trim().toLocaleLowerCase("en-US"),
        ),
      );
      return (
        (subtypes.has("icebreaker") ||
          ["fracter", "decoder", "killer", "worm"].some((subtype) =>
            subtypes.has(subtype),
          )) &&
        !subtypes.has("noisy")
      );
    },
  );
  const rigDefinitionIds = new Set(
    (input.playerView.own.rig ?? [])
      .map((card) => card.definitionId)
      .filter((id): id is string => Boolean(id)),
  );
  const gripDefinitionCounts = new Map<string, number>();
  for (const card of input.playerView.own.gripOrHq) {
    if (!card.definitionId) continue;
    gripDefinitionCounts.set(
      card.definitionId,
      (gripDefinitionCounts.get(card.definitionId) ?? 0) + 1,
    );
  }
  const serverFeaturesById = dependencies.buildServerFeatures(input);
  return {
    credits: input.playerView.own.credits,
    memoryRemaining:
      (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0),
    hasInstalledNonNoisyIcebreaker,
    rigRoles,
    rigDefinitionIds,
    gripDefinitionCounts,
    serverFeaturesById,
  };
}
