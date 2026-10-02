import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

const sourceId = "runner_onr_v1_059_self-modifying-code_1";
const root = "plan:runner.contest_remote:remote%3Aremote_1";
const leaf = "plan:runner.convert_run_window:run%3Arun_134";
const read = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );

function nativeInput() {
  const fixture = read("meta489-g11-d138");
  expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...fixture.input,
    ...buildAiDecisionInputDto(fixture.input),
  } as AiDecisionInputWithDeckCapabilities;
  // The official restart boundary invalidates the old source's turn lease,
  // while restoring the native run parent and its reserve contract.
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    fixture.runtime,
  );
  return input;
}

function nextSearchInput(): AiDecisionInput {
  const fixture = read("meta489-g11-d138-search-counterline");
  expect(fixture.provenance.kind).toBe(
    "real-engine-counterline-from-native-api-checkpoint",
  );
  return { ...fixture.input, ...buildAiDecisionInputDto(fixture.input) };
}

function selectSource() {
  const input = nativeInput();
  const decision = chooseAiAction(input);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId),
  ).toMatchObject({
    type: "activated_card_ability",
    source: sourceId,
    expiresAtStateVersion: 137,
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: leaf,
    executionOrigin: {
      rootPlanInstanceId: root,
      leafPlanInstanceId: leaf,
      stateVersion: 137,
    },
  });
  return decision;
}

describe("native in-run program search (SP-333)", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it(
    "selects the real SMC source through its existing run parent",
    selectSource,
  );

  it("preserves that parent and executor through the Engine's hidden search choice", () => {
    selectSource();
    const input = nextSearchInput();
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("runner.resolve_choice");
    expect(decision.selectedChoices).toEqual({
      choiceId: "p3_38_search_stack_install_138",
      selectedOptionIds: ["card_runner_onr_v1_014_codecracker_1"],
    });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: root,
      leafExecutorInstanceId: leaf,
      executionOrigin: {
        rootPlanInstanceId: root,
        leafPlanInstanceId: leaf,
        stateVersion: 138,
      },
    });
    expect(input.playerView.own).toMatchObject({
      credits: 10,
      memoryUsed: 5,
      memoryLimit: 7,
    });
  });

  it.each([
    "credits",
    "source_memory_quote",
    "inventory",
    "no_break",
    "hosted_source",
  ] as const)(
    "does not sacrifice the source when the exact route lacks %s",
    (boundary) => {
      const input = nativeInput();
      if (boundary === "credits") input.playerView.own.credits = 0;
      if (boundary === "source_memory_quote")
        delete input.playerView.own.rig!.find(
          (card) => card.instanceId === sourceId,
        )!.memoryCost;
      if (boundary === "inventory")
        for (const breaker of input.ownDeckCapabilities!.runner!
          .breakerInventory)
          breaker.quantityKnownInDeck = 0;
      if (boundary === "no_break")
        input.playerView.run!.noBreakSubroutinesActive = true;
      if (boundary === "hosted_source")
        input.playerView.own.rig!.find(
          (card) => card.instanceId === sourceId,
        )!.hostedOn = "different_host";
      const decision = chooseAiAction(input);
      expect(
        input.legalActions.find((a) => a.actionId === decision.actionId)
          ?.source,
      ).not.toBe(sourceId);
      expect(
        decision.decisionDebug?.actionAlternatives
          ?.find((a) => a.actionId.includes(sourceId))
          ?.whyNot?.join("|"),
      ).toContain("runner_run_program_search");
    },
  );

  it.each(["source", "version", "target", "run", "install_cost"] as const)(
    "rejects a changed %s instead of selecting a replacement program",
    (boundary) => {
      selectSource();
      const input = nextSearchInput();
      const choice = input.playerView.pendingChoice!;
      if (boundary === "source")
        choice.sourceCardInstanceId = "different_source";
      if (boundary === "version") choice.stateVersion += 1;
      if (boundary === "target")
        choice.options = choice.options.filter(
          (option) => option.card?.definitionId !== "onr_v1_014_codecracker",
        );
      if (boundary === "run") input.playerView.run!.runId = "different_run";
      if (boundary === "install_cost")
        for (const option of choice.options)
          if (option.card?.definitionId === "onr_v1_014_codecracker")
            option.card.installCost = 9;
      expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
    },
  );

  it("rejects an active-run search without its resident source binding", () => {
    expect(() => chooseAiAction(nextSearchInput())).toThrow(
      /window_origin_missing/,
    );
  });
});
