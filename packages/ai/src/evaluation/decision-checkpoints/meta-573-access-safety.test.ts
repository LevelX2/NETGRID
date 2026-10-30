import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { currentRunAbortAssessment } from "../../runner/run-window/run-window-assessment";
import { runnerAgendaStealCreditRequirement } from "../../run-analysis/runner-agenda-steal-cost";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint(name = "g2d44") {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta573-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}
function decide(cp: ReturnType<typeof checkpoint>) {
  const input = cp.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input);
  const result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId)
      ?.expiresAtStateVersion,
  ).toBe(input.playerView.stateVersion);
  return result;
}

it("jacks out of the native remote after Data Darts leaves one card before unknown access", () => {
  const cp = checkpoint();
  const result = decide(cp);
  expect(result).toMatchObject({
    actionId: "runner.jack_out",
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_40",
        selectedStep: {
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        },
        route: {
          actionId: "runner.jack_out",
          actionType: "jack_out",
          stateVersion: 43,
        },
      },
    },
  });
  expect(result.evidence?.join("\n")).toContain(
    "runner_critical_low_grip_unknown_remote_access_requires_jack_out",
  );
});

it.each([0, 1])(
  "retains the unknown remote barrier with %i cards under current public damage pressure",
  (hand) => {
    const { input } = checkpoint();
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(
      0,
      hand,
    );
    expect(currentRunAbortAssessment(input, undefined)?.evidenceCode).toContain(
      "runner_critical_low_grip_unknown_remote_access_requires_jack_out",
    );
  },
);
it.each(["agenda", "score_threat"] as const)(
  "preserves an already bound %s payoff",
  (payoff) => {
    const { input } = checkpoint();
    expect(
      currentRunAbortAssessment(input, {
        purpose: "contest",
        accessCommitment: {
          payoff,
          intendedAction: "steal",
          knownTargetDefinitionIds: [],
          trashBudget: "unknown",
          evidenceCode: "bound-contest-countercase",
        },
      }),
    ).toBeUndefined();
  },
);
it("does not impose the unknown-access barrier on a larger hand", () => {
  const { input } = checkpoint();
  input.playerView.own.gripOrHq.push({
    ...input.playerView.own.gripOrHq[0]!,
    instanceId: "additional-owned-buffer",
  });
  expect(currentRunAbortAssessment(input, undefined)).toBeUndefined();
});
it("does not invent unknown access when the root is fully known", () => {
  const { input } = checkpoint();
  input.playerView.servers.find((s) => s.id === "remote_1")!.root = [];
  expect(
    currentRunAbortAssessment(input, undefined)?.evidenceCode,
  ).not.toContain("runner_critical_low_grip_unknown_remote_access");
});
it("does not infer damage pressure from a hidden root alone", () => {
  const { input } = checkpoint();
  input.playerView.publicEvents = [];
  input.eventTail = [];
  input.playerView.opponent.discardCards = [];
  input.playerView.servers.forEach((s) => {
    s.ice = [];
    if (s.id !== "remote_1") s.root = [];
  });
  expect(currentRunAbortAssessment(input, undefined)).toBeUndefined();
});
it("never claims an abort without its current legal exit", () => {
  const { input } = checkpoint();
  input.legalActions = input.legalActions.filter((a) => a.type !== "jack_out");
  expect(currentRunAbortAssessment(input, undefined)).toBeUndefined();
});

it("does not overwrite the native unfunded Archives route with a second agenda signal", () => {
  const cp = checkpoint("g40d34");
  const result = decide(cp);
  expect(result.actionId).toBe("runner.draw_card");
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.defense_and_recovery:runner",
  );
});
it("retains a currently quoted payable known Archives steal", () => {
  const cp = checkpoint("g40d34"),
    input = cp.input;
  input.playerView.own.credits = 2;
  input.playerView.own.tags = 0;
  const archives = input.playerView.servers.find((s) => s.id === "archives")!;
  archives.ice = [];
  const fetal = archives.root.find((c) => c.type === "agenda")!;
  fetal.effectiveStealCostQuote = {
    stateVersion: input.playerView.stateVersion,
    serverId: "archives",
    agendaInstanceId: fetal.instanceId,
    creditCost: 2,
    complete: true,
  };
  expect(runnerAgendaStealCreditRequirement(input, "archives")).toBe(2);
  expect(decide(cp).actionId).toBe("runner.start_run.archives");
});

it.each(["unfunded", "stale", "wrong_server", "wrong_instance"] as const)(
  "does not admit a known Archives steal with %s cost evidence",
  (variant) => {
    const cp = checkpoint("g40d34"),
      input = cp.input;
    input.playerView.own.credits = variant === "unfunded" ? 1 : 2;
    input.playerView.own.tags = 0;
    const archives = input.playerView.servers.find((s) => s.id === "archives")!;
    archives.ice = [];
    const fetal = archives.root.find((c) => c.type === "agenda")!;
    fetal.effectiveStealCostQuote = {
      stateVersion:
        input.playerView.stateVersion - (variant === "stale" ? 1 : 0),
      serverId: variant === "wrong_server" ? "hq" : "archives",
      agendaInstanceId:
        variant === "wrong_instance" ? "foreign-agenda" : fetal.instanceId,
      creditCost: 2,
      complete: true,
    };
    expect(
      evaluateRunnerRunTargets({ input }).find(
        (t) => t.targetServerId === "archives",
      )?.stealOrTrashAffordable,
    ).toBe(false);
    expect(decide(cp).actionId).not.toBe("runner.start_run.archives");
  },
);
