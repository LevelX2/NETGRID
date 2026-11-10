import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import { DEMO_DECKS, type GameState } from "@netgrid/shared";
import { expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildAiDecisionInputDto } from "../input-dto";
import { projectExactCorpIceRezRoute } from "./corp-exact-ice-rez-route";
import { assessCorpExactIceRezAgainstScoreReserves } from "../corp/defense/corp-defense-score-reserve";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import { currentRunPathContext } from "../run-analysis/current-run-path-context";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

const QUANDARY = "onr_v1_261_quandary";
const WALL = "onr_v1_237_data-wall";
const INSIDE = "onr_v1_094_inside-job";
const KRASH = "onr_v1_039_krash";

it("keeps Classic trace semantics when quoting the live inner path", () => {
  const f = fixture(false, true, true, 15, "onr_v1_249_hunter");
  const view = getPlayerView(f.state, "runner");
  const input = {
    ...f.input,
    side: "runner" as const,
    playerView: view,
    legalActions: getLegalActions(f.state, "runner"),
  };
  const path = assessKnownRezzedIcePath(
    view.servers.find((s) => s.id === "remote_1")!.ice.slice(0, 1),
    view.own.rig ?? [],
    view.own.credits,
    [],
    view.opponent.credits,
    currentRunPathContext(input),
  );
  const hazard = path.visibleIceRunHazards!.find(
    (h) => h.kind === "trace_tag",
  )!;
  expect(hazard.traceBaseStrength).toBe(0);
  expect(hazard.runnerTraceCapacity).toBe(0);
  expect(hazard.evidence).toContain(
    "visible_trace_rules_profile:classic_blind",
  );
});

it("keeps the funded bypass-soak route with the Defense owner and its original action", () => {
  resetResidentPlanPortfolioMemory();
  const f = fixture(true, false);
  const counts = new Map<string, number>();
  for (const card of Object.values(f.state.cardInstances)) {
    if (card.owner === "corp" && card.instanceId !== f.state.corp.identity)
      counts.set(card.definitionId, (counts.get(card.definitionId) ?? 0) + 1);
  }
  const input = buildAiDecisionInput(f.state, "corp", {
    ownDeckSnapshot: {
      deckSnapshotId: "native-bypass-corp",
      side: "corp",
      cards: [...counts].map(([cardId, quantity]) => ({ cardId, quantity })),
    },
  });
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(f.candidate.actionId);
  expect(result.fallbackUsed).toBeFalsy();
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toContain(
    "corp.defend_servers",
  );
  expect(
    result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain("corp.defend_servers");
  resetResidentPlanPortfolioMemory();
});

// Explicit native component fixture, not a reconstructed historical GameState.
function fixture(
  inside: boolean,
  innerRezzed: boolean,
  innerPresent = true,
  corpCredits = 15,
  innerDefinition = WALL,
) {
  let state = createGameAfterSetup({
    seed: "manual-bypass-fort",
    traceRulesProfile: "classic_blind",
    runnerDeck: {
      ...DEMO_DECKS.demo_runner_001,
      cards: [
        ...DEMO_DECKS.demo_runner_001.cards,
        { id: INSIDE, quantity: 1 },
        { id: KRASH, quantity: 1 },
      ],
    },
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      cards: [
        ...DEMO_DECKS.demo_corp_001.cards,
        { id: QUANDARY, quantity: 1 },
        { id: WALL, quantity: 1 },
        { id: "onr_v1_249_hunter", quantity: 1 },
      ],
    },
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  const builder = RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(14)
    .withRunnerClicks(4)
    .withCorpCredits(corpCredits)
    .withRunnerCardInGrip(INSIDE)
    .withRunnerProgramInstalled(KRASH)
    .withCorpRemoteAgenda("remote_1", 1);
  if (innerPresent) builder.withCorpIceOnServer("remote_1", innerDefinition);
  builder.withCorpIceOnServer("remote_1", QUANDARY);
  const server = state.corp.servers.find((s) => s.id === "remote_1")!;
  if (innerPresent && innerRezzed) {
    state.cardInstances[server.ice[0]!]!.rezzed = true;
    state.cardInstances[server.ice[0]!]!.faceup = true;
  }
  const action = getLegalActions(state, "runner").find(
    (a) =>
      a.payload?.serverId === "remote_1" &&
      (inside
        ? a.type === "play_event" &&
          state.cardInstances[a.source!]?.definitionId === INSIDE
        : a.type === "start_run"),
  );
  if (!action) throw new Error("native_bypass_run_missing");
  state = apply(state, "runner", action.actionId);
  const input = buildAiDecisionInputDto({
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    legalActions: getLegalActions(state, "corp"),
    eventTail: [],
    difficulty: "normal",
    seed: state.seed,
    decisionId: "bypass-fort",
    actionNumber: 1,
    profileId: "bypass-fort",
  });
  const sourceCard = input.playerView.servers
    .find((s) => s.id === "remote_1")!
    .ice.at(-1)!;
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: state.stateVersion,
    visibleSourceDefinitionsByInstanceId: { [sourceCard.instanceId]: QUANDARY },
  }).find(
    (c) =>
      input.legalActions.find((a) => a.actionId === c.actionId)?.type ===
      "rez_ice",
  )!;
  const route = projectExactCorpIceRezRoute({
    input,
    sourceCard,
    candidate,
    targetServerId: "remote_1",
  });
  return { state, input, sourceCard, candidate, route };
}

