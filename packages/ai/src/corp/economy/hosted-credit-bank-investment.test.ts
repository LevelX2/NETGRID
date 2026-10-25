import { corpHostedBankLoadMatches } from "./hosted-credit-bank-facts";
import { afterEach, describe, expect, it } from "vitest";
import {
  aiInput,
  legalAction,
  visibleCard,
} from "../../semantic-ai-runtime-cutover.test-support";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpHostedBankInvestments } from "./hosted-credit-bank-investment";

const DEPARTMENT = "onr_v1_318_department-of-truth-enhancement";
const LOAD = `${DEPARTMENT}:abilities_activated_corp_main_add_hosted_credits`;
const CASH = `${DEPARTMENT}:abilities_activated_corp_main_take_hosted_credits`;
afterEach(resetResidentPlanPortfolioMemory);

function fixture(
  params: {
    stored?: number;
    protected?: boolean;
    clicks?: number;
    futureCost?: number;
  } = {},
) {
  const stored = params.stored ?? 6;
  const load = legalAction(
    "department-load",
    "corp",
    "activated_card_ability",
    "Department aufladen",
    { credits: 0, clicks: 1 },
    {
      source: "department",
      payload: {
        cardId: "department",
        sourceDefinitionId: DEPARTMENT,
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: LOAD,
        cardImplementationAbilityKey:
          "abilities_activated_corp_main_add_hosted_credits",
        cardImplementationAddsHostedCredits: true,
        hostedCreditAddAmount: 3,
      },
    },
  );
  load.abilityRef = {
    sourceCardInstanceId: "department",
    sourceAbilityId: LOAD,
  };
  const cash = legalAction(
    "department-cash",
    "corp",
    "activated_card_ability",
    "Department auszahlen",
    { credits: 0, clicks: 1 },
    {
      source: "department",
      payload: {
        cardId: "department",
        sourceDefinitionId: DEPARTMENT,
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: CASH,
        cardImplementationAbilityKey:
          "abilities_activated_corp_main_take_hosted_credits",
        cardImplementationTakesHostedCredits: true,
        hostedCreditTakeMode: "all",
        hostedCreditTakeAmount: stored,
        gainCreditsAmount: stored,
      },
    },
  );
  cash.abilityRef = {
    sourceCardInstanceId: "department",
    sourceAbilityId: CASH,
  };
  // Installing ICE is currently free; its Engine-quoted later rez costs are
  // an exact visible spending budget, not current payment capacity.
  const install = legalAction(
    "install-future-ice",
    "corp",
    "install_card",
    "ICE installieren",
    { credits: 0, clicks: 1 },
    {
      source: "future-ice",
      payload: {
        cardId: "future-ice",
        sourceDefinitionId: "onr_v1_254_liche",
        serverId: "new_remote",
        placement: "ice",
        postInstallRezQuoteCardId: "future-ice",
        postInstallRezQuoteTargetServerId: "new_remote",
        postInstallRezQuoteProjectedServerId: "remote_2",
        postInstallRezQuoteExpiresAtStateVersion: 1,
        postInstallRezQuoteCostKind: "fixed",
        postInstallRezQuoteBaseCredits: params.futureCost ?? 14,
        postInstallRezQuoteMandatoryAgendaPointCost: 0,
        postInstallRezQuoteComplete: true,
        postInstallRezQuoteFinalCredits: params.futureCost ?? 14,
      },
    },
  );
  const input = aiInput("corp", [
    load,
    ...(stored > 0 ? [cash] : []),
    legalAction("corp.gain_credit", "corp", "gain_credit", "1 Credit", {
      credits: 0,
      clicks: 1,
    }),
    install,
  ]);
  input.playerView.own.credits = 3;
  input.playerView.own.clicks = params.clicks ?? 1;
  input.playerView.own.stackOrRdCount = 20;
  input.playerView.own.gripOrHq = [
    visibleCard("future-ice", "corp", "ice", {
      definitionId: "onr_v1_254_liche",
      rezCost: 14,
    }),
  ];
  input.playerView.opponent.rig = [];
  input.playerView.servers.push({
    id: "remote_1",
    label: "Remote 1",
    root: [
      visibleCard("department", "corp", "asset", {
        definitionId: DEPARTMENT,
        rezzed: true,
        counters: { bit: stored },
      }),
    ],
    ice:
      params.protected === false
        ? []
        : [
            visibleCard("wall", "corp", "ice", {
              definitionId: "onr_v1_237_data-wall",
              rezzed: true,
              strength: 2,
              subtypes: ["wall"],
              effectiveRunQuote: {
                iceInstanceId: "wall",
                iceDefinitionId: "onr_v1_237_data-wall",
                effectiveStrength: 2,
                subroutines: [{ id: "wall:etr", type: "end_the_run" }],
              },
            }),
          ],
  });
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  return { input, candidates };
}

