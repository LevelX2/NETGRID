import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

const AMBUSH_ROOT_ID = "plan:corp.ambush_and_bluff:ambush%3Avacant-soulkiller";
const AMBUSH_FUNDING_NEED_ID = "ambush-funding:vacant-soulkiller";
const AMBUSH_SETUP_NEED_ID = "ambush-setup:vacant-soulkiller:new_remote";

describe("red contract: persistent Corp Ambush root and exact support children", () => {
  it("keeps a visible concrete P5 Ambush as root and funds its known unaffordable setup through an exact Economy child", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const install = installAmbush(trap, "new_remote", 4);
    const credit = gainCredit();
    const input = corpInput([install, credit], [trap]);
    input.playerView.own.credits = 0;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${AMBUSH_ROOT_ID}`,
        `plan_priority_delegated_from:${AMBUSH_ROOT_ID}`,
        `plan_priority_need:${AMBUSH_FUNDING_NEED_ID}`,
      ]),
    );

    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(portfolio?.rootForegroundInstanceId).toBe(AMBUSH_ROOT_ID);
    const root = portfolio?.instances.find(
      (instance) => instance.instanceId === AMBUSH_ROOT_ID,
    );
    expect(root).toMatchObject({
      moduleId: "corp.ambush_and_bluff",
      persistencePolicy: "sticky_goal",
      viability: "ready",
      openNeedIds: [AMBUSH_FUNDING_NEED_ID],
      moduleState: {
        kind: "ambush",
        signal: {
          sourceInstanceId: trap.instanceId,
          sourceDefinitionId: trap.definitionId,
          serverId: "new_remote",
        },
      },
    });

    const fundingChild = portfolio?.instances.find(
      (instance) =>
        instance.parentInstanceId === AMBUSH_ROOT_ID &&
        instance.parentNeedId === AMBUSH_FUNDING_NEED_ID,
    );
    expect(fundingChild).toMatchObject({
      moduleId: "corp.economy",
      persistencePolicy: "flexible_support",
      parentInstanceId: AMBUSH_ROOT_ID,
      parentNeedId: AMBUSH_FUNDING_NEED_ID,
      moduleState: {
        kind: "economy",
        signal: {
          kind: "parent_funding",
          needId: AMBUSH_FUNDING_NEED_ID,
          gap: 4,
          actionIds: [credit.actionId],
          parentPlanInstanceId: AMBUSH_ROOT_ID,
          parentNeedId: AMBUSH_FUNDING_NEED_ID,
        },
      },
    });
    expect(portfolio?.executorInstanceId).toBe(fundingChild?.instanceId);

    const fundingSignal = (
      fundingChild?.moduleState as
        | { signal?: Record<string, unknown> }
        | undefined
    )?.signal;
    expect(fundingSignal).not.toHaveProperty("delegatedPriorityClass");
    expect(fundingSignal).toHaveProperty("parentPriorityClass", "P5");
  });

  it("executes the exact funded install as a flexible support child of the same Ambush root", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const install = installAmbush(trap, "new_remote", 4);
    const input = corpInput([install, gainCredit()], [trap]);
    input.playerView.own.credits = 4;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${AMBUSH_ROOT_ID}`,
        `plan_priority_delegated_from:${AMBUSH_ROOT_ID}`,
        `plan_priority_need:${AMBUSH_SETUP_NEED_ID}`,
      ]),
    );

    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(portfolio?.rootForegroundInstanceId).toBe(AMBUSH_ROOT_ID);
    expect(
      portfolio?.instances.find(
        (instance) => instance.instanceId === AMBUSH_ROOT_ID,
      ),
    ).toMatchObject({
      persistencePolicy: "sticky_goal",
      openNeedIds: [AMBUSH_SETUP_NEED_ID],
    });
    const setupChild = portfolio?.instances.find(
      (instance) =>
        instance.parentInstanceId === AMBUSH_ROOT_ID &&
        instance.parentNeedId === AMBUSH_SETUP_NEED_ID,
    );
    expect(setupChild).toMatchObject({
      moduleId: "corp.ambush_and_bluff",
      persistencePolicy: "flexible_support",
      parentInstanceId: AMBUSH_ROOT_ID,
      parentNeedId: AMBUSH_SETUP_NEED_ID,
      moduleState: {
        kind: "ambush_setup",
        signal: {
          sourceInstanceId: trap.instanceId,
          serverId: "new_remote",
          actionIds: [install.actionId],
        },
      },
    });
    expect(portfolio?.executorInstanceId).toBe(setupChild?.instanceId);
  });

  it("keeps the resident Ambush root when its current Engine route quote disappears while another regular plan continues", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const agendaAtOne = scoreAgenda(1);
    const advance = advanceAgenda(agendaAtOne);
    const install = installAmbush(trap, "new_remote", 0);
    const input = corpInput([advance, install], [trap]);
    input.playerView.own.credits = 4;
    input.playerView.servers = scoringServers(agendaAtOne);
    const context = liveContext();

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) => instance.instanceId === AMBUSH_ROOT_ID,
      ),
    ).toBe(true);

    const agendaAtTwo = scoreAgenda(2);
    input.playerView.stateVersion = 2;
    input.actionNumber = 2;
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 3;
    input.playerView.servers = scoringServers(agendaAtTwo);
    input.legalActions = [
      { ...advanceAgenda(agendaAtTwo), expiresAtStateVersion: 2 },
    ];
    input.playerView.legalActions = input.legalActions;

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });

    const portfolio = residentPlanPortfolioSnapshot(input);
    const root = portfolio?.instances.find(
      (instance) => instance.instanceId === AMBUSH_ROOT_ID,
    );
    expect(root).toMatchObject({
      moduleId: "corp.ambush_and_bluff",
      persistencePolicy: "sticky_goal",
      viability: "blocked",
      openNeedIds: [],
      updatedAtStateVersion: 2,
      blockers: [
        expect.objectContaining({
          code: "corp_ambush_install_route_quote_unknown",
          removable: true,
        }),
      ],
    });
    expect(
      portfolio?.instances.some(
        (instance) =>
          instance.parentInstanceId === AMBUSH_ROOT_ID &&
          instance.parentNeedId?.startsWith("ambush-funding:") === true,
      ),
    ).toBe(false);
    expect(portfolio?.transitions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: AMBUSH_ROOT_ID,
          reason: "target_disappeared",
        }),
      ]),
    );
  });
});

