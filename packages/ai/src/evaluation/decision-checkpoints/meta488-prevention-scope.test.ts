import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { runnerEffectsDamagePreventionTypes } from "../../runner-canonical-hint-semantics";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
import {
  installAction,
  runnerInput,
  visibleCard,
} from "../../runner-hand-development.test-support";

function capture() {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta488-g24-d82-prevention.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  return {
    ...fixture,
    input: { ...fixture.input, ...buildAiDecisionInputDto(fixture.input) },
  };
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
  const source =
    damageType === "meat"
      ? 519
      : damageType === "core"
        ? 69
        : 79;
  const event: PublicGameEvent = {
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
  input.eventTail = [event];
  input.playerView.publicEvents = [event];
  return input;
}

describe("type-bound prevention development", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("does not execute Meat-only defense against the original public Core threat", () => {
    const fixture = capture();
    expect(Object.values(fixture.validation).every(Boolean)).toBe(true);
    restoreAiRuntimeCheckpoint(
      fixture.input,
      fixture.input.ownDeckSnapshot!.deckSnapshotId,
      fixture.runtime,
    );
    expect(runnerDamageThreatAssessment(fixture.input).flatlineRisk.level).toBe(
      "confirmed",
    );
    const evaluation = evaluateRunnerHandDevelopment({
      input: fixture.input,
    }).find((e) => e.definitionId === 333);
    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "none",
      deferReason: "no_current_need",
    });
    const result = chooseAiAction(fixture.input);
    const chosen = fixture.input.legalActions.find(
      (a) => a.actionId === result.actionId,
    );
    expect(chosen?.source).toBe("runner_320_1");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.defense_and_recovery");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
    ).toContain("build_reaction_reserve");
    expect(result.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: expect.stringContaining("armored-fridge"),
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
    // Controlled public-history variant of the native frame; LegalActions,
    // generated hints, costs, doctrine and the actor's own cards stay exact.
    const { input } = capture();
    const version = input.playerView.stateVersion;
    const meat: PublicGameEvent = {
      eventId: version - 1 + 1,
      type: "damage_resolved",
      stateVersionBefore: version - 2,
      stateVersionAfter: version - 1,
      stateHashAfter: "fnv1a:controlled-meat",
      visibilityClass: "public",
      publicPayload: {
        actor: "corp",
        targetSide: "runner",
        damageType: "meat",
        sourceDefinitionId: 519,
        damageAmount: 1,
        damageResolved: true,
      },
    };
    input.eventTail.push(meat);
    input.playerView.publicEvents.push(meat);
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
    expect(result.actionId).toContain(
      "install_card.runner_onr_v1_121_armored-fridge",
    );
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
      runnerEffectsDamagePreventionTypes(
        AI_HINTS_BY_CARD.get(240)?.effects,
      ),
    ).toEqual(["core", "net"]);
    for (const hint of AI_HINTS_BY_CARD.values())
      expect(() =>
        runnerEffectsDamagePreventionTypes(hint.effects),
      ).not.toThrow();
  });
});
