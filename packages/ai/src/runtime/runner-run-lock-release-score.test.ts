import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerRunLockReleaseScoreComponent } from "./runner-run-lock-release-score";

describe("runnerRunLockReleaseScoreComponent", () => {
  it("converts a payable matchpoint lock into a plausible HQ follow-up", () => {
    const component = runnerRunLockReleaseScoreComponent(
      input(),
      releaseAction(),
    );

    expect(component).toMatchObject({
      key: "runner_matchpoint_run_lock_release",
      value: 4100,
    });
    expect(component?.reason).toContain("follow_up_server:hq");
  });

  it("does not release without a click for the follow-up run", () => {
    const current = input();
    current.playerView.own.clicks = 1;

    expect(
      runnerRunLockReleaseScoreComponent(current, releaseAction()),
    ).toBeUndefined();
  });

  it("does not release into an unaffordable unknown path", () => {
    const current = input();
    current.playerView.own.credits = 2;

    expect(
      runnerRunLockReleaseScoreComponent(current, releaseAction()),
    ).toBeUndefined();
  });

  it("does not release into a known rezzed ETR path without breaker coverage", () => {
    const current = input();
    current.playerView.servers[0]!.ice = [
      {
        instanceId: "known-data-wall",
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        type: "ice",
        known: true,
        rezzed: true,
      },
    ];
    current.playerView.own.rig = [];

    expect(
      runnerRunLockReleaseScoreComponent(current, releaseAction()),
    ).toBeUndefined();
  });

  it("does not create terminal urgency below Corp matchpoint", () => {
    const current = input();
    current.playerView.opponent.agendaPoints = 4;

    expect(
      runnerRunLockReleaseScoreComponent(current, releaseAction()),
    ).toBeUndefined();
  });
});

function input(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      agendaPointsToWin: 7,
      own: { credits: 4, clicks: 4 },
      opponent: { agendaPoints: 6, handCount: 5, deckCount: 20 },
      servers: [
        {
          id: "hq",
          root: [],
          ice: [{ instanceId: "hidden_hq_ice", known: false, rezzed: false }],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function releaseAction(): LegalAction {
  return {
    actionId: "runner.trigger_ability",
    side: "runner",
    type: "trigger_ability",
    costs: [{ clicks: 1, credits: 2 }],
    payload: {
      abilityId: "pay_to_remove_run_lock",
      v1920RunnerRunLockAbility: "pay_to_remove_run_lock",
    },
  } as unknown as LegalAction;
}