describe("Department demand-bound multi-turn investment", () => {
  it("invests the last action across the turn only behind currently known protection", () => {
    const { input, candidates } = fixture();
    const choice = corpHostedBankInvestments(input, candidates, []).get(
      "department",
    );
    expect(choice).toMatchObject({
      shouldCashout: false,
      development: {
        phase: "load",
        actionIds: ["department-load"],
        hostedCreditBankInvestment: {
          storedCredits: 6,
          targetCredits: 14,
          additionalLoadExecutions: 2,
          canCarryAcrossTurn: true,
        },
        payback: { horizonTurns: 1 },
      },
    });
    expect(
      corpHostedBankLoadMatches(
        input,
        candidates.find((c) => c.actionId === "department-load")!,
        choice!.development!.hostedCreditBankInvestment!,
      ),
    ).toBe(true);
  });

  it("cashes out before the opponent can reach an unprotected bank", () => {
    const { input, candidates } = fixture({ protected: false });
    expect(
      corpHostedBankInvestments(input, candidates, []).get("department"),
    ).toEqual({ shouldCashout: true });
  });

  it("cashes out when the current budget is funded instead of adding a fixed fourth load", () => {
    const { input, candidates } = fixture({ stored: 12, clicks: 3 });
    expect(
      corpHostedBankInvestments(input, candidates, []).get("department"),
    ).toEqual({ shouldCashout: true });
  });

  it("stops investing when liquid money already covers the visible budget", () => {
    const { input, candidates } = fixture();
    input.playerView.own.credits = 14;
    expect(
      corpHostedBankInvestments(input, candidates, []).get("department"),
    ).toEqual({ shouldCashout: false });
  });

  it("does not invent a spending budget from an incomplete future rez quote", () => {
    const { input, candidates } = fixture();
    input.legalActions.find(
      (a) => a.actionId === "install-future-ice",
    )!.payload!.postInstallRezQuoteComplete = false;
    expect(
      corpHostedBankInvestments(input, candidates, []).get("department")
        ?.development,
    ).toBeUndefined();
  });

  it("invalidates the exact load binding after a source or state change", () => {
    const { input, candidates } = fixture();
    const binding = corpHostedBankInvestments(input, candidates, []).get(
      "department",
    )!.development!.hostedCreditBankInvestment!;
    input.playerView.stateVersion++;
    expect(corpHostedBankLoadMatches(input, candidates[0]!, binding)).toBe(
      false,
    );
  });

  it("does not turn a background future Remote budget into an immediate cashout deadline", () => {
    const { input, candidates } = fixture();
    const choice = corpHostedBankInvestments(input, candidates, [
      {
        kind: "parent_funding",
        needId: "remote-budget",
        parentNeedId: "remote-budget",
        parentPlanInstanceId: "plan:corp.establish_scoring_remote:future",
        gap: 6,
        actionIds: ["department-cash"],
        parentPriorityClass: "P6",
        urgentForScore: false,
        evidenceCode: "future_remote_budget",
      },
    ]).get("department");
    expect(choice?.shouldCashout).toBe(false);
    expect(choice?.development?.actionIds).toEqual(["department-load"]);
  });

  it("yields the bank to an immediate defense funding deadline", () => {
    const { input, candidates } = fixture();
    expect(
      corpHostedBankInvestments(input, candidates, [
        {
          kind: "parent_funding",
          needId: "defense-now",
          parentNeedId: "defense-now",
          parentPlanInstanceId:
            "plan:corp.defend_servers:server-defense-portfolio",
          gap: 6,
          actionIds: ["department-cash"],
          parentPriorityClass: "P2",
          immediateDefenseConversion: true,
          urgentForScore: false,
          evidenceCode: "current_defense_budget",
        },
      ]).get("department"),
    ).toEqual({ shouldCashout: true });
  });

  it("runs the investment through the existing Corp economy plan, step and native route", () => {
    const { input } = fixture();
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("department-load");
    expect(decision.decisionDebug?.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.economy:economy-hosted-bank-investment%3Adepartment",
      route: { actionId: "department-load", stateVersion: 1 },
    });
  });
});
