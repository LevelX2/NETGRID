import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { resolvePlanBoundRunnerRunProgramSearchChoice } from "../../runner/run-window/run-window-program-search-binding";

const sourceId = "c1o9";
const root = "p1p4xezjcxov79rno40lq3f7rv";
const leaf = "p9nyoe3wdsw0j74ikqi7ockkcs";
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
    expect(decision.actionId).toBe("rn");
    expect(decision.selectedChoices).toEqual({
      choiceId: "p3_38_search_stack_install_138",
      selectedOptionIds: ["card_c1e9"],
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

  it("uses the same remembered plan for the choice and its origin", () => {
    selectSource();
    const input = nextSearchInput();
    const context = { input, turnKey: "runner:search", actionCandidates: [] };
    expect(
      resolvePlanBoundRunnerRunProgramSearchChoice(context, undefined),
    ).toMatchObject({
      actionId: "rn",
      origin: { rootPlanInstanceId: root, leafPlanInstanceId: leaf },
    });
    input.legalActions.find(
      (action) => action.type === "resolve_choice",
    )!.timingPoint = "runner_action.main";
    expect(() =>
      resolvePlanBoundRunnerRunProgramSearchChoice(context, undefined),
    ).toThrow(/window_origin_missing/);
  });

  it.each([
    "credits",
    "source_memory_quote",
    "inventory",
    "no_break",
    "hosted_source",
    "later_damage_group",
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
      if (boundary === "later_damage_group") {
        const run = input.playerView.run!;
        const subroutines = run.encounteredIce!.effectiveRunQuote!.subroutines;
        const endRun = subroutines.find(
          (subroutine) => subroutine.type === "end_the_run",
        );
        if (!endRun) throw Error("Expected native end-run subroutine");
        const damage = {
          id: subroutines.length.toString(36),
          type: "do_damage",
          damageType: "net",
          amount: 1,
        } as const;
        run.encounteredIce!.effectiveRunQuote!.subroutines.push(damage);
        if (run.position?.kind !== "ice")
          throw Error("Expected native encounter");
        const ice = input.playerView.servers.find(
          (server) => server.id === run.attackedServerId,
        )!.ice[run.position.iceIndex]!;
        if (ice.effectiveRunQuote !== run.encounteredIce!.effectiveRunQuote)
          ice.effectiveRunQuote!.subroutines.push(damage);
        const continuation = input.legalActions.find(
          (action) => action.type === "continue_run",
        )!;
        continuation.encounterRemainingSubroutineIds = [endRun.id, damage.id];
        continuation.payload = {
          ...continuation.payload,
          encounterRemainingSubroutineCount: 2,
        };
      }
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
          (option) => option.card?.definitionId !== 226,
        );
      if (boundary === "run") input.playerView.run!.runId = input.playerView.stateVersion + 1;
      if (boundary === "install_cost")
        for (const option of choice.options)
          if (option.card?.definitionId === 226)
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
