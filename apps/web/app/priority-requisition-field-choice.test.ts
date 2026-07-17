import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PlayerView, VisibleCard } from "@netgrid/shared";

import {
  fieldCardChoiceAuxiliaryOptions,
  fieldCardChoiceInfo,
  fieldCardChoiceOptionsForCard,
  shouldUseFieldCardChoice,
} from "./action-board-ui";

describe("Priority Requisition field choice", () => {
  const hqIce = card("corp_ice_hq", "HQ Wall");
  const remoteIce = card("corp_ice_remote", "Remote Sentry");
  const board = view([hqIce], [remoteIce]);
  const priorityRequisitionChoice: NonNullable<PlayerView["pendingChoice"]> = {
    choiceId: "v162_scored_agenda_free_rez_8",
    side: "corp",
    source:
      "card_implementation.scored_agenda_free_rez:priority_requisition_1:8",
    prompt: "Priority Requisition: ICE kostenlos rezzen",
    kind: "select_cards",
    options: [
      { id: "card_corp_ice_hq", label: "HQ Wall", value: "corp_ice_hq" },
      {
        id: "card_corp_ice_remote",
        label: "Remote Sentry",
        value: "corp_ice_remote",
      },
      { id: "skip", label: "Überspringen", publicLabel: "Überspringen" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
  };

  it("keeps both ICE selectable at their Fort positions and presents skip separately", () => {
    expect(shouldUseFieldCardChoice(priorityRequisitionChoice, board)).toBe(
      true,
    );
    expect(
      fieldCardChoiceOptionsForCard(
        priorityRequisitionChoice,
        board,
        hqIce,
      ).map((option) => option.id),
    ).toEqual(["card_corp_ice_hq"]);
    expect(
      fieldCardChoiceOptionsForCard(
        priorityRequisitionChoice,
        board,
        remoteIce,
      ).map((option) => option.id),
    ).toEqual(["card_corp_ice_remote"]);
    expect(
      fieldCardChoiceAuxiliaryOptions(priorityRequisitionChoice).map(
        (option) => option.id,
      ),
    ).toEqual(["skip"]);
  });

  it("counts only the directly selected ICE toward the 0/1 to 1/1 confirmation", () => {
    expect(fieldCardChoiceInfo(priorityRequisitionChoice, [])).toMatchObject({
      counterLabel: "0/1",
      canSubmit: false,
      canClear: false,
    });
    expect(
      fieldCardChoiceInfo(priorityRequisitionChoice, ["card_corp_ice_hq"]),
    ).toMatchObject({
      counterLabel: "1/1",
      canSubmit: true,
      canClear: true,
    });
    expect(
      fieldCardChoiceInfo(priorityRequisitionChoice, ["skip"]),
    ).toMatchObject({
      counterLabel: "0/1",
      canSubmit: false,
      canClear: false,
    });
  });

  it("resolves the separate action-board skip button with only the engine skip option", () => {
    const source = readFileSync(
      new URL("../features/actions/ChoicePanels.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      'data-testid="field-card-choice-auxiliary-option"',
    );
    expect(source).toMatch(
      /onChoiceOptions\(action, choice\.choiceId, \[option\.id\]\)/,
    );
  });

  it("keeps unknown mixed card and non-card choices on the safe fallback", () => {
    const unknownChoice = {
      ...priorityRequisitionChoice,
      choiceId: "unknown_mixed_choice",
      source: "unknown.mixed_choice:8",
    };

    expect(fieldCardChoiceAuxiliaryOptions(unknownChoice)).toEqual([]);
    expect(shouldUseFieldCardChoice(unknownChoice, board)).toBe(false);
  });
});

function card(instanceId: string, title: string): VisibleCard {
  return {
    instanceId,
    known: true,
    title,
    definitionId: instanceId,
    type: "ice",
    rezzed: false,
  };
}

function view(hqIce: VisibleCard[], remoteIce: VisibleCard[]): PlayerView {
  const identity = (side: "corp" | "runner"): VisibleCard => ({
    instanceId: `${side}_identity`,
    known: true,
    title: `${side} identity`,
    definitionId: `${side}_identity`,
    type: "identity",
    rezzed: true,
  });
  return {
    side: "corp",
    stateVersion: 8,
    timingPoint: "corp_action.main",
    activeSide: "corp",
    phase: "corp_action_phase",
    own: {
      identity: identity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 2,
      gripOrHq: [],
      stackOrRdCount: 10,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identity("runner"),
      credits: 5,
      clicks: 4,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 10,
      discardCount: 0,
      scoreArea: [],
      rig: [],
    },
    servers: [
      { id: "hq", label: "HQ", ice: hqIce, root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: remoteIce,
        root: [],
      },
    ],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  };
}
