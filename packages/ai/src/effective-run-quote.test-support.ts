import type {
  PlayerView,
  VisibleCard,
  VisibleCorpIcePostRezRunQuote,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";

type EffectiveRunQuoteFields = Omit<
  VisibleEffectiveIceRunQuote,
  "iceInstanceId" | "iceDefinitionId"
>;

/**
 * Builds the same card-bound quote shape that the Engine projects into a
 * PlayerView. Every effect remains explicit at the call site; this helper only
 * binds the quote to the concrete visible card instance and definition.
 */
export function effectiveRunQuote(
  ice: VisibleCard,
  fields: EffectiveRunQuoteFields,
): VisibleEffectiveIceRunQuote {
  if (!ice.definitionId) {
    throw new Error(
      `Effective run quote fixture ${ice.instanceId} needs a definitionId.`,
    );
  }
  return {
    iceInstanceId: ice.instanceId,
    iceDefinitionId: ice.definitionId,
    ...fields,
  };
}

export function withEffectiveRunQuote(
  ice: VisibleCard,
  fields: EffectiveRunQuoteFields,
): VisibleCard {
  return {
    ...ice,
    effectiveRunQuote: effectiveRunQuote(ice, fields),
  };
}

export function withPostRezRunQuote(
  ice: VisibleCard,
  binding: {
    serverId: PlayerView["servers"][number]["id"];
    stateVersion: number;
  },
  fields: EffectiveRunQuoteFields,
): VisibleCard {
  const quote: VisibleCorpIcePostRezRunQuote = {
    context: "installed_post_rez",
    cardId: ice.instanceId,
    iceDefinitionId: requireDefinitionId(ice),
    targetServerId: binding.serverId,
    projectedServerId: binding.serverId,
    expiresAtStateVersion: binding.stateVersion,
    complete: true,
    effectiveRunQuote: effectiveRunQuote(ice, fields),
  };
  return {
    ...ice,
    effectivePostRezRunQuote: quote,
  };
}

function requireDefinitionId(ice: VisibleCard): string {
  if (!ice.definitionId) {
    throw new Error(
      `Post-rez run quote fixture ${ice.instanceId} needs a definitionId.`,
    );
  }
  return ice.definitionId;
}
