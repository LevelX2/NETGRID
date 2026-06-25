import { type AiDecisionInput, type VisibleCard, type Side } from "@netgrid/shared";

import { type ServerFeatures } from "./ai-feature-server";

type ObservedFacts = {
  readonly eventCounts: Record<string, number>;
};

type KnownPathAssessment = {
  readonly canReachAccess: boolean;
};

type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

export type AiFeatures = {
  side: Side;
  credits: number;
  clicks: number;
  tags: number;
  citySurveillanceSourceCount: number;
  opponentCredits: number;
  opponentTags: number;
  memoryRemaining: number;
  handCount: number;
  rigRoles: Set<string>;
  rigDefinitionIds: Set<string>;
  handRoles: Set<string>;
  eventCounts: Record<string, number>;
  knownServerPressure: number;
  blockedRunServers: Set<string>;
  serverFeaturesById: Map<string, ServerFeatures>;
};

export type AiFeaturesDependencies = {
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly buildObservedFacts: (input: AiDecisionInput) => ObservedFacts;
  readonly buildServerFeatures: (
    input: AiDecisionInput,
  ) => Map<string, ServerFeatures>;
  readonly assessKnownRezzedIcePath: (
    ice: VisibleCard[],
    rig: VisibleCard[],
    credits: number,
    root: VisibleCard[],
  ) => KnownPathAssessment;
  readonly isBlockedByKnownRezzedIce: (
    ice: VisibleCard | undefined,
    rigDefinitionIds: Set<string>,
  ) => boolean;
  readonly visibleCitySurveillanceSourceCount: (
    input: AiDecisionInput,
  ) => number;
};

export function extractAiFeatures(
  input: AiDecisionInput,
  dependencies: AiFeaturesDependencies,
): AiFeatures {
  const ownCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
  ];
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      dependencies.rolesForCardId(card.definitionId),
    ),
  );
  const rigDefinitionIds = new Set(
    (input.playerView.own.rig ?? [])
      .map((card) => card.definitionId)
      .filter((id): id is string => Boolean(id)),
  );
  const handRoles = new Set(
    input.playerView.own.gripOrHq.flatMap((card) =>
      dependencies.rolesForCardId(card.definitionId),
    ),
  );
  const eventCounts = dependencies.buildObservedFacts(input).eventCounts;
  const serverFeaturesById = dependencies.buildServerFeatures(input);
  const knownServerPressure = input.playerView.servers.reduce(
    (sum, server) =>
      sum +
      server.ice.filter((card) => card.known || card.rezzed).length +
      server.root.filter((card) => card.known).length,
    0,
  );
  const blockedRunServers = new Set(
    input.playerView.servers
      .filter((server: VisibleServer) => {
        const knownPath = dependencies.assessKnownRezzedIcePath(
          server.ice.slice(),
          (input.playerView.own.rig ?? []).slice(),
          input.playerView.own.credits,
          server.root.slice(),
        );
        return (
          knownPath.canReachAccess === false ||
          dependencies.isBlockedByKnownRezzedIce(
            server.ice.at(-1),
            rigDefinitionIds,
          )
        );
      })
      .map((server) => server.id),
  );
  return {
    side: input.side,
    credits: input.playerView.own.credits,
    clicks: input.playerView.own.clicks,
    tags: input.playerView.own.tags,
    citySurveillanceSourceCount:
      dependencies.visibleCitySurveillanceSourceCount(input),
    opponentCredits: input.playerView.opponent.credits,
    opponentTags: input.playerView.opponent.tags,
    memoryRemaining:
      (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0),
    handCount: input.playerView.own.gripOrHq.length,
    rigRoles,
    rigDefinitionIds,
    handRoles: new Set([
      ...handRoles,
      ...ownCards
        .flatMap((card) => dependencies.rolesForCardId(card.definitionId))
        .filter((role) => role === "tag_punishment"),
    ]),
    eventCounts,
    knownServerPressure,
    blockedRunServers,
    serverFeaturesById,
  };
}
