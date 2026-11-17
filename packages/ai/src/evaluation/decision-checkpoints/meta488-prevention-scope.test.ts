import { createGameAfterSetup } from "@netgrid/engine";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type PublicGameEvent,
} from "@netgrid/shared";
import {
  removeEverywhere,
  toRunnerTurn,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { runnerEffectsDamagePreventionTypes } from "../../runner-canonical-hint-semantics";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
import {
  installAction,
  runnerInput,
  visibleCard,
} from "../../runner-hand-development.test-support";

const ARMORED_FRIDGE = 333;
const SCORE = 320;
const BRAIN_WASH = 69;
const WORM = 286;
const HQ_INTERFACE = 341;
const HAND = [373, 366, SCORE, 228, ARMORED_FRIDGE];

function nativeInput(damageType: "meat" | "core") {
  const runnerDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.runner,
    cards: [
      ...[...HAND, WORM, HQ_INTERFACE].map((id) => ({ id, quantity: 1 })),
      { id: 595, quantity: 2 },
    ],
  };
  const corpDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.corp,
    cards: [
      ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
        (card) => card.id !== BRAIN_WASH,
      ),
      { id: BRAIN_WASH, quantity: 1 },
    ],
  };
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed: "damaged-hand-prevention:" + damageType,
      runnerDeck,
      corpDeck,
    }),
  );
  const builder = RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(7)
    .withRunnerClicks(1)
    .withCorpCredits(12)
    .withRunnerProgramInstalled(WORM)
    .withRezzedCorpIceOnServer("hq", BRAIN_WASH);
  for (const definitionId of HAND) builder.withRunnerCardInGrip(definitionId);
  const hqInterface = Object.values(state.cardInstances).find(
    (card) => card.definitionId === HQ_INTERFACE,
  )!;
  removeEverywhere(state, hqInterface.instanceId);
  state.runner.rig.hardware.push(hqInterface.instanceId);
  hqInterface.zone = { side: "runner", zone: "rig" };
  hqInterface.faceup = true;
  hqInterface.rezzed = true;
  state.runner.coreDamage = 2;

  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "damaged-hand-prevention",
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  const observation = damageObservation(damageType);
  input.eventTail = [observation];
  input.playerView.publicEvents = [observation];
  const fridge = input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === ARMORED_FRIDGE,
  )!;
  const fridgeInstall = input.legalActions.find(
    (action) =>
      action.type === "install_card" && action.source === fridge.instanceId,
  );
  if (!fridgeInstall) throw new Error("Missing legal Armored Fridge install");
  return { input, fridgeInstall };
}

function preventionInput(
  definitionId: number,
  damageType: "net" | "meat" | "core",
) {
  const meatOnly = definitionId === 333;
  const card = visibleCard("prevention", {
    definitionId,
    type: meatOnly ? "hardware" : "program",
    installCost: meatOnly ? 3 : 0,
    ...(meatOnly ? {} : { memoryCost: 1 }),
  });
  const input = runnerInput({
    credits: 5,
    hand: [
      card,
      visibleCard("expensive-sentry", {
        definitionId: 278,
        type: "program",
        installCost: 10,
        memoryCost: 1,
      }),
      visibleCard("expensive-economy", {
        definitionId: 223,
        type: "program",
        installCost: 7,
        memoryCost: 1,
      }),
      visibleCard("expensive-wall", {
        definitionId: 233,
        type: "program",
        installCost: 6,
        memoryCost: 1,
      }),
    ],
    memoryUsed: 0,
    memoryLimit: 4,
    legalActions: [installAction("install-prevention", card, meatOnly ? 3 : 0)],
  });
  const event = damageObservation(damageType);
  input.eventTail = [event];
  input.playerView.publicEvents = [event];
  return input;
}

function damageObservation(
  damageType: "net" | "meat" | "core",
): PublicGameEvent {
  const source = damageType === "meat" ? 519 : damageType === "core" ? 69 : 79;
  return {
    eventId: 2,
    type: "damage_resolved",
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: "fnv1a:prevention",
    visibilityClass: "public",
    publicPayload: {
      actor: "corp",
      targetSide: "runner",
      sourceDefinitionId: source,
      damageType,
      damageAmount: 1,
      damageResolved: true,
    },
  };
}

describe("type-bound prevention development", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("does not execute Meat-only defense against a current public Core threat", () => {
    const { input, fridgeInstall } = nativeInput("core");
    expect(runnerDamageThreatAssessment(input).flatlineRisk.level).toBe(
      "confirmed",
    );
    const evaluation = evaluateRunnerHandDevelopment({
      input: input,
    }).find((e) => e.definitionId === 333);
    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "none",
      deferReason: "no_current_need",
    });
    const result = chooseAiAction(input);
    const chosen = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    );
    expect(
      input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === chosen?.source,
      )?.definitionId,
    ).toBe(SCORE);
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.defense_and_recovery");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
    ).toContain("build_reaction_reserve");
    expect(result.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: fridgeInstall.actionId,
          ownerModuleId: "runner.defense_and_recovery",
          disposition: "explicitly_nonproductive",
        }),
      ]),
    );
  });

  it.each(["net", "core"] as const)(
    "keeps the general %s hand buffer while rejecting Fridge",
    (type) => {
      const input = preventionInput(333, type);
      expect(runnerDamageThreatAssessment(input).flatlineRisk.level).toBe(
        "confirmed",
      );
      expect(
        evaluateRunnerHandDevelopment({ input }).find(
          (e) => e.definitionId === 333,
        ),
      ).toMatchObject({ currentNeed: "none" });
    },
  );

  it("retains a real Meat prevention need", () => {
    const { input, fridgeInstall } = nativeInput("meat");
    expect(
      evaluateRunnerHandDevelopment({ input }).find(
        (e) => e.definitionId === 333,
      ),
    ).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "acute",
      deferReason: "none",
    });
    const result = chooseAiAction(input);
    expect(result.actionId).toBe(fridgeInstall.actionId);
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.defense_and_recovery");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
    ).toContain("install_defense_support");
  });

  it.each(["net", "core"] as const)(
    "retains Force Shield's canonical %s scope",
    (type) => {
      const input = preventionInput(240, type);
      expect(
        evaluateRunnerHandDevelopment({ input }).find(
          (e) => e.definitionId === 240,
        ),
      ).toMatchObject({ currentNeed: "acute", deferReason: "none" });
    },
  );

  it("rejects Force Shield for pure Meat and consumes every generated scope", () => {
    const input = preventionInput(240, "meat");
    expect(
      evaluateRunnerHandDevelopment({ input }).find(
        (e) => e.definitionId === 240,
      )?.currentNeed,
    ).toBe("none");
    expect(
      runnerEffectsDamagePreventionTypes(AI_HINTS_BY_CARD.get(240)?.effects),
    ).toEqual(["core", "net"]);
    for (const hint of AI_HINTS_BY_CARD.values())
      expect(() =>
        runnerEffectsDamagePreventionTypes(hint.effects),
      ).not.toThrow();
  });
});
