import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  simulateAiGame,
  summarizeDoctrineQualityMetrics,
} from "../index";

const originalSemanticAiRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

beforeEach(() => {
  process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
});

afterEach(() => {
  if (originalSemanticAiRuntimeMode === undefined) {
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
  } else {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalSemanticAiRuntimeMode;
  }
});

describe("AI simulation harness", () => {
  it("runs deterministic AI-vs-AI simulations and replays the event log", () => {
    const first = simulateAiGame({ seed: "ai-sim-golden", maxActions: 80 });
    const second = simulateAiGame({ seed: "ai-sim-golden", maxActions: 80 });

    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(first.actionSequence).toEqual(second.actionSequence);
    expect(first.errors).toEqual([]);
    expect(first.replayOk).toBe(true);
    expect(first.finalStateHash).toMatch(/^fnv1a:/);
    expect(
      first.actionSequence.every((entry) => Array.isArray(entry.qualityTags)),
    ).toBe(true);
    expect(first.metrics.doctrine).toEqual(
      summarizeDoctrineQualityMetrics(first.actionSequence),
    );
    expect(JSON.stringify(first)).not.toContain("cardInstances");
    expect(JSON.stringify(first)).not.toContain("sessionToken");
  }, 15_000);

  it("summarizes doctrine quality error classes from redaction-safe action tags", () => {
    const metrics = summarizeDoctrineQualityMetrics([
      {
        side: "corp",
        stateVersionBefore: 1,
        actionType: "install_card",
        reasonCode: "corp.plan.build_scoring_remote",
        explanation: "metric fixture",
        confidence: 0.7,
        evidence: [],
        fallbackUsed: false,
        timeoutUsed: false,
        targetServerId: "new_remote",
        qualityTags: ["agenda_flood_exposure", "naked_agenda_install"],
        stateHashAfter: "fnv1a:metric001",
      },
      {
        side: "runner",
        stateVersionBefore: 2,
        actionType: "start_run",
        reasonCode: "runner.plan.pressure_rnd",
        explanation: "metric fixture",
        confidence: 0.7,
        evidence: [],
        fallbackUsed: false,
        timeoutUsed: false,
        targetServerId: "rd",
        qualityTags: ["rig_stall"],
        stateHashAfter: "fnv1a:metric002",
      },
      {
        side: "runner",
        stateVersionBefore: 3,
        actionType: "start_run",
        reasonCode: "runner.plan.pressure_rnd",
        explanation: "metric fixture",
        confidence: 0.7,
        evidence: [],
        fallbackUsed: false,
        timeoutUsed: false,
        targetServerId: "rd",
        qualityTags: ["asset_trash_neglect"],
        stateHashAfter: "fnv1a:metric003",
      },
    ]);

    expect(metrics).toMatchObject({
      nakedAgendaInstalls: 1,
      agendaFloodExposure: 1,
      repeatedLowValueCentralRun: 1,
      rigStall: 1,
      assetTrashNeglect: 1,
    });
    expect(JSON.stringify(metrics)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda|simple_run_event/,
    );
  });
});
