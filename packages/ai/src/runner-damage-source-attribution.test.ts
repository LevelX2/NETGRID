import { readFileSync } from "node:fs";
import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type { PublicGameEvent } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "./ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "./input-dto";
import { restoreAiRuntimeCheckpoint } from "./evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import { runnerDamageThreatAssessment } from "./runner-damage-threat-assessment";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r10-corp-ice-damage.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
afterEach(resetResidentPlanPortfolioMemory);
describe("public damage source attribution", () => {
  it("recognizes Corp ICE damage during a Runner continuation and funds hand safety through its owner", () => {
    const cp = fixture();
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    expect(runnerDamageThreatAssessment(input)).toMatchObject({
      deckBelief: { resolvedCorpDamageEvents: 1 },
      flatlineRisk: {
        recommendedHandFloor: 4,
        recentResolvedCorpDamageAmount: 4,
      },
    });
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("r8");
    expect(
      decision.decisionDebug?.planFirstDecision?.portfolio.find(
        (instance) => instance.instanceId === decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      )?.moduleId,
    ).toBe("runner.defense_and_recovery");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      input.legalActions.some((a: { actionId: string }) => a.actionId === decision.actionId),
    ).toBe(true);
  });
  it.each(["runner_source", "unknown_source", "no_damage"])(
    "does not infer Corp damage from %s",
    (condition) => {
      const cp = fixture();
      for (const events of [
        cp.input.eventTail,
        cp.input.playerView.publicEvents,
      ] as PublicGameEvent[][]) {
        const event = events.find((entry) => entry.eventId === 81);
        if (!event?.publicPayload.resolvedEffects)
          throw new Error("Native damage event lacks its resolved effects");
        const payload = event.publicPayload;
        const effects = event.publicPayload.resolvedEffects;
        expect(payload).toMatchObject({ sourceDefinitionId: 490, damageAmount: 4 });
        if (condition === "no_damage") {
          delete payload.damageAmount;
          delete payload.damageResolved;
          delete payload.damageType;
          delete payload.effectKind;
          payload.resolvedEffects = effects.filter((effect) => effect.kind !== "damage");
        } else {
          payload.sourceDefinitionId =
            condition === "runner_source"
              ? 307
              : syntheticCardDefinitionId("unknown-damage-source");
          for (const effect of effects)
            effect.sourceDefinitionId = payload.sourceDefinitionId;
        }
      }
      const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      expect(
        runnerDamageThreatAssessment(input).deckBelief.resolvedCorpDamageEvents,
      ).toBe(0);
    },
  );
});
