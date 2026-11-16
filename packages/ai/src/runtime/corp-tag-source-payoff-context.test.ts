import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { classifyTagPunishPayoffFromOntology } from "../tag-punish-ontology-consumer";
import { createCorpTagSourcePayoffContext } from "./corp-tag-source-payoff-context";

const source = {
  side: "corp",
  type: "play_operation",
  source: "source-instance",
  actionId: "tag",
} as LegalAction;

const payoffCard = {
  known: true,
  definitionId: "onr_v1_302_scorched-earth",
};

function knownPayoffInstances(instances: string[]) {
  const assess = createCorpTagSourcePayoffContext({
    tagPunishAssessmentForAction: () => undefined,
    payoffProfileForDefinition: classifyTagPunishPayoffFromOntology,
  });
  return assess(
    {
      side: "corp",
      legalActions: [source],
      playerView: {
        own: {
          gripOrHq: instances.map((instanceId) => ({
            ...payoffCard,
            instanceId,
          })),
          scoreArea: [],
          heapOrArchives: [],
        },
        servers: [],
      },
    } as unknown as AiDecisionInput,
    source,
  );
}

describe("Corp tag-source payoff availability", () => {
  it("only counts a payoff instance that remains after the source operation", () => {
    expect(knownPayoffInstances([source.source])).toBe(false);
    expect(knownPayoffInstances([source.source, "remaining-payoff"])).toBe(
      true,
    );
  });
});
