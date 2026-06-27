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
      source: bank.instanceId,
      label: "3 Credits auf Quelle legen",
    });
    const cashOutAction = runnerAction("trigger_ability", {
      source: bank.instanceId,
      label: "Credits aus Quelle nehmen",
    });
    const input = runnerInput({
      rig: [bank],
      legalActions: [buildAction, cashOutAction],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, buildAction),
    ).toContain("bankBuildLegal:true");
    expect(context.isRunnerBankCashOutAction(input, cashOutAction)).toBe(true);
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
  input: Record<string, string> = {},
): LegalAction {
  const { label, source, ...payload } = input;
  return {
    actionId: `${type}-${payload.serverId ?? source ?? "action"}`,
    side: "runner",
    type,
    source,
    label: label ?? type,
    payload,
  } as LegalAction;
}