function vacantSoulkiller(): VisibleCard {
  return visibleCard("vacant-soulkiller", "corp", "asset", {
    definitionId: "onr_v1_346_vacant-soulkiller",
    title: "Vacant Soulkiller",
  });
}

function scoreAgenda(advancementCounters: number): VisibleCard {
  return visibleCard("agenda-1", "corp", "agenda", {
    definitionId: "onr_v1_189_artificial-security-directors",
    title: "Artificial Security Directors",
    advancementCounters,
    advancementRequirement: 3,
    agendaPoints: 2,
  });
}

function installAmbush(
  card: VisibleCard,
  serverId: "new_remote",
  creditCost: number,
): LegalAction {
  return legalAction(
    "install-vacant-soulkiller",
    "corp",
    "install_card",
    "Install Vacant Soulkiller in a new remote",
    { credits: creditCost, clicks: 1 },
    {
      source: card.instanceId,
      payload: {
        cardId: card.instanceId,
        serverId,
        placement: "root",
      },
    },
  );
}

function advanceAgenda(card: VisibleCard): LegalAction {
  return legalAction(
    "advance-agenda",
    "corp",
    "advance_card",
    "Advance agenda",
    { credits: 1, clicks: 1 },
    {
      source: card.instanceId,
      payload: { cardId: card.instanceId },
    },
  );
}

function gainCredit(): LegalAction {
  return legalAction(
    "gain-credit",
    "corp",
    "gain_credit",
    "Gain 1 Credit",
    { credits: 0, clicks: 1 },
    {
      source: "basic_action",
      payload: { gainCreditsAmount: 1 },
    },
  );
}

function scoringServers(agenda: VisibleCard) {
  return [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [
        visibleCard("remote-ice", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
          rezzed: true,
        }),
      ],
      [agenda],
    ),
  ];
}

function corpInput(
  actions: LegalAction[],
  grip: VisibleCard[],
): AiDecisionInput {
  const input = aiInput("corp", actions);
  input.playerView.own.gripOrHq = grip;
  input.playerView.own.clicks = 3;
  input.playerView.servers = [server("hq"), server("rd"), server("archives")];
  for (const action of actions) {
    action.expiresAtStateVersion = input.playerView.stateVersion;
  }
  input.playerView.legalActions = actions;
  input.legalActions = actions;
  (input as AiDecisionInputWithDeckCapabilities).ownCorpStrategicIntent =
    corpIntent();
  return input;
}

function corpIntent(): CorpStrategicIntentProfile {
  return {
    schemaVersion: "corp-strategic-intent-profile-v1",
    side: "corp",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "corp.punish_runner",
    scorePlan: ["corp.remote_scoreline"],
    defensePlan: [],
    economyPlan: [],
    enginePlan: [],
    punishPlan: ["corp.ambush_bluff"],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: ["test_corp_ambush_strategy_active"],
  };
}

function liveContext() {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
