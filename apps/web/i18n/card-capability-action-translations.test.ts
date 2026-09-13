import { listPublicCardViews } from "@netgrid/cards/server";
import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  actionButtonLabel,
  contextualCardActionLabel,
} from "../app/action-board-ui";
import {
  CARD_CAPABILITY_ACTION_TRANSLATION_CATALOGS,
  cardCapabilityIdForAction,
} from "./card-capability-action-translations";

const EXPECTED_MULTI_CAPABILITY_CARD_COUNT = 21;
const EXPECTED_MULTI_CAPABILITY_LABEL_COUNT = 46;

describe("card capability action translations", () => {
  it("names Data Fort Remapping and its run-ending effect without needing a catalog lookup", () => {
    const capabilityId =
      "onr_classic_001_data-fort-remapping:spend_remap_counter_end_run";
    const action: LegalAction = {
      actionId: "remap_action",
      side: "corp",
      type: "activated_card_ability",
      label: "Data Fort Remapping: Run beenden",
      source: "remap_agenda",
      timingPoint: "run.approach_ice",
      costs: [],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: 5,
      abilityRef: {
        sourceCardInstanceId: "remap_agenda",
        sourceAbilityId: capabilityId,
      },
      payload: {
        cardId: "remap_agenda",
        cardImplementationAbilityId: capabilityId,
      },
    };
    const original = structuredClone(action);
    expect(actionButtonLabel(action, undefined, "de")).toBe(
      "Data Fort Remapping: Run beenden",
    );
    expect(actionButtonLabel(action, undefined, "en")).toBe(
      "Data Fort Remapping: End the run",
    );
    expect(actionButtonLabel(action, undefined, "fr")).toBe(
      "Data Fort Remapping : Mettre fin au piratage",
    );
    expect(contextualCardActionLabel(action, undefined, "en")).toBe(
      "End the run",
    );
    expect(action).toEqual(original);
  });

  it("covers every public card with multiple capability authoring labels", () => {
    const multiCapabilityCards = listPublicCardViews().filter(
      (card) => (card.capabilityText?.length ?? 0) > 1,
    );
    const capabilityLabelCount = multiCapabilityCards.reduce(
      (sum, card) => sum + (card.capabilityText?.length ?? 0),
      0,
    );

    expect(multiCapabilityCards).toHaveLength(
      EXPECTED_MULTI_CAPABILITY_CARD_COUNT,
    );
    expect(capabilityLabelCount).toBe(EXPECTED_MULTI_CAPABILITY_LABEL_COUNT);

    for (const card of multiCapabilityCards) {
      const sourceLabels = card.capabilityText ?? [];
      for (const entry of sourceLabels) {
        const capabilityId = `${card.cardDefinitionId}:${entry.capabilityKey}`;
        expect(
          CARD_CAPABILITY_ACTION_TRANSLATION_CATALOGS.en[capabilityId],
          `${capabilityId} must have an English execution label`,
        ).toBeTruthy();
        expect(
          CARD_CAPABILITY_ACTION_TRANSLATION_CATALOGS.fr[capabilityId],
          `${capabilityId} must have a French execution label`,
        ).toBeTruthy();
      }

      const distinctGermanLabels = new Set(
        sourceLabels.map((entry) => entry.actionLabel),
      );
      if (distinctGermanLabels.size < 2) continue;
      for (const locale of ["en", "fr"] as const) {
        const localizedLabels = new Set(
          sourceLabels.map(
            (entry) =>
              CARD_CAPABILITY_ACTION_TRANSLATION_CATALOGS[locale][
                `${card.cardDefinitionId}:${entry.capabilityKey}`
              ],
          ),
        );
        expect(
          localizedLabels.size,
          `${card.cardDefinitionId} must keep its distinct ${locale} actions`,
        ).toBe(distinctGermanLabels.size);
      }
    }
  });

  it("renders Broker store and cash-out actions distinctly in every locale", () => {
    const store = brokerAction(
      "store_credits",
      "Broker: 3 Credits auf Broker legen",
    );
    const withdraw = brokerAction(
      "withdraw_credits",
      "Broker: Credits von Broker nehmen",
    );

    expect(
      [store, withdraw].map((action) => actionButtonLabel(action)),
    ).toEqual([
      "Broker: 3 Credits auf Broker legen",
      "Broker: Credits von Broker nehmen",
    ]);
    expect(
      [store, withdraw].map((action) =>
        actionButtonLabel(action, undefined, "en"),
      ),
    ).toEqual([
      "Broker: place 3 credits on Broker",
      "Broker: take all credits from Broker",
    ]);
    expect(
      [store, withdraw].map((action) =>
        actionButtonLabel(action, undefined, "fr"),
      ),
    ).toEqual([
      "Broker : placer 3 crédits sur Broker",
      "Broker : prendre tous les crédits de Broker",
    ]);
    expect(
      [store, withdraw].map((action) =>
        contextualCardActionLabel(action, undefined, "en"),
      ),
    ).toEqual(["place 3 credits on Broker", "take all credits from Broker"]);
  });

  it("uses only a consistent canonical binding and leaves action identity unchanged", () => {
    const action = brokerAction(
      "store_credits",
      "Broker: 3 Credits auf Broker legen",
    );
    const original = structuredClone(action);

    expect(cardCapabilityIdForAction(action)).toBe(
      "onr_v1_154_broker:store_credits",
    );
    expect(actionButtonLabel(action, undefined, "en")).toBe(
      "Broker: place 3 credits on Broker",
    );
    expect(action).toEqual(original);

    const mismatched = {
      ...action,
      payload: {
        ...action.payload,
        cardImplementationAbilityId: "onr_v1_154_broker:withdraw_credits",
      },
    } satisfies LegalAction;
    expect(cardCapabilityIdForAction(mismatched)).toBeNull();
  });
});

function brokerAction(
  capabilityKey: "store_credits" | "withdraw_credits",
  label: string,
): LegalAction {
  const sourceAbilityId = `onr_v1_154_broker:${capabilityKey}`;
  return {
    actionId: `action:${capabilityKey}`,
    side: "runner",
    type: "activated_card_ability",
    label,
    source: "broker_1",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    abilityRef: {
      sourceCardInstanceId: "broker_1",
      sourceAbilityId,
    },
    visibility: "public",
    expiresAtStateVersion: 7,
    payload: {
      cardId: "broker_1",
      cardImplementationAbility: "activated",
      cardImplementationAbilityKey: capabilityKey,
      cardImplementationAbilityId: sourceAbilityId,
    },
  };
}
