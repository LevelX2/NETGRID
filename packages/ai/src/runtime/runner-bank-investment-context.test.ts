import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { createRunnerBankInvestmentContext } from "./runner-bank-investment-context";

describe("createRunnerBankInvestmentContext", () => {
  it("detects credit-bank cards from generic hint effects", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [
              {
                kind: "economy",
                target: "economy.temporary_resource_bank",
                timing: "persistent",
              },
              {
                kind: "finite_economy_pool",
                resource: "credits",
                timing: "action",
              },
            ]
          : [],
    });
    const action = runnerAction("start_run", { serverId: "hq" });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(
        runnerInput({
          rig: [
            visibleRunnerCard("custom-runner-credit-bank", {
              counters: { power: 4 },
            }),
          ],
          legalActions: [action],
        }),
        action,
      ),
    ).toContain("bankStoredCredits:4");
  });

  it("does not treat every economy resource as a credit bank", () => {
    const context = createContext();
    const action = runnerAction("start_run", { serverId: "hq" });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(
        runnerInput({
          rig: [
            visibleRunnerCard("custom-economy-resource", {
              counters: { power: 4 },
            }),
          ],
          legalActions: [action],
        }),
        action,
      ),
    ).toContain("bankStoredCredits:0");
  });

  it("ignores substring-only economy roles for credit-bank detection", () => {
    const context = createContext({
      rolesForCardId: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? ["microeconomy"]
          : [],
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const action = runnerAction("start_run", { serverId: "hq" });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(
        runnerInput({
          rig: [
            visibleRunnerCard("custom-runner-credit-bank", {
              counters: { power: 4 },
            }),
          ],
          legalActions: [action],
        }),
        action,
      ),
    ).toContain("bankStoredCredits:0");
  });

  it("ignores substring-only funding-need role noise", () => {
    const action = runnerAction("install_card", {
      actionId: "expensive-noise",
      source: "expensive-noise-card",
    });
    const context = createContext({
      actionCreditCost: () => 9,
      rolesForAction: () => ["pressurewasher_noise"],
    });

    expect(
      context.runnerBankHasConcreteFundingNeed(
        runnerInput({
          rig: [],
          legalActions: [action],
        }),
      ),
    ).toBe(false);
  });

  it("classifies credit-bank build and cashout actions without card-name text", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 3 },
    });
    const buildAction = runnerAction("activated_card_ability", {
      actionId: "structured-build",
      source: bank.instanceId,
      label: "Use ability",
      cardImplementationAddsHostedCredits: true,
    });
    const cashOutAction = runnerAction("trigger_ability", {
      actionId: "structured-cashout",
      source: bank.instanceId,
      label: "Use ability",
      cardImplementationTakesHostedCredits: true,
    });
    const labelOnlyCashOutAction = runnerAction("trigger_ability", {
      actionId: "label-only-cashout",
      source: bank.instanceId,
      label: "Credits aus Quelle nehmen",
    });
    const input = runnerInput({
      rig: [bank],
      legalActions: [buildAction, cashOutAction, labelOnlyCashOutAction],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, buildAction),
    ).toContain("bankBuildLegal:true");
    expect(context.isRunnerBankCashOutAction(input, cashOutAction)).toBe(true);
    expect(context.isRunnerBankCashOutAction(input, labelOnlyCashOutAction)).toBe(
      false,
    );
  });

  it("ignores build-action substring noise in credit-bank action text", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 0 },
    });
    const noisyBuildAction = runnerAction("trigger_ability", {
      actionId: "substring-build-noise",
      source: bank.instanceId,
      resourceAbility: "bankroll counterfeiting",
    });
    const runAction = runnerAction("start_run", { serverId: "hq" });
    const input = runnerInput({
      rig: [bank],
      legalActions: [noisyBuildAction, runAction],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, runAction),
    ).toContain("bankBuildLegal:false");
  });
});

function createContext(
  overrides: Partial<
    Parameters<typeof createRunnerBankInvestmentContext>[0]
  > = {},
) {
  return createRunnerBankInvestmentContext({
    previousPlan: () => ({ type: "runner.build_credit_bank" }),
    runnerHandFundingTarget: () => undefined,
    findVisibleCard: (input, instanceId) =>
      [
        ...(input.playerView.own.rig ?? []),
        ...input.playerView.own.gripOrHq,
      ].find((card) => card.instanceId === instanceId),
    sourceDefinitionIdForAction: () => undefined,
    rolesForCardId: (definitionId) =>
      definitionId?.startsWith("custom-") ? ["economy", "resource"] : [],
    definitionForCardId: () => ({
      rulesText: "",
      mechanics: [],
    }),
    hintEffectsForDefinition: () => [],
    actionCreditCost: () => 0,
    rolesForAction: () => [],
    serverId: (action) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    definitionType: () => undefined,
    runnerRunTargetEvaluation: () => undefined,
    runnerRunTargetHighPayoff: () => false,
    ...overrides,
  });
}

function runnerInput(input: {
  rig: VisibleCard[];
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 1,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "runner_action_phase",
      own: {
        identity: visibleRunnerCard("runner-identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: input.rig,
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleRunnerCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        {
          id: "hq",
          label: "HQ",
          ice: [],
          root: [],
        },
      ],
      publicEvents: [],
      legalActions: input.legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: input.legalActions,
    difficulty: "normal",
    seed: "runner-bank-investment-context-test",
    decisionId: "runner-bank-investment-context-test",
    actionNumber: 1,
    profileId: "runner-bank-investment-context-test",
  } as AiDecisionInput;
}

function visibleRunnerCard(
  definitionId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "resource",
    known: true,
    owner: "runner",
    controller: "runner",
    ...overrides,
  };
}

function runnerAction(
  type: string,
  input: Record<string, unknown> = {},
): LegalAction {
  const { actionId, label, source, ...payload } = input;
  return {
    actionId:
      typeof actionId === "string"
        ? actionId
        : `${type}-${payload.serverId ?? source ?? "action"}`,
    side: "runner",
    type,
    source: typeof source === "string" ? source : undefined,
    label: typeof label === "string" ? label : type,
    payload,
  } as LegalAction;
}
