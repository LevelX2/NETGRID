import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { buildCorpFiniteEconomyPlans } from "./tactical-plan-corp-finite-economy";
import { buildCorpTacticalPlans } from "./tactical-plan-corp-plans";

describe("Corp finite economy plans", () => {
  it("installs a reviewed finite economy asset when no pool is active", () => {
    const bbs = bbsCard("bbs-hand");
    const installRemote1 = action(
      "install-bbs-remote-1",
      "install_card",
      bbs.instanceId,
      { placement: "root", serverId: "remote_1" },
    );
    const installNewRemote = action(
      "install-bbs-new-remote",
      "install_card",
      bbs.instanceId,
      { placement: "root", serverId: "new_remote" },
    );

    const plans = buildCorpFiniteEconomyPlans({
      input: corpInput({
        hq: [bbs],
        actions: [installRemote1, installNewRemote],
      }),
    });

    expect(plans).toEqual([
      expect.objectContaining({
        planId: "corp.develop_finite_economy:bbs-hand",
        type: "corp.develop_finite_economy",
        currentStep: expect.objectContaining({
          kind: "install_finite_economy",
          actionCandidateIds: [
            "install-bbs-remote-1",
            "install-bbs-new-remote",
          ],
        }),
      }),
    ]);
  });

  it("drains an active pool before installing the next copy", () => {
    const activeBbs = bbsCard("bbs-active", {
      rezzed: true,
      counters: { bit: 12 },
    });
    const nextBbs = bbsCard("bbs-next");
    const drain = action(
      "drain-bbs",
      "activated_card_ability",
      activeBbs.instanceId,
      {
        gainCreditsAmount: 2,
        hostedCreditTakeAmount: 2,
        cardImplementationTakesHostedCredits: true,
      },
    );
    const installNext = action(
      "install-next-bbs",
      "install_card",
      nextBbs.instanceId,
      { placement: "root", serverId: "new_remote" },
    );

    const plans = buildCorpFiniteEconomyPlans({
      input: corpInput({
        hq: [nextBbs],
        root: [activeBbs],
        actions: [drain, installNext],
      }),
    });

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      planId: "corp.develop_finite_economy:bbs-active",
      priority: 890,
      currentStep: {
        kind: "drain_finite_economy",
        actionCandidateIds: ["drain-bbs"],
      },
    });
    expect(JSON.stringify(plans)).not.toContain("install-next-bbs");
  });

  it("rezzes an installed pool before trying to drain it", () => {
    const installedBbs = bbsCard("bbs-installed", {
      rezzed: false,
    });
    const rez = action("rez-bbs", "rez_ice", installedBbs.instanceId);

    const plans = buildCorpFiniteEconomyPlans({
      input: corpInput({ root: [installedBbs], actions: [rez] }),
    });

    expect(plans[0]).toMatchObject({
      currentStep: {
        kind: "rez_finite_economy",
        actionCandidateIds: ["rez-bbs"],
      },
      nextSteps: [{ kind: "drain_finite_economy" }],
    });
  });

  it("does not misclassify a root rez as an ICE-defense plan", () => {
    const setup = card("setup", "onr_v1_340_setup", "asset", {
      rezzed: false,
    });
    const rez = action("rez-setup", "rez_ice", setup.instanceId);

    const plans = buildCorpTacticalPlans({
      input: corpInput({ root: [setup], actions: [rez] }),
    });

    expect(plans.some((plan) => plan.type === "corp.rez_defense")).toBe(false);
  });
});

function corpInput(params: {
  hq?: VisibleCard[];
  root?: VisibleCard[];
  actions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-id", "corp_identity_001", "identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: params.hq ?? [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "runner_identity_001", "identity"),
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
        { id: "remote_1", label: "Remote 1", ice: [], root: params.root ?? [] },
      ],
      publicEvents: [],
      legalActions: params.actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: params.actions,
    difficulty: "normal",
    seed: "finite-economy-plan-test",
    decisionId: "finite-economy-plan-test",
    actionNumber: 1,
    profileId: "finite-economy-plan-test",
  } as AiDecisionInput;
}

function bbsCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return card(
    instanceId,
    "onr_v1_309_bbs-whispering-campaign",
    "asset",
    overrides,
  );
}

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type,
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
