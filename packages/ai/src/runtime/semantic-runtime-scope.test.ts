import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { semanticRuntimeScopeForAction } from "./semantic-runtime-scope";

describe("semanticRuntimeScopeForAction", () => {
  it("does not route non-credit gain_credit wrappers through economy scope", () => {
    expect(scopeFor(corpAction("basic-credit", "gain_credit"))).toBe(
      "basic_economy_draw",
    );
    expect(
      scopeFor(
        corpAction("reveal-rd-top", "gain_credit", {
          abilityFamily: "hidden-zone",
          effectKind: "hidden_zone",
          agendaAbility: "v1919_scored_agenda_reveal_rd_top",
        }),
        {
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: ["card_ability.trigger", "zone.reveal"],
        },
      ),
    ).toBe("corp_legal_action");
    expect(scopeFor(corpAction("draw", "draw_card"))).toBe(
      "basic_economy_draw",
    );
  });
});

function scopeFor(
  action: LegalAction,
  candidateOverrides: Partial<ActionSemanticCandidate> = {},
): string {
  const candidate =
    Object.keys(candidateOverrides).length > 0
      ? ({
          actionId: action.actionId,
          actionType: action.type,
          actorSide: action.side,
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: [],
          ...candidateOverrides,
        } as ActionSemanticCandidate)
      : undefined;
  return semanticRuntimeScopeForAction(
    { side: "corp" } as AiDecisionInput,
    action,
    candidate,
    {
      isRemoteServerTarget: () => false,
      runnerSourceCardAnswerRole: () => undefined,
    },
  );
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source: type === "gain_credit" ? "basic_action" : "test",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...(Object.keys(payload).length > 0 ? { payload } : {}),
  };
}
