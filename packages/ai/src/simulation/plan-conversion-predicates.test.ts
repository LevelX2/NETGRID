import type { GameState, PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { simulationActionLocation } from "../runtime/simulation-action-target";
import { legalAction } from "../semantic-ai-runtime-cutover.test-support";
import {
  corpProtectionConvertsToScoreSafety,
  corpRemoteCreatedConvertsTo,
  isRunnerSetupAction,
  planKindForConversion,
  planIntentConvertedWithin,
  runnerProbeConvertsToUsefulInfoOrPivot,
  runnerRemoteContestConvertsToStealTrashOrAbort,
} from "./plan-conversion-predicates";

describe("planIntentConvertedWithin", () => {
  it("matches plan kinds by bounded terms", () => {
    const sequence = [
      { side: "runner", actionType: "draw_card" },
      { side: "runner", actionType: "start_run", targetServerId: "rd" },
      { side: "runner", actionType: "steal_agenda", targetServerId: "rd" },
    ];
    expect(converted(sequence, "setup_plan")).toBe(true);
    expect(converted(sequence, "setupish_noise")).toBe(false);
  });

  it("matches Corp remote asset conversion evidence by bounded role terms", () => {
    expect(
      corpRemoteCreatedConvertsTo(
        [
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
          },
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
            evidence: ["corp.remote_support"],
          },
        ],
        0,
        2,
        "asset",
      ),
    ).toBe(true);
    expect(
      corpRemoteCreatedConvertsTo(
        [
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
          },
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
            evidence: [
              "remote_supportish_noise",
              "economy_assetish_noise",
              "asset_trash_targetish_noise",
            ],
          },
        ],
        0,
        2,
        "asset",
      ),
    ).toBe(false);
    expect(
      corpRemoteCreatedConvertsTo(
        [
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
          },
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
            reasonCode: "corp.plan.remote_asset",
          },
        ],
        0,
        2,
        "asset",
      ),
    ).toBe(true);
    expect(
      corpRemoteCreatedConvertsTo(
        [
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
          },
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
            reasonCode: "corp.plan.assetish_noise",
          },
        ],
        0,
        2,
        "asset",
      ),
    ).toBe(false);
  });

  it("matches Corp remote bait reason codes by bounded terms", () => {
    expect(
      corpRemoteCreatedConvertsTo(
        [
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
          },
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
            reasonCode: "corp.plan.bait_runner",
          },
        ],
        0,
        2,
        "bait",
      ),
    ).toBe(true);
    expect(
      corpRemoteCreatedConvertsTo(
        [
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
          },
          {
            side: "corp",
            actionType: "install_card",
            targetServerId: "remote_1",
            reasonCode: "corp.plan.baitish_noise",
          },
        ],
        0,
        2,
        "bait",
      ),
    ).toBe(false);
  });

  it("reads a new remote's concrete id from the applied Engine state", () => {
    const before = {
      corp: { servers: [{ id: "hq", kind: "hq" }] },
    } as unknown as GameState;
    const after = {
      corp: { servers: [{ id: "hq", kind: "hq" }, { id: "remote_5", kind: "remote" }] },
    } as unknown as GameState;
    const install = legalAction(
      "new-remote-install",
      "corp",
      "install_card",
      "Install in a new remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "new_remote" } },
    );
    const event = { publicPayload: { serverId: "new_remote" } } as PublicGameEvent;
    expect(simulationActionLocation(install, event, before, after)).toEqual({
      targetServerId: "remote_5",
      corpNewRemoteCreated: true,
    });
  });

  it("recognizes a run started by an event from the applied Engine state", () => {
    const before = {} as GameState;
    const after = {
      run: { runId: "run_1", attackedServerId: "hq" },
    } as GameState;
    const play = legalAction("event", "runner", "play_event", "Run event", { credits: 0 });
    const event = { publicPayload: {} } as PublicGameEvent;
    expect(simulationActionLocation(play, event, before, after)).toEqual({
      targetServerId: "hq",
      runnerRunStarted: true,
    });
    expect(simulationActionLocation(play, event, after, after)).toEqual({});
  });

  it("keeps remote conversion on the server that was actually created", () => {
    const sequence = [
      { side: "corp", actionType: "install_card", targetServerId: "remote_1" },
      {
        side: "corp",
        actionType: "install_card",
        targetCardType: "agenda",
        targetServerId: "remote_2",
      },
      {
        side: "corp",
        actionType: "advance_card",
        targetCardType: "agenda",
        targetServerId: "remote_1",
      },
      {
        side: "corp",
        actionType: "install_card",
        targetCardType: "agenda",
        targetServerId: "remote_1",
      },
    ];
    expect(corpRemoteCreatedConvertsTo(sequence, 0, 2, "agenda")).toBe(false);
    expect(corpRemoteCreatedConvertsTo(sequence, 0, 3, "agenda")).toBe(true);
    expect(corpRemoteCreatedConvertsTo(sequence.slice(2), 0, 0, "agenda")).toBe(
      false,
    );
  });

  it("recognizes an actual steal during a Runner strategic window", () => {
    const sequence = [
      { side: "runner", actionType: "start_run", targetServerId: "remote_1" },
      {
        side: "runner",
        actionType: "steal_agenda",
        targetServerId: "remote_1",
      },
    ];
    expect(
      runnerRemoteContestConvertsToStealTrashOrAbort(sequence, 0, () => false),
    ).toBe(true);
  });

  it("matches runner setup reason codes by bounded terms", () => {
    expect(
      isRunnerSetupAction({ side: "runner", reasonCode: "runner.setup.draw" }),
    ).toBe(true);
    expect(
      isRunnerSetupAction({
        side: "runner",
        reasonCode: "runner.search.breaker",
      }),
    ).toBe(true);
    expect(
      isRunnerSetupAction({ side: "runner", reasonCode: "setupish_noise" }),
    ).toBe(false);
    expect(
      isRunnerSetupAction({ side: "runner", reasonCode: "research_noise" }),
    ).toBe(false);
  });

  it("matches runner probe pivot plan kinds by bounded terms", () => {
    expect(
      runnerProbeConvertsToUsefulInfoOrPivot(
        [
          { side: "runner", actionType: "start_run", targetServerId: "rd" },
          {
            side: "runner",
            actionType: "gain_credit",
            targetServerId: "rd",
            reasonCode: "runner.plan.recover_economy",
          },
        ],
        0,
        () => false,
      ),
    ).toBe(true);
    expect(
      runnerProbeConvertsToUsefulInfoOrPivot(
        [
          { side: "runner", actionType: "start_run", targetServerId: "rd" },
          {
            side: "runner",
            actionType: "gain_credit",
            targetServerId: "rd",
            reasonCode: "runner.plan.recover_economyish_noise",
          },
        ],
        0,
        () => false,
      ),
    ).toBe(false);
  });

  it("extracts explicit plan kinds only from exact reason-code segments", () => {
    expect(
      planKindForConversion({
        side: "runner",
        reasonCode: "runner.plan.recover_economy",
      }),
    ).toBe("recover_economy");
    expect(
      planKindForConversion({
        side: "corp",
        reasonCode: "corp.plan.remote_build",
      }),
    ).toBe("remote_build");
    expect(
      planKindForConversion({
        side: "runner",
        reasonCode: "runner.planish.recover_economy",
      }),
    ).toBeUndefined();
    expect(
      planKindForConversion({
        side: "runner",
        reasonCode: "runner.plan.recover-economy",
      }),
    ).toBeUndefined();
  });

  it("matches Corp protection remote-build followups by bounded terms", () => {
    expect(
      corpProtectionConvertsToScoreSafety(
        [
          { side: "corp", reasonCode: "corp.plan.protect_remote" },
          {
            side: "corp",
            actionType: "install_card",
            reasonCode: "corp.plan.remote_build",
          },
        ],
        0,
      ),
    ).toBe(true);
    expect(
      corpProtectionConvertsToScoreSafety(
        [
          { side: "corp", reasonCode: "corp.plan.protect_remote" },
          {
            side: "corp",
            actionType: "install_card",
            reasonCode: "corp.plan.remote_builder_noise",
          },
        ],
        0,
      ),
    ).toBe(false);
  });
});

function converted(
  sequence: Array<{
    side: string;
    actionType: string;
    targetServerId?: string;
  }>,
  planKind: string,
): boolean {
  return planIntentConvertedWithin(
    sequence,
    0,
    planKind,
    () => false,
    () => false,
  );
}
