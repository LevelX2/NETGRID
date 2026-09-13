import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerRepeatedFreeStopProbeEvidence } from "./central-probe-outcome";

function fixture(game = 3) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r7-free-probe-g${game}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
describe("central information admission after an observed free stop", () => {
  it.each(["score", "livewire", "decline", "hosted"])(
    "retains the observed stop across the original %s transition",
    (transition) => {
      const cp = JSON.parse(
        readFileSync(
          new URL(
            `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r10-free-probe-${transition}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      const serverId =
        transition === "decline" || transition === "hosted" ? "hq" : "rd";
      const target = evaluateRunnerRunTargets({ input }).find(
        (e) => e.actionId === `runner.start_run.${serverId}`,
      )!;
      expect(runnerRepeatedFreeStopProbeEvidence(input, target)).toContain(
        "free_stop_already_observed",
      );
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        cp.runtime,
      );
      const decision = chooseAiAction(input);
      expect(decision.actionId).not.toBe(target.actionId);
      expect(decision.fallbackUsed).toBe(false);
      const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
        (i) =>
          i.moduleId === "runner.pressure_central" && i.target?.id === serverId,
      )!;
      expect(owner.moduleState).toMatchObject({
        signal: {
          reachable: false,
          runActionExclusions: {
            [target.actionId]: [
              expect.stringContaining("free_stop_already_observed"),
            ],
          },
        },
      });
    },
  );
  it.each([3, 16])(
    "declines the repeated basic probe in original G%i through the existing owner",
    (game) => {
      const cp = fixture(game);
      const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      const serverId = game === 3 ? "hq" : "rd";
      const target = evaluateRunnerRunTargets({ input }).find(
        (e) => e.actionId === `runner.start_run.${serverId}`,
      )!;
      expect(runnerRepeatedFreeStopProbeEvidence(input, target)).toContain(
        "free_stop_already_observed",
      );
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        cp.runtime,
      );
      const decision = chooseAiAction(input);
      expect(decision.actionId).not.toBe(target.actionId);
      expect(decision.fallbackUsed).toBe(false);
      const owner = residentPlanPortfolioSnapshot(input)!.instances.find(
        (i) =>
          i.moduleId === "runner.pressure_central" && i.target?.id === serverId,
      )!;
      expect(owner.moduleState).toMatchObject({
        signal: {
          reachable: false,
          runActionExclusions: {
            [target.actionId]: [
              expect.stringContaining("free_stop_already_observed"),
            ],
          },
        },
      });
    },
  );
  it("does not treat a power-counter change as credit banking", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r10-free-probe-hosted.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    for (const list of [cp.input.eventTail, cp.input.playerView.publicEvents]) {
      const p = list.find(
        (e: { eventId: string }) => e.eventId === "evt_117",
      ).publicPayload;
      p.resolvedEffects[0].counterType = "power";
    }
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    const target = evaluateRunnerRunTargets({ input }).find(
      (e) => e.actionId === "runner.start_run.hq",
    )!;
    expect(runnerRepeatedFreeStopProbeEvidence(input, target)).toBeUndefined();
  });
  it.each(["mixed_effect", "unquoted_event"])(
    "requires a pure quoted financing event: %s",
    (condition) => {
      const cp = JSON.parse(
        readFileSync(
          new URL(
            "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r10-free-probe-score.json",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      for (const list of [
        cp.input.eventTail,
        cp.input.playerView.publicEvents,
      ]) {
        const p = list.find(
          (e: { eventId: string }) => e.eventId === "evt_144",
        ).publicPayload;
        if (condition === "unquoted_event") delete p.resolvedEffects;
        else
          p.resolvedEffects.push({
            effectId: "mixed-draw",
            visibility: "public",
            kind: "draw_cards",
            side: "runner",
            amount: 1,
          });
      }
      const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      const target = evaluateRunnerRunTargets({ input }).find(
        (e) => e.actionId === "runner.start_run.rd",
      )!;
      expect(
        runnerRepeatedFreeStopProbeEvidence(input, target),
      ).toBeUndefined();
    },
  );
  it("preserves only the approved typed Engine outcome through both event lists", () => {
    const cp = fixture();
    for (const list of [cp.input.eventTail, cp.input.playerView.publicEvents]) {
      const event = list.find(
        (e: { eventId: string }) => e.eventId === "evt_33",
      );
      event.publicPayload.unapprovedHiddenIceIdentity = "must-not-cross";
    }
    const input = buildAiDecisionInputDto(cp.input);
    for (const list of [input.eventTail, input.playerView.publicEvents]) {
      const event = list.find((e) => e.eventId === "evt_33")!;
      expect(event.publicPayload).toMatchObject({
        result: "ended",
        encounterContinue: true,
        encounterWillEndRun: true,
      });
      expect(event.publicPayload).not.toHaveProperty(
        "unapprovedHiddenIceIdentity",
      );
    }
  });
  it.each([
    "next_turn",
    "paid_defense",
    "new_installation",
    "guaranteed_route",
    "event_run",
    "untyped_outcome",
  ])(
    "does not suppress a different or unsupported experiment: %s",
    (condition) => {
      const input: AiDecisionInput = fixture().input;
      const target = evaluateRunnerRunTargets({ input }).find(
        (e) => e.actionId === "runner.start_run.hq",
      )!;
      if (condition === "next_turn") input.playerView.turnSerial!++;
      if (condition === "paid_defense" || condition === "untyped_outcome") {
        for (const events of [input.eventTail, input.playerView.publicEvents]) {
          if (condition === "paid_defense")
            events.find(
              (e) => e.eventId === "evt_32",
            )!.publicPayload.rezCostPaid = 1;
          else
            delete events.find((e) => e.eventId === "evt_33")!.publicPayload
              .result;
        }
      }
      if (condition === "new_installation")
        input.eventTail.push({
          ...input.eventTail.at(-1)!,
          eventId: "new-rig-install",
          stateVersionBefore: 33,
          stateVersionAfter: 34,
          publicPayload: { actor: "runner", actionType: "install_card" },
        });
      if (condition === "guaranteed_route")
        target.routeQuote = {
          ...target.routeQuote!,
          reachability: "guaranteed_access",
        };
      if (condition === "event_run")
        input.legalActions.find((a) => a.actionId === target.actionId)!.source =
          "own-run-event";
      // Evaluation may cache merged history; use a fresh decision input after
      // each actual transition being compared.
      expect(
        runnerRepeatedFreeStopProbeEvidence(structuredClone(input), target),
      ).toBeUndefined();
    },
  );
});
