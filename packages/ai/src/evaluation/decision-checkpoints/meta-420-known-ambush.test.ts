import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-420-known-ambush-start-d84.json";
import windowJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-420-known-ambush-window-d88.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  runnerKnownAccessDamageJackOutAssessment,
  runnerKnownRemoteAccessDamageAmbushAssessment,
} from "../../runner-damage-threat-assessment";
import { projectKnownCorpCardAccessEffect } from "../../runtime/known-corp-card-access-effect-projection";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capture(json: unknown) {
  return structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

describe("meta 420 known ambush run admission", () => {
  it("leaves a missing rez state explicitly unresolved", () => {
    const { input } = capture(checkpointJson);
    const source = input.playerView.servers.find((s) => s.id === "remote_1")!
      .root[0]!;
    delete source.rezzed;
    expect(
      projectKnownCorpCardAccessEffect({
        input,
        sourceDefinitionId: source.definitionId!,
        sourceCard: source,
      }),
    ).toMatchObject({
      status: "unknown",
      evidenceCodes: expect.arrayContaining([
        "known_access_effect_source_rez_state_unknown",
      ]),
    });
  });
  it.each(["unknown", "mixed", "unrezzed", "safe"])(
    "does not infer a sole known damage ambush from a %s root",
    (state) => {
      const { input } = capture(checkpointJson);
      const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
      const source = server.root[0]!;
      if (state === "unknown") {
        source.known = false;
        delete source.definitionId;
      }
      if (state === "mixed")
        server.root.push({
          instanceId: "unknown-additional-root",
          known: false,
        });
      if (state === "unrezzed") source.rezzed = false;
      if (state === "safe") source.definitionId = "onr_v1_214_project-babylon";
      expect(
        runnerKnownRemoteAccessDamageAmbushAssessment(input, server.id),
      ).toBeUndefined();
    },
  );

  it.each([
    [true, 2],
    [false, 1],
  ] as const)(
    "projects the active installed variant with rezzed=%s",
    (rezzed, amount) => {
      const { input } = capture(checkpointJson);
      const source = input.playerView.servers.find((s) => s.id === "remote_1")!
        .root[0]!;
      source.rezzed = rezzed;
      expect(
        projectKnownCorpCardAccessEffect({
          input,
          sourceDefinitionId: source.definitionId!,
          sourceCard: source,
        }),
      ).toMatchObject({ status: "complete", damage: { type: "net", amount } });
    },
  );

  it("does not start the unchanged run that its own access owner must abort", () => {
    const { input, runtime } = capture(checkpointJson);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(result.actionId).not.toBe("runner.start_run.remote_1");
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(result.fallbackUsed).toBe(false);
    const plan = result.decisionDebug!.planFirstDecision!;
    expect(plan.selectedStep!.planInstanceId).toBe(
      plan.selectedPlan!.instanceId,
    );
    expect(
      result.decisionDebug?.actionAlternatives
        ?.find((a) => a.actionId === "runner.start_run.remote_1")
        ?.whyNot?.join(" "),
    ).toContain("known_access_damage_ambush");
  });

  it("keeps the real in-run safety response bound to its original remote parent", () => {
    const { input, runtime } = capture(windowJson);
    expect(runnerKnownAccessDamageJackOutAssessment(input)).toMatchObject({
      serverId: "remote_1",
    });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(result.actionId).toBe("runner.jack_out");
    expect(result.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject(
      {
        moduleId: "runner.convert_run_window",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      },
    );
    expect(result.fallbackUsed).toBe(false);
  });
});
