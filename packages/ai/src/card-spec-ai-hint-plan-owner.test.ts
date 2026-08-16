import {
  cardSpecPlanningCards,
  KNOWN_PLANNING_PLAN_OWNERS,
  KNOWN_PLANNING_PLAN_OWNER_ROUTES,
} from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import {
  AI_ACTION_PLAN_OWNERS,
  AI_ACTION_PLAN_OWNER_ROUTES,
} from "./ai-hint-contracts";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function entry(cardId: string) {
  const result = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (result === undefined) throw new Error(`missing_test_card:${cardId}`);
  return result;
}

describe("capability-bound CardSpec plan owners", () => {
  it("keeps the catalog-safe AI vocabulary exactly aligned with Cards planning", () => {
    expect(AI_ACTION_PLAN_OWNERS).toEqual(KNOWN_PLANNING_PLAN_OWNERS);
    expect(AI_ACTION_PLAN_OWNER_ROUTES).toEqual(
      KNOWN_PLANNING_PLAN_OWNER_ROUTES,
    );
  });

  it("projects all current bindings deterministically from exact capabilities", () => {
    const broker = deriveCardSpecAiHint(entry("onr_v1_154_broker"));
    expect(broker.actionPlanOwnerBindings).toEqual([
      {
        capabilityKey: "store_credits",
        owner: "runner.credit_bank",
        route: "build",
      },
      {
        capabilityKey: "withdraw_credits",
        owner: "runner.credit_bank",
        route: "cash_out",
      },
    ]);
    expect(
      deriveCardSpecAiHint(entry("onr_v1_178_short-term-contract"))
        .actionPlanOwnerBindings,
    ).toEqual([
      {
        capabilityKey: "abilities_activated_runner_main_take_hosted_credits",
        owner: "runner.credit_bank",
        route: "cash_out",
      },
    ]);
    expect(
      deriveCardSpecAiHint(entry("onr_v1_168_loan-from-chiba"))
        .actionPlanOwnerBindings,
    ).toEqual([
      {
        capabilityKey: "trash_at_end_of_turn",
        owner: "runner.resource_lifecycle",
      },
    ]);
    expect(
      deriveCardSpecAiHint(entry("onr_v1_197_data-fort-reclamation"))
        .actionPlanOwnerBindings,
    ).toEqual([
      {
        capabilityKey: "hq_to_new_remote_install_rez",
        owner: "corp.score_agenda",
      },
    ]);
  });

  it("rejects missing, duplicate annotation, and duplicate mechanical owners", () => {
    const broker = entry("onr_v1_154_broker");
    const forgedMissing = {
      ...broker,
      planning: {
        ...broker.planning,
        planningAnnotations: {
          schemaVersion: "card-planning-annotations-v1",
          card: [],
          capabilities: [
            {
              capabilityKey: "forged_missing_capability",
              annotations: [
                {
                  kind: "plan_owner",
                  owner: "runner.credit_bank",
                  route: "build",
                },
              ],
            },
          ],
        },
      },
    };
    expect(() => deriveCardSpecAiHint(forgedMissing as never)).toThrow(
      "card_spec_plan_owner_capability_missing",
    );

    const brokerCapabilities =
      broker.planning.planningAnnotations?.capabilities ?? [];
    const forgedDuplicateAnnotation = {
      ...broker,
      planning: {
        ...broker.planning,
        planningAnnotations: {
          schemaVersion: "card-planning-annotations-v1",
          card: [],
          capabilities: brokerCapabilities.map((capability) =>
            capability.capabilityKey === "store_credits"
              ? {
                  ...capability,
                  annotations: [
                    ...capability.annotations,
                    ...capability.annotations.filter(
                      (annotation) => annotation.kind === "plan_owner",
                    ),
                  ],
                }
              : capability,
          ),
        },
      },
    };
    expect(() =>
      deriveCardSpecAiHint(forgedDuplicateAnnotation as never),
    ).toThrow("card_spec_plan_owner_duplicate");

    const abilities = broker.planning.engine.abilities ?? [];
    const storeAbility = abilities.find(
      (ability) => ability.capabilityKey === "store_credits",
    );
    expect(storeAbility).toBeDefined();
    const forgedDuplicateNode = {
      ...broker,
      planning: {
        ...broker.planning,
        engine: {
          ...broker.planning.engine,
          abilities: [...abilities, { ...storeAbility }],
        },
      },
    };
    expect(() => deriveCardSpecAiHint(forgedDuplicateNode as never)).toThrow(
      "card_spec_plan_owner_capability_duplicate",
    );
  });
});
