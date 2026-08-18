import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { selectedCorpDiscardChoiceOptionIds } from "./corp-discard-choice-selection";

describe("selectedCorpDiscardChoiceOptionIds", () => {
  it("keeps the aggregate discard batch from exposing matchpoint in open Archives", () => {
    const cards = [
      agenda("agenda-1", 2),
      agenda("agenda-2", 2),
      operation("operation-1"),
      operation("operation-2"),
    ];
    const input = discardInput(cards, { runnerAgendaPoints: 4 });
    const choice = input.playerView.pendingChoice!;

    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) => ({
        total: candidate.type === "agenda" ? 100 : 0,
        planDisposition: "redundant",
      }),
    );

    expect(selection).toMatchObject({
      selectedOptionIds: ["option-operation-1", "option-operation-2"],
      archivesReachable: true,
      exposedAgendaPoints: 0,
      terminalAgendaExposure: false,
    });
  });

  it("does not turn agenda protection into a hard ban when the alternative belongs to the current plan", () => {
    const cards = [agenda("agenda-1", 2), operation("operation-1")];
    const input = discardInput(cards, { runnerAgendaPoints: 4, count: 1 });
    const choice = input.playerView.pendingChoice!;

    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) =>
        candidate.type === "agenda"
          ? { total: 0, planDisposition: "redundant" }
          : { total: -1_000, planDisposition: "current_plan_route" },
    );

    expect(selection?.selectedOptionIds).toEqual(["option-agenda-1"]);
    expect(selection?.terminalAgendaExposure).toBe(false);
  });

  it("allows an otherwise low-value agenda discard when Archives is not immediately reachable", () => {
    const cards = [agenda("agenda-1", 2), operation("operation-1")];
    const input = discardInput(cards, {
      runnerAgendaPoints: 4,
      count: 1,
      archivesIce: [ice("archives-ice")],
    });
    const choice = input.playerView.pendingChoice!;

    const selection = selectedCorpDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) => ({
        total: candidate.type === "agenda" ? 0 : 500,
        planDisposition: "redundant",
      }),
    );

    expect(selection).toMatchObject({
      selectedOptionIds: ["option-agenda-1"],
      archivesReachable: false,
      exposedAgendaPoints: 2,
      terminalAgendaExposure: false,
    });
  });

  it("fails closed when an agenda in the exact batch has no known point value", () => {
    const unknownAgenda = {
      ...agenda("agenda-unknown", 2),
      agendaPoints: undefined,
      definitionId: "unknown-agenda-definition",
    } as unknown as VisibleCard;
    const input = discardInput([unknownAgenda, operation("operation-1")], {
      count: 1,
    });
    const choice = input.playerView.pendingChoice!;

    expect(
      selectedCorpDiscardChoiceOptionIds(input, choice, choice.options, () => ({
        total: 0,
      })),
    ).toBeUndefined();
  });
});

function agenda(instanceId: string, agendaPoints: number): VisibleCard {
  return {
    instanceId,
    definitionId: `definition-${instanceId}`,
    title: instanceId,
    type: "agenda",
    agendaPoints,
    known: true,
  } as VisibleCard;
}

function operation(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: `definition-${instanceId}`,
    title: instanceId,
    type: "operation",
    known: true,
  } as VisibleCard;
}

function ice(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: `definition-${instanceId}`,
    title: instanceId,
    type: "ice",
    known: true,
  } as VisibleCard;
}

function discardInput(
  cards: VisibleCard[],
  options: {
    count?: number;
    runnerAgendaPoints?: number;
    archivesIce?: VisibleCard[];
  } = {},
): AiDecisionInput {
  const count = options.count ?? 2;
  return {
    side: "corp",
    playerView: {
      own: { gripOrHq: cards },
      opponent: { agendaPoints: options.runnerAgendaPoints ?? 0 },
      agendaPointsToWin: 7,
      servers: [
        {
          id: "archives",
          label: "Archives",
          ice: options.archivesIce ?? [],
          root: [],
        },
      ],
      pendingChoice: {
        choiceId: "corp-discard-test",
        kind: "select_cards",
        side: "corp",
        source: "discard_phase",
        minSelections: count,
        maxSelections: count,
        options: cards.map((candidate) => ({
          id: `option-${candidate.instanceId}`,
          label: candidate.title ?? candidate.instanceId,
          value: candidate.instanceId,
        })),
      },
    },
  } as unknown as AiDecisionInput;
}
