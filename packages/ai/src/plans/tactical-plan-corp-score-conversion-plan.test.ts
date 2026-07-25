import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { mapPlanStepToLegalActions } from "../tactical-plans";
import { buildCorpTacticalPlans } from "./tactical-plan-corp-plans";

describe("Corp score-conversion TacticalPlan integration", () => {
  it("keeps a visible agenda scoreline as a multi-turn plan without semantic candidate hints", () => {
    const agenda = card("retreat", "onr_v1_050_corporate-retreat", "agenda", {
      advancementRequirement: 4,
    });
    const supportAsset = card("support", "simple_asset", "asset");
    const install = legalAction("install-retreat", "install_card", "retreat", {
      serverId: "remote_1",
      placement: "root",
    });

    const plan = buildCorpTacticalPlans({
      input: corpInput(agenda, supportAsset, [install], 3, 4),
    }).find(
      (entry) => entry.planId === "corp.create_score_window:install-retreat",
    );

    expect(plan).toMatchObject({
      type: "corp.create_score_window",
      horizonTurns: 3,
      target: { kind: "server", id: "remote_1" },
    });
  });

  it("does not promote a scoreline-support asset install to an agenda score-window target", () => {
    const agenda = card("agenda", "simple_agenda", "agenda");
    const vapor = card("vapor", "onr_v1_347_vapor-ops", "asset");
    const installVapor = legalAction(
      "install-vapor",
      "install_card",
      vapor.instanceId,
      { serverId: "remote_1", placement: "root" },
    );
    const input = corpInput(agenda, vapor, [installVapor]);
    input.playerView.own.gripOrHq = [vapor];
    input.playerView.servers.find((server) => server.id === "remote_1")!.root =
      [];
    const candidates = buildActionSemanticCandidates({
      legalActions: [installVapor],
      observerSide: "corp",
      stateVersion: 1,
      visibleSourceDefinitionsByInstanceId: {
        [vapor.instanceId]: vapor.definitionId!,
      },
    });

    const plans = buildCorpTacticalPlans({ input, candidates });

    expect(
      plans.some(
        (plan) =>
          plan.type === "corp.create_score_window" &&
          plan.currentStep.actionCandidateIds.includes(installVapor.actionId),
      ),
    ).toBe(false);
  });

  it("projects a reviewed advancement operation that becomes legal after agenda installation", () => {
    const agenda = card("zurich", "onr_proteus_008_project-zurich", "agenda", {
      advancementRequirement: 3,
    });
    const layoffs = card(
      "layoffs",
      "onr_v1_304_systematic-layoffs",
      "operation",
      { playCost: { kind: "fixed", credits: 5 } },
    );
    const vapor = card("vapor", "onr_v1_347_vapor-ops", "asset", {
      advancementCounters: 0,
      rezzed: true,
    });
    const install = legalAction("install", "install_card", agenda.instanceId, {
      serverId: "remote_1",
      placement: "root",
    });
    const beforeInstall = corpInput(agenda, vapor, [install], 3, 9, [layoffs]);

    const plan = buildCorpTacticalPlans({ input: beforeInstall }).find(
      (entry) => entry.planId === "corp.create_score_window:conversion:zurich",
    );

    expect(plan).toMatchObject({
      status: "active",
      currentStep: { actionCandidateIds: ["install"] },
    });
    expect(plan?.nextSteps.map((step) => step.kind)).toEqual([
      "convert_advancement",
      "advance_score_card",
      "score_agenda",
    ]);
    expect(plan?.nextSteps[0]?.rationale).toContain(
      "score_conversion:projected_from_visible_hand",
    );

    const installedAgenda = { ...agenda, advancementCounters: 0 };
    const playLayoffs = legalAction(
      "play-layoffs",
      "play_operation",
      layoffs.instanceId,
      {
        scoreConversionCapability: "place_advancement",
        scoreConversionAdvancementAmount: 2,
        scoreConversionAdvancementMode: "any_combination",
      },
    );
    playLayoffs.costs = [{ clicks: 1, credits: 5 }];
    const afterInstall = corpInput(
      layoffs,
      vapor,
      [playLayoffs],
      2,
      9,
      [],
      installedAgenda,
    );
    const followupPlan = buildCorpTacticalPlans({ input: afterInstall }).find(
      (entry) => entry.planId === "corp.create_score_window:conversion:zurich",
    );
    expect(followupPlan?.currentStep).toMatchObject({
      kind: "convert_advancement",
      actionCandidateIds: ["play-layoffs"],
    });
  });

  it("selects an unprotected agenda install only for a complete conversion", () => {
    const agenda = card("agenda", "simple_agenda", "agenda", {
      advancementRequirement: 3,
    });
    const vapor = card("vapor", "onr_v1_347_vapor-ops", "asset", {
      advancementCounters: 3,
      rezzed: true,
    });
    const actions = [
      legalAction("install", "install_card", agenda.instanceId, {
        serverId: "new_remote",
        placement: "root",
      }),
      legalAction("transfer", "activated_card_ability", vapor.instanceId, {
        scoreConversionCapability: "move_advancement",
        scoreConversionAdvancementMaximum: "all",
        scoreConversionSourceMode: "source_card",
        scoreConversionTargetMode: "chosen_installed_advanceable_card",
        scoreConversionTiming: "immediate",
      }),
    ];
    const input = corpInput(agenda, vapor, actions);
    const candidates = buildActionSemanticCandidates({
      legalActions: actions,
      observerSide: "corp",
      stateVersion: 1,
      visibleSourceDefinitionsByInstanceId: {
        [agenda.instanceId]: agenda.definitionId!,
        [vapor.instanceId]: vapor.definitionId!,
      },
    });

    const plan = buildCorpTacticalPlans({ input, candidates }).find((entry) =>
      entry.evidence.includes("corp_score_sequence:same_turn_conversion"),
    );

    expect(plan).toMatchObject({
      type: "corp.create_score_window",
      status: "active",
      target: { kind: "card", id: agenda.instanceId },
      blockers: [],
      currentStep: {
        kind: "install_or_prepare_agenda",
        actionCandidateIds: ["install"],
      },
    });
    expect(
      mapPlanStepToLegalActions(
        plan!,
        plan!.currentStep,
        candidates,
        input,
      ).legalActions.map((action) => action.actionId),
    ).toEqual(["install"]);
  });

  it("does not create the conversion override for an incomplete path", () => {
    const agenda = card("agenda", "simple_agenda", "agenda", {
      advancementRequirement: 4,
    });
    const vapor = card("vapor", "onr_v1_347_vapor-ops", "asset", {
      advancementCounters: 2,
      rezzed: true,
    });
    const actions = [
      legalAction("install", "install_card", agenda.instanceId, {
        serverId: "new_remote",
        placement: "root",
      }),
      legalAction("transfer", "activated_card_ability", vapor.instanceId, {
        scoreConversionCapability: "move_advancement",
        scoreConversionAdvancementMaximum: "all",
        scoreConversionSourceMode: "source_card",
        scoreConversionTargetMode: "chosen_installed_advanceable_card",
        scoreConversionTiming: "immediate",
      }),
    ];
    const input = corpInput(agenda, vapor, actions, 2, 0);

    expect(
      buildCorpTacticalPlans({ input }).some((entry) =>
        entry.evidence.includes("corp_score_sequence:same_turn_conversion"),
      ),
    ).toBe(false);
  });
});

function corpInput(
  agenda: VisibleCard,
  vapor: VisibleCard,
  actions: LegalAction[],
  clicks = 2,
  credits = 0,
  extraHq: VisibleCard[] = [],
  installedAgenda?: VisibleCard,
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
        identity: card("corp-id", "corp_identity_001", "identity"),
        credits,
        clicks,
        agendaPoints: 0,
        gripOrHq: [agenda, ...extraHq],
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
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [vapor, ...(installedAgenda ? [installedAgenda] : [])],
        },
      ],
      publicEvents: [],
      legalActions: actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: actions,
    difficulty: "normal",
    seed: "conversion-plan-test",
    decisionId: "conversion-plan-test",
    actionNumber: 1,
    profileId: "conversion-plan-test",
  } as AiDecisionInput;
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

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  cardId: string,
  payload: Record<string, string | number | boolean>,
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    source: cardId,
    label: actionId,
    costs: [{ clicks: 1, credits: 0 }],
    payload: { cardId, ...payload },
    stateVersion: 1,
    expiresAtStateVersion: 1,
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    targetRequirements: [],
  } as unknown as LegalAction;
}
