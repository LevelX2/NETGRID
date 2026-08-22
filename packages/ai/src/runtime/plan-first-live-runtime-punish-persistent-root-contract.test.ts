import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type CorpPunishRouteQuoteSet,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseCorpAction } from "../index";
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

const CLOSED_ACCOUNTS_DEFINITION_ID = "onr_v1_285_closed-accounts";
const CLOSED_ACCOUNTS_CAMPAIGN_ID = "tagged-closed-accounts";
const CLOSED_ACCOUNTS_ROUTE_ID = "closed-accounts-payoff";
const CLOSED_ACCOUNTS_FUNDING_NEED = `punish-funding:${CLOSED_ACCOUNTS_CAMPAIGN_ID}:${CLOSED_ACCOUNTS_ROUTE_ID}`;

describe("plan-first persistent Corp punish root contract", () => {
  afterEach(() => {
    resetResidentPlanPortfolioMemory();
  });

  it("keeps a visible underfunded tagged payoff as a persistent punish root with an exact funding need", () => {
    const input = taggedPayoffInput({
      credits: 0,
      stateVersion: 1,
      payoffQuote: "known",
      payoffAction: "unavailable",
    });

    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const punishRoot = portfolio?.instances.find(
      (instance) => instance.moduleId === "corp.punish_campaign",
    );

    expect(punishRoot).toBeDefined();
    expect(punishRoot).toMatchObject({
      persistencePolicy: "sticky_goal",
      openNeedIds: [CLOSED_ACCOUNTS_FUNDING_NEED],
    });
    expect(
      portfolio?.instances.find(
        (instance) =>
          instance.moduleId === "corp.economy" &&
          instance.parentNeedId === CLOSED_ACCOUNTS_FUNDING_NEED,
      ),
    ).toMatchObject({
      persistencePolicy: "flexible_support",
      parentInstanceId: punishRoot?.instanceId,
      parentNeedId: CLOSED_ACCOUNTS_FUNDING_NEED,
    });
    expect(decision).toMatchObject({
      actionId: "gain-credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("inherits the punish root priority only through scheduler delegation", () => {
    const input = taggedPayoffInput({
      credits: 0,
      stateVersion: 1,
      payoffQuote: "known",
      payoffAction: "unavailable",
    });

    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const economyChild = portfolio?.instances.find(
      (instance) =>
        instance.moduleId === "corp.economy" &&
        instance.dedupeKey === CLOSED_ACCOUNTS_FUNDING_NEED,
    );
    const punishRoot = portfolio?.instances.find(
      (instance) => instance.instanceId === economyChild?.parentInstanceId,
    );

    expect(economyChild).toBeDefined();
    expect(economyChild?.parentInstanceId).toBeDefined();
    expect(economyChild?.parentNeedId).toBe(CLOSED_ACCOUNTS_FUNDING_NEED);
    expect(economyChild).toMatchObject({
      parentInstanceId: punishRoot?.instanceId,
      parentNeedId: CLOSED_ACCOUNTS_FUNDING_NEED,
    });
    expect(punishRoot).toMatchObject({
      moduleId: "corp.punish_campaign",
      openNeedIds: [CLOSED_ACCOUNTS_FUNDING_NEED],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${punishRoot?.instanceId}`,
        `plan_first_executor:${economyChild?.instanceId}`,
        `plan_priority_delegated_from:${punishRoot?.instanceId}`,
        `plan_priority_need:${CLOSED_ACCOUNTS_FUNDING_NEED}`,
        "plan_priority_class:P4",
      ]),
    );
  });

  it("retains one root identity while funding becomes an executable punish child", () => {
    const input = taggedPayoffInput({
      credits: 0,
      stateVersion: 1,
      payoffQuote: "known",
      payoffAction: "unavailable",
    });

    chooseCorpAction(input);
    const fundingPortfolio = residentPlanPortfolioSnapshot(input);

    advanceToPayoffExecution(input);
    const decision = chooseCorpAction(input);
    const executionPortfolio = residentPlanPortfolioSnapshot(input);
    const retainedRoot = executionPortfolio?.instances.find(
      (instance) => instance.moduleId === "corp.punish_campaign",
    );
    const executionChild = executionPortfolio?.instances.find(
      (instance) => instance.moduleId === "corp.execute_punish_sequence",
    );
    const fundingRoot = fundingPortfolio?.instances.find(
      (instance) => instance.instanceId === executionChild?.parentInstanceId,
    );

    expect(decision).toMatchObject({
      actionId: "closed-accounts",
      reasonCode: "plan_first.corp.execute_punish_sequence",
      fallbackUsed: false,
    });
    expect(executionChild).toBeDefined();
    expect(executionChild?.parentInstanceId).toBeDefined();
    expect(fundingRoot).toBeDefined();
    expect(retainedRoot?.instanceId).toBe(fundingRoot?.instanceId);
    expect(retainedRoot?.createdAtStateVersion).toBe(1);
    expect(retainedRoot?.updatedAtStateVersion).toBe(2);
    expect(executionChild).toMatchObject({
      persistencePolicy: "locked_sequence",
      parentInstanceId: fundingRoot?.instanceId,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${fundingRoot?.instanceId}`,
        `plan_first_executor:${executionChild?.instanceId}`,
        `plan_priority_delegated_from:${fundingRoot?.instanceId}`,
      ]),
    );
  });

  it("fails closed only the unknown funding route without deleting its punish root", () => {
    const input = taggedPayoffInput({
      credits: 0,
      stateVersion: 1,
      payoffQuote: "known",
      payoffAction: "unavailable",
    });

    chooseCorpAction(input);
    const initialRoot = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) => instance.moduleId === "corp.punish_campaign",
    );
    advanceToUnknownQuoteWithScoreAlternative(input);
    const decision = chooseCorpAction(input);
    const portfolio = residentPlanPortfolioSnapshot(input);
    const punishRoot = portfolio?.instances.find(
      (instance) => instance.moduleId === "corp.punish_campaign",
    );

    expect(punishRoot).toBeDefined();
    expect(punishRoot?.instanceId).toBe(initialRoot?.instanceId);
    expect(punishRoot).toMatchObject({
      persistencePolicy: "sticky_goal",
      viability: "blocked",
      phase: "watch_window",
    });
    expect(
      portfolio?.instances.some(
        (instance) =>
          instance.moduleId === "corp.economy" &&
          instance.parentInstanceId === punishRoot?.instanceId,
      ),
    ).toBe(false);
    expect(
      portfolio?.instances.some(
        (instance) =>
          instance.moduleId === "corp.execute_punish_sequence" &&
          instance.parentInstanceId === punishRoot?.instanceId,
      ),
    ).toBe(false);
    expect(decision).toMatchObject({
      actionId: "purge-virus",
      reasonCode: "plan_first.corp.respond_to_virus_pressure",
      fallbackUsed: false,
    });
  });
});

