import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { assessShellTradersAccess } from "../../runner/shell-traders/shell-traders-access";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  provenance: string;
  stateVersion: number;
  validation: Record<string, boolean>;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

function readCapture(index: number): Capture {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-e553-d${index}-replay.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
const lateShellJson = readCapture(147);
const unknownIceJson = readCapture(96);
const earlyRemoteJson = readCapture(49);
const earlySearchJson = readCapture(59);

function replay(unchecked: unknown) {
  const capture = structuredClone(unchecked) as Capture;
  const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Missing captured deck identity");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId, capture.runtime);
  return { input: capture.input, decision: chooseAiAction(capture.input) };
}

describe("e553 human-pattern historical evidence", () => {
  it("keeps the early blocked remote and its exact coverage child resident", () => {
    const { decision } = replay(earlyRemoteJson);
    const parent = "plan:runner.contest_remote:remote%3Aremote_1";
    const need = "coverage:breaker_sentry:run:runner.start_run.remote_1";
    expect(decision.decisionDebug?.planFirstDecision?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instanceId: parent, openNeedIds: [need] }),
        expect.objectContaining({
          moduleId: "runner.rig_and_coverage",
          parentInstanceId: parent,
          parentNeedId: need,
          phase: "search_answer",
        }),
      ]),
    );
  });

  it("searches the known blocking sentry role early under the remote parent at D59", () => {
    const { input, decision } = replay(earlySearchJson);
    const action = input.legalActions.find(
      (entry) => entry.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("activated_card_ability");
    expect(
      input.playerView.own.rig?.find(
        (card) => card.instanceId === action.source,
      )?.definitionId,
    ).toBe("onr_v1_177_the-short-circuit");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: {
        moduleId: "runner.rig_and_coverage",
        phase: "search_answer",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        target: { id: "breaker_sentry" },
      },
      executionOrigin: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        stateVersion: input.playerView.stateVersion,
      },
      priority: { effectiveClass: "P4" },
    });
  });

  it.each(["empty", "unknown_ice"])(
    "does not claim known remote coverage for %s",
    (variant) => {
      const changed = structuredClone(earlyRemoteJson);
      const server = changed.input.playerView.servers.find(
        (entry) => entry.id === "remote_1",
      )!;
      if (variant === "empty") server.root = [];
      else server.ice = [{ instanceId: "hidden-remote-ice", known: false }];
      const { decision } = replay(changed);
      expect(
        decision.decisionDebug?.planFirstDecision?.portfolio.some(
          (entry) =>
            entry.moduleId === "runner.rig_and_coverage" &&
            entry.parentInstanceId ===
              "plan:runner.contest_remote:remote%3Aremote_1",
        ),
      ).toBe(false);
    },
  );
  it("keeps liquidity instead of paying for an incomplete matchpoint answer at D147", () => {
    const { input, decision } = replay(lateShellJson);
    expect(decision.actionId).toBe("runner.draw_card");
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.defense_and_recovery");
    const paid = input.legalActions.filter(
      (action) =>
        action.payload?.delayedInstallAbility === "remove_shell_counter" &&
        ["onr_v1_016_cyfermaster", "onr_v1_023_evil-twin"].includes(
          String(action.payload.targetCardDefinitionId),
        ),
    );
    expect(paid).toHaveLength(2);
    for (const action of paid)
      expect(
        decision.decisionDebug?.planFirstDecision?.dispositions,
      ).toContainEqual(
        expect.objectContaining({
          actionId: action.actionId,
          ownerModuleId: "runner.shell_traders_pipeline",
          disposition: "explicitly_nonproductive",
          evidenceCode: "runner_shell_traders_holds_unfunded_access",
        }),
      );
  });

  it("quotes the complete prepared combination, including break costs and the run click", () => {
    const { input } = structuredClone(lateShellJson) as Capture;
    // Projection counterfactual: identical visible Engine quotes, more liquid credits.
    input.playerView.own.credits = 100;
    const source = "runner_onr_v1_176_the-shell-traders_1";
    const target = "runner_onr_v1_016_cyfermaster_1";
    const assessment = assessShellTradersAccess(
      input,
      source,
      target,
      "remote_1",
    );
    expect(assessment).toMatchObject({
      status: "funded",
      completionCredits: 8,
      requiredClicks: 1,
    });
    expect(assessment.completionCardIds).toEqual(
      expect.arrayContaining([target, "runner_onr_v1_023_evil-twin_1"]),
    );
    expect(assessment.knownPathCost).toBeGreaterThan(0);
    const fundedDecision = replay({ ...lateShellJson, input }).decision;
    expect(fundedDecision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: { moduleId: "runner.shell_traders_pipeline" },
      priority: { effectiveClass: "P2" },
      route: {
        actionType: "trigger_ability",
        stateVersion: input.playerView.stateVersion,
      },
    });
    input.playerView.own.credits = assessment.requiredCredits!;
    expect(
      assessShellTradersAccess(input, source, target, "remote_1").status,
    ).toBe("funded");
    input.playerView.own.credits -= 1;
    expect(
      assessShellTradersAccess(input, source, target, "remote_1").status,
    ).toBe("blocked");
    input.playerView.own.credits = 100;
    input.playerView.own.clicks = 0;
    expect(
      assessShellTradersAccess(input, source, target, "remote_1").reason,
    ).toBe("run_click_unavailable");
  });

  it("does not replace an unknown ICE quote with a funded access claim", () => {
    const { input } = structuredClone(lateShellJson) as Capture;
    input.playerView.own.credits = 100;
    input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.ice[0] = { instanceId: "hidden", known: false };
    expect(
      assessShellTradersAccess(
        input,
        "runner_onr_v1_176_the-shell-traders_1",
        "runner_onr_v1_016_cyfermaster_1",
        "remote_1",
      ).status,
    ).toBe("unknown");
  });

  it("requires explicit permitted memory replacement and current source bindings", () => {
    const { input } = structuredClone(lateShellJson);
    input.playerView.own.credits = 100;
    input.playerView.own.memoryLimit = 3;
    const source = "runner_onr_v1_176_the-shell-traders_1";
    const target = "runner_onr_v1_016_cyfermaster_1";
    expect(
      assessShellTradersAccess(input, source, target, "remote_1").status,
    ).toBe("blocked");
    expect(
      assessShellTradersAccess(input, source, target, "remote_1", [
        "runner_onr_v1_036_jackhammer_1",
      ]).status,
    ).toBe("funded");
    const action = input.legalActions.find(
      (entry) =>
        entry.payload?.targetCardId === target &&
        entry.payload.delayedInstallAbility === "remove_shell_counter",
    )!;
    action.expiresAtStateVersion -= 1;
    expect(
      assessShellTradersAccess(input, source, target, "remote_1", [
        "runner_onr_v1_036_jackhammer_1",
      ]).status,
    ).toBe("unknown");
  });
  it.each([lateShellJson, unknownIceJson, earlyRemoteJson, earlySearchJson])(
    "preserves actor-safe capture and deterministic legal plan selection at $stateVersion",
    (capture) => {
      expect(capture.provenance).toBe(
        "reconstructed_from_persisted_decision_sources",
      );
      expect(
        Object.values(capture.validation).every((value) => value === true),
      ).toBe(true);
      expect(capture.input.playerView.opponent).not.toHaveProperty("gripOrHq");
      const first = replay(capture);
      const second = replay(capture);
      expect(first.decision.actionId).toBe(second.decision.actionId);
      expect(
        first.input.legalActions.some(
          (action) => action.actionId === first.decision.actionId,
        ),
      ).toBe(true);
      expect(first.decision.fallbackUsed).toBe(false);
      expect(
        first.decision.decisionDebug?.planFirstDecision?.executionOrigin,
      ).toMatchObject({
        side: "runner",
        stateVersion: capture.stateVersion,
      });
    },
  );
});
