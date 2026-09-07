import { describe, expect, it } from "vitest";
import deckoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-deckout-maturity-d427.json";
import deckoutContinuationJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-deckout-maturity-d428.json";
import discardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-discard-search-d125.json";
import programJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-probe-program-safety-d32.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
function choose(json: unknown) {
  const { input, runtime } = structuredClone(json) as Capture;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input, { runnerTurnPlannerMode: "cutover" });
  const selected = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(selected).toBeDefined();
  expect(selected.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(result.fallbackUsed).toBe(false);
  const plan = result.decisionDebug?.planFirstDecision;
  expect(plan?.selectedStep?.planInstanceId).toBe(
    plan?.selectedPlan?.instanceId,
  );
  return { input, result, selected, plan };
}

describe("meta 403 round 5 exact owner regressions", () => {
  it("keeps certified deckout score routes available under the actual score owner", () => {
    const { plan } = choose(deckoutJson);
    expect(plan?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "corp.score_agenda",
          viability: "ready",
          phase: "install_agenda",
        }),
      ]),
    );
  });

  it("installs a winning agenda on the next real click instead of the one-point agenda", () => {
    const { input, selected, plan } = choose(deckoutContinuationJson);
    expect(selected.type).toBe("install_card");
    const agenda = input.playerView.own.gripOrHq.find(
      (c) => c.instanceId === selected.source,
    )!;
    expect(
      agenda.agendaPoints! + input.playerView.own.agendaPoints,
    ).toBeGreaterThanOrEqual(input.playerView.agendaPointsToWin);
    expect(plan?.selectedPlan?.moduleId).toBe("corp.score_agenda");
  });

  it("keeps ordinary remote maturity requirements when deck exhaustion is not near", () => {
    const capture = structuredClone(deckoutJson) as unknown as Capture;
    capture.input.playerView.own.stackOrRdCount = 20;
    const { plan } = choose(capture);
    expect(
      plan?.portfolio.filter(
        (p) =>
          p.moduleId === "corp.score_agenda" &&
          p.phase === "install_agenda" &&
          p.viability === "ready",
      ),
    ).toHaveLength(0);
  });

  it("retains its known breaker search while choosing the exact forced discard", () => {
    const { input, result, selected, plan } = choose(discardJson);
    expect(selected.type).toBe("resolve_choice");
    expect(plan?.selectedPlan?.moduleId).toBe("runner.defense_and_recovery");
    expect(result.selectedChoices?.choiceId).toBe(
      input.playerView.pendingChoice?.choiceId,
    );
    expect(result.selectedChoices?.selectedOptionIds).not.toContain(
      "card_runner_onr_proteus_128_airport-locker_1",
    );
    expect(result.selectedChoices?.selectedOptionIds).toHaveLength(1);
    const selectedOptionIds = result.selectedChoices
      ?.selectedOptionIds as string[];
    expect(
      input.playerView.pendingChoice?.options.some(
        (o) => o.id === selectedOptionIds[0],
      ),
    ).toBe(true);
  });

  it("breaks the affordable program-trash subroutine inside the existing run executor", () => {
    const { selected, plan } = choose(programJson);
    expect(selected.type).toBe("break_subroutine");
    expect(selected.payload?.subroutineIndex).toBe(0);
    expect(plan?.selectedPlan?.moduleId).toBe("runner.convert_run_window");
    expect(plan?.leafExecutorInstanceId).toBe(
      "plan:runner.convert_run_window:run%3Arun_29",
    );
  });

  it("does not spend the information budget on end-the-run after program trash is broken", () => {
    const capture = structuredClone(programJson) as unknown as Capture;
    capture.input.legalActions = capture.input.legalActions.filter(
      (a) => a.type !== "break_subroutine" || a.payload?.subroutineIndex !== 0,
    );
    const continuation = capture.input.legalActions.find(
      (a) => a.type === "continue_run",
    )!;
    continuation.actionId =
      "runner.continue_run.printed_subroutines_end_the_run";
    Object.assign(continuation.payload!, {
      encounterSubroutineIds: "printed_subroutines_end_the_run",
      unbrokenSubroutineCount: 1,
    });
    const { selected, plan } = choose(capture);
    expect(selected.type).toBe("continue_run");
    expect(plan?.selectedPlan?.moduleId).toBe("runner.convert_run_window");
  });

  it("fails visibly if program preservation cannot bind the Engine's remaining subroutines", () => {
    const capture = structuredClone(programJson) as unknown as Capture;
    const continuation = capture.input.legalActions.find(
      (a) => a.type === "continue_run",
    )!;
    delete continuation.payload!.encounterSubroutineIds;
    expect(() => choose(capture)).toThrow("missing_action_semantics");
  });
});
