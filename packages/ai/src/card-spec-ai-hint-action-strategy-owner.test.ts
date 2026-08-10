import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function actionStrategyEntry(cardId: string) {
  const entry = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (entry === undefined) throw new Error(`missing_test_card:${cardId}`);
  return {
    ...entry,
    planning: {
      ...entry.planning,
      planningAnnotations: {
        schemaVersion: "card-planning-annotations-v1" as const,
        card: [],
        capabilities: (
          entry.planning.planningAnnotations?.capabilities ?? []
        ).flatMap((capability) => {
          const annotations = capability.annotations.filter(
            (annotation) => annotation.kind === "strategy_support",
          );
          return annotations.length === 0
            ? []
            : [{ ...capability, annotations }];
        }),
      },
    },
  };
}

describe("CardSpec action-strategy typed owners", () => {
  it("compiles all 48 Originalset capability bindings from their exact owner nodes", () => {
    const entries = cardSpecPlanningCards().filter((entry) =>
      entry.definition.id.startsWith("onr_v1_"),
    );
    const bindingCount = entries.reduce(
      (count, entry) =>
        count +
        (entry.planning.planningAnnotations?.capabilities ?? []).reduce(
          (capabilityCount, capability) =>
            capabilityCount +
            capability.annotations.filter(
              (annotation) => annotation.kind === "strategy_support",
            ).length,
          0,
        ),
      0,
    );
    expect(bindingCount).toBe(48);

    for (const entry of entries) {
      const capabilityBindings = (
        entry.planning.planningAnnotations?.capabilities ?? []
      ).some((capability) =>
        capability.annotations.some(
          (annotation) => annotation.kind === "strategy_support",
        ),
      );
      if (!capabilityBindings) continue;
      expect(() =>
        deriveCardSpecAiHint(actionStrategyEntry(entry.definition.id)),
      ).not.toThrow();
    }
  });

  it("covers nested and printed trace, tag source, tagged payoff, and ice-tax clusters", () => {
    const witnesses = [
      ["onr_v1_084_edited-shipping-manifests", "tag.source"],
      ["onr_v1_207_netwatch-operations-office", "trace.source"],
      ["onr_v1_236_data-raven", "tag.source"],
      ["onr_v1_208_on-call-solo-team", "tag.payoff"],
      ["onr_v1_271_tko-2-0", "corp_ice.runner_action_loss"],
      ["onr_v1_313_city-surveillance", "tag.source"],
      ["onr_v1_299_power-grid-overload", "tag.payoff"],
    ] as const;

    for (const [cardId, evidenceAnchor] of witnesses)
      expect(
        deriveCardSpecAiHint(actionStrategyEntry(cardId))
          .actionStrategySupportPairs,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            evidence: [`tactic_signal_anchor:${evidenceAnchor}`],
          }),
        ]),
      );
  });

  it("rejects near-matching nodes that lack the asserted typed evidence", () => {
    const forged = (cardId: string, engine: Record<string, unknown>) => {
      const entry = actionStrategyEntry(cardId);
      return () =>
        deriveCardSpecAiHint({
          ...entry,
          planning: {
            ...entry.planning,
            engine: { ...entry.planning.engine, ...engine },
          },
        } as never);
    };

    const edited = actionStrategyEntry("onr_v1_084_edited-shipping-manifests");
    const editedAbility = edited.planning.engine.abilities?.[0];
    expect(
      forged("onr_v1_084_edited-shipping-manifests", {
        abilities: [
          {
            ...editedAbility,
            effects: [
              {
                kind: "make_run",
                target: { kind: "central_server", server: "hq" },
                visibility: "public",
              },
            ],
          },
        ],
      }),
    ).toThrow("card_spec_action_strategy_binding_mismatch");

    const netwatch = actionStrategyEntry(
      "onr_v1_207_netwatch-operations-office",
    );
    const traceAbility = netwatch.planning.engine.abilities?.[0];
    expect(
      forged("onr_v1_207_netwatch-operations-office", {
        abilities: [
          {
            ...traceAbility,
            effects: [
              {
                kind: "trace",
                traceLimit: 2,
                onSuccess: [],
                visibility: "public",
              },
            ],
          },
        ],
      }),
    ).toThrow("card_spec_action_strategy_binding_mismatch");

    const solo = actionStrategyEntry("onr_v1_208_on-call-solo-team");
    const damageAbility = solo.planning.engine.abilities?.[0];
    expect(
      forged("onr_v1_208_on-call-solo-team", {
        abilities: [{ ...damageAbility, condition: undefined }],
      }),
    ).toThrow("card_spec_action_strategy_binding_mismatch");

    expect(
      forged("onr_v1_313_city-surveillance", {
        remainingReplacementLongtail: {
          kind: "runner_run_lock_actions",
          amount: 1,
          visibility: "public",
        },
      }),
    ).toThrow("card_spec_action_strategy_capability_missing");
  });
});
