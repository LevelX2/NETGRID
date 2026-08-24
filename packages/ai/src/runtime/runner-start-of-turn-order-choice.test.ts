import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedRunnerStartOfTurnOrderChoiceOptionId } from "./runner-start-of-turn-order-choice";

describe("Runner start-of-turn order choice", () => {
  it("resolves a due credit gain before an optional installed-card conversion without changing the bound action", () => {
    const smithsPawnshopId =
      "runner_onr_v1_180_smiths-pawnshop_1";
    const topRunnersConferenceId =
      "runner_onr_v1_184_top-runners-conference_1";
    const options = [
      {
        id: `source_${smithsPawnshopId}`,
        label: "Smith's Pawnshop",
        value: smithsPawnshopId,
      },
      {
        id: `source_${topRunnersConferenceId}`,
        label: "Top Runners' Conference",
        value: topRunnersConferenceId,
      },
    ];
    const input = {
      side: "runner",
      seed: "runner-start-order-test",
      decisionId: "runner-start-order-test:89",
      profileId: "runner-start-order-test",
      playerView: {
        stateVersion: 89,
        timingPoint: "runner_action.main",
        winner: null,
        own: {
          credits: 5,
          gripOrHq: [],
          rig: [
            {
              instanceId: smithsPawnshopId,
              definitionId: "onr_v1_180_smiths-pawnshop",
              known: true,
              type: "resource",
            },
            {
              instanceId: topRunnersConferenceId,
              definitionId: "onr_v1_184_top-runners-conference",
              known: true,
              type: "resource",
            },
          ],
          scoreArea: [],
        },
        servers: [],
        opponent: { credits: 5 },
        pendingChoice: {
          choiceId: "runner_start_order_89",
          side: "runner",
          source: "runner_start.order:89",
          prompt: "Choose the next start-of-turn source",
          kind: "select_cards",
          options,
          minSelections: 1,
          maxSelections: 1,
          stateVersion: 89,
          visibility: "hidden_info_barrier",
        },
        legalActions: [],
      },
      legalActions: [],
    } as unknown as AiDecisionInput;
    const action = {
      actionId: "runner.resolve_choice",
      side: "runner",
      type: "resolve_choice",
      label: "Resolve choice",
      source: "game_rule",
      timingPoint: "runner_action.main",
      expiresAtStateVersion: 89,
      costs: [],
      choiceRequirements: [
        {
          choiceId: "runner_start_order_89",
          minSelections: 1,
          maxSelections: 1,
          optionIds: options.map((option) => option.id),
        },
      ],
    } as unknown as LegalAction;
    const actionBefore = structuredClone(action);

    expect(
      selectedRunnerStartOfTurnOrderChoiceOptionId(
        input,
        action,
        input.playerView.pendingChoice!,
        input.playerView.pendingChoice!.options,
      ),
    ).toBe(`source_${topRunnersConferenceId}`);
    expect(action).toEqual(actionBefore);
  });
});
