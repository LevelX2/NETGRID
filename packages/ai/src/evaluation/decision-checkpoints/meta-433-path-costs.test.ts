import { expect, it } from "vitest";
import type { VisibleEffectiveIceRunQuote } from "@netgrid/shared";
import tollCapture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-r2-g19-d329.json";
import zeroCapture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-r2-g9-d190.json";
import feeCapture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-433-r2-g9-d192.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { currentRunRemainingIce } from "../../runtime/current-encounter";
import { runnerRunWindowCreditBudget } from "../../runtime/runner-fort-pass-toll";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  assessKnownRezzedIcePath,
  type RunnerRunPathCreditBudget,
} from "../../visible-run-analysis";
import { pathProjectionEffectsForQuote } from "../../run-analysis/visible-run-hazards";

const toll = () =>
  structuredClone(
    tollCapture.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
const zero = () =>
  structuredClone(
    zeroCapture.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
function path(
  input: AiDecisionInputWithDeckCapabilities,
  budget: number | RunnerRunPathCreditBudget,
) {
  const server = input.playerView.servers.find((s) => s.id === "rd")!;
  return assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    budget,
    server.root,
    input.playerView.opponent.credits,
  );
}

it("reserves both known pass fees in the original fully known G19 route", () => {
  expect(path(toll(), 6).canReachAccess).toBe(false);
  expect(path(toll(), 7)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 7,
    creditsAfterPath: 0,
  });
});

it.each(["hidden", "unrezzed"])(
  "does not infer a pass fee from a %s root",
  (mode) => {
    const input = toll();
    for (const root of input.playerView.servers.find((s) => s.id === "rd")!
      .root) {
      if (mode === "hidden") root.known = false;
      else root.rezzed = false;
    }
    expect(path(input, 5)).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 5,
      creditsAfterPath: 0,
    });
  },
);

it("cannot pay general pass fees from a breaker-only pool", () => {
  expect(
    path(toll(), { credits: 1, icebreakerCredits: 20 }).canReachAccess,
  ).toBe(false);
  expect(path(toll(), { credits: 2, icebreakerCredits: 20 })).toMatchObject({
    canReachAccess: true,
    creditsAfterPath: 0,
  });
});

it("reserves passage of unknown ICE and removes only exact zero damage", () => {
  expect(path(zero(), 4)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 4,
    creditsAfterPath: 0,
  });
  const input = zero();
  const server = input.playerView.servers.find((s) => s.id === "rd")!;
  server.root = [];
  expect(path(input, 1)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 1,
    creditsAfterPath: 0,
  });
});

it.each([undefined, 1])(
  "retains positive or unknown damage %s in the path",
  (amount) => {
    const input = zero();
    const server = input.playerView.servers.find((s) => s.id === "rd")!;
    server.root = [];
    const sub = server.ice[0]!.effectiveRunQuote!.subroutines.find(
      (s) => s.type === "do_damage",
    )!;
    if (amount === undefined) delete sub.amount;
    else sub.amount = amount;
    expect(path(input, 2)).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 2,
    });
  },
);

it("retains independent effects beside exact zero damage", () => {
  const quote = zero().playerView.servers.find((s) => s.id === "rd")!.ice[0]!
    .effectiveRunQuote!;
  const damage = quote.subroutines.find((s) => s.type === "do_damage")!;
  damage.unbrokenRunEffect = {
    ...damage.unbrokenRunEffect,
    preventsFutureBreaking: true,
  };
  expect(
    pathProjectionEffectsForQuote(quote as VisibleEffectiveIceRunQuote),
  ).toContainEqual({
    effect: { ...damage.unbrokenRunEffect, causesDamageOrProgramTrash: false },
    sourceSubroutine: damage,
  });
});

it.each([tollCapture, zeroCapture])(
  "rejects the underquoted original route through the existing plan owner",
  (capture) => {
    const { input, runtime } = structuredClone(capture) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected).toBeDefined();
    expect(selected!.actionId).not.toBe("runner.start_run.rd");
    const plan = decision.decisionDebug!.planFirstDecision!;
    const owner = plan.selectedPlan!.instanceId;
    expect([
      "runner.economy",
      "runner.rig_and_coverage",
      "runner.pressure_central",
    ]).toContain(plan.selectedPlan!.moduleId);
    expect(decision).toMatchObject({
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          leafExecutorInstanceId: owner,
          selectedStep: { planInstanceId: owner },
          route: {
            actionId: selected!.actionId,
            planInstanceId: owner,
            stateVersion: input.playerView.stateVersion,
          },
        },
      },
    });
  },
);

it.each([false, true])(
  "charges the pending fee once and admits general bad-publicity credits: %s",
  (badPublicity) => {
    const input = structuredClone(
      feeCapture.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    if (badPublicity) {
      input.playerView.own.credits = 0;
      input.playerView.run!.badPublicityCredits = 6;
    }
    const server = input.playerView.servers.find((s) => s.id === "rd")!;
    const budget = runnerRunWindowCreditBudget(input);
    expect(budget.credits).toBe(5);
    expect(
      assessKnownRezzedIcePath(
        currentRunRemainingIce(input),
        input.playerView.own.rig!,
        budget,
        server.root,
      ),
    ).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 3,
      creditsAfterPath: 2,
    });
  },
);

it("includes a bypassed ICE's passage without charging its omitted encounter", () => {
  const input = toll(),
    server = input.playerView.servers.find((s) => s.id === "rd")!;
  expect(
    assessKnownRezzedIcePath(
      server.ice.slice(0, -1),
      input.playerView.own.rig!,
      4,
      server.root,
      0,
      { additionalPassedIceCount: 1 },
    ),
  ).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 4,
    creditsAfterPath: 0,
  });
});

it("does not shield reserved passage money from an unbroken credit loss", () => {
  const input = toll(),
    server = input.playerView.servers.find((s) => s.id === "rd")!;
  server.ice = server.ice.slice(0, 1);
  server.ice[0]!.effectiveRunQuote!.subroutines = [
    { id: "loss", type: "runner_lose_credits", amount: 5 },
  ];
  input.playerView.own.rig = [];
  expect(path(input, 5).canReachAccess).toBe(false);
  expect(path(input, 6)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 6,
    creditsAfterPath: 0,
  });
});

it("consumes one-shot payment support once across multiple passages", () => {
  expect(
    path(toll(), {
      credits: 0,
      icebreakerCredits: 20,
      paymentSupportLiquidCredits: 0,
      paymentSupportSources: [
        {
          cardInstanceId: "bank",
          sourceAbilityId: "withdraw",
          creditCost: 0,
          gainCredits: 1,
        },
      ],
    }).canReachAccess,
  ).toBe(false);
});
