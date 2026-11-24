import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assessDecisionOpportunity } from "./decision-opportunity";

describe("assessDecisionOpportunity", () => {
  it("classifies an alternative-free end turn as forced terminal", () => {
    const end = action("end", "end_turn");
    expect(assessDecisionOpportunity(input([end]), end)).toEqual({
      kind: "forced_terminal",
      legalActionCount: 1,
      actionableAlternativeCount: 0,
      evidence: [
        "decision_opportunity:forced_terminal",
        "decision_legal_action_count:1",
        "decision_actionable_alternative_count:0",
      ],
    });
  });

  it("keeps end turn competitive when a productive legal alternative exists", () => {
    const end = action("end", "end_turn");
    const draw = action("draw", "draw_card");
    expect(assessDecisionOpportunity(input([end, draw]), end)).toMatchObject({
      kind: "competitive",
      legalActionCount: 2,
      actionableAlternativeCount: 1,
    });
  });

  it.each([
    {
      min: 1,
      max: 1,
      options: 1,
      ordered: false,
      kind: "forced_choice",
      alternatives: 0,
    },
    {
      min: 0,
      max: 1,
      options: 1,
      ordered: false,
      kind: "competitive",
      alternatives: 1,
    },
    {
      min: 1,
      max: 1,
      options: 3,
      ordered: false,
      kind: "competitive",
      alternatives: 2,
    },
    {
      min: 2,
      max: 2,
      options: 2,
      ordered: false,
      kind: "forced_choice",
      alternatives: 0,
    },
    {
      min: 2,
      max: 2,
      options: 2,
      ordered: true,
      kind: "competitive",
      alternatives: 1,
    },
  ])(
    "counts legal selections ($min-$max of $options, ordered=$ordered)",
    ({ min, max, options, ordered, kind, alternatives }) => {
      const choiceOptions = Array.from({ length: options }, (_, i) => ({
        id: `card_${i}`,
        label: `Card ${i}`,
      }));
      const disabled = { id: "disabled", label: "Disabled", selectable: false };
      const opts = [...choiceOptions, disabled];
      const resolve: LegalAction = {
        ...action("resolve", "resolve_choice"),
        source: "game_rule",
        choiceRequirements: [
          {
            choiceId: "current-choice",
            optionIds: opts.map(({ id }) => id),
            minSelections: min,
            maxSelections: max,
          },
        ],
      };
      const decisionInput = input([resolve]);
      decisionInput.playerView.pendingChoice = {
        choiceId: "current-choice",
        side: "corp",
        source: "test",
        prompt: "Choose",
        kind: "select_cards",
        options: opts,
        minSelections: min,
        maxSelections: max,
        selectionOrdering: ordered ? "ordered" : "unordered",
        stateVersion: 1,
        visibility: "private_to_side",
      };

      expect(assessDecisionOpportunity(decisionInput, resolve)).toMatchObject({
        kind,
        actionableAlternativeCount: alternatives,
      });
    },
  );
});

function input(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "corp",
    profileId: "forced-decision-test",
    difficulty: "hard",
    playerView: {
      side: "corp",
      stateVersion: 1,
      activeSide: "corp",
      phase: "corp_action_phase",
      timingPoint: "corp_action.main",
      own: {
        identity: { instanceId: "corp-id", known: true },
        credits: 5,
        clicks: 0,
        agendaPoints: 0,
        tags: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        gripOrHqCount: 5,
        heapOrArchivesCount: 0,
        scoreArea: [],
      },
      servers: [],
    },
    legalActions,
    eventTail: [],
  } as unknown as AiDecisionInput;
}

function action(actionId: string, type: LegalAction["type"]): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    source: "basic_action",
    payload: {},
    costs: [],
    stateVersion: 1,
    expiresAtStateVersion: 1,
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    targetRequirements: [],
  } as unknown as LegalAction;
}
