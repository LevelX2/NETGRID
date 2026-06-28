import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { createRunnerNoRunEconomyContext } from "./runner-no-run-economy-context";

describe("runner no-run economy context", () => {
  it("matches no-run economy effect targets exactly", () => {
    expect(
      evidenceFor({
        effectTargets: ["economy.turn_start_credit", "risk.ends_on_run"],
      }),
    ).toContain("noRunEconomyCommitmentActive:true");
    expect(
      evidenceFor({
        effectTargets: [
          "economy.turn_start_credited_noise",
          "risk.ends_on_runner_noise",
        ],
      }),
    ).toEqual([]);
  });

  it("matches no-run economy mechanics by bounded terms", () => {
    expect(
      evidenceFor({
        mechanics: ["start_of_turn_credit_gain", "trash_on_run"],
      }),
    ).toContain("noRunEconomyCommitmentActive:true");
    expect(
      evidenceFor({
        mechanics: [
          "start_of_turn_credit_gainish_noise",
          "trash_on_runner_noise",
        ],
      }),
    ).toEqual([]);
  });
});

function evidenceFor(params: {
  effectTargets?: string[];
  mechanics?: string[];
}): string[] {
  const context = createRunnerNoRunEconomyContext({
    findVisibleCard: () => undefined,
    hintEffectsForDefinition: () =>
      (params.effectTargets ?? []).map((target) => ({ target })),
    mechanicsForDefinition: () => params.mechanics ?? [],
    rulesTextForDefinition: () => "Gain 2 credits at the start of your turn.",
    runnerBankCommitmentRunOverride: () => undefined,
    isRunnerRigInstallAction: () => false,
  });
  return context.runnerNoRunEconomyCommitmentEvidence(input(), startRun());
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    eventTail: [],
    legalActions: [startRun()],
    playerView: {
      own: {
        clicks: 3,
        rig: [card()],
      },
    },
  } as unknown as AiDecisionInput;
}

function startRun(): LegalAction {
  return {
    actionId: "run",
    side: "runner",
    type: "start_run",
    label: "Run",
    source: "basic_action",
    payload: { serverId: "rd" },
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function card(): VisibleCard {
  return {
    instanceId: "no_run_economy",
    definitionId: "no_run_economy",
    known: true,
    type: "resource",
  } as VisibleCard;
}
