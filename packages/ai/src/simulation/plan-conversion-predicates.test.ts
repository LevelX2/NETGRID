import { describe, expect, it } from "vitest";
import {
  corpProtectionConvertsToScoreSafety,
  corpRemoteCreatedConvertsTo,
  isRunnerSetupAction,
  planIntentConvertedWithin,
  runnerProbeConvertsToUsefulInfoOrPivot,
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
          { side: "corp", actionType: "install_card" },
          {
            side: "corp",
            actionType: "install_card",
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
          { side: "corp", actionType: "install_card" },
          {
            side: "corp",
            actionType: "install_card",
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
