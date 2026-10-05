import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import {
  readCorpPublicOffServerAccessThreat,
  corpCurrentRunAccessServerId,
} from "../../corp/defense/corp-central-defense-facts-adapter";
import { allocateCorpCentralDefenseFromAiFacts } from "../../corp/defense/corp-central-defense-facts-adapter";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpGlobalDefenseInstallRouteAssessment } from "../../corp/defense/corp-defense-domain-signals";
import { CORP_DEFENSE_DOMAIN_SIGNAL_FACTS } from "../../corp/defense/defense-discovery-support";

function load(key: string) {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/meta-ten-repairs/508-${key}.json`, import.meta.url),
      "utf8",
    ),
  );
}
function decide(cp: ReturnType<typeof load>) {
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input),
    pf = result.decisionDebug!.planFirstDecision!;
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: cp.stateVersion,
    planInstanceId: pf.selectedStep!.planInstanceId,
    stepId: pf.selectedStep!.stepId,
  });
  expect(
    input.legalActions.find(
      (a: { actionId: string }) => a.actionId === result.actionId,
    )?.expiresAtStateVersion,
  ).toBe(cp.stateVersion);
  return result;
}
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  ["g1d9", "corp.decline_rez"],
  ["g4d81", "corp.rez_ice.corp_onr_v1_277_virizz_3.corp_onr_v1_277_virizz_3"],
])("keeps current native future-effect ownership for %s", (key, actionId) =>
  expect(decide(load(key)).actionId).toBe(actionId),
);
it("uses the public actual HQ access destination on the physical Archives path and stops the native terminal access", () => {
  const cp = load("g29d316"),
    original = structuredClone(cp);
  delete original.input.playerView.run.accessServerOverride;
  expect(decide(original).actionId).toBe("corp.decline_rez");
  const decision = decide(cp);
  expect(decision.actionId).toBe(
    "corp.rez_ice.corp_onr_v1_252_keeper_2.corp_onr_v1_252_keeper_2",
  );
  let state = load("g29d316-engine") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  const before = getPlayerView(state, "runner").own.agendaPoints;
  for (const side of ["corp", "runner"] as const) {
    const view = getPlayerView(state, side);
    expect(view.run).toMatchObject({
      attackedServerId: "archives",
      accessServerOverride: "hq",
    });
    expect(view.opponent).not.toHaveProperty("gripOrHq");
    expect(
      buildAiDecisionInputDto({
        ...cp.input,
        side,
        playerView: view,
        legalActions: getLegalActions(state, side),
      }).playerView.run?.accessServerOverride,
    ).toBe("hq");
  }
  for (let i = 0; i < 8 && state.run; i++) {
    const actions = getLegalActions(state, state.activeSide);
    const action =
      i === 0
        ? actions.find((a) => a.actionId === decision.actionId)
        : (actions.find((a) => a.type === "pump_breaker") ??
          actions.find((a) => a.type === "continue_run"));
    expect(action).toBeDefined();
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: state.activeSide,
      actionId: action!.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw new Error("actual Engine control rejected");
    state = applied.state;
  }
  expect(state.run).toBeUndefined();
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(before);
});
it("binds possible off-server paths to real current own agenda exposure, without predicting a next target", () => {
  const positive = load("g4d192").input,
    negative = load("g5d172").input;
  expect(readCorpPublicOffServerAccessThreat(positive, "archives")).toEqual({
    threat: "terminal",
    accessServerIds: ["hq"],
  });
  const action = positive.legalActions.find(
    (a: { actionId: string }) =>
      a.actionId ===
      "corp.install_card.corp_onr_v1_250_ice-pick-willie_1.archives.corp_onr_v1_250_ice-pick-willie_1.2",
  );
  const candidate = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "corp",
    stateVersion: positive.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [action.source]: "onr_v1_250_ice-pick-willie",
    },
  })[0]!;
  const assess = (input: typeof positive) =>
    corpGlobalDefenseInstallRouteAssessment(
      input,
      candidate,
      "archives",
      allocateCorpCentralDefenseFromAiFacts({ input }),
      CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
    );
  expect(assess(positive)).toMatchObject({
    knowledge: "known",
    disposition: "funding_only",
  });
  const noPath = structuredClone(positive);
  noPath.playerView.opponent.rig = [];
  expect(assess(noPath)).toMatchObject({
    knowledge: "known",
    disposition: "effect_missing",
    evidenceCode: "corp_archives_ice_install_has_no_visible_agenda_pressure",
  });
  expect(readCorpPublicOffServerAccessThreat(negative, "archives")).toEqual({
    threat: "none",
    accessServerIds: ["hq"],
  });
  expect(readCorpPublicOffServerAccessThreat(positive, "hq")).toEqual({
    threat: "none",
    accessServerIds: [],
  });
  const missing = structuredClone(positive);
  delete missing.playerView.corpCentralAccessQuotes;
  expect(
    readCorpPublicOffServerAccessThreat(missing, "archives"),
  ).toBeUndefined();
  const stale = structuredClone(positive);
  stale.playerView.corpCentralAccessQuotes[0].stateVersion--;
  expect(
    readCorpPublicOffServerAccessThreat(stale, "archives"),
  ).toBeUndefined();
  const inventory = structuredClone(positive);
  delete inventory.ownDeckSnapshot;
  expect(
    readCorpPublicOffServerAccessThreat(inventory, "archives"),
  ).toBeUndefined();
  const absent = structuredClone(positive);
  absent.playerView.opponent.rig = [];
  expect(readCorpPublicOffServerAccessThreat(absent, "archives")).toEqual({
    threat: "none",
    accessServerIds: [],
  });
  const hidden = structuredClone(positive);
  hidden.playerView.opponent.rig.forEach(
    (card: { known: boolean }) => (card.known = false),
  );
  expect(readCorpPublicOffServerAccessThreat(hidden, "archives")).toEqual({
    threat: "none",
    accessServerIds: [],
  });
  decide({ ...load("g5d172"), input: negative });
});
it("uses the current breach destination and validates the public DTO destination fail-closed", () => {
  const cp = load("g29d316"),
    input = cp.input;
  expect(corpCurrentRunAccessServerId(input)).toBe("hq");
  input.playerView.run.breach = {
    breachId: "b",
    serverId: "rd",
    currentIndex: 0,
    remainingCount: 1,
    completed: false,
  };
  expect(corpCurrentRunAccessServerId(input)).toBe("rd");
  input.playerView.run.accessServerOverride = "nonexistent";
  expect(() => buildAiDecisionInputDto(input)).toThrow(
    "Invalid Engine public run access destination.",
  );
});
