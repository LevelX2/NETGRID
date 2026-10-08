import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  projectExactCorpIceRezRoute,
  exactCorpIceRezRoutesEqual,
} from "../../runtime/corp-exact-ice-rez-route";
const capture = () =>
  JSON.parse(
    readFileSync(
      new URL("./test-fixtures/free-rez-credit-gain.json", import.meta.url),
      "utf8",
    ),
  );
function inputFor(state: GameState): AiDecisionInput {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: capture().checkpoint.input.ownDeckSnapshot,
  });
}
function normalRez(input: AiDecisionInput) {
  return input.legalActions.find(
    (a) =>
      a.type === "rez_ice" &&
      a.payload?.discountedRezSourceCardId === undefined,
  )!;
}
function routeFor(input: AiDecisionInput) {
  const action = normalRez(input);
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  }).find((c) => c.actionId === action.actionId)!;
  const server = input.playerView.servers.find((s) =>
    s.ice.some((c) => c.instanceId === action.source),
  )!;
  return projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard: server.ice.find((c) => c.instanceId === action.source)!,
    targetServerId: server.id,
  });
}
afterEach(resetResidentPlanPortfolioMemory);
describe("Engine-certified costless ICE credit gain under Defense", () => {
  it.each(["zeroBank", "singleIce"])(
    "chooses and applies the native %s income rez without claiming an ETR",
    (key) => {
      const fixture = capture(),
        state: GameState = fixture.states[key],
        before = hashGameState(state),
        input = inputFor(state),
        action = normalRez(input);
      expect(fixture.provenance.eachPrefixHashMatches).toBe(true);
      expect(
        Object.values(fixture.checkpoint.validation).every((v) => v === true),
      ).toBe(true);
      if (key === "zeroBank")
        restoreAiRuntimeCheckpoint(
          input,
          fixture.checkpoint.input.ownDeckSnapshot.deckSnapshotId,
          fixture.checkpoint.runtime,
        );
      const decision = chooseAiAction({
        ...input,
        ...buildAiDecisionInputDto(input),
      });
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.actionId).toBe(action.actionId);
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("corp.defend_servers");
      expect(routeFor(input)).toMatchObject({
        routeKind: "costless_immediate_credit_gain",
        immediateCorpCreditGain: 3,
        effect: "progress",
        totalRezCredits: 0,
      });
      const result = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: decision.actionId!,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.error.message);
      expect(result.state.corp.credits).toBe(state.corp.credits + 3);
      expect(result.state.cardInstances[action.source]?.rezzed).toBe(true);
      expect(result.state.randomCounter).toBe(state.randomCounter);
      expect(result.state.pendingChoice).toBeUndefined();
      expect(hashGameState(state)).toBe(before);
      expect(JSON.stringify(result.event.publicPayload)).not.toContain(
        "creditGainOnRez",
      );
      const replay = replayEvents(state, [result.event]);
      expect(replay.ok).toBe(true);
      expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        "creditGainOnRez",
      );
    },
  );
  it("retains the native no-gate Minotaur decline", () => {
    const input = inputFor(capture().states.noGateMinotaur);
    expect(chooseAiAction(input).actionId).toBe("corp.decline_rez");
    expect(routeFor(input)).toBeUndefined();
  });
  it("does not claim income consumed by actual Corp credit debt", () => {
    const state: GameState = capture().states.singleIce;
    state.actionEconomy ??= {};
    state.actionEconomy.corpCreditForfeitDebt = { remaining: 3 } as NonNullable<
      NonNullable<GameState["actionEconomy"]>["corpCreditForfeitDebt"]
    >;
    const before = hashGameState(state),
      input = inputFor(state);
    expect(routeFor(input)).toBeUndefined();
    expect(chooseAiAction(input).actionId).toBe("corp.decline_rez");
    expect(hashGameState(state)).toBe(before);
    expect(state.actionEconomy.corpCreditForfeitDebt.remaining).toBe(3);
  });
  it.each([
    "missing",
    "stale",
    "wrong_source",
    "wrong_server",
    "wrong_definition",
    "wrong_bank",
    "wrong_balance",
    "negative",
    "zero",
    "paid",
    "point_paid",
  ])("does not admit an income route with %s", (kind) => {
    const input = inputFor(capture().states.singleIce),
      action = normalRez(input);
    const ice = input.playerView.servers
      .flatMap((s) => s.ice)
      .find((c) => c.instanceId === action.source)!;
    const quote = ice.effectivePostRezRunQuote! as any;
    if (kind === "missing") delete quote.creditGainOnRez;
    if (kind === "stale") quote.expiresAtStateVersion--;
    if (kind === "wrong_source") quote.cardId = "other_source";
    if (kind === "wrong_server") quote.targetServerId = "hq";
    if (kind === "wrong_definition") quote.iceDefinitionId = "other_definition";
    if (kind === "wrong_bank") {
      quote.creditGainOnRez.creditsBefore++;
      quote.creditGainOnRez.creditsAfter++;
    }
    if (kind === "wrong_balance") quote.creditGainOnRez.creditsAfter++;
    if (kind === "negative") quote.creditGainOnRez.creditGain = -1;
    if (kind === "zero") {
      quote.creditGainOnRez.creditGain = 0;
      quote.creditGainOnRez.creditsAfter = quote.creditGainOnRez.creditsBefore;
    }
    if (kind === "paid") {
      (ice.effectiveRezCostQuote as any).baseCredits = 1;
      (ice.effectiveRezCostQuote as any).finalCredits = 1;
      action.costs = [{ credits: 1 }];
    }
    if (kind === "point_paid") {
      (ice.effectiveRezCostQuote as any).mandatoryAdditionalCosts.agendaPoints =
        1;
      action.payload!.agendaPointCost = 1;
      action.payload!.selfRezAdditionalCostKind = "agenda_point";
      input.playerView.own.agendaPoints = 1;
    }
    expect(routeFor(input)).toBeUndefined();
  });
  it("validates lifecycle income through the DTO and rejects a contradictory balance", () => {
    const input = inputFor(capture().states.singleIce),
      card = input.playerView.servers
        .flatMap((s) => s.ice)
        .find((c) => c.instanceId === normalRez(input).source)!;
    const original = (card.effectivePostRezRunQuote as any).creditGainOnRez;
    expect(
      routeFor({ ...input, ...buildAiDecisionInputDto(input) })
        ?.immediateCorpCreditGain,
    ).toBe(3);
    original.creditsAfter++;
    expect(
      buildAiDecisionInputDto(input)
        .playerView.servers.flatMap((s) => s.ice)
        .find((c) => c.instanceId === card.instanceId)
        ?.effectivePostRezRunQuote,
    ).toBeUndefined();
  });
  it("binds the exact income when revalidating a resident Defense route", () => {
    const route = routeFor(inputFor(capture().states.singleIce))!;
    expect(
      exactCorpIceRezRoutesEqual(route, {
        ...route,
        immediateCorpCreditGain: 4,
      }),
    ).toBe(false);
  });
});
