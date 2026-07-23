import { describe, expect, it } from "vitest";
import {
  createPlanCommitment,
  materializeCommitmentStep,
  requireExecutionOrigin,
  type PlanCommitment,
} from "./plan-continuation";

describe("semantic plan continuations", () => {
  it("rematerializes a Promises conversion without storing a future action id", () => {
    const commitment = createPlanCommitment(baseCommitment());
    expect(JSON.stringify(commitment.nodes)).not.toContain("actionId");

    const result = materializeCommitmentStep(commitment, {
      side: "runner",
      stateVersion: 11,
      timingPoint: "runner_choice.promises",
      windowKind: "mandatory_choice",
      windowId: "choice-11",
      outcomeCodes: ["always"],
    });

    expect(result.step?.capability.semanticActionTypes).toEqual([
      "choice.resolve",
    ]);
    expect(result.origin).toMatchObject({
      rootPlanInstanceId: "runner.pressure:rd",
      leafPlanInstanceId: "runner.promises:rd",
    });
  });

  it("branches Manhunt from trace into tag damage or prevention", () => {
    const commitment = manhuntCommitment();
    const tagged = materializeCommitmentStep(commitment, {
      side: "corp",
      stateVersion: 21,
      timingPoint: "trace.result",
      windowKind: "trace",
      windowId: "trace-21",
      outcomeCodes: ["tag_applied"],
    });
    const prevented = materializeCommitmentStep(commitment, {
      side: "corp",
      stateVersion: 21,
      timingPoint: "trace.result",
      windowKind: "trace",
      windowId: "trace-21",
      outcomeCodes: ["tag_prevented"],
    });

    expect(tagged.step?.capability.capabilityId).toBe("apply_tag_damage");
    expect(prevented.commitment.status).toBe("aborted");
  });

  it("preserves root and leaf through run and access windows", () => {
    const run = baseCommitment();
    run.currentNodeId = "run";
    const duringRun = materializeCommitmentStep(run, {
      side: "runner",
      stateVersion: 12,
      timingPoint: "run.success",
      windowKind: "run",
      windowId: "run-7",
      outcomeCodes: ["run_successful"],
    });
    const access = materializeCommitmentStep(duringRun.commitment, {
      side: "runner",
      stateVersion: 13,
      timingPoint: "access.choose",
      windowKind: "access",
      windowId: "access-7",
      outcomeCodes: [],
    });

    expect(access.origin.rootPlanInstanceId).toBe("runner.pressure:rd");
    expect(access.origin.leafPlanInstanceId).toBe("runner.promises:rd");
    expect(access.step?.capability.capabilityId).toBe("resolve_access");
  });

  it("rejects future action ids and missing window origins", () => {
    const invalid = baseCommitment();
    invalid.nodes[0] = {
      ...invalid.nodes[0]!,
      actionId: "future-legal-action",
    } as never;
    expect(() => createPlanCommitment(invalid)).toThrow(
      expect.objectContaining({ code: "commitment_invalidated" }),
    );
    expect(() =>
      requireExecutionOrigin(undefined, {
        side: "runner",
        stateVersion: 14,
        timingPoint: "access.choose",
        windowKind: "access",
      }),
    ).toThrow(expect.objectContaining({ code: "window_origin_missing" }));
  });
});

function baseCommitment(): PlanCommitment {
  return {
    commitmentId: "commitment:promises",
    rootPlanInstanceId: "runner.pressure:rd",
    leafPlanInstanceId: "runner.promises:rd",
    side: "runner",
    guarantee: "visible_state_forced",
    deadline: { horizon: "current_run", stateVersionLimit: 20, runId: "run-7" },
    status: "active",
    currentNodeId: "choice",
    createdAtStateVersion: 10,
    nodes: [
      {
        nodeId: "choice",
        capability: {
          capabilityId: "resolve_promises_choice",
          semanticActionTypes: ["choice.resolve"],
        },
        purpose: "Convert the already-triggered Promises window.",
        windowKind: "mandatory_choice",
        branches: [],
      },
      {
        nodeId: "run",
        capability: {
          capabilityId: "continue_run",
          semanticActionTypes: ["run.continue"],
        },
        purpose: "Continue the committed R&D run.",
        windowKind: "run",
        branches: [
          {
            condition: "run_successful",
            nextNodeId: "access",
            reasonCode: "run_reached_access",
          },
          {
            condition: "run_ended",
            terminal: "aborted",
            reasonCode: "run_ended_without_access",
          },
        ],
      },
      {
        nodeId: "access",
        capability: {
          capabilityId: "resolve_access",
          semanticActionTypes: ["access.resolve_card"],
        },
        purpose: "Resolve the access created by the committed run.",
        windowKind: "access",
        branches: [],
      },
    ],
  };
}

function manhuntCommitment(): PlanCommitment {
  return {
    commitmentId: "commitment:manhunt",
    rootPlanInstanceId: "corp.punish:runner",
    leafPlanInstanceId: "corp.manhunt:runner",
    side: "corp",
    guarantee: "robust_but_reactive",
    deadline: { horizon: "current_window", stateVersionLimit: 22 },
    status: "active",
    currentNodeId: "trace",
    createdAtStateVersion: 20,
    nodes: [
      {
        nodeId: "trace",
        capability: {
          capabilityId: "resolve_manhunt_trace",
          semanticActionTypes: ["choice.resolve"],
        },
        purpose: "Resolve Manhunt's trace.",
        windowKind: "trace",
        branches: [
          {
            condition: "tag_applied",
            nextNodeId: "damage",
            reasonCode: "tag_created_damage_branch",
          },
          {
            condition: "tag_prevented",
            terminal: "aborted",
            reasonCode: "tag_prevented",
          },
        ],
      },
      {
        nodeId: "damage",
        capability: {
          capabilityId: "apply_tag_damage",
          semanticActionTypes: ["damage.net"],
        },
        purpose: "Apply the visible tag-dependent damage continuation.",
        windowKind: "automatic_resolution",
        branches: [],
      },
    ],
  };
}
