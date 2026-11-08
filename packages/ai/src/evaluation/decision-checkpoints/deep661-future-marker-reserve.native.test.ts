import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { nextEncounterDamageMarkerPayment } from "../../runner/run-window/run-window-encounter-payment";
import { createGameAfterSetup, getPlayerView } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";

afterEach(resetResidentPlanPortfolioMemory);

function native(
  restrictions?: Partial<NonNullable<GameState["run"]>>,
  historical = false,
) {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/deep661-d267-future-marker-payment.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const cp = fixture.checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const source: AiDecisionInputWithDeckCapabilities = structuredClone(cp.input);
  // Explicit current-contract companion. Do not rewrite the captured historical DTO.
  if (!historical) {
    const state = createGameAfterSetup({
      seed: "deep661-public-exit-companion",
    });
    state.run = {
      runId: "companion",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      ...restrictions,
    } as NonNullable<GameState["run"]>;
    const quote = getPlayerView(
      state,
      "runner",
    ).run!.afterEncounterJackOut;
    expect(quote).toBeDefined();
    source.playerView.run!.afterEncounterJackOut = quote!;
  }
  const input: AiDecisionInputWithDeckCapabilities = {
    ...source,
    ...buildAiDecisionInputDto(source),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { fixture, input };
}

it("does not spend the bound full-run reserve on a next-encounter-only marker", () => {
  const { input, fixture } = native();
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(
    "runner.continue_run.printed_subroutines_next_encounter_unless_fully_break_damage_net",
  );
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ard",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "plan:runner.convert_run_window:run%3Arun_265",
  );
  expect(plan.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: 266,
  });
  expect(plan.dispositions).toContainEqual(
    expect.objectContaining({
      actionId: fixture.historicalActionId,
      evidenceCode:
        "runner_run_window_action_excluded:run_plan_encounter_payment_degrades_bound_reserve",
    }),
  );
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});

it("preserves the historical witness and requires the new public quote", () => {
  const { input, fixture } = native(undefined, true);
  expect(input.playerView.run).not.toHaveProperty("afterEncounterJackOut");
  expect(chooseAiAction(input).actionId).toBe(fixture.historicalActionId);
});

it("preserves a funded payment in an explicit richer-bank companion", () => {
  const { input, fixture } = native();
  input.playerView.own.credits = 25;
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(fixture.historicalActionId);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it.each(["nextEncounterJackOutLock", "jackOutLockedForRun"] as const)(
  "retains mitigation when %s prevents the stated immediate exit",
  (lock) => {
    const { input, fixture } = native({ [lock]: true });
    expect(input.playerView.run!.afterEncounterJackOut!.locked).toBe(true);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(fixture.historicalActionId);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  },
);

it.each([
  { jackOutAdditionalCostForRun: 2 },
  { activeIceProgramTrashSourceIceId: "public-source" },
])(
  "retains mitigation when a canonical exit fee is present: %j",
  (restrictions) => {
    const { input, fixture } = native(restrictions);
    expect(
      input.playerView.run!.afterEncounterJackOut!.additionalCost,
    ).toBeGreaterThan(0);
    expect(chooseAiAction(input).actionId).toBe(fixture.historicalActionId);
  },
);

it("keeps immediate damage outside the optional future-marker payment scope", () => {
  const { input, fixture } = native();
  const action = input.legalActions.find(
    (a) => a.actionId === fixture.historicalActionId,
  )!;
  const subroutine =
    input.playerView.run!.encounteredIce!.effectiveRunQuote!.subroutines[0]!;
  subroutine.type = "do_damage";
  subroutine.damageType = "net";
  subroutine.amount = 3;
  expect(nextEncounterDamageMarkerPayment(input, action)).toBeUndefined();
});

it("does not query encounter-only facts at the post-pass boundary", () => {
  const { input, fixture } = native();
  const action = input.legalActions.find(
    (a) => a.actionId === fixture.historicalActionId,
  )!;
  input.playerView.run!.phase = "movement";
  expect(nextEncounterDamageMarkerPayment(input, action)).toBeUndefined();
});
