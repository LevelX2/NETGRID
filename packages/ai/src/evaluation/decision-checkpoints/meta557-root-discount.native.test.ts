import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  validateGameState,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { toPublicEventForSide } from "../../../../engine/src/game/view/public-event-view";

function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta557-root-discount-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

function current() {
  const f = original();
  const input = {
    ...f.native.input,
    playerView: getPlayerView(f.state, "corp"),
    legalActions: getLegalActions(f.state, "corp"),
  };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { ...f, input };
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 557 current root-rez discount funding", () => {
  it("projects real root and discounted ICE transitions without state mutation or leakage", () => {
    const { state } = original();
    const before = hashGameState(state);
    const root = getLegalActions(state, "corp").find(
      (a) => a.type === "rez_card",
    )!;
    const quote = JSON.parse(
      String(root.payload?.rootRezDiscountedIceQuoteJson),
    );
    expect(quote).toMatchObject({
      schemaVersion: "corp-root-rez-discounted-ice-v1",
      actionId: root.actionId,
      stateVersion: state.stateVersion,
      ordinaryCredits: 7,
      discountedCredits: 3,
      temporaryDerezAfterRun: true,
    });
    expect(hashGameState(state)).toBe(before);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "rootRezDiscountedIceQuoteJson",
    );
    const first = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: root.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw Error("Root rez rejected");
    expect(first.state.corp.credits).toBe(5);
    expect(
      JSON.stringify(first.state.eventLog.at(-1)?.publicPayload),
    ).not.toContain("rootRezDiscountedIceQuoteJson");
    const ice = getLegalActions(first.state, "corp").find(
      (a) =>
        a.type === "rez_ice" &&
        a.payload?.discountedRezSourceCardId === root.source,
    )!;
    expect(ice.costs).toEqual([{ credits: quote.discountedCredits }]);
    const second = applyAction(first.state, {
      matchId: state.matchId,
      side: "corp",
      actionId: ice.actionId,
      clientKnownStateVersion: first.state.stateVersion,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) throw Error("Discount rez rejected");
    expect(second.state.corp.credits).toBe(2);
    expect(validateGameState(second.state)).toMatchObject({ ok: true });
    expect(getLegalActions(second.state, "runner")).toContainEqual(
      expect.objectContaining({
        payload: expect.objectContaining({ encounterWillEndRun: true }),
      }),
    );
  });

  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    "uses the Engine quote through DTO=%s resident=%s in the real Defense owner",
    (dto, resident) => {
      const f = current();
      if (dto) {
        f.input = { ...f.input, ...buildAiDecisionInputDto(f.input) };
        f.input.planningStateIdentity = buildPlanningStateIdentity(f.input);
      }
      if (resident)
        restoreAiRuntimeCheckpoint(
          f.input,
          f.input.ownDeckSnapshot.deckSnapshotId,
          f.native.runtime,
        );
      const before = JSON.stringify(f.input);
      const result = chooseAiAction(f.input);
      const action = f.input.legalActions.find(
        (a: any) => a.actionId === result.actionId,
      );
      expect(action?.type).toBe("rez_card");
      expect(action?.payload?.rootRezDiscountedIceQuoteJson).toBeTypeOf(
        "string",
      );
      expect(result.fallbackUsed).toBe(false);
      expect(result.timeoutUsed).toBe(false);
      const pf = result.decisionDebug!.planFirstDecision!;
      expect(pf.rootPlanInstanceId).toMatch(/^plan:corp.defend_servers:/);
      expect(pf.route).toMatchObject({
        actionId: result.actionId,
        stateVersion: f.input.playerView.stateVersion,
      });
      expect(JSON.stringify(f.input)).toBe(before);
      if (!result.actionId) throw Error("Root decision has no action");
      const first = applyAction(f.state, {
        matchId: f.state.matchId,
        side: "corp",
        actionId: result.actionId,
        clientKnownStateVersion: f.state.stateVersion,
      });
      if (!first.ok) throw Error("Selected root action rejected");
      let after = {
        ...f.input,
        playerView: getPlayerView(first.state, "corp"),
        legalActions: getLegalActions(first.state, "corp"),
        eventTail: first.state.eventLog.map((event) =>
          toPublicEventForSide(event, "corp"),
        ),
        decisionId: `sp663:${first.state.stateVersion}`,
        actionNumber: f.input.actionNumber + 1,
      };
      if (dto) after = { ...after, ...buildAiDecisionInputDto(after) };
      after.planningStateIdentity = buildPlanningStateIdentity(after);
      const next = chooseAiAction(after);
      const nextAction = after.legalActions.find(
        (a: any) => a.actionId === next.actionId,
      );
      expect(nextAction).toMatchObject({
        type: "rez_ice",
        costs: [{ credits: 3 }],
        payload: {
          discountedRezSourceCardId: action.source,
          temporaryDerezAfterRun: true,
        },
      });
      expect(next.fallbackUsed).toBe(false);
      expect(next.timeoutUsed).toBe(false);
    },
  );

  it.each([
    "missing",
    "stale",
    "source",
    "target",
    "server",
    "run",
    "unfunded",
    "no_stop",
    "unknown_break",
    "breakable",
  ])("does not prepare an uncertified current stop: %s", (kind) => {
    const f = current();
    const action = f.input.legalActions.find(
      (a: any) => a.type === "rez_card",
    )!;
    const quote = JSON.parse(
      String(action.payload!.rootRezDiscountedIceQuoteJson),
    );
    const ice = f.input.playerView.servers.find((s: any) => s.id === "rd")!
      .ice[0]!;
    if (kind === "missing")
      delete action.payload!.rootRezDiscountedIceQuoteJson;
    if (kind === "stale") quote.stateVersion--;
    if (kind === "source") quote.sourceCardInstanceId = "other";
    if (kind === "target") quote.targetIceInstanceId = "other";
    if (kind === "server") quote.targetServerId = "hq";
    if (kind === "run") quote.runId = "other";
    if (kind === "unfunded") quote.discountedCredits = 6;
    if (kind === "no_stop")
      ice.effectiveRezResourceExchangeQuote!.hardEndTheRunSubroutineCount = 0;
    if (kind === "unknown_break")
      delete ice.effectiveRezResourceExchangeQuote!.runnerBreakUnavailable;
    if (kind === "breakable") {
      delete ice.effectiveRezResourceExchangeQuote!.runnerBreakUnavailable;
      ice.effectiveRezResourceExchangeQuote!.runnerBreakCostCredits = 0;
    }
    if (kind !== "missing")
      action.payload!.rootRezDiscountedIceQuoteJson = JSON.stringify(quote);
    f.input.planningStateIdentity = buildPlanningStateIdentity(f.input);
    expect(chooseAiAction(f.input).actionId).toBe("corp.decline_rez");
  });
});
