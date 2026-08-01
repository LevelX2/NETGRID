import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  buildCorpAmbushPlanSignals,
  CORP_AMBUSH_COMMITMENT_VERSION,
} from "./corp-ambush-plan-signals";

describe("Corp ambush plan signal duplicate scope", () => {
  it("counts only same-definition copies in active remote roots as installed duplicates", () => {
    const definitionId = "onr_v1_345_trap";
    const handCopy = visibleCard("trap-in-hq", "corp", "asset", {
      definitionId,
      title: "TRAP!",
    });
    const install = legalAction(
      "install-trap-remote-1",
      "corp",
      "install_card",
      "Install TRAP! in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: handCopy.instanceId,
        payload: {
          cardId: handCopy.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.credits = 8;
    input.playerView.own.gripOrHq = [handCopy];
    input.playerView.servers = [
      server("hq", [], [sameDefinitionCopy("trap-in-hq-root")]),
      server("rd", [], [sameDefinitionCopy("trap-in-rd")]),
      server("archives", [], [sameDefinitionCopy("trap-in-archives")]),
      server("remote_1"),
    ];
    setAmbushIntent(input);
    const candidate = ambushInstallCandidate(
      install.actionId,
      handCopy.instanceId,
      definitionId,
      "remote_1",
    );

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [candidate],
        previous: undefined,
      }),
    ).toEqual([
      expect.objectContaining({
        sourceInstanceId: handCopy.instanceId,
        sourceDefinitionId: definitionId,
        actionIds: [install.actionId],
        serverId: "remote_1",
        phase: "install",
        duplicateAlreadyInstalled: false,
      }),
    ]);

    input.playerView.servers.push(
      server("remote_2", [], [sameDefinitionCopy("trap-in-remote-2")]),
    );

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [candidate],
        previous: undefined,
      }),
    ).toEqual([]);

    function sameDefinitionCopy(instanceId: string) {
      return visibleCard(instanceId, "corp", "asset", {
        definitionId,
        title: "TRAP!",
      });
    }
  });

  it("qualifies an Engine-quoted contestable counter bank as a generic score decoy", () => {
    const counterBank = visibleCard(
      "synthetic-counter-bank-1",
      "corp",
      "asset",
      {
        definitionId: "synthetic_counter_bank",
        advancementCounters: 0,
        counterBankPreparationQuote: {
          schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
          context: "corp_counter_bank_preparation",
          sourceCardId: "synthetic-counter-bank-1",
          expiresAtStateVersion: 1,
          location: { kind: "corp_hq" },
          advancementCounters: 0,
          advanceableBeforeRez: true,
          activatedAbilitiesRequireRez: true,
          cashout: {
            advancementCounterCost: 1,
            creditGain: 1,
            actionCost: 0,
          },
          transfer: {
            actionCost: 1,
            minimumSourceCounters: 1,
            source: "source_card",
            target: "chosen_installed_advanceable_card",
            maximum: "all",
          },
        },
      },
    );
    const agenda = visibleCard("followup-agenda-1", "corp", "agenda", {
      definitionId: "simple_agenda",
      advancementRequirement: 3,
      agendaPoints: 2,
    });
    const install = legalAction(
      "install-synthetic-counter-bank-remote-1",
      "corp",
      "install_card",
      "Install the quoted counter bank",
      { credits: 0, clicks: 1 },
      {
        source: counterBank.instanceId,
        payload: {
          cardId: counterBank.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.gripOrHq = [counterBank, agenda];
    input.playerView.opponent.credits = 4;
    input.playerView.opponent.rig = [
      visibleCard("generic-breaker-1", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        subtypes: ["icebreaker"],
        strength: 2,
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-code-gate-1", "corp", "ice", {
          definitionId: "onr_v1_261_quandary",
          rezzed: true,
          subtypes: ["code_gate"],
          strength: 2,
        }),
      ]),
    ];
    setAmbushIntent(input);

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [
          ambushInstallCandidate(
            install.actionId,
            counterBank.instanceId,
            counterBank.definitionId!,
            "remote_1",
          ),
        ],
        previous: undefined,
      }),
    ).toContainEqual(
      expect.objectContaining({
        patternKind: "score_decoy",
        sourceInstanceId: counterBank.instanceId,
        followupAgendaInstanceId: agenda.instanceId,
        serverId: "remote_1",
        actionIds: [install.actionId],
        plannedAdvancementTarget: 1,
      }),
    );
  });

  it("retires a score decoy after rez instead of re-advancing a liquidated counter bank", () => {
    const source = visibleCard(
      "synthetic-counter-bank-1",
      "corp",
      "asset",
      {
        definitionId: "synthetic_counter_bank",
        advancementCounters: 0,
        rezzed: true,
      },
    );
    const input = aiInput("corp", []);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [source]),
    ];
    const previous = {
      instances: [
        {
          instanceId: "plan:corp.ambush_and_bluff:score-decoy",
          moduleId: "corp.ambush_and_bluff",
          moduleState: {
            kind: "ambush",
            signal: {
              commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
              ambushId: "score-decoy:synthetic-counter-bank-1:remote_1:agenda-1",
              sourceDefinitionId: "synthetic_counter_bank",
              sourceInstanceId: source.instanceId,
              actionIds: [],
              serverId: "remote_1",
              phase: "advance",
              patternKind: "score_decoy",
              followupAgendaInstanceId: "agenda-1",
              purposeCode: "test_score_decoy",
              assignedDomainPlanIds: ["corp.ambush_bluff"],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              plannedAtStateVersion: input.playerView.stateVersion,
              plannedAdvancementTarget: 1,
              value: 300,
              evidenceCode: "test_score_decoy",
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    expect(
      buildCorpAmbushPlanSignals({ input, candidates: [], previous }),
    ).toEqual([]);

    source.rezzed = false;
    expect(
      buildCorpAmbushPlanSignals({ input, candidates: [], previous }),
    ).toContainEqual(
      expect.objectContaining({
        sourceInstanceId: source.instanceId,
        phase: "advance",
        patternKind: "score_decoy",
      }),
    );
  });
});

function ambushInstallCandidate(
  actionId: string,
  sourceInstanceId: string,
  sourceDefinitionId: string,
  serverId: "remote_1",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: ["cardId", "placement", "serverId"],
    },
    stateVersion: 1,
    sourceKind: "card",
    sourceCardInstanceId: sourceInstanceId,
    sourceDefinitionId,
    abilityBindingMethod: "unresolved",
    semanticActionType: "install.card",
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      paidBy: "corp",
      beneficiary: "corp",
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {
      phase: "corp_action_phase",
      turnSide: "corp",
      window: "corp_action.main",
      responseWindow: true,
    },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 1,
      notes: [],
    },
    runProjectionSummary: {
      serverId,
      serverKind: "remote",
      source: "legal_action_payload",
      evidence: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function setAmbushIntent(input: AiDecisionInput): void {
  (input as AiDecisionInputWithDeckCapabilities).ownCorpStrategicIntent = {
    schemaVersion: "corp-strategic-intent-profile-v1",
    side: "corp",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "corp.punish_runner",
    scorePlan: [],
    defensePlan: [],
    economyPlan: [],
    enginePlan: [],
    punishPlan: ["corp.ambush_bluff"],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: ["test_corp_ambush_strategy_active"],
  } satisfies CorpStrategicIntentProfile;
}
