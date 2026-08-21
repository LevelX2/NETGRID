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
});

function decide(params: {
  visibleBanks: VisibleCard[];
  event: PublicGameEvent;
}) {
  const build = bankBuildAction("broker-2");
  const credit = basicCredit();
  const input = aiInput("runner", [build, credit]);
  input.playerView.turnSerial = 1;
  input.playerView.own.credits = 5;
  input.playerView.own.clicks = 3;
  input.playerView.own.rig = params.visibleBanks;
  input.playerView.publicEvents = [params.event];
  input.eventTail = input.playerView.publicEvents;

  return runtimeContext().chooseSemanticRuntimeAction(input, {});
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

function runtimeContext() {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: buildDeckCapabilityProfileFromInput,
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
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
