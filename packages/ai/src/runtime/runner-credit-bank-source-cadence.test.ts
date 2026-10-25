import type { PublicGameEvent, VisibleCard } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildDeckCapabilityProfileFromInput } from "../deck-capabilities";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

const BROKER = "onr_v1_154_broker";

describe("runner credit-bank source-bound cadence", () => {
  beforeEach(() => resetResidentPlanPortfolioMemory());

  it("keeps one credit-bank plan across install and exact post-install build rematerialization", () => {
    const source = bank("broker-1", 0);
    const install = legalAction(
      "install-broker-1",
      "runner",
      "install_card",
      "Install Broker",
      { credits: 3, clicks: 1 },
      {
        source: source.instanceId,
        payload: {
          cardId: source.instanceId,
          sourceDefinitionId: BROKER,
        },
      },
    );
    const beforeInstall = aiInput("runner", [install, basicCredit()]);
    beforeInstall.playerView.own.credits = 3;
    beforeInstall.playerView.own.clicks = 2;
    beforeInstall.playerView.own.gripOrHq = [source];

    const installDecision = runtimeContext().chooseSemanticRuntimeAction(
      beforeInstall,
      {},
    );
    expect(installDecision).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });

    const afterInstall = aiInput("runner", [
      bankBuildAction(source.instanceId),
      basicCredit(),
    ]);
    afterInstall.playerView.stateVersion = 2;
    for (const action of afterInstall.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    afterInstall.playerView.own.credits = 0;
    afterInstall.playerView.own.clicks = 1;
    afterInstall.playerView.own.rig = [source];
    Object.assign(afterInstall, {
      planningStateIdentity: buildPlanningStateIdentity(afterInstall),
    });
    const buildDecision = runtimeContext().chooseSemanticRuntimeAction(
      afterInstall,
      {},
    );
    expect(buildDecision).toMatchObject({
      actionId: buildActionId(source.instanceId),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.credit_bank",
        planFirstDecision: {
          rootPlanInstanceId:
            installDecision.decisionDebug?.planFirstDecision
              ?.rootPlanInstanceId,
          route: { actionId: buildActionId(source.instanceId) },
        },
      },
    });
  });

  it("lets a same-counter sibling keep its own exact build route", () => {
    const decision = decide({
      visibleBanks: [bank("broker-1", 3), bank("broker-2", 3)],
      event: bankLoadEvent("broker-1"),
    });

    expect(decision).toMatchObject({
      actionId: buildActionId("broker-2"),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planId: expect.stringContaining("broker-2"),
        planKind: "runner.credit_bank",
        planFirstDecision: {
          leafExecutorInstanceId: expect.stringContaining("broker-2"),
          route: { actionId: buildActionId("broker-2") },
        },
      },
    });
  });

  it("does not transfer a removed source's cadence to the remaining copy", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 3)],
      event: bankLoadEvent("broker-removed"),
    });

    expect(decision).toMatchObject({
      actionId: buildActionId("broker-2"),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planId: expect.stringContaining("broker-2"),
      },
    });
  });

  it("does not infer cadence when the actor-side source binding is missing", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 3)],
      event: bankLoadEvent(undefined),
    });

    expect(decision).toMatchObject({
      actionId: buildActionId("broker-2"),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
  });

  it("does not carry an exact source binding across turn serials", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 3)],
      event: bankLoadEvent("broker-2", 0),
    });

    expect(decision).toMatchObject({
      actionId: buildActionId("broker-2"),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
  });

  it("establishes an empty Broker as development without promoting its recurring cadence", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 0)],
      event: bankLoadEvent("other-broker"),
    });

    expect(decision).toMatchObject({
      actionId: buildActionId("broker-2"),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_assessment_evidence:runner_credit_bank_first_load",
      ]),
    );
  });

  it("keeps recurring Broker loads in their background priority class", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 3)],
      event: bankLoadEvent("other-broker"),
    });

    expect(decision).toMatchObject({
      actionId: buildActionId("broker-2"),
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P5",
        "plan_assessment_evidence:runner_credit_bank_continue_to_value_target",
      ]),
    );
  });

  it("yields after the exact current-turn bank instance has loaded", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 3)],
      event: bankLoadEvent("broker-2"),
    });

    expect(decision).toMatchObject({
      actionId: "runner.gain_credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_portfolio_blocked_evidence:plan:runner.credit_bank:broker-2:runner_credit_bank_hold_instance_built_this_turn",
      ]),
    );
  });

  it("keeps building the same Broker over successive turns while a spending gap remains", () => {
    for (const [turn, stored] of [
      [2, 3],
      [3, 6],
    ] as const) {
      const decision = decide({
        visibleBanks: [bank("broker-2", stored)],
        event: bankLoadEvent("broker-2", turn - 1),
        turnSerial: turn,
        includeCashout: true,
      });
      expect(decision).toMatchObject({
        actionId: buildActionId("broker-2"),
        reasonCode: "plan_first.runner.credit_bank",
        fallbackUsed: false,
      });
      expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
        actionId: buildActionId("broker-2"),
        stateVersion: 1,
      });
    }
  });

  it("holds the funded bank instead of loading or cashing out merely to meet a wish reserve", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 9)],
      event: bankLoadEvent("broker-2", 0),
      includeCashout: true,
    });
    expect(decision.actionId).toBe("runner.gain_credit");
    expect(decision.evidence).toContain(
      "plan_portfolio_blocked_evidence:plan:runner.credit_bank:broker-2:runner_credit_bank_hold_spending_budget_funded",
    );
  });

  it("continues past twelve stored credits when the actual spending budget is larger", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 12)],
      event: bankLoadEvent("broker-2", 0),
      desiredReserve: 23,
      includeCashout: true,
    });
    expect(decision.actionId).toBe(buildActionId("broker-2"));
  });

  it("cashouts three immediately to restore a breached safety floor", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 3)],
      event: bankLoadEvent("broker-2", 0),
      credits: 1,
      includeCashout: true,
    });
    expect(decision).toMatchObject({
      actionId: "withdraw-broker-2",
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: "withdraw-broker-2",
      stateVersion: 1,
    });
  });

  it("protects exposed resource savings when tags make the bank trashable", () => {
    const decision = decide({
      visibleBanks: [bank("broker-2", 6)],
      event: bankLoadEvent("broker-2", 0),
      tags: 1,
      includeCashout: true,
    });
    expect(decision.actionId).toBe("withdraw-broker-2");
  });

  it.each([
    [16, false],
    [17, true],
  ] as const)(
    "admits another bank only for an unfilled portfolio budget (%i)",
    (reserve, admitted) => {
      const source = bank("broker-1", 0);
      const install = legalAction(
        "install-broker-1",
        "runner",
        "install_card",
        "Install Broker",
        { credits: 3, clicks: 1 },
        {
          source: source.instanceId,
          payload: { cardId: source.instanceId, sourceDefinitionId: BROKER },
        },
      );
      const input = aiInput("runner", [install, basicCredit()]);
      input.playerView.own.credits = 7;
      input.playerView.own.clicks = 2;
      input.playerView.own.gripOrHq = [source];
      input.playerView.own.rig = [bank("broker-2", 9)];
      const decision = runtimeContext(reserve).chooseSemanticRuntimeAction(
        input,
        {},
      );
      expect(decision.actionId === install.actionId).toBe(admitted);
      if (!admitted)
        expect(decision.evidence).toContain(
          "plan_portfolio_blocked_evidence:plan:runner.credit_bank:broker-1:runner_credit_bank_install_deferred_portfolio_budget_funded",
        );
    },
  );
});

