import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
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
        definitionId === "custom-runner-credit-bank" ? ["microeconomy"] : [],
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

  it("ignores substring-only credit-counter text for credit-bank detection", () => {
    const context = createContext({
      definitionForCardId: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? {
              rulesText: "Creditor counterparty.",
              mechanics: [],
            }
          : { rulesText: "", mechanics: [] },
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

  it("ignores substring-only stored-credit display text", () => {
    const context = createContext({
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
              counterDisplays: [
                {
                  id: "creditor-bankrupt-display",
                  amount: 9,
                  displayKind: "generic_counter",
                  label: "creditor bankrupt",
                  ariaLabel: "generic marker",
                },
              ],
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
    expect(
      context.isRunnerBankCashOutAction(input, labelOnlyCashOutAction),
    ).toBe(false);
  });

  it("uses first-load cashout at critical reserve but defers smaller payouts", () => {
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
      cardImplementationAddsHostedCredits: true,
    });
    const cashOutAction = runnerAction("trigger_ability", {
      actionId: "structured-cashout",
      source: bank.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    const input = runnerInput({
      credits: 2,
      rig: [bank],
      legalActions: [buildAction, cashOutAction],
    });

    expect(context.runnerBankCashOutIsUsefulNow(input, cashOutAction)).toBe(
      true,
    );
    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, cashOutAction),
    ).toEqual(
      expect.arrayContaining([
        "bankStoredCredits:3",
        "desiredBankTarget:6",
        "bankCashOutThreshold:false",
        "why_cashout_now:critical_reserve",
      ]),
    );
    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, buildAction),
    ).toContain("bankCommitmentStatus:build_second_load");

    const underloadedBank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 1 },
    });
    const underloadedCashOut = runnerAction("trigger_ability", {
      actionId: "underloaded-cashout",
      source: underloadedBank.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    const underloadedInput = runnerInput({
      credits: 2,
      rig: [underloadedBank],
      legalActions: [underloadedCashOut],
    });

    expect(
      context.runnerBankCashOutIsUsefulNow(
        underloadedInput,
        underloadedCashOut,
      ),
    ).toBe(false);
    expect(
      context.runnerBankInvestmentCommitmentEvidence(
        underloadedInput,
        underloadedCashOut,
      ),
    ).toEqual(
      expect.arrayContaining([
        "bankStoredCredits:1",
        "bankCommitmentStatus:cashout_deferred",
        "why_cashout_now:no_funding_need",
      ]),
    );
  });

  it("cashes out a funded bank to convert a blocked matchpoint remote", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
      runnerRunTargetEvaluation: () =>
        ({
          scoreThreat: true,
          pathPassability: "blocked_unpayable",
        }) as RunnerRunTargetEvaluation,
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 3 },
    });
    const cashOutAction = runnerAction("trigger_ability", {
      actionId: "structured-cashout",
      source: bank.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    const remoteRun = runnerAction("start_run", {
      actionId: "remote-matchpoint-run",
      serverId: "remote_1",
    });
    const input = runnerInput({
      credits: 12,
      clicks: 4,
      rig: [bank],
      legalActions: [cashOutAction, remoteRun],
    });
    input.playerView.opponent.agendaPoints = 6;

    expect(context.runnerBankHasConcreteFundingNeed(input)).toBe(true);
    expect(context.runnerBankCashOutIsUsefulNow(input, cashOutAction)).toBe(
      true,
    );
    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, cashOutAction),
    ).toEqual(
      expect.arrayContaining([
        "bankTerminalContestFundingNeed:true",
        "why_cashout_now:concrete_funding_need",
      ]),
    );
  });

  it("holds bank building once fifteen liquid credits are available", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 0 },
    });
    const buildAction = runnerAction("activated_card_ability", {
      actionId: "structured-build",
      source: bank.instanceId,
      cardImplementationAddsHostedCredits: true,
    });
    const input = runnerInput({
      credits: 15,
      rig: [bank],
      legalActions: [buildAction],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, buildAction),
    ).toEqual(
      expect.arrayContaining([
        "bankComfortableCreditPool:false",
        "bankCommitmentStatus:hold",
      ]),
    );
    expect(
      context.runnerBankInvestmentCommitmentScoreComponents(
        input,
        buildAction,
      )[0]?.value,
    ).toBe(-300);
  });

  it("keeps loading toward twelve when only combined access is comfortable", () => {
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
      cardImplementationAddsHostedCredits: true,
    });
    const input = runnerInput({
      credits: 9,
      rig: [bank],
      legalActions: [buildAction],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, buildAction),
    ).toEqual(
      expect.arrayContaining([
        "bankCombinedCreditAccess:12",
        "bankComfortableCreditPool:false",
        "bankCommitmentStatus:build_second_load",
      ]),
    );
  });

  it("finishes a bank from nine to twelve despite high combined access", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 9 },
    });
    const buildAction = runnerAction("activated_card_ability", {
      actionId: "structured-build",
      source: bank.instanceId,
      cardImplementationAddsHostedCredits: true,
    });
    const cashOutAction = runnerAction("trigger_ability", {
      actionId: "structured-cashout",
      source: bank.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    const input = runnerInput({
      credits: 12,
      rig: [bank],
      legalActions: [buildAction, cashOutAction],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, buildAction),
    ).toEqual(
      expect.arrayContaining([
        "bankCombinedCreditAccess:21",
        "bankOverDesiredTarget:false",
        "bankCommitmentStatus:build_second_load",
      ]),
    );
    expect(
      context.runnerBankInvestmentCommitmentScoreComponents(
        input,
        buildAction,
      )[0]?.value,
    ).toBeGreaterThan(0);
  });

  it("uses a mature bank below twenty liquid credits but preserves it at twenty", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 15 },
    });
    const cashOutAction = runnerAction("trigger_ability", {
      actionId: "structured-cashout",
      source: bank.instanceId,
      cardImplementationTakesHostedCredits: true,
    });

    expect(
      context.runnerBankCashOutIsUsefulNow(
        runnerInput({
          credits: 15,
          rig: [bank],
          legalActions: [cashOutAction],
        }),
        cashOutAction,
      ),
    ).toBe(true);
    expect(
      context.runnerBankCashOutIsUsefulNow(
        runnerInput({
          credits: 20,
          rig: [bank],
          legalActions: [cashOutAction],
        }),
        cashOutAction,
      ),
    ).toBe(false);
  });

  it("treats fewer than five liquid credits as a valid reaction-floor emergency", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 3 },
    });
    const cashOutAction = runnerAction("trigger_ability", {
      actionId: "structured-cashout",
      source: bank.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    const input = runnerInput({
      credits: 4,
      rig: [bank],
      legalActions: [cashOutAction],
    });

    expect(context.runnerBankCashOutIsUsefulNow(input, cashOutAction)).toBe(
      true,
    );
  });

  it("only cashes out for a hand target when the payout bridges it this turn", () => {
    const context = createContext({
      runnerHandFundingTarget: () => ({
        value: 900,
        reason: "breaker_in_hand",
        cardCost: 9,
        missingCredits: 4,
      }),
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bankWithThree = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 3 },
    });
    const threeCreditCashOut = runnerAction("trigger_ability", {
      actionId: "cashout-three",
      source: bankWithThree.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    expect(
      context.runnerBankHasConcreteFundingNeed(
        runnerInput({
          credits: 5,
          clicks: 2,
          rig: [bankWithThree],
          legalActions: [threeCreditCashOut],
        }),
      ),
    ).toBe(false);

    const bankWithSix = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 6 },
    });
    const sixCreditCashOut = runnerAction("trigger_ability", {
      actionId: "cashout-six",
      source: bankWithSix.instanceId,
      cardImplementationTakesHostedCredits: true,
    });
    expect(
      context.runnerBankHasConcreteFundingNeed(
        runnerInput({
          credits: 5,
          clicks: 2,
          rig: [bankWithSix],
          legalActions: [sixCreditCashOut],
        }),
      ),
    ).toBe(true);
    expect(
      context.runnerBankHasConcreteFundingNeed(
        runnerInput({
          credits: 5,
          clicks: 1,
          rig: [bankWithSix],
          legalActions: [sixCreditCashOut],
        }),
      ),
    ).toBe(false);
  });

  it("keeps first and continuation loads at comparable portfolio priority", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const emptyBank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 0 },
    });
    const emptyBuild = runnerAction("activated_card_ability", {
      actionId: "build-empty",
      source: emptyBank.instanceId,
      cardImplementationAddsHostedCredits: true,
    });
    const loadedBank = visibleRunnerCard("custom-runner-credit-bank", {
      instanceId: "loaded-bank-instance",
      counters: { power: 6 },
    });
    const loadedBuild = runnerAction("activated_card_ability", {
      actionId: "build-loaded",
      source: loadedBank.instanceId,
      cardImplementationAddsHostedCredits: true,
    });
    const input = runnerInput({
      credits: 8,
      rig: [emptyBank, loadedBank],
      legalActions: [emptyBuild, loadedBuild],
    });
    const emptyPriority =
      context.runnerBankInvestmentCommitmentScoreComponents(
        input,
        emptyBuild,
      )[0]?.value ?? 0;
    const loadedPriority =
      context.runnerBankInvestmentCommitmentScoreComponents(
        input,
        loadedBuild,
      )[0]?.value ?? 0;

    expect(emptyPriority).toBeGreaterThan(0);
    expect(loadedPriority).toBeGreaterThan(0);
    expect(Math.abs(emptyPriority - loadedPriority)).toBeLessThanOrEqual(300);
  });

  it("keeps a first last-click load strong but makes a second load background", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const emptyBank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 0 },
    });
    const emptyBuild = runnerAction("activated_card_ability", {
      actionId: "build-empty-last-click",
      source: emptyBank.instanceId,
      cardImplementationAddsHostedCredits: true,
    });
    const loadedBank = visibleRunnerCard("custom-runner-credit-bank", {
      instanceId: "loaded-last-click-bank-instance",
      counters: { power: 3 },
    });
    const loadedBuild = runnerAction("activated_card_ability", {
      actionId: "build-loaded-last-click",
      source: loadedBank.instanceId,
      cardImplementationAddsHostedCredits: true,
    });
    const input = runnerInput({
      credits: 12,
      clicks: 1,
      rig: [emptyBank, loadedBank],
      legalActions: [emptyBuild, loadedBuild],
    });

    const firstLoad =
      context.runnerBankInvestmentCommitmentScoreComponents(
        input,
        emptyBuild,
      )[0]?.value ?? 0;
    const secondLoad =
      context.runnerBankInvestmentCommitmentScoreComponents(
        input,
        loadedBuild,
      )[0]?.value ?? 0;

    expect(firstLoad).toBeGreaterThan(2000);
    expect(secondLoad).toBeGreaterThan(0);
    expect(secondLoad).toBeLessThan(820);
  });

  it("defers installing another bank outside the build phase", () => {
    const context = createContext({
      previousPlan: () => undefined,
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
      actionCreditCost: (action) => (action.type === "install_card" ? 3 : 0),
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank");
    const install = runnerAction("install_card", {
      actionId: "install-bank",
      source: bank.instanceId,
    });
    const input = runnerInput({
      credits: 15,
      clicks: 4,
      hand: [bank],
      rig: [],
      legalActions: [install],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, install),
    ).toContain("bankCommitmentStatus:install_deferred");
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

  it("ignores cashout-action substring noise in credit-bank action text", () => {
    const context = createContext({
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank", {
      counters: { power: 4 },
    });
    const noisyCashOutAction = runnerAction("trigger_ability", {
      actionId: "substring-cashout-noise",
      source: bank.instanceId,
      resourceAbility: "bankroll payoutish",
    });
    const input = runnerInput({
      rig: [bank],
      legalActions: [noisyCashOutAction],
    });

    expect(context.isRunnerBankCashOutAction(input, noisyCashOutAction)).toBe(
      false,
    );
  });

  it("projects install, urgent run and first load when all three clicks remain", () => {
    const context = createContext({
      previousPlan: () => undefined,
      hintEffectsForDefinition: (definitionId) =>
        definitionId === "custom-runner-credit-bank"
          ? [{ kind: "economy", target: "economy.temporary_resource_bank" }]
          : [],
      actionCreditCost: (action) => (action.type === "install_card" ? 3 : 0),
    });
    const bank = visibleRunnerCard("custom-runner-credit-bank");
    const install = runnerAction("install_card", {
      actionId: "install-bank",
      source: bank.instanceId,
    });
    const run = runnerAction("start_run", {
      actionId: "run-known-agenda",
      serverId: "hq",
    });
    const input = runnerInput({
      credits: 9,
      clicks: 3,
      hand: [bank],
      hqRoot: [
        visibleRunnerCard("known-agenda", {
          owner: "corp",
          controller: "corp",
          type: "agenda",
        }),
      ],
      rig: [],
      legalActions: [install, run],
    });

    expect(
      context.runnerBankInvestmentCommitmentEvidence(input, install),
    ).toEqual(
      expect.arrayContaining([
        "bankCommitmentStatus:install_ready",
        "bankProjectedCreditsAfterInstall:6",
        "bankProjectedClicksAfterInstall:2",
        "bankProjectedReservedRunClicks:1",
        "bankProjectedLoadThisTurn:true",
      ]),
    );
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
  credits?: number;
  clicks?: number;
  hand?: VisibleCard[];
  hqRoot?: VisibleCard[];
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
        credits: input.credits ?? 5,
        clicks: input.clicks ?? 4,
        agendaPoints: 0,
        gripOrHq: input.hand ?? [],
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
          root: input.hqRoot ?? [],
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
