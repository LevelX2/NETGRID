import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildCorpPersistentEconomyPlans } from "./tactical-plan-corp-persistent-economy";

describe("Corp persistent economy plans", () => {
  it.each([
    "onr_v1_314_corporate-negotiating-center",
    "onr_v1_321_esa-contract",
  ])(
    "activates installed zero-cost support %s before passive actions",
    (definitionId) => {
      const asset = card("installed-support", definitionId, {
        rezzed: false,
        rezCost: 0,
      });
      const rez = action("rez-support", "rez_ice", asset.instanceId);
      const draw = action("basic-draw", "draw_card", "game_rule");
      const plans = buildCorpPersistentEconomyPlans({
        input: corpInput([asset], [rez, draw]),
      });

      expect(plans).toEqual([
        expect.objectContaining({
          type: "corp.activate_persistent_economy",
          priority: 930,
          currentStep: expect.objectContaining({
            kind: "rez_persistent_economy",
            actionCandidateIds: ["rez-support"],
          }),
          evidence: expect.arrayContaining([
            "corp_persistent_economy_zero_cost_activation:true",
          ]),
        }),
      ]);
      expect(plans[0]?.currentStep.actionCandidateIds).not.toContain(
        "basic-draw",
      );
    },
  );

  it("uses a rezzed persistent draw engine through its own legal ability", () => {
    const esa = card("esa-active", "onr_v1_321_esa-contract", {
      rezzed: true,
      rezCost: 0,
    });
    const use = action("use-esa", "activated_card_ability", esa.instanceId, {
      drawAmount: 2,
    });
    const plans = buildCorpPersistentEconomyPlans({
      input: corpInput([esa], [use]),
    });

    expect(plans[0]).toMatchObject({
      type: "corp.activate_persistent_economy",
      currentStep: {
        kind: "use_persistent_economy",
        actionCandidateIds: ["use-esa"],
      },
    });
  });

  it("does not force repeated draw-engine use when fewer than two hand slots remain", () => {
    const esa = card("esa-active", "onr_v1_321_esa-contract", {
      rezzed: true,
      rezCost: 0,
    });
    const use = action("use-esa", "activated_card_ability", esa.instanceId, {
      drawAmount: 2,
    });
    const input = corpInput([esa], [use]);
    input.playerView.own.gripOrHq = Array.from({ length: 4 }, (_, index) =>
      card(`hq-${index + 1}`, `hq-card-${index + 1}`, { type: "operation" }),
    );

    expect(buildCorpPersistentEconomyPlans({ input })).toEqual([]);
  });

  it("leaves finite BBS pools under the finite-economy owner", () => {
    const bbs = card("bbs", "onr_v1_309_bbs-whispering-campaign", {
      rezzed: false,
      rezCost: 0,
      counters: { bit: 12 },
    });
    const rez = action("rez-bbs", "rez_ice", bbs.instanceId);

    expect(
      buildCorpPersistentEconomyPlans({ input: corpInput([bbs], [rez]) }),
    ).toEqual([]);
  });
});

function corpInput(
  root: VisibleCard[],
  actions: LegalAction[],
): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-id", "corp_identity_001", { type: "identity" }),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "runner_identity_001", {
          type: "identity",
        }),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
        { id: "remote_1", label: "Remote 1", ice: [], root },
      ],
      publicEvents: [],
      legalActions: actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: actions,
    difficulty: "normal",
    seed: "persistent-economy-plan-test",
    decisionId: "persistent-economy-plan-test",
    actionNumber: 1,
    profileId: "persistent-economy-plan-test",
  } as AiDecisionInput;
}

function card(
  instanceId: string,
  definitionId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type: "asset",
    known: true,
    owner: "corp",
    controller: "corp",
    ...overrides,
  } as VisibleCard;
}

function action(
  actionId: string,
  type: LegalAction["type"],
  source: string,
  payload: Record<string, string | number | boolean> = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    source,
    payload: { cardId: source, ...payload },
    costs: [{ clicks: type === "rez_ice" ? 0 : 1, credits: 0 }],
    stateVersion: 1,
    expiresAtStateVersion: 1,
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    targetRequirements: [],
  } as unknown as LegalAction;
}
