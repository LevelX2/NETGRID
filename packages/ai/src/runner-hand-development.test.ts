import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import {
  evaluateRunnerHandDevelopment,
  redactedRunnerHandDevelopmentFacts,
} from "./runner-hand-development";
import {
  RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
  type RunnerStrategicIntentProfile,
} from "./runner-strategic-intent";

describe("RunnerHandDevelopmentEvaluation", () => {
  it("classifies central access payoff from own hand without leaking card identity in redacted facts", () => {
    const accessCard = visibleCard("rd-interface-1", {
      definitionId: "test-rd-interface",
      title: "R&D Interface",
      type: "hardware",
      installCost: 4,
      rulesText:
        "Whenever you make a successful run on R&D, access 1 additional card.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [accessCard],
      legalActions: [installAction("install-rd-interface", accessCard, 4)],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        pressureVectors: ["runner.central_probe_pressure"],
      }),
    });
    const evaluation = findByInstance(evaluations, "rd-interface-1");
    const redacted = redactedRunnerHandDevelopmentFacts([evaluation]);

    expect(evaluation).toMatchObject({
      developmentRole: "access_payoff",
      availability: "legal_now",
      strategicFit: "strong",
      currentNeed: "useful_now",
      deferReason: "none",
    });
    expect(evaluation.priority).toBeGreaterThanOrEqual(900);
    expect(redacted.join("\n")).not.toMatch(/R&D Interface|test-rd-interface|rd-interface-1/);
    expect(evaluation.evidence.join("\n")).not.toMatch(/R&D Interface|test-rd-interface|rd-interface-1/);
  });

  it("separates MU-blocked breaker setup from missing-credit setup", () => {
    const breaker = visibleCard("breaker-1", {
      definitionId: "test-code-breaker",
      title: "Test Decoder",
      type: "program",
      subtypes: ["icebreaker", "decoder"],
      installCost: 3,
      memoryCost: 1,
      rulesText: "Icebreaker: break code gate subroutines.",
    });
    const economy = visibleCard("expensive-economy-1", {
      definitionId: "test-expensive-economy",
      title: "Expensive Economy",
      type: "resource",
      installCost: 5,
      rulesText: "Gain credits over future turns.",
    });
    const input = runnerInput({
      credits: 2,
      hand: [breaker, economy],
      memoryUsed: 4,
      memoryLimit: 4,
      legalActions: [],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        setupEngine: [
          "runner.rig_first",
          "runner.economy_setup_before_pressure",
        ],
      }),
    });
    const breakerEvaluation = findByInstance(evaluations, "breaker-1");
    const economyEvaluation = findByInstance(evaluations, "expensive-economy-1");

    expect(breakerEvaluation).toMatchObject({
      developmentRole: "breaker_or_rig_piece",
      availability: "missing_mu",
      deferReason: "missing_mu",
    });
    expect(economyEvaluation).toMatchObject({
      developmentRole: "economy_engine",
      availability: "missing_credits",
      fundingNeed: {
        installOrPlayCost: 5,
        missingCredits: 3,
        reason: "cannot_pay",
      },
      deferReason: "missing_credits",
    });
  });

  it("marks bank and economy tools as acute setup when the Runner is credit-starved", () => {
    const broker = visibleCard("broker-1", {
      definitionId: "test-broker",
      title: "Broker",
      type: "resource",
      installCost: 0,
      rulesText: "Put credits on this bank. Take credits from this bank.",
    });
    const input = runnerInput({
      credits: 1,
      hand: [broker],
      legalActions: [installAction("install-broker", broker, 0)],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        setupEngine: ["runner.economy_setup_before_pressure"],
      }),
    });
    const evaluation = findByInstance(evaluations, "broker-1");

    expect(evaluation).toMatchObject({
      developmentRole: "bank_tool",
      availability: "legal_now",
      currentNeed: "acute",
      strategicFit: "strong",
    });
    expect(evaluation.priority).toBeGreaterThanOrEqual(900);
  });

  it("keeps defense cards without visible threat low and deferred", () => {
    const shield = visibleCard("shield-1", {
      definitionId: "test-shield",
      title: "Shield",
      type: "program",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Prevent 2 net damage.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [shield],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-shield", shield, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "shield-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      availability: "legal_now",
      currentNeed: "none",
      strategicFit: "weak",
      deferReason: "no_current_need",
    });
    expect(evaluation.priority).toBeLessThan(500);
  });

  it("keeps duplicate or low-value hand cards conservative", () => {
    const duplicate = visibleCard("spare-resource-1", {
      definitionId: "test-spare-resource",
      title: "Spare Resource",
      type: "resource",
      installCost: 1,
      rulesText: "A spare connection with no current setup role.",
    });
    const installed = visibleCard("spare-resource-installed", {
      definitionId: "test-spare-resource",
      title: "Spare Resource",
      type: "resource",
    });
    const input = runnerInput({
      credits: 5,
      hand: [duplicate],
      rig: [installed],
      legalActions: [installAction("install-spare-resource", duplicate, 1)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "spare-resource-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "duplicate_or_low_value",
      availability: "legal_now",
      strategicFit: "weak",
      deferReason: "duplicate",
    });
    expect(evaluation.priority).toBeLessThan(200);
  });

  it("marks useful but currently unavailable run events as timing-blocked", () => {
    const runEvent = visibleCard("run-event-1", {
      definitionId: "test-run-event",
      title: "Run Event",
      type: "event",
      cost: 2,
      rulesText: "Make a run on HQ; if successful, access 1 additional card.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [runEvent],
      legalActions: [],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        executionStyle: "runner.run_event_tempo",
        pressureVectors: ["runner.central_probe_pressure"],
      }),
    });
    const evaluation = findByInstance(evaluations, "run-event-1");

    expect(evaluation).toMatchObject({
      developmentRole: "access_payoff",
      availability: "timing_blocked",
      currentNeed: "useful_now",
      strategicFit: "strong",
      deferReason: "timing",
    });
  });
});