function taggedPayoffInput(params: {
  credits: number;
  stateVersion: number;
  payoffQuote: "known" | "unknown";
  payoffAction: "available" | "unavailable";
}): AiDecisionInput {
  const closedAccounts = closedAccountsCard(params.payoffQuote);
  const actions: LegalAction[] = [
    gainCredit(params.stateVersion),
    drawCard(params.stateVersion),
    endTurn(params.stateVersion),
    ...(params.payoffAction === "available"
      ? [playClosedAccounts(closedAccounts, params.stateVersion)]
      : []),
  ];
  const input = aiInput("corp", actions);
  input.decisionId = "persistent-punish-root:corp";
  input.actionNumber = params.stateVersion;
  input.playerView.stateVersion = params.stateVersion;
  input.playerView.own.credits = params.credits;
  input.playerView.own.clicks = 3;
  input.playerView.own.gripOrHq = [closedAccounts];
  input.playerView.opponent.tags = 1;
  input.playerView.opponent.credits = 3;
  input.playerView.servers = [server("hq"), server("rd"), server("archives")];
  input.playerView.legalActions = actions;
  input.legalActions = actions;
  const currentPayoffAction = actions.find(
    (action) => action.actionId === "closed-accounts",
  );
  input.playerView.corpPunishRouteQuoteSet =
    params.payoffQuote === "known"
      ? closedAccountsQuoteSet({
          stateVersion: params.stateVersion,
          credits: params.credits,
          card: closedAccounts,
          ...(params.payoffAction === "available" && currentPayoffAction
            ? { currentAction: currentPayoffAction }
            : {}),
        })
      : {
          schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
          visibility: "private_to_actor",
          side: "corp",
          stateVersion: params.stateVersion,
          timingPoint: "corp_action.main",
          complete: false,
          incompleteReasons: ["cost_quote_incomplete"],
          runnerHandCount: input.playerView.opponent.handCount,
          runnerTags: input.playerView.opponent.tags,
          runnerCreditsVisible: input.playerView.opponent.credits,
          routes: [],
        };
  return input;
}

