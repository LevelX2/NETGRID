import { describe, expect, it } from "vitest";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import {
  requireCurrentTransientPlanSignals,
  transientPlanSignalsForExactPlanTarget,
  transientPlanSignalEvidenceCodes,
  type TransientPlanSignal,
} from "./transient-plan-signals";

describe("transient plan goal/threat signals", () => {
  it("feeds deterministic discovery evidence without carrying action authority", () => {
    const signals = requireCurrentTransientPlanSignals(
      [
        signal({
          signalId: "runner-visible-score-threat",
          kind: "threat",
          scope: "tactical",
          evidenceCode: "runner_visible_score_threat",
        }),
        signal({
          signalId: "runner-pressure-goal",
          kind: "goal",
          scope: "strategic",
          evidenceCode: "runner_pressure_goal",
        }),
      ],
      { side: "runner", stateVersion: 17 },
    );

    expect(signals.map((entry) => entry.signalId)).toEqual([
      "runner-pressure-goal",
      "runner-visible-score-threat",
    ]);
    expect(transientPlanSignalEvidenceCodes(signals)).toEqual(
      expect.arrayContaining([
        "transient_plan_signal:goal:strategic:runner-pressure-goal",
        "transient_plan_signal_plan:runner.contest_remote",
        "transient_plan_signal_evidence:runner_pressure_goal",
        "transient_plan_signal:threat:tactical:runner-visible-score-threat",
        "transient_plan_signal_evidence:runner_visible_score_threat",
      ]),
    );
    expect(JSON.stringify(signals)).not.toMatch(
      /actionId|actionIds|legalAction|stepId|capability/i,
    );
  });

  it("binds only the exact plan and target while targetless or foreign signals cannot authorize", () => {
    const exact = signal({
      signalId: "exact",
      target: { kind: "server", id: "remote_1" },
    });
    const signals = requireCurrentTransientPlanSignals(
      [
        exact,
        signal({
          signalId: "foreign-plan",
          planModuleId: "runner.pressure_central",
          target: { kind: "server", id: "remote_1" },
        }),
        signal({
          signalId: "foreign-instance",
          planDedupeKey: "remote-2",
          target: { kind: "server", id: "remote_1" },
        }),
        signal({
          signalId: "foreign-target",
          target: { kind: "server", id: "remote_2" },
        }),
        signal({ signalId: "targetless" }),
      ],
      { side: "runner", stateVersion: 17 },
    );

    expect(
      transientPlanSignalsForExactPlanTarget(
        signals,
        "runner.contest_remote",
        "remote-1",
        { kind: "server", id: "remote_1" },
      ),
    ).toEqual([exact]);
    expect(
      transientPlanSignalsForExactPlanTarget(
        signals,
        "runner.contest_remote",
        "remote-1",
        undefined,
      ),
    ).toEqual([]);
  });

  it.each([
    { label: "stale", observedAtStateVersion: 16 },
    { label: "future", observedAtStateVersion: 18 },
  ])(
    "fails closed for a $label signal",
    ({ observedAtStateVersion }) => {
      expect(() =>
        requireCurrentTransientPlanSignals(
          [signal({ observedAtStateVersion })],
          { side: "runner", stateVersion: 17 },
        ),
      ).toThrow(PlanResolutionFailure);
    },
  );

  it("rejects an undeclared action-authority field instead of ignoring it", () => {
    const authorityBearingSignal = {
      ...signal(),
      actionIds: ["runner.start_run.rd"],
    } as unknown as TransientPlanSignal;

    let failure: unknown;
    try {
      requireCurrentTransientPlanSignals([authorityBearingSignal], {
        side: "runner",
        stateVersion: 17,
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(PlanResolutionFailure);
    expect((failure as PlanResolutionFailure).context.removalCondition).toContain(
      "unknown_or_authority_field:actionIds",
    );
  });
});

function signal(
  overrides: Partial<TransientPlanSignal> = {},
): TransientPlanSignal {
  return {
    schemaVersion: "transient-plan-signal-v1",
    signalId: "runner-current-goal",
    side: "runner",
    observedAtStateVersion: 17,
    planModuleId: "runner.contest_remote",
    planDedupeKey: "remote-1",
    kind: "goal",
    scope: "strategic",
    evidenceCode: "runner_current_goal",
    guarantee: "visible_state_forced",
    ...overrides,
  };
}
