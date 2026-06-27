import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { semanticRuntimeCorpPassiveScoreLinePenalty } from "./semantic-runtime-corp-passive-scoreline";

describe("semanticRuntimeCorpPassiveScoreLinePenalty", () => {
  it("does not punish economy when every terminal scoreline action is risky", () => {
    const installScoreline = corpAction("install-scoreline", "install_card");
    const gainCredit = corpAction("gain-credit", "gain_credit");

    const penalty = semanticRuntimeCorpPassiveScoreLinePenalty(
      corpInput([installScoreline, gainCredit]),
      gainCredit,
      testDependencies({
        agendaInstallActionIds: [installScoreline.actionId],
        riskyActionIds: [installScoreline.actionId],
      }),
    );

    expect(penalty).toBeUndefined();
  });

  it("still punishes economy when a real score action is available", () => {
    const scoreAgenda = corpAction("score-agenda", "score_agenda");
    const installScoreline = corpAction("install-scoreline", "install_card");
    const gainCredit = corpAction("gain-credit", "gain_credit");

    const penalty = semanticRuntimeCorpPassiveScoreLinePenalty(
      corpInput([scoreAgenda, installScoreline, gainCredit]),
      gainCredit,
      testDependencies({
        scoreActionIds: [scoreAgenda.actionId],
        agendaInstallActionIds: [installScoreline.actionId],
        riskyActionIds: [installScoreline.actionId],
      }),
    );

    expect(penalty).toEqual(
      expect.objectContaining({
        key: "corp_passive_scoreline_available",
        value: -2400,
        reason: "economy",
      }),
    );
  });

  it("uses structured roles for passive scoreline economy actions", () => {
    const scoreAgenda = corpAction("score-agenda", "score_agenda");
    const structuredEconomy = corpAction("structured-economy", "play_operation");
    const noiseEconomy = corpAction("noise-economy", "play_operation");

    expect(
      semanticRuntimeCorpPassiveScoreLinePenalty(
        corpInput([scoreAgenda, structuredEconomy]),
        structuredEconomy,
        testDependencies({
          scoreActionIds: [scoreAgenda.actionId],
          rolesByActionId: {
            [structuredEconomy.actionId]: ["economy_asset"],
          },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        reason: "economy",
        value: -2400,
      }),
    );
    expect(
      semanticRuntimeCorpPassiveScoreLinePenalty(
        corpInput([scoreAgenda, noiseEconomy]),
        noiseEconomy,
        testDependencies({
          scoreActionIds: [scoreAgenda.actionId],
          rolesByActionId: {
            [noiseEconomy.actionId]: ["microeconomy_noise"],
          },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        reason: "non_score_action",
        value: -700,
      }),
    );
  });
});

function corpInput(legalActions: readonly LegalAction[]): AiDecisionInput {
  return {
    side: "corp",
    legalActions,
    playerView: {
      own: {
        credits: 4,
      },
      legalActions,
    },
  } as unknown as AiDecisionInput;
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    costs: [],
    payload: {},
  } as unknown as LegalAction;
}

function testDependencies(
  overrides: {
    scoreActionIds?: readonly string[];
    advanceToScoreActionIds?: readonly string[];
    agendaInstallActionIds?: readonly string[];
    riskyActionIds?: readonly string[];
    rolesByActionId?: Readonly<Record<string, readonly string[]>>;
  } = {},
) {
  return {
    scoreTerminalWindow: () => ({
      terminalWindow: true,
      scoreActionIds: overrides.scoreActionIds ?? [],
      advanceToScoreActionIds: overrides.advanceToScoreActionIds ?? [],
      agendaInstallActionIds: overrides.agendaInstallActionIds ?? [],
    }),
    actionIsScoreLine: () => false,
    rolesForAction: (_input: AiDecisionInput, action: LegalAction) =>
      [...(overrides.rolesByActionId?.[action.actionId] ?? [])],
    scoreLineActionIsRisky: (_input: AiDecisionInput, action: LegalAction) =>
      overrides.riskyActionIds?.includes(action.actionId) === true,
  };
}
