import { describe, expect, it } from "vitest";
import { simulateAiGame, summarizeDoctrineQualityMetrics } from "../simulation";

describe("AI simulation harness", () => {
  it("captures defensive exact-state copies before requested selfplay decisions", () => {
    const captures: Array<{ actionIndex: number; stateVersion: number }> = [];
    const result = simulateAiGame({
      seed: "ai-sim-checkpoint-capture",
      maxActions: 3,
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [1],
        capture: (snapshot) => {
          captures.push({
            actionIndex: snapshot.actionIndex,
            stateVersion: snapshot.state.stateVersion,
          });
          snapshot.state.stateVersion = 999;
          snapshot.input.legalActions.splice(0);
        },
      },
    });

    expect(captures).toEqual([{ actionIndex: 1, stateVersion: 1 }]);
    expect(result.actions).toBe(3);
    expect(result.terminationKind).toBe("action_limit");
    expect(result.winner).toBe("action_limit_reached");
    expect(result.errors).toEqual([]);
  });

  it("classifies a technical abort as a runtime failure instead of an action limit", () => {
    const result = simulateAiGame({
      seed: "ai-sim-invalid-deck-support",
      runnerDeck: {
        id: "invalid-runtime-deck",
        side: "runner",
        identityCardId: "missing-identity",
        cards: [{ id: "missing-card", quantity: 1 }],
      } as never,
    });

    expect(result.terminationKind).toBe("runtime_failure");
    expect(result.winner).toBe("runtime_failure");
    expect(result.actions).toBe(0);
    expect(result.runtimeFailures).toEqual([
      expect.objectContaining({
        code: "simulation_deck_support_invalid",
      }),
    ]);
  });

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
  }, 60_000);

  it("exercises distinct live trajectories instead of relying on one golden seed", () => {
    const summaries = [
      "ai-sim-realism-a",
      "ai-sim-realism-b",
      "ai-sim-realism-c",
    ].map((seed) => simulateAiGame({ seed, maxActions: 40 }));

    for (const summary of summaries) {
      expect(summary.errors, summary.seed).toEqual([]);
      expect(summary.replayOk, summary.seed).toBe(true);
      expect(summary.actionSequence.length, summary.seed).toBeGreaterThan(10);
      expect(
        new Set(summary.actionSequence.map((entry) => entry.side)),
        summary.seed,
      ).toEqual(new Set(["corp", "runner"]));
    }
    expect(
      new Set(summaries.map((summary) => summary.finalStateHash)).size,
    ).toBe(summaries.length);
  }, 60_000);

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
