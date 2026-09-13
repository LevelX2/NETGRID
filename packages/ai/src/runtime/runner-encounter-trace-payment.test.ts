import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import { cheaperSafeCurrentTracePayment } from "./runner-encounter-trace-payment";
import { currentEncounteredIceCard } from "./current-encounter";
import type { AiDecisionInput } from "@netgrid/shared";

afterEach(resetResidentPlanPortfolioMemory);
describe("encounter trace payment preserves the quoted access route", () => {
  it.each([
    "full_break",
    "corp_can_outbid",
    "restricted_breaker_funds",
    "missing_trace_quote",
  ])("does not replace the break route for %s", (condition) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r11-trace-pump.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input: AiDecisionInput = cp.input;
    if (condition === "full_break")
      input.legalActions.find(
        (a) => a.type === "continue_run",
      )!.payload!.encounterFullBreakDamage = 2;
    if (condition === "corp_can_outbid") input.playerView.opponent.credits = 40;
    if (condition === "missing_trace_quote")
      delete input.playerView.own.runnerTraceSupportQuote;
    const breaker = input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_039_krash",
    )!;
    expect(
      cheaperSafeCurrentTracePayment(
        input,
        breaker,
        currentEncounteredIceCard(input)!,
        condition === "restricted_breaker_funds" ? 2 : 18,
      ),
    ).toBeUndefined();
  });
  it("takes the safe six-credit trace route before spending ten credits on pumps", () => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r11-trace-pump.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(
      "runner.continue_run.printed_subroutines_trace",
    );
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("runner.pressure_central");
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("runner.convert_run_window");
  });
});
