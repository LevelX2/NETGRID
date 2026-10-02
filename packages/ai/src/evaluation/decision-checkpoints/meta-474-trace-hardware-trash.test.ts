import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { selectedCorpTraceHardwareTrashChoiceOptionIds } from "../../runtime/corp-trace-hardware-trash-choice";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r8-g4-d299.json",
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
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}

describe("pairing 474: mandatory Trace hardware target after run end", () => {
  it("binds the unchanged native action, choice, state and public target to Defense", () => {
    const input = checkpoint();
    expect(input.playerView.run).toBeUndefined();
    expect(
      input.playerView.servers
        .flatMap((s) => s.ice)
        .find((c) => c.instanceId === "corp_onr_v1_228_cinderella_1")?.rezzed,
    ).toBe(false);
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: "corp.resolve_choice",
      fallbackUsed: false,
      timeoutUsed: false,
      selectedChoices: {
        choiceId: input.playerView.pendingChoice!.choiceId,
        selectedOptionIds: ["hardware_runner_onr_v1_129_hq-interface_1"],
      },
    });
    expect(input.legalActions[0]!.expiresAtStateVersion).toBe(298);
    expect(decision.decisionDebug!.planFirstDecision!).toMatchObject({
      stateVersion: 298,
      lane: "plan",
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      selectedStep: {
        planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
        stepId: "plan:corp.defend_servers:server-defense-portfolio:allocate",
      },
      route: { actionId: decision.actionId },
    });
  });

  it("retains Defense ownership when only one hardware target remains", () => {
    const input = checkpoint();
    const choice = input.playerView.pendingChoice!;
    const remainingId = "runner_onr_v1_139_r-and-d-interface_1";
    // Keep the original native R&D Interface, its option and LegalAction binding.
    input.playerView.opponent.rig = input.playerView.opponent.rig!.filter(
      (card) => card.type !== "hardware" || card.instanceId === remainingId,
    );
    choice.options = choice.options.filter(
      (option) => option.value === remainingId,
    );
    input.legalActions[0]!.choiceRequirements![0]!.optionIds =
      choice.options.map((option) => option.id);
    const decision = chooseAiAction(input);
    expect(decision.selectedChoices?.selectedOptionIds).toEqual([
      `hardware_${remainingId}`,
    ]);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      lane: "plan",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
    });
    expect(decision.fallbackUsed).toBe(false);
  });

  it("values public hardware in the owner and preserves the bound payload in the resolver", () => {
    const input = checkpoint();
    const hardware = input.playerView.opponent.rig!.filter(
      (card) => card.type === "hardware",
    );
    const target = hardware.find(
      (card) => card.instanceId === "runner_onr_v1_139_r-and-d-interface_1",
    )!;
    target.counters = { power: 2 };
    const choice = input.playerView.pendingChoice!;
    choice.options.reverse();
    input.legalActions[0]!.choiceRequirements![0]!.optionIds.reverse();
    const decision = chooseAiAction(input);
    expect(decision.selectedChoices?.selectedOptionIds).toEqual([
      `hardware_${target.instanceId}`,
    ]);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    // Revaluation would now prefer the other card. Payload completion must keep
    // the owner-selected target rather than creating a second decision authority.
    hardware.find((card) => card !== target)!.counters = { power: 9 };
    expect(
      selectedCorpTraceHardwareTrashChoiceOptionIds(
        input,
        input.legalActions[0]!,
        choice,
        choice.options,
        portfolio,
      ),
    ).toEqual([`hardware_${target.instanceId}`]);
  });

  it.each(["executor", "module", "state", "target"])(
    "rejects a corrupted resident %s binding without selecting a replacement",
    (kind) => {
      const input = checkpoint();
      chooseAiAction(input);
      const portfolio = structuredClone(residentPlanPortfolioSnapshot(input)!);
      const executor = portfolio.instances.find(
        (instance) => instance.instanceId === portfolio.executorInstanceId,
      )!;
      if (kind === "executor") portfolio.executorInstanceId = "absent-executor";
      if (kind === "module") executor.moduleId = "corp.draw";
      if (kind === "state") portfolio.stateVersion--;
      if (kind === "target") {
        const state = executor.moduleState as {
          signals: { choiceResolution?: { selectedOptionId: string } }[];
        };
        state.signals.find(
          (signal) => signal.choiceResolution,
        )!.choiceResolution!.selectedOptionId = "hardware_absent";
      }
      const choice = input.playerView.pendingChoice!;
      expect(() =>
        selectedCorpTraceHardwareTrashChoiceOptionIds(
          input,
          input.legalActions[0]!,
          choice,
          choice.options,
          portfolio,
        ),
      ).toThrow(PlanResolutionFailure);
    },
  );

  it.each([
    "quote_expiry",
    "quote_complete",
    "quote_server",
    "quote_source",
    "effect",
    "event",
    "cost",
    "duplicate",
    "option_binding",
    "cardinality",
    "choice_state",
    "action_state",
  ])("fails closed for invalid current Engine facts: %s", (kind) => {
    const input = checkpoint();
    const choice = input.playerView.pendingChoice!;
    const action = input.legalActions[0]!;
    const source = input.playerView.servers
      .flatMap((server) => server.ice)
      .find((card) => card.instanceId === "corp_onr_v1_228_cinderella_1")!;
    const quote = source.effectivePostRezRunQuote!;
    if (!quote.complete)
      throw new Error("Native checkpoint requires a complete quote");
    if (kind === "quote_expiry") quote.expiresAtStateVersion--;
    if (kind === "quote_complete") Object.assign(quote, { complete: false });
    if (kind === "quote_server") quote.targetServerId = "hq";
    if (kind === "quote_source") quote.cardId = "absent-source";
    if (kind === "effect")
      quote.effectiveRunQuote!.subroutines[0]!.traceSuccessEffect = {
        type: "none",
      };
    if (kind === "event")
      input.eventTail.at(-1)!.publicPayload.traceStep = "corp_bid";
    if (kind === "cost")
      delete input.playerView.opponent.rig!.find(
        (card) => card.type === "hardware",
      )!.installCost;
    if (kind === "duplicate")
      choice.options[1] = structuredClone(choice.options[0]!);
    if (kind === "option_binding")
      action.choiceRequirements![0]!.optionIds[0] = "absent-option";
    if (kind === "cardinality") choice.minSelections = choice.maxSelections = 2;
    if (kind === "choice_state") choice.stateVersion--;
    if (kind === "action_state") action.expiresAtStateVersion--;
    expect(() => chooseAiAction(input)).toThrow(PlanResolutionFailure);
  });
});