function decide(params: {
  visibleBanks: VisibleCard[];
  event: PublicGameEvent;
  credits?: number;
  desiredReserve?: number;
  turnSerial?: number;
  includeCashout?: boolean;
  tags?: number;
}) {
  const build = bankBuildAction("broker-2");
  const credit = basicCredit();
  const stored =
    params.visibleBanks.find((b) => b.instanceId === "broker-2")
      ?.counterDisplays?.[0]?.amount ?? 0;
  const cashout = legalAction(
    "withdraw-broker-2",
    "runner",
    "activated_card_ability",
    "Broker auszahlen",
    { credits: 0, clicks: 1 },
    {
      source: "broker-2",
      payload: {
        cardId: "broker-2",
        sourceDefinitionId: BROKER,
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: `${BROKER}:withdraw_credits`,
        cardImplementationAbilityKey: "withdraw_credits",
        cardImplementationTakesHostedCredits: true,
        hostedCreditTakeMode: "all",
        hostedCreditTakeAmount: stored,
        gainCreditsAmount: stored,
      },
    },
  );
  const input = aiInput("runner", [
    build,
    credit,
    ...(params.includeCashout ? [cashout] : []),
  ]);
  input.playerView.turnSerial = params.turnSerial ?? 1;
  input.playerView.own.credits = params.credits ?? 5;
  input.playerView.own.tags = params.tags ?? 0;
  input.playerView.own.clicks = 3;
  input.playerView.own.rig = params.visibleBanks;
  input.playerView.publicEvents = [params.event];
  input.eventTail = input.playerView.publicEvents;

  return runtimeContext(params.desiredReserve).chooseSemanticRuntimeAction(
    input,
    {},
  );
}

