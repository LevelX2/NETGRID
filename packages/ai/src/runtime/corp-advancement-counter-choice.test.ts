import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { selectedCorpAdvancementCounterChoiceOptionId } from "./corp-advancement-counter-choice";

describe("selectedCorpAdvancementCounterChoiceOptionId", () => {
  it("honors the planned overadvance amount on the bound agenda", () => {
    const input = decisionInput([
      card("agenda", "simple_agenda", {
        type: "agenda",
        advancementRequirement: 3,
        advancementCounters: 0,
      }),
    ]);

    expect(
      selectedCorpAdvancementCounterChoiceOptionId(
        input,
        [
          { id: "exact", label: "3", value: "vapor|agenda|3" },
          {
            id: "overadvance",
            label: "5",
            value: "vapor|agenda|5",
          },
        ] as never,
        "agenda",
        5,
      ),
    ).toBe("overadvance");
  });

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

  it("parses move choices and binds them to the planned agenda", () => {
    const plannedAgenda = card("planned-agenda", "simple_agenda", {
      type: "agenda",
      advancementRequirement: 3,
      advancementCounters: 0,
    });
    const otherAgenda = card("other-agenda", "simple_agenda", {
      type: "agenda",
      advancementRequirement: 3,
      advancementCounters: 1,
    });
    const vapor = card("vapor", "onr_v1_347_vapor-ops", {
      type: "asset",
      advancementCounters: 3,
    });
    const input = decisionInput([plannedAgenda, otherAgenda, vapor]);
    const options = [
      {
        id: "alphabetically_first_wrong_target",
        label: "2 auf andere Agenda",
        value: `${vapor.instanceId}|${otherAgenda.instanceId}|2`,
      },
      {
        id: "planned_exact_fit",
        label: "3 auf geplante Agenda",
        value: `${vapor.instanceId}|${plannedAgenda.instanceId}|3`,
      },
      {
        id: "planned_short",
        label: "2 auf geplante Agenda",
        value: `${vapor.instanceId}|${plannedAgenda.instanceId}|2`,
      },
    ];

    expect(
      selectedCorpAdvancementCounterChoiceOptionId(
        input,
        options as never,
        plannedAgenda.instanceId,
      ),
    ).toBe("planned_exact_fit");
  });

  it("completes the exact two-target placement bound by the score plan", () => {
    const agenda = card("agenda", "simple_agenda", {
      type: "agenda",
      advancementRequirement: 4,
    });
    const bank = card("bank", "onr_v1_348_virus-test-site", {
      advancementCounters: 3,
    });
    const input = decisionInput([agenda, bank]);
    const options = [
      { id: "agenda-only", label: "Agenda", value: "agenda:1" },
      {
        id: "agenda-and-bank",
        label: "Agenda und Bank",
        value: "bank:1|agenda:1",
      },
    ];

    expect(
      selectedCorpAdvancementCounterChoiceOptionId(
        input,
        options as never,
        agenda.instanceId,
        undefined,
        undefined,
        {
          placements: [
            { targetCardId: agenda.instanceId, amount: 1 },
            { targetCardId: bank.instanceId, amount: 1 },
          ],
        },
      ),
    ).toBe("agenda-and-bank");
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
