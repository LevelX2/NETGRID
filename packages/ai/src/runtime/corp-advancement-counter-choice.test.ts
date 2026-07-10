import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { selectedCorpAdvancementCounterChoiceOptionId } from "./corp-advancement-counter-choice";

describe("selectedCorpAdvancementCounterChoiceOptionId", () => {
  it("concentrates a burst on the agenda that becomes scoreable", () => {
    const agenda = card("agenda", "onr_v1_194_corporate-downsizing", {
      type: "agenda",
      advancementRequirement: 3,
      advancementCounters: 1,
    });
    const asset = card("asset", "onr_v1_347_vapor-ops", {
      type: "asset",
      advancementCounters: 0,
    });
    const input = decisionInput([agenda, asset]);
    const options = [
      {
        id: "agenda_score",
        label: "Agenda 2",
        value: `${agenda.instanceId}:2`,
      },
      {
        id: "split",
        label: "Agenda 1, Asset 1",
        value: `${agenda.instanceId}:1|${asset.instanceId}:1`,
      },
      {
        id: "asset_bank",
        label: "Asset 2",
        value: `${asset.instanceId}:2`,
      },
    ];

    expect(
      selectedCorpAdvancementCounterChoiceOptionId(input, options as never),
    ).toBe("agenda_score");
  });
});

function card(
  instanceId: string,
  definitionId: string,
  overrides: Partial<VisibleCard>,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type: "asset",
    known: true,
    owner: "corp",
    controller: "corp",
    ...overrides,
  };
}

function decisionInput(root: VisibleCard[]): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-id", "corp-id", {}),
        credits: 10,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "runner-id", {}),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [{ id: "remote_1", label: "Remote 1", ice: [], root }],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "advancement-choice-test",
    decisionId: "advancement-choice-test",
    actionNumber: 1,
    profileId: "advancement-choice-test",
  } as AiDecisionInput;
}
