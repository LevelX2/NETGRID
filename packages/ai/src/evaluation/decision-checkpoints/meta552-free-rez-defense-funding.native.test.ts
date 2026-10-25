import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  CURRENT_RULES_BASELINE,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import type { GameState, PlayerAction } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { corpFreeRezPayoutPreparation } from "../../corp/economy/free-rez-payout-preparation";
import type {
  CorpEconomyDevelopmentSignal,
  CorpEconomyParentFundingSignal,
  EconomyState,
} from "../../corp/economy/economy-types";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import {
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-free-rez-defense-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    matchId: string;
    seed: string;
    runnerDeckSnapshot: DeckSnapshot;
    native: {
      input: AiDecisionInputWithDeckCapabilities & {
        ownDeckSnapshot: DeckSnapshot;
      };
      runtime: AiRuntimeCheckpointV1;
      stateHash: string;
      validation: Record<string, boolean>;
    };
    prefixActions: Array<{
      side: "runner" | "corp";
      actionId: string;
      selectedChoices?: PlayerAction["selectedChoices"];
    }>;
    originalContinuation: Array<{
      side: "corp";
      actionId: string;
      selectedChoices?: PlayerAction["selectedChoices"];
    }>;
  };
}
function advance(
  state: GameState,
  action: {
    side: "runner" | "corp";
    actionId: string;
    selectedChoices?: PlayerAction["selectedChoices"];
  },
) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `native-prefix:${state.stateVersion}`,
    ...(action.selectedChoices
      ? { selectedChoices: action.selectedChoices }
      : {}),
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function originalState() {
  const f = fixture(),
    corp = f.native.input.ownDeckSnapshot!,
    runner = f.runnerDeckSnapshot!;
  if (!runner.publicMetadata || !corp.publicMetadata)
    throw Error("native_fixture_missing_deck_metadata");
  const controllers = {
    runner: {
      controllerId: "runner-ai",
      side: "runner" as const,
      type: "ai" as const,
      displayName: "Runner KI",
      difficulty: "hard" as const,
      profileId: "runner-ai-v0.9-hard",
    },
    corp: {
      controllerId: "corp-ai",
      side: "corp" as const,
      type: "ai" as const,
      displayName: "Korp KI",
      difficulty: "hard" as const,
      profileId: "corp-ai-v0.9-hard",
    },
  };
  let state = createGame({
    matchId: f.matchId,
    seed: f.seed,
    baseline: CURRENT_RULES_BASELINE,
    agendaPointsToWin: 7,
    traceRulesProfile: "modern_open",
    controllers,
    runnerDeck: buildEngineDeck(runner),
    corpDeck: buildEngineDeck(corp),
    runnerDeckMetadata: runner.publicMetadata,
    corpDeckMetadata: corp.publicMetadata,
  });
  for (const a of f.prefixActions) state = advance(state, a);
  expect(hashState(state)).toBe(f.native.stateHash);
  return { f, state };
}
function offers() {
  const { f, state } = originalState();
  const input = buildAiDecisionInput(state, "corp", {
    ownDeckSnapshot: f.native.input.ownDeckSnapshot!,
    difficulty: "hard",
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    f.native.runtime,
  );
  chooseAiAction(input);
  const signals = exportAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
  )
    .residentPlanPortfolio!.instances.filter(
      (p) => p.moduleId === "corp.economy",
    )
    .map((p) => (p.moduleState as EconomyState).signal);
  const signal = signals.find(
    (s): s is CorpEconomyParentFundingSignal =>
      s.kind === "parent_funding" && !!s.freeRezPayoutPreparation,
  )!;
  expect(signal).toBeDefined();
  const campaigns = signals.filter(
    (s): s is CorpEconomyDevelopmentSignal => s.kind === "develop_campaign",
  );
  const visibleCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((s) => [...s.root, ...s.ice]),
  ];
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      visibleCards
        .filter((c) => c.known && c.definitionId)
        .map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
  return { input, signal, campaigns, candidates };
}
describe("native free rez before Defense funding", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it("fails closed when an admitted campaign loses its required payout proof", () => {
    const { input, signal, campaigns, candidates } = offers();
    const source = campaigns.find(
      (c) => c.needId === signal.freeRezPayoutPreparation!.campaignNeedId,
    )!;
    delete source.riskAdjustment;
    expect(() =>
      corpFreeRezPayoutPreparation(
        input,
        candidates,
        signal,
        signal.freeRezPayoutPreparation!.basicFundingActionId,
        campaigns,
      ),
    ).toThrow("missing_plan_module_coverage");
  });
  it("reconstructs the original Engine state and strictly improves the one-click funding prefix", () => {
    const { f, state } = originalState();
    expect(Object.keys(f.native.validation)).toHaveLength(9);
    expect(Object.values(f.native.validation).every(Boolean)).toBe(true);
    const rez = getLegalActions(state, "corp").find(
      (a) => a.type === "rez_card",
    )!;
    const basic = advance(structuredClone(state), {
      side: "corp",
      actionId: "corp.gain_credit",
    });
    let improved = advance(structuredClone(state), {
      side: "corp",
      actionId: rez.actionId,
    });
    expect(improved.corp.credits).toBe(5);
    expect(improved.corp.clicks).toBe(2);
    const payout = getLegalActions(improved, "corp").find(
      (a) =>
        a.type === "activated_card_ability" &&
        a.actionId.includes("take_hosted_credits"),
    )!;
    improved = advance(improved, { side: "corp", actionId: payout.actionId });
    expect([basic.corp.credits, basic.corp.clicks]).toEqual([6, 1]);
    expect([improved.corp.credits, improved.corp.clicks]).toEqual([7, 1]);
    const replay = replayEvents(
      state,
      improved.eventLog.slice(state.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(improved));
  });
  it("keeps the important installation first, then performs the free setup and real payout under the same funding parent", () => {
    const { f, state } = originalState();
    let current = structuredClone(state);
    const actions: string[] = [];
    for (let index = 0; index < 3; index++) {
      const input = buildAiDecisionInput(current, "corp", {
        ownDeckSnapshot: f.native.input.ownDeckSnapshot!,
        difficulty: "hard",
      });
      if (index === 0)
        restoreAiRuntimeCheckpoint(
          input,
          input.ownDeckSnapshot!.deckSnapshotId,
          f.native.runtime,
        );
      const d = chooseAiAction(input),
        a = input.legalActions.find((a) => a.actionId === d.actionId)!;
      expect(d.fallbackUsed).toBe(false);
      expect(d.timeoutUsed).toBe(false);
      actions.push(a.type);
      const p = d.decisionDebug?.planFirstDecision;
      expect(p?.route).toMatchObject({
        actionId: a.actionId,
        stateVersion: current.stateVersion,
      });
      expect(p?.route?.planInstanceId).toBe(p?.leafExecutorInstanceId);
      if (index > 0) {
        expect(p?.rootPlanInstanceId).toBe(
          "plan:corp.defend_servers:server-defense-portfolio",
        );
        expect(p?.selectedPlan?.moduleId).toBe("corp.economy");
      }
      current = advance(current, { side: "corp", actionId: a.actionId });
    }
    expect(actions).toEqual([
      "install_card",
      "rez_card",
      "activated_card_ability",
    ]);
    expect([current.corp.credits, current.corp.clicks]).toEqual([7, 0]);
    const replay = replayEvents(
      state,
      current.eventLog.slice(state.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(current));
  });
  it("binds the exact current legal source, admitted campaign and resident Defense need", () => {
    const { input, signal, campaigns, candidates } = offers(),
      expected = signal.freeRezPayoutPreparation!;
    expect(
      corpFreeRezPayoutPreparation(
        input,
        candidates,
        signal,
        expected.basicFundingActionId,
        campaigns,
      ),
    ).toEqual(expected);
    expect(expected).toMatchObject({
      stateVersion: 25,
      parentPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      parentNeedId: signal.parentNeedId,
      poolCreditsOnRez: 16,
      payoutCredits: 2,
      payoutClicks: 1,
    });
    expect(signal.fundingRouteAssessment?.freeRezPayoutPreparation).toEqual(
      expected,
    );
  });
  it.each([
    "stale",
    "paid",
    "no_click",
    "no_campaign",
    "funded",
    "other_parent",
  ])("does not authorize an unproved preparation: %s", (kind) => {
    const { input, signal, campaigns, candidates } = offers(),
      quote = signal.freeRezPayoutPreparation!;
    if (kind === "stale") input.playerView.stateVersion++;
    if (kind === "paid")
      input.legalActions.find((a) => a.actionId === quote.actionId)!.costs = [
        { credits: 1 },
      ];
    if (kind === "no_click") input.playerView.own.clicks = 0;
    if (kind === "funded") signal.gap = 0;
    if (kind === "other_parent")
      signal.parentPlanInstanceId = "plan:corp.score_agenda:other";
    expect(
      corpFreeRezPayoutPreparation(
        input,
        candidates,
        signal,
        quote.basicFundingActionId,
        kind === "no_campaign" ? [] : campaigns,
      ),
    ).toBeUndefined();
  });
});
