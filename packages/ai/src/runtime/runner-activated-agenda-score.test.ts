import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerActivatedAgendaScoreComponents } from "./runner-activated-agenda-score";

describe("runnerActivatedAgendaScoreComponents", () => {
  it("values an engine-declared visible agenda score", () => {
    const action = activatedAbility({
      cardImplementationScoresSourceAsAgenda: true,
    });
    const input = runnerInput(action, visibleAgenda(3), 2, 7);

    expect(runnerActivatedAgendaScoreComponents(input, action)).toEqual([
      expect.objectContaining({
        key: "runner_activated_agenda_score",
        value: 9600,
        reason: "agenda_points:3|source_visible:true|engine_effect:true",
      }),
    ]);
  });

  it("adds matchpoint value when the score ends the game", () => {
    const action = activatedAbility({
      cardImplementationScoresSourceAsAgenda: true,
    });
    const input = runnerInput(action, visibleAgenda(3), 4, 7);

    expect(runnerActivatedAgendaScoreComponents(input, action)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_activated_agenda_matchpoint",
          value: 5000,
        }),
      ]),
    );
  });

  it("does not value an arbitrary activated ability", () => {
    const action = activatedAbility({ gainCreditsAmount: 3 });
    const input = runnerInput(action, visibleAgenda(3), 2, 7);

    expect(runnerActivatedAgendaScoreComponents(input, action)).toEqual([]);
  });

  it("does not infer points from a source absent from the actor view", () => {
    const action = activatedAbility({
      cardImplementationScoresSourceAsAgenda: true,
    });
    const input = runnerInput(action, undefined, 2, 7);

    expect(runnerActivatedAgendaScoreComponents(input, action)).toEqual([]);
  });
});

function activatedAbility(
  payload: NonNullable<LegalAction["payload"]>,
): LegalAction {
  return {
    actionId: "runner.activated_card_ability.visible-agenda",
    side: "runner",
    type: "activated_card_ability",
    label: "Aktivieren",
    source: "visible-agenda",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload,
  };
}

function visibleAgenda(agendaPoints: number): VisibleCard {
  return {
    instanceId: "visible-agenda",
    definitionId: "test-visible-agenda",
    title: "Sichtbare Agenda",
    owner: "corp",
    controller: "runner",
    type: "agenda",
    agendaPoints,
    known: true,
  };
}

function runnerInput(
  action: LegalAction,
  source: VisibleCard | undefined,
  agendaPoints: number,
  agendaPointsToWin: number,
): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [action],
    playerView: {
      own: {
        rig: source ? [source] : [],
        agendaPoints,
      },
      agendaPointsToWin,
    },
  } as AiDecisionInput;
}