function basicCredit() {
  return legalAction(
    "runner.gain_credit",
    "runner",
    "gain_credit",
    "Gain 1 Credit",
    { credits: 0, clicks: 1 },
  );
}

function runtimeContext(desiredReserve = 14) {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: buildDeckCapabilityProfileFromInput,
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      // Cadence is exercised with a real unfilled spending budget. A fully
      // funded reserve no longer authorizes arbitrary additional bank loads.
      desiredCreditReserve: desiredReserve,
      fundingNeed: false,
      evidence: [],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}

function bank(instanceId: string, amount: number): VisibleCard {
  return visibleCard(instanceId, "runner", "resource", {
    definitionId: BROKER,
    title: "Broker",
    counterDisplays: [
      {
        id: `stored-credits:${instanceId}`,
        amount,
        displayKind: "stored_credits",
        label: "Credits",
        ariaLabel: `${amount} gespeicherte Credits`,
        counterType: "bit",
        usageHint: "spendable",
        creditPool: { kind: "stored_credit" },
      },
    ],
  });
}

function bankBuildAction(instanceId: string) {
  return legalAction(
    buildActionId(instanceId),
    "runner",
    "activated_card_ability",
    "3 Credits auf Broker legen",
    { credits: 0, clicks: 1 },
    {
      source: instanceId,
      payload: {
        cardId: instanceId,
        sourceDefinitionId: BROKER,
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: `${BROKER}:store_credits`,
        cardImplementationAbilityKey: "store_credits",
        cardImplementationAddsHostedCredits: true,
        hostedCreditAddAmount: 3,
      },
    },
  );
}

function buildActionId(instanceId: string): string {
  return `runner.activated_card_ability.${instanceId}.${instanceId}.activated.${BROKER}:store_credits`;
}

function bankLoadEvent(
  sourceCardInstanceId: string | undefined,
  turnSerial = 1,
): PublicGameEvent {
  return {
    eventId: `bank-load:${sourceCardInstanceId ?? "unbound"}`,
    type: "activated_card_ability",
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    turnSerial,
    stateHashAfter: "fnv1a:bank-load",
    publicPayload: {
      actor: "runner",
      actionType: "activated_card_ability",
      ...(sourceCardInstanceId ? { sourceCardInstanceId } : {}),
      sourceDefinitionId: BROKER,
      resolvedEffects: [
        {
          effectId: "broker-load",
          kind: "add_hosted_credits",
          visibility: "public",
          amount: 3,
          remainingCounters: 3,
        },
      ],
    },
  };
}
