import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { runnerTerminalRemoteToolScoreComponent } from "./runner-terminal-remote-tool-score";

describe("runnerTerminalRemoteToolScoreComponent", () => {
  it("prioritizes visible expose semantics against a possible matchpoint remote", () => {
    const component = runnerTerminalRemoteToolScoreComponent(
      input({ advancementCounters: 0 }),
      action("see-ya", "activated_card_ability"),
      candidate("effect:expose_info"),
    );

    expect(component).toMatchObject({
      key: "runner_terminal_remote_tool",
      value: 1800,
    });
    expect(component?.reason).toContain("terminal_remote_tool:expose_info");
  });

  it("prioritizes visible ICE disruption for an advanced matchpoint remote", () => {
    const component = runnerTerminalRemoteToolScoreComponent(
      input({ advancementCounters: 2 }),
      action("forged", "play_event"),
      candidate("effect:ice_trash"),
    );

    expect(component).toMatchObject({
      key: "runner_terminal_remote_tool",
      value: 2200,
    });
    expect(component?.reason).toContain("terminal_remote_tool:ice_disruption");
  });

  it("does not create terminal urgency below the Corp matchpoint", () => {
    const current = input({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("forged", "play_event"),
        candidate("effect:ice_trash"),
      ),
    ).toBeUndefined();
  });

  it("does not start an ICE-disruption sequence without a follow-up click", () => {
    const current = input({ advancementCounters: 2 });
    current.playerView.own.clicks = 1;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("forged", "play_event"),
        candidate("effect:ice_trash"),
      ),
    ).toBeUndefined();
  });
});

function input(options: { advancementCounters: number }): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      agendaPointsToWin: 7,
      own: { agendaPoints: 0, clicks: 4 },
      opponent: { agendaPoints: 6 },
      servers: [
        {
          id: "remote_1",
          root: [
            {
              instanceId: "hidden-root",
              known: false,
              advancementCounters: options.advancementCounters,
            },
          ],
          ice: [
            {
              instanceId: "rezzed-ice",
              definitionId: "visible-ice",
              known: true,
              rezzed: true,
            },
          ],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function action(actionId: string, type: LegalAction["type"]): LegalAction {
  return { actionId, side: "runner", type } as LegalAction;
}

function candidate(signal: string): ActionSemanticCandidate {
  return {
    actorSide: "runner",
    semanticActionType: signal,
    actionTacticSignals: [signal],
    cardContextSignals: [],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}
