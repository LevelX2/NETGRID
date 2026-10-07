import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta520-g3d213.json";
import nativeState from "./fixtures/meta520-g3d213-state.json";
import { afterEach, expect, it } from "vitest";
import type { GameState } from "@netgrid/shared";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import { projectGlobalRootSupportRezAfterInstall } from "../../../../engine/src/game/payment/root-support-post-install-rez-quote";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpGlobalIceSupportAssetInstallSignal } from "../../corp/defense/defense-discovery-support";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

const source = "corp_onr_v1_317_data-masons_1";
function fixture() {
  const state = structuredClone(nativeState) as unknown as GameState;
  const cp = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto({
      ...cp.input,
      playerView: getPlayerView(state, "corp"),
      legalActions: getLegalActions(state, "corp"),
    }),
  };
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: state.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq.map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
  const action = input.legalActions.find(
    (a) =>
      a.source === source &&
      a.type === "install_card" &&
      a.payload?.serverId === "remote_1",
  )!;
  const candidate = candidates.find((c) => c.actionId === action.actionId)!;
  return { cp, state, input, candidates, candidate, action };
}
afterEach(resetResidentPlanPortfolioMemory);
it("quotes a native protected placement, chooses it through Defense, rezzes it and retains all four funded ICE", () => {
  const { cp, state, input, action } = fixture();
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  expect(hashGameState(state)).toBe(checkpoint.stateHash);
  expect(action.payload).toMatchObject({
    postInstallRezQuoteComplete: true,
    postInstallRezQuoteCardId: source,
    postInstallRezQuoteTargetServerId: "remote_1",
    postInstallRezQuoteProjectedServerId: "remote_1",
    postInstallRezQuoteExpiresAtStateVersion: state.stateVersion,
    postInstallRezQuoteFinalCredits: 1,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const chosen = chooseAiAction(input);
  expect(chosen.actionId).toBe(action.actionId);
  expect(chosen.fallbackUsed).toBe(false);
  expect(chosen.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toContain(
    "plan:corp.defend_servers:",
  );
  expect(chosen.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: state.stateVersion,
  });
  if (!chosen.actionId) throw Error("native_install_action_missing");
  let result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: chosen.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error("native_install_rejected");
  const installed = result.state;
  const nextInput = {
    ...input,
    ...buildAiDecisionInputDto({
      ...input,
      playerView: getPlayerView(installed, "corp"),
      legalActions: getLegalActions(installed, "corp"),
    }),
  };
  const rez = chooseAiAction(nextInput);
  expect(
    nextInput.legalActions.find((a) => a.actionId === rez.actionId),
  ).toMatchObject({ type: "rez_card", source });
  expect(rez.fallbackUsed).toBe(false);
  expect(rez.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toContain(
    "plan:corp.defend_servers:",
  );
  if (!rez.actionId) throw Error("native_rez_action_missing");
  result = applyAction(installed, {
    matchId: state.matchId,
    side: "corp",
    actionId: rez.actionId,
    clientKnownStateVersion: installed.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error("native_rez_rejected");
  expect(result.state.corp.credits).toBe(11);
  expect(result.state.corp.clicks).toBe(state.corp.clicks - 1);
  const fort = getPlayerView(result.state, "corp").servers.find(
    (s) => s.id === "remote_1",
  )!;
  expect(fort.ice).toHaveLength(4);
  expect(fort.root.find((c) => c.instanceId === source)?.rezzed).toBe(true);
  expect(
    fort.ice.reduce((n, c) => {
      const quote = c.effectiveRezCostQuote;
      if (!quote?.complete) throw Error("native_ice_rez_quote_incomplete");
      return n + quote.finalCredits;
    }, 0),
  ).toBe(11);
  const replay = replayEvents(
    state,
    result.state.eventLog.slice(state.eventLog.length),
  );
  expect(replay.errors).toEqual([]);
  expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
  expect(hashGameState(state)).toBe(checkpoint.stateHash);
});
it.each([
  "missing",
  "stale",
  "source",
  "target",
  "projected",
  "additional",
  "unfunded",
  "no_ice",
  "occupied",
] as const)(
  "rejects an unbound or unsupported protected placement: %s",
  (variant) => {
    const { input, action, candidate, candidates } = fixture();
    const p = action.payload!;
    if (variant === "missing") delete p.postInstallRezQuoteComplete;
    if (variant === "stale")
      p.postInstallRezQuoteExpiresAtStateVersion =
        input.playerView.stateVersion - 1;
    if (variant === "source") p.postInstallRezQuoteCardId = "another_source";
    if (variant === "target")
      p.postInstallRezQuoteTargetServerId = "new_remote";
    if (variant === "projected")
      p.postInstallRezQuoteProjectedServerId = "remote_999";
    if (variant === "additional")
      p.postInstallRezQuoteMandatoryAgendaPointCost = 1;
    if (variant === "unfunded") input.playerView.own.credits = 0;
    const fort = input.playerView.servers.find((s) => s.id === "remote_1")!;
    if (variant === "no_ice") fort.ice = [];
    if (variant === "occupied")
      fort.root = [
        input.playerView.own.gripOrHq.find((c) => c.type === "agenda")!,
      ];
    expect(
      corpGlobalIceSupportAssetInstallSignal(input, candidate, [], candidates),
    ).toBeUndefined();
  },
);
it("does not suppress an admitted new remote when no existing empty fort has funded protection", () => {
  const { input, candidates } = fixture();
  for (const server of input.playerView.servers.filter((s) =>
    s.id.startsWith("remote_"),
  ))
    server.ice = [];
  const fresh = candidates.find(
    (c) =>
      input.legalActions.find((a) => a.actionId === c.actionId)?.source ===
        source &&
      input.legalActions.find((a) => a.actionId === c.actionId)?.payload
        ?.serverId === "new_remote",
  )!;
  expect(
    corpGlobalIceSupportAssetInstallSignal(input, fresh, [], candidates),
  ).toMatchObject({ serverId: "new_remote" });
});
it("fails closed at the producer for existing central, missing and occupied asset slots", () => {
  const { state } = fixture();
  expect(
    projectGlobalRootSupportRezAfterInstall(state, source, "hq"),
  ).toMatchObject({ complete: false });
  expect(
    projectGlobalRootSupportRezAfterInstall(state, source, "remote_999"),
  ).toMatchObject({ complete: false });
  state.corp.servers.find((s) => s.id === "remote_1")!.root.push(source);
  expect(
    projectGlobalRootSupportRezAfterInstall(state, source, "remote_1"),
  ).toMatchObject({ complete: false });
});