function advanceToPayoffExecution(input: AiDecisionInput): void {
  const closedAccounts = input.playerView.own.gripOrHq[0]!;
  const stateVersion = 2;
  const actions = [
    playClosedAccounts(closedAccounts, stateVersion),
    gainCredit(stateVersion),
    drawCard(stateVersion),
    endTurn(stateVersion),
  ];
  input.actionNumber = 2;
  input.playerView.stateVersion = stateVersion;
  input.playerView.own.credits = 1;
  input.playerView.own.clicks = 2;
  input.playerView.legalActions = actions;
  input.legalActions = actions;
  input.playerView.corpPunishRouteQuoteSet = closedAccountsQuoteSet({
    stateVersion,
    credits: 1,
    card: closedAccounts,
    currentAction: actions[0]!,
  });
}

function advanceToUnknownQuoteWithScoreAlternative(
  input: AiDecisionInput,
): void {
  const stateVersion = 2;
  const agenda = visibleCard("score-agenda", "corp", "agenda", {
    definitionId: "onr_v1_203_hostile-takeover",
    title: "Hostile Takeover",
    agendaPoints: 2,
    advancementRequirement: 1,
  });
  const actions = [
    atStateVersion(
      legalAction(
        "purge-virus",
        "corp",
        "purge_virus_counters",
        "Purge virus counters",
        { credits: 0, clicks: 3 },
        { source: "basic_action" },
      ),
      stateVersion,
    ),
    atStateVersion(
      legalAction(
        "install-agenda",
        "corp",
        "install_card",
        "Install Hostile Takeover in remote 1",
        { credits: 0, clicks: 1 },
        {
          source: agenda.instanceId,
          payload: {
            cardId: agenda.instanceId,
            sourceDefinitionId: agenda.definitionId!,
            serverId: "remote_1",
            placement: "root",
          },
        },
      ),
      stateVersion,
    ),
    endTurn(stateVersion),
  ];
  input.actionNumber = stateVersion;
  input.playerView.stateVersion = stateVersion;
  input.playerView.own.clicks = 3;
  input.playerView.own.gripOrHq = [input.playerView.own.gripOrHq[0]!, agenda];
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1"),
  ];
  input.playerView.legalActions = actions;
  input.legalActions = actions;
  input.playerView.opponent.rig = [
    visibleCard("runner-virus", "runner", "program", {
      definitionId: "test-runner-virus",
      title: "Visible Runner Virus",
      counters: { virus: 3 },
    }),
  ];
  input.playerView.corpPunishRouteQuoteSet = {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    side: "corp",
    stateVersion,
    timingPoint: "corp_action.main",
    complete: false,
    incompleteReasons: ["future_state_transition_unavailable"],
    runnerHandCount: input.playerView.opponent.handCount,
    runnerTags: input.playerView.opponent.tags,
    runnerCreditsVisible: input.playerView.opponent.credits,
    routes: [],
  };
}

