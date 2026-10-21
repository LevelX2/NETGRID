import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import * as discovery from "../../corp/economy/economy-discovery";
import * as defense from "../../corp/defense/corp-funded-continuation-window";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

afterEach(() => vi.restoreAllMocks());

it("executes the real defense draw before releasing its consumed receipt to Economy", () => {
  const observed: Parameters<typeof discovery.buildCorpEconomySignals>[0][] = [];
  const original = discovery.buildCorpEconomySignals;
  vi.spyOn(discovery, "buildCorpEconomySignals").mockImplementation((p) => {
    observed.push(p);
    return original(p);
  });
  resetResidentPlanPortfolioMemory();
  for (const d of [275, 276]) {
    const name = d === 275 ? "active-defense-draw" : "completed-defense-draw";
    const f = JSON.parse(readFileSync(new URL(
      `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-543-r1-g34-d${d}-${name}.json`, import.meta.url,
    ), "utf8")) as {input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1};
    if (d === 275)
      restoreAiRuntimeCheckpoint(f.input, f.input.ownDeckSnapshot!.deckSnapshotId, f.runtime);
    const view = structuredClone(f.input.playerView);
    const decision = chooseAiAction(f.input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(f.input.playerView).toEqual(view);
    const action = f.input.legalActions.find(a => a.actionId === decision.actionId);
    expect(action?.expiresAtStateVersion).toBe(f.input.playerView.stateVersion);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.route?.actionId).toBe(action?.actionId);
    expect(plan?.route?.stateVersion).toBe(f.input.playerView.stateVersion);
    if (d === 275) {
      expect(action?.type).toBe("draw_card");
      expect(plan?.selectedPlan?.moduleId).toBe("corp.defend_servers");
    } else {
      expect(action?.payload?.hostedCreditAddAmount).toBe(3);
      expect(plan?.selectedPlan?.moduleId).toBe("corp.economy");
    }
  }
  expect(observed.some(p => p.defenseNeeds.some(s => s.kind === "generic" && s.drawAttemptState?.remainingAttempts === 1 && s.actionIds?.includes("corp.draw_card")))).toBe(true);
  expect(observed.some(p => p.defenseNeeds.some(s => s.kind === "generic" && s.drawAttemptState?.remainingAttempts === 0 && s.actionIds?.length === 0))).toBe(true);
});

it.each(["g5-d333", "g18-d237", "g19-d258", "g19-d259", "g19-d269", "completed-defense-draw"])(
  "admits the profitable bank cycle without an executable Remote protection window: %s",
  (name) => {
    const f = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/${name === "completed-defense-draw" ? "cp-meta-543-r1-g34-d276-completed-defense-draw.json" : `cp-meta-543-before-${name}-remote-bank.json`}`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      validation: Record<string, boolean>;
    };
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    const original = discovery.buildCorpEconomySignals;
    const window = defense.corpFundedDefenseContinuationWindow;
    const windows: ReturnType<typeof window>[] = [];
    const observed: Parameters<typeof original>[0][] = [];
    vi.spyOn(defense, "corpFundedDefenseContinuationWindow").mockImplementation(
      (p) => {
        const result = window(p);
        windows.push(result);
        return result;
      },
    );
    vi.spyOn(discovery, "buildCorpEconomySignals").mockImplementation((p) => {
      observed.push(p);
      return original(p);
    });
    const view = structuredClone(f.input.playerView);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      f.input,
      f.input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    const decision = chooseAiAction(f.input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(f.input.playerView).toEqual(view);
    expect(
      observed.some((p) =>
        p.remoteProjects.some(
          (r) => r.need?.capability === "improve_remote_protection_path",
        ),
      ),
    ).toBe(true);
    expect(windows.length).toBeGreaterThan(0);
    expect(
      windows.every((w) => w.actionIds.length === 0 && w.unknown.length === 0),
    ).toBe(true);
    const selected = f.input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    );
    if (!selected) throw Error("Current native action missing");
    expect(selected.payload?.hostedCreditAddAmount).toBe(3);
    expect(selected.expiresAtStateVersion).toBe(f.input.playerView.stateVersion);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.selectedPlan?.moduleId).toBe("corp.economy");
    expect(plan?.rootPlanInstanceId).toContain("economy-hosted-bank-cycle");
    expect(plan?.route?.actionId).toBe(selected.actionId);
    expect(plan?.route?.stateVersion).toBe(f.input.playerView.stateVersion);
    expect(plan?.selectedStep?.planInstanceId).toBe(plan?.selectedPlan?.instanceId);
  },
);

it.each([
  ["cp-daed3ad-latest-02-start-score-remote-d19.json", "new_remote"],
  ["cp-daed3ad-latest-03-harden-bound-remote-d88.json", "remote_1"],
])("preserves a native bound Remote protection window: %s", (name, target) => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(`../../../../../data/scenarios/ai-decision-checkpoints/${name}`, import.meta.url),
      "utf8",
    ),
  ) as AiDecisionCheckpointV1;
  const original = discovery.buildCorpEconomySignals;
  const windows: ReturnType<typeof defense.corpFundedDefenseContinuationWindow>[] = [];
  vi.spyOn(discovery, "buildCorpEconomySignals").mockImplementation((p) => {
    windows.push(defense.corpFundedDefenseContinuationWindow({
      input: p.input,
      candidates: p.candidates,
      centralAllocation: p.centralDefenseAllocation,
      scoreProjects: p.scoreProjects,
      remoteProjects: p.remoteProjects,
      available: {credits: p.input.playerView.own.credits + 1, clicks: p.input.playerView.own.clicks - 1},
    }));
    return original(p);
  });
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, result.message).toBe(true);
  expect(windows.length).toBeGreaterThan(0);
  if (target === "new_remote")
    expect(windows.some(w => w.unknown.some(id => id.includes("bound_new_remote_window_unassessed")))).toBe(true);
  else
    expect(windows.some(w => w.actionIds.some(id => id.includes(`.${target}.`)))).toBe(true);
});