it.each([true, false])(
  "prices the inner fort at two credits when outer rez consumes Inside Job (inner rezzed: %s)",
  (innerRezzed) => {
    const f = fixture(true, innerRezzed);
    expect(f.input.playerView.run?.bypassFirstIceRemaining).toBe(true);
    expect(f.route).toMatchObject({
      routeKind: "known_access_path_tax",
      knownAccessPathTax: 2,
    });
    expect(f.route?.resourceExchange).toBeUndefined();
    expect(f.sourceCard.effectiveRezResourceExchangeQuote).toMatchObject({
      complete: false,
      reason: "current_encounter_bypassed",
    });
    expect(f.route?.before?.runnerCreditsRemainingOnBestAccessPath).toBe(12);
    expect(f.route?.after?.runnerCreditsRemainingOnBestAccessPath).toBe(10);
    if (!innerRezzed) {
      expect(f.route?.continuationRezCredits).toBe(1);
      expect(
        assessCorpExactIceRezAgainstScoreReserves({
          input: f.input,
          route: f.route!,
          scoreProjects: [],
        }).requiredCreditsAfterRez,
      ).toBeGreaterThanOrEqual(1);
      expect(
        getPlayerView(f.state, "runner").servers.find(
          (s) => s.id === "remote_1",
        )!.ice[0]!.effectivePostRezRunQuote,
      ).toBeUndefined();
    }
    const rezzed = apply(f.state, "corp", f.candidate.actionId);
    expect(rezzed.run?.bypassFirstIceRemaining).toBe(false);
    expect(hashState(rezzed)).toBe(
      hashState(apply(structuredClone(f.state), "corp", f.candidate.actionId)),
    );
  },
);

it("does not fund an inner continuation from money already spent on outer rez", () => {
  expect(fixture(true, false, true, 2).route).toBeUndefined();
});

it("rejects a stale inner continuation quote", () => {
  const f = fixture(true, false);
  const inner = f.input.playerView.servers.find((s) => s.id === "remote_1")!
    .ice[0]!;
  inner.effectivePostRezRunQuote!.expiresAtStateVersion--;
  expect(
    projectExactCorpIceRezRoute({ ...f, targetServerId: "remote_1" }),
  ).toBeUndefined();
});

it("does not invent an encounter tax without inner ICE", () => {
  expect(fixture(true, false, false).route).toBeUndefined();
});

it("keeps the ordinary six-credit encounter quote without a bypass", () => {
  expect(
    fixture(false, true).route?.resourceExchange?.runnerRequiredCredits,
  ).toBe(6);
});

it("preserves the bypass after declining outer ICE until the rezzed inner encounter", () => {
  const f = fixture(true, true);
  const decline = getLegalActions(f.state, "corp").find(
    (a) => a.type === "decline_rez",
  )!;
  let state = apply(f.state, "corp", decline.actionId);
  expect(getPlayerView(state, "corp").run?.bypassFirstIceRemaining).toBe(true);
  const continuation = getLegalActions(state, "runner").find(
    (a) => a.type === "continue_run",
  )!;
  state = apply(state, "runner", continuation.actionId);
  expect(getPlayerView(state, "corp").run?.bypassFirstIceRemaining).toBe(false);
});

function apply(state: GameState, side: "runner" | "corp", actionId: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
