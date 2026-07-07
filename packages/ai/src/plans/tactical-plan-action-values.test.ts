import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { legalActionCreditGainForPlan } from "./tactical-plan-action-values";

describe("legalActionCreditGainForPlan", () => {
  it("uses structured credit payloads and ignores label-only amounts", () => {
    const input = { side: "runner", playerView: {} } as AiDecisionInput;
    const dependencies = {
      aiHintsByCard: new Map(),
      visibleCardForAction: () => undefined,
    };

    expect(
      legalActionCreditGainForPlan(
        input,
        legalAction({ payload: { gainCreditsAmount: 5 } }),
        dependencies,
      ),
    ).toBe(5);
    expect(
      legalActionCreditGainForPlan(
        input,
        legalAction({
          label: "Resource: 7 Credits nehmen",
          payload: { cardImplementationAbilityLabel: "Gain 7 Credits" },
        }),
        dependencies,
      ),
    ).toBe(0);
    expect(
      legalActionCreditGainForPlan(
        input,
        legalAction({ payload: { gainCreditsAmount: 5 } }),
        {
          ...dependencies,
          visibleCardForAction: () =>
            ({
              counters: { bit: 2 },
              counterDisplays: [
                {
                  displayKind: "stored_credits",
                  amount: 2,
                },
              ],
            }) as VisibleCard,
        },
      ),
    ).toBe(2);
  });

  it("does not give default gain value to non-credit gain_credit wrappers", () => {
    const input = { side: "corp", playerView: {} } as AiDecisionInput;
    const dependencies = {
      aiHintsByCard: new Map(),
      visibleCardForAction: () => undefined,
    };

    expect(
      legalActionCreditGainForPlan(
        input,
        legalAction({
          side: "corp",
          type: "gain_credit",
          source: "basic_action",
        }),
        dependencies,
      ),
    ).toBe(1);
    expect(
      legalActionCreditGainForPlan(
        input,
        legalAction({
          side: "corp",
          type: "gain_credit",
          source: "scored-security-directors",
          payload: {
            abilityFamily: "hidden-zone",
            effectKind: "hidden_zone",
            agendaAbility: "v1919_scored_agenda_reveal_rd_top",
          },
        }),
        dependencies,
      ),
    ).toBe(0);
  });
});

function legalAction(
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: "runner-credit-action",
    side: "runner",
    type: "trigger_ability",
    label: "Runner economy",
    source: "runner-source",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}