function runnerInput(params: {
  credits: number;
  hand: VisibleCard[];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  memoryUsed?: number;
  memoryLimit?: number;
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: params.hand,
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
      ...(params.memoryUsed !== undefined ? { memoryUsed: params.memoryUsed } : {}),
      ...(params.memoryLimit !== undefined ? { memoryLimit: params.memoryLimit } : {}),
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
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
    servers: [],
    publicEvents: [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-hand-development-test",
    decisionId: "runner-hand-development-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function strategicIntent(
  overrides: Partial<
    Pick<
      RunnerStrategicIntentProfile,
      "executionStyle" | "setupEngine" | "pressureVectors"
    >
  > = {},
): RunnerStrategicIntentProfile {
  return {
    schemaVersion: RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
    side: "runner",
    source: {
      deckStrategyProfile: "diagnostic_only",
      deckCapabilities: "ai_internal",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "runner.steal_agendas_default",
    ...(overrides.executionStyle ? { executionStyle: overrides.executionStyle } : {}),
    setupEngine: overrides.setupEngine ?? [],
    pressureVectors: overrides.pressureVectors ?? [],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "medium",
    evidence: ["test_strategic_intent"],
  };
}

function installAction(
  actionId: string,
  card: VisibleCard,
  creditCost: number,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "install_card",
    label: `Install ${card.title ?? card.instanceId}`,
    source: card.instanceId,
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }, ...(creditCost > 0 ? [{ credits: creditCost }] : [])],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: {
      cardId: card.instanceId,
      ...(card.definitionId ? { cardDefinitionId: card.definitionId } : {}),
    },
  };
}

function visibleIdentity(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId" | "known" | "owner" | "controller">,
): VisibleCard {
  return {
    instanceId,
    owner: "runner",
    controller: "runner",
    known: true,
    ...overrides,
  };
}

function findByInstance(
  evaluations: ReturnType<typeof evaluateRunnerHandDevelopment>,
  instanceId: string,
) {
  const evaluation = evaluations.find(
    (candidate) => candidate.cardInstanceId === instanceId,
  );
  expect(evaluation).toBeDefined();
  return evaluation!;
}
