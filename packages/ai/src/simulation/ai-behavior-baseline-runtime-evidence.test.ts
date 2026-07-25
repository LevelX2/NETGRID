import { describe, expect, it } from "vitest";

import type { AiSimulationSummary } from "./ai-simulation-summary";
import { actionLimitDiagnosisForSimulation } from "./ai-behavior-baseline-runtime-evidence";

describe("actionLimitDiagnosisForSimulation", () => {
  it("binds a classified action limit to the last owner, plan, step and no-progress class", () => {
    const sequence: AiSimulationSummary["actionSequence"] = [
      action("start_run", "runner.contest_remote", "remote_1"),
      action("gain_credit", "corp.economy", undefined, "corp"),
      action("start_run", "runner.contest_remote", "remote_1"),
      action("start_run", "runner.contest_remote", "remote_1"),
      action("start_run", "runner.contest_remote", "remote_1"),
      action("start_run", "runner.contest_remote", "remote_1"),
      action("access_card", "runner.contest_remote", "remote_1"),
    ];

    expect(actionLimitDiagnosisForSimulation(summary(sequence))).toEqual({
      classified: true,
      owner: "plan_module",
      planInstanceId: "plan:runner.contest_remote:remote_1",
      stepId: "plan:runner.contest_remote:remote_1:contest",
      noProgressCluster: "action_limit_runner_repeated_no_progress_run",
      noProgressSubcluster: "access_pending",
    });
  });

  it("keeps an ownerless and patternless action limit explicitly unclassified", () => {
    const diagnosis = actionLimitDiagnosisForSimulation(
      summary([action("end_turn")]),
    );

    expect(diagnosis).toMatchObject({
      classified: false,
      owner: "unclassified",
      planInstanceId: "unclassified",
      stepId: "unclassified",
      noProgressCluster: "action_limit_mixed_or_unknown",
      noProgressSubcluster: "mixed_unknown",
    });
  });

  it("attributes a repeated-run limit to its repeated root plan instead of the final window leaf", () => {
    const pressure = () =>
      action("start_run", "runner.pressure_central", "hq");
    const runWindow = action(
      "continue_run",
      "runner.convert_run_window",
      "hq",
    );
    const corpWindow = action(
      "decline_rez",
      "corp.defend_servers",
      "hq",
      "corp",
    );
    const finalWindow = {
      ...action("continue_run", "engine_window"),
      evidence: ["plan_first_lane:engine_window"],
    };
    const sequence: AiSimulationSummary["actionSequence"] = [
      pressure(),
      corpWindow,
      runWindow,
      action("access_card", "runner.convert_run_window", "hq"),
      pressure(),
      corpWindow,
      runWindow,
      action("access_card", "runner.convert_run_window", "hq"),
      pressure(),
      corpWindow,
      runWindow,
      action("access_card", "runner.convert_run_window", "hq"),
      pressure(),
      corpWindow,
      runWindow,
      action("access_card", "runner.convert_run_window", "hq"),
      finalWindow,
    ];

    expect(actionLimitDiagnosisForSimulation(summary(sequence))).toMatchObject({
      classified: true,
      owner: "plan_module",
      planInstanceId: "plan:runner.pressure_central:hq",
      stepId: "plan:runner.pressure_central:hq:contest",
      noProgressCluster: "action_limit_low_value_repeat",
      noProgressSubcluster: "access_pending",
    });
  });

  it("does not blame an earlier repeated pressure plan for a later foreign limit cycle", () => {
    const pressure = () =>
      action("start_run", "runner.pressure_central", "hq");
    const access = () =>
      action("access_card", "runner.convert_run_window", "hq");
    const laterEconomy = () =>
      action("gain_credit", "corp.economy", undefined, "corp");
    const sequence: AiSimulationSummary["actionSequence"] = [
      pressure(),
      access(),
      pressure(),
      access(),
      pressure(),
      access(),
      laterEconomy(),
      laterEconomy(),
      laterEconomy(),
      laterEconomy(),
    ];

    expect(actionLimitDiagnosisForSimulation(summary(sequence))).toMatchObject({
      owner: "plan_module",
      planInstanceId: "plan:corp.economy:none",
      stepId: "plan:corp.economy:none:contest",
    });
  });

  it("does not diagnose runtime-error termination as an action limit", () => {
    expect(
      actionLimitDiagnosisForSimulation(summary([], ["runtime_failure:test"])),
    ).toBeUndefined();
  });
});

function summary(
  actionSequence: AiSimulationSummary["actionSequence"],
  errors: string[] = [],
): AiSimulationSummary {
  return {
    terminationKind: errors.length > 0 ? "runtime_failure" : "action_limit",
    winner:
      errors.length > 0 ? "runtime_failure" : "action_limit_reached",
    actionSequence,
    errors,
  } as AiSimulationSummary;
}

function action(
  actionType: AiSimulationSummary["actionSequence"][number]["actionType"],
  planKind?: string,
  targetServerId?: string,
  side: "runner" | "corp" = "runner",
): AiSimulationSummary["actionSequence"][number] {
  const planInstanceId = planKind
    ? `plan:${planKind}:${targetServerId ?? "none"}`
    : undefined;
  return {
    side,
    stateVersionBefore: 1,
    actionType,
    ...(planKind ? { planKind } : {}),
    ...(targetServerId ? { targetServerId } : {}),
    reasonCode: planKind ?? "test",
    explanation: "test",
    confidence: 1,
    evidence: planInstanceId
      ? [
          `plan_module:${planKind}`,
          `plan_execution:instance:${planInstanceId}`,
          `plan_execution:step:${planInstanceId}:contest`,
        ]
      : [],
    fallbackUsed: false,
    timeoutUsed: false,
    qualityTags: [],
    stateHashAfter: "hash",
  };
}
