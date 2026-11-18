import { canonicalCapabilityId, capabilityKey } from "@netgrid/cards";
import { cardInstanceIdForCopy } from "../../../../engine/src/game/state/card-instance-id";
import { referencesDefaultDeckCard } from "./compact-card-reference.test-support";
import jettison from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p745-g18-d72.json";
import bypass from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p745-g31-d61.json";
import search from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p745-g39-d69.json";
import boundSearch from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p746-g31-d20.json";
import { afterEach, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { runnerNextCorpTurnGripBlocksAction } from "../../runner/defense-recovery/defense-dispositions";
import type { RunnerDefenseSignals } from "../../runner/defense-recovery/defense-types";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function decide(
  checkpoint: typeof jettison | typeof bypass | typeof search | typeof boundSearch,
  event: number,
  extraClick = false,
) {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(input.playerView.own.clicks).toBe(1);
  if (extraClick) input.playerView.own.clicks += 1;
  const eventAction = input.legalActions.find(
    (action) => action.type === "play_event" && referencesDefaultDeckCard(action.source, event),
  );
  expect(eventAction).toBeDefined();
  const actionId = eventAction!.actionId;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint.runtime as unknown as AiRuntimeCheckpointV1,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
  const plan = decision.decisionDebug!.planFirstDecision!;
  return {
    actionId,
    selectedActionId: decision.actionId,
    plan,
    dispositions: plan.dispositions.filter((entry) => entry.actionId === actionId),
  };
}

const protection = {
  ownerModuleId: "runner.defense_and_recovery",
  disposition: "explicitly_nonproductive",
  evidenceCode: "runner_last_action_would_lose_next_corp_turn_hand_buffer",
};

it.each([
  ["ICE removal", jettison, 292, "fnv1a:85b73d8a"],
  ["bypass", bypass, 323, "fnv1a:1998f9b1"],
] as const)("keeps Grip over optional last-click %s", (label, cp, event, hash) => {
  expect(cp.stateHash).toBe(hash);
  const guarded = decide(cp, event);
  expect(guarded.dispositions).toEqual([{ ...protection, actionId: guarded.actionId }]);
  expect(guarded.selectedActionId).toBe(
    label === "bypass" ? "rs.hq" : "rb",
  );
  expect(
    guarded.plan.turnPlanning!.consideredLines!.some(
      (line) => line.firstActionId === guarded.actionId,
    ),
  ).toBe(false);

  resetResidentPlanPortfolioMemory();
  const canRefill = decide(cp, event, true);
  if (label === "bypass") {
    expect(canRefill.dispositions).toEqual([
      {
        actionId: canRefill.actionId,
        ownerModuleId: "runner.pressure_central",
        disposition: "explicitly_nonproductive",
        evidenceCode: "runner_no_bound_targeted_bypass_route",
      },
    ]);
    expect(canRefill.selectedActionId).not.toBe(canRefill.actionId);
    return;
  }
  expect(canRefill.dispositions).toEqual([]);
  expect(canRefill.selectedActionId).toBe(canRefill.actionId);
  expect(canRefill.plan.rootPlanInstanceId).toBe("pa90fufw9vc5bkshp96ztlryxl");
  expect(canRefill.plan.route).toMatchObject({
    actionId: canRefill.actionId,
    stateVersion: cp.input.playerView.stateVersion,
  });
});

it("keeps the Coverage rejection when a Grip-neutral search has no useful answer", () => {
  expect(search.stateHash).toBe("fnv1a:5f7140ae");
  const guarded = decide(search, 311);
  expect(guarded.dispositions).toEqual([
    {
      actionId: guarded.actionId,
      ownerModuleId: "runner.rig_and_coverage",
      disposition: "explicitly_nonproductive",
      evidenceCode: "runner_coverage_search_rejected_without_deck_answer:breaker_sentry@no_server+breaker_wall@no_server",
    },
  ]);
  expect(guarded.selectedActionId).toBe("rb");

  resetResidentPlanPortfolioMemory();
  const canRefill = decide(search, 311, true);
  expect(canRefill.dispositions).toEqual([
    {
      actionId: canRefill.actionId,
      ownerModuleId: "runner.rig_and_coverage",
      disposition: "explicitly_nonproductive",
      evidenceCode: "runner_coverage_search_rejected_without_deck_answer:breaker_sentry@no_server+breaker_wall@no_server",
    },
  ]);
});

it("executes a bound mandatory search that returns the spent card count to Grip", () => {
  expect(boundSearch.stateHash).toBe("fnv1a:afe9fa72");
  const ready = decide(boundSearch, 311);
  expect(ready.selectedActionId).toBe(ready.actionId);
  expect(ready.dispositions).toEqual([]);
  expect(ready.plan.rootPlanInstanceId).toBe("p5s1qdgqrafrs3n2kss1t9ct7m");
  expect(ready.plan.route).toMatchObject({
    actionId: ready.actionId,
    stateVersion: boundSearch.input.playerView.stateVersion,
  });
  const guardedRemoval = ready.plan.dispositions.find((entry) =>
    referencesDefaultDeckCard(entry.actionId, 292),
  );
  expect(guardedRemoval).toMatchObject(protection);
});

it("credits the mandatory Grip return of an exact heap search on the final action", () => {
  const input = structuredClone(
    boundSearch.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const { playerView } = input;
  const definitionId = 301;
  const instanceId = cardInstanceIdForCopy("runner", definitionId, 1);
  const abilityKey = capabilityKey("abilities_on_play_search_trash_to_grip");
  const abilityId = canonicalCapabilityId(definitionId, abilityKey);
  playerView.own.gripOrHq[0] = {
    ...playerView.own.gripOrHq[0]!,
    instanceId,
    definitionId,
    type: "event",
    known: true,
  };
  const searchAction: LegalAction = {
    actionId: `rh.${instanceId}.${instanceId}.${abilityId}`,
    side: "runner",
    type: "play_event",
    label: "Gideon’s Pawnshop spielen",
    source: instanceId,
    timingPoint: playerView.timingPoint,
    costs: [{ clicks: 1, credits: 2 }],
    targetRequirements: [],
    abilityRef: {
      sourceCardInstanceId: instanceId,
      sourceAbilityId: abilityId,
    },
    visibility: "private_to_actor",
    expiresAtStateVersion: playerView.stateVersion,
    payload: {
      cardImplementationEffectKind: "search_trash_to_grip",
      cardImplementationSearchFilter: "any_card",
      cardId: instanceId,
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityId: abilityId,
      cardImplementationAbilityKey: abilityKey,
    },
  };
  input.legalActions = [searchAction];
  const [candidate] = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: { [instanceId]: definitionId },
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  expect(candidate).toMatchObject({
    sourceDefinitionId: definitionId,
    abilityBindingMethod: "canonical_capability_id",
  });
  const handSize = playerView.own.gripOrHq.length;
  const defense: RunnerDefenseSignals = {
    handSize,
    minimumHandBuffer: handSize,
    nextCorpTurnBufferTarget: handSize,
    nextCorpTurnGripPreservation: true,
    handBufferPriorityClass: "P3",
    evidenceCodes: [],
    activeTags: 0,
    visibleTagPunish: false,
    persistentHazardCounterRemovalAvailable: false,
    pendingDamage: 0,
    damagePreventionNeeded: false,
    drawAllowed: true,
    forgoUnsafeRunCapacity: false,
  };
  expect(runnerNextCorpTurnGripBlocksAction(input, candidate!, defense)).toBe(
    false,
  );

  searchAction.expiresAtStateVersion -= 1;
  expect(runnerNextCorpTurnGripBlocksAction(input, candidate!, defense)).toBe(
    true,
  );
});
