import { type AiDecisionInput } from "@netgrid/shared";
import { classifyTagSourceFromOntology } from "../tag-punish-ontology-consumer";

export type ServerFeatures = {
  iceCount: number;
  rootCount: number;
  knownRootCount: number;
  unrezzedRootCount: number;
  rezzedRootCount: number;
};

export function buildServerFeatures(
  input: AiDecisionInput,
): Map<string, ServerFeatures> {
  return new Map(
    input.playerView.servers.map((server) => [
      server.id,
      {
        iceCount: server.ice.length,
        rootCount: server.root.length,
        knownRootCount: server.root.filter((card) => card.known).length,
        unrezzedRootCount: server.root.filter((card) => card.rezzed !== true)
          .length,
        rezzedRootCount: server.root.filter((card) => card.rezzed === true)
          .length,
      },
    ]),
  );
}

export function visibleCitySurveillanceSourceCount(
  input: AiDecisionInput,
): number {
  return input.playerView.servers.reduce(
    (count, server) =>
      count +
      server.root.filter(
        (card) =>
          card.known &&
          card.rezzed === true &&
          Boolean(classifyTagSourceFromOntology(card.definitionId)),
      ).length,
    0,
  );
}