function closedAccountsQuoteSet(params: {
  stateVersion: number;
  credits: number;
  card: VisibleCard;
  currentAction?: LegalAction;
}): CorpPunishRouteQuoteSet {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    side: "corp",
    stateVersion: params.stateVersion,
    timingPoint: "corp_action.main",
    complete: true,
    incompleteReasons: [],
    runnerHandCount: 5,
    runnerTags: 1,
    runnerCreditsVisible: 3,
    routes: [
      {
        schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
        visibility: "private_to_actor",
        matchId: "punish-persistent-root-match",
        side: "corp",
        routeId: CLOSED_ACCOUNTS_ROUTE_ID,
        campaignId: CLOSED_ACCOUNTS_CAMPAIGN_ID,
        campaignIdOrigin: "request_binding",
        stateVersion: params.stateVersion,
        timingPoint: "corp_action.main",
        requestFingerprint: `punish-persistent:${params.stateVersion}`,
        requestEcho: {
          schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
          matchId: "punish-persistent-root-match",
          side: "corp",
          stateVersion: params.stateVersion,
          timingPoint: "corp_action.main",
          campaignId: CLOSED_ACCOUNTS_CAMPAIGN_ID,
          routeId: CLOSED_ACCOUNTS_ROUTE_ID,
          steps: [
            {
              stepId: `${CLOSED_ACCOUNTS_ROUTE_ID}:payoff`,
              order: 0,
              kind: "other_punish",
              sourceCardInstanceId: params.card.instanceId,
              sourceCapabilityBindingKind: "card_spec_capability_key",
              sourceCapabilityId: `${params.card.definitionId!}:abilities_on_play_lose_credits`,
            },
          ],
        },
        complete: true,
        incompleteReasons: [],
        steps: [
          {
            stepId: `${CLOSED_ACCOUNTS_ROUTE_ID}:payoff`,
            order: 0,
            kind: "other_punish",
            sourceCardInstanceId: params.card.instanceId,
            sourceCardDefinitionId: params.card.definitionId!,
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId: `${params.card.definitionId!}:abilities_on_play_lose_credits`,
            clicks: 1,
            credits: 1,
            ...(params.currentAction
              ? { currentLegalAction: params.currentAction }
              : {}),
          },
        ],
        totalClicks: 1,
        totalActionCredits: 1,
        tagTrigger: {
          kind: "existing_tag",
          status: "satisfied",
          currentRunnerTags: 1,
          requiredRunnerTags: 1,
        },
        responsePaymentEnvelope: {
          responseKind: "none",
          paymentKnowledge: "exact_public",
          corpCreditsAvailable: params.credits,
          runnerCreditsVisible: 3,
          corpResponseCredits: { minimum: 0, maximum: 0 },
          totalCorpCredits: { minimum: 1, maximum: 1 },
          runnerResponseCredits: { minimum: 0, maximum: 0 },
        },
        damageEnvelope: {
          runnerHandCount: 5,
          rawDamage: { meat: 0, net: 0, core: 0, total: 0 },
          effectiveDamage: { minimum: 0, maximum: 0 },
          visiblePrevention: {
            knowledge: "none_visible",
            maximumPreventableDamage: 0,
            creditCost: { minimum: 0, maximum: 0 },
          },
          visiblePiercing: {
            knowledge: "none_visible",
            maximumBypassedDamage: 0,
            creditCost: { minimum: 0, maximum: 0 },
          },
        },
        nonDamageEnvelope: {
          runnerCreditLoss: {
            knowledge: "exact_public",
            minimum: 3,
            maximum: 3,
          },
        },
        guarantee: "not_guaranteed",
        responseKnowledge: "public_exact",
      },
    ],
  };
}

function closedAccountsCard(payoffQuote: "known" | "unknown"): VisibleCard {
  return visibleCard("closed-accounts", "corp", "operation", {
    definitionId: CLOSED_ACCOUNTS_DEFINITION_ID,
    title: "Closed Accounts",
    ...(payoffQuote === "known"
      ? {
          cost: 1,
          playCost: { kind: "fixed" as const, credits: 1 },
        }
      : {}),
  });
}

function playClosedAccounts(
  card: VisibleCard,
  stateVersion: number,
): LegalAction {
  return atStateVersion(
    legalAction(
      "closed-accounts",
      "corp",
      "play_operation",
      "Closed Accounts spielen",
      { credits: 1, clicks: 1 },
      { source: card.instanceId },
    ),
    stateVersion,
  );
}

function gainCredit(stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
      credits: 0,
      clicks: 1,
    }),
    stateVersion,
  );
}

function drawCard(stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction("draw", "corp", "draw_card", "Draw 1 Card", {
      credits: 0,
      clicks: 1,
    }),
    stateVersion,
  );
}

function endTurn(stateVersion: number): LegalAction {
  return atStateVersion(
    legalAction(
      "end-turn",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0 },
      { source: "game_rule" },
    ),
    stateVersion,
  );
}

function atStateVersion(
  action: LegalAction,
  stateVersion: number,
): LegalAction {
  return {
    ...action,
    expiresAtStateVersion: stateVersion,
  };
}
