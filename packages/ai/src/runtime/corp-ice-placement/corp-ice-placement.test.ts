import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  buildCorpIceCardPlacementProfile,
  buildCorpIceDensityProfile,
  buildCorpServerNeedProfile,
  assessCorpIcePlacementForDiagnostics,
  classifyCorpFutureRunIcePlacementProfile,
  corpIcePlacementCandidateForAction,
  corpIcePlacementEvaluationForActions,
  corpIcePlacementScoreComponent,
} from "./corp-ice-placement";

describe("corp ICE placement profile", () => {
  it("classifies historical future-run ICE through the new placement profile", () => {
    expect(
      classifyCorpFutureRunIcePlacementProfile("onr_v1_222_ball-and-chain"),
    ).toBe("ball_and_chain");
    expect(
      classifyCorpFutureRunIcePlacementProfile("onr_v1_225_canis-major"),
    ).toBe("canis");
  });

  it("classifies direct stop ICE as immediate protection", () => {
    const profile = buildCorpIceCardPlacementProfile(
      corpIce("data-wall", {
        definitionId: "simple_barrier_ice",
        rulesText: "*End the run.",
        rezCost: 3,
      }),
    );

    expect(profile).toMatchObject({
      immediateStop: true,
      positionDependent: false,
      deadAsFirstIce: false,
      rezCost: 3,
    });
  });

  it("marks outside-scaling ICE as position dependent and weak when alone", () => {
    const profile = buildCorpIceCardPlacementProfile(
      corpIce("hunting-pack", {
        title: "Hunting Pack",
        rulesText:
          "For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one Trace subroutine.",
        rezCost: 4,
      }),
    );

    expect(profile.outsideIceScaling).toBe(true);
    expect(profile.positionDependent).toBe(true);
    expect(profile.wantsInner).toBe(true);
    expect(profile.deadAsFirstIce).toBe(true);
  });

  it("bounds next-ICE text matching to exact tokens", () => {
    const nextIce = buildCorpIceCardPlacementProfile(
      corpIce("next-ice", {
        rulesText: "The next ice encountered this run gains *End the run.",
      }),
    );
    const noisyText = buildCorpIceCardPlacementProfile(
      corpIce("nextish", {
        rulesText: "The nextish icebreaker reference is only flavor.",
      }),
    );

    expect(nextIce.nextIceModifier).toBe(true);
    expect(noisyText.nextIceModifier).toBe(false);
  });
});

describe("corp ICE placement server need and density", () => {
  it("treats HQ agendas as concrete central server need", () => {
    const input = corpInput({
      hq: [agenda("agenda-in-hq")],
      servers: [server("hq", []), server("rd", [])],
    });

    const profile = buildCorpServerNeedProfile(
      input,
      "hq",
      input.playerView.servers[0],
    );

    expect(profile.serverNeed).toBeGreaterThanOrEqual(900);
    expect(profile.agendaRisk).toBe(true);
    expect(profile.evidence).toContain("hq_agenda_risk:true");
  });

  it("derives a conservative own-deck ICE density profile from side-safe Corp view", () => {
    const input = corpInput({
      hq: [
        corpIce("hq-ice-1", { rulesText: "*End the run." }),
        corpIce("hq-ice-2", { rulesText: "Tax the runner." }),
        agenda("agenda-in-hq"),
      ],
      servers: [
        server("hq", [corpIce("installed-hq-ice")]),
        server("rd", []),
      ],
      stackOrRdCount: 30,
    });

    const density = buildCorpIceDensityProfile(input);

    expect(density.iceInHq).toBe(2);
    expect(density.installedIce).toBe(1);
    expect(density.knownIceSeen).toBe(3);
    expect(density.iceDensityClass).toBe("high");
  });
});

describe("corp ICE placement candidate scoring", () => {
  it("scores affordable direct HQ stop ICE above a dead first future-run ICE", () => {
    const dataWall = corpIce("data-wall", {
      definitionId: "simple_barrier_ice",
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const huntingPack = corpIce("hunting-pack", {
      title: "Hunting Pack",
      rulesText:
        "For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one Trace subroutine.",
      rezCost: 4,
    });
    const input = corpInput({
      credits: 6,
      hq: [agenda("agenda-in-hq"), dataWall, huntingPack],
      servers: [server("hq", []), server("rd", [])],
    });

    const dataWallCandidate = corpIcePlacementCandidateForAction({
      input,
      action: installIceAction(dataWall, "hq"),
      serverId: "hq",
      server: input.playerView.servers[0],
      sourceCard: dataWall,
      actionCreditCost: 1,
      iceRezCost: 2,
    });
    const huntingPackCandidate = corpIcePlacementCandidateForAction({
      input,
      action: installIceAction(huntingPack, "hq"),
      serverId: "hq",
      server: input.playerView.servers[0],
      sourceCard: huntingPack,
      actionCreditCost: 1,
      iceRezCost: 4,
    });

    expect(dataWallCandidate?.recommendation).toBe("install_now");
    expect(huntingPackCandidate?.recommendation).not.toBe("install_now");
    expect(dataWallCandidate?.score).toBeGreaterThan(
      huntingPackCandidate?.score ?? 0,
    );
    expect(huntingPackCandidate?.components.positionFit).toBeLessThan(0);
  });

  it("keeps non-stopping tag ICE below install-now even under central agenda pressure", () => {
    const fetch = corpIce("fetch-4-0-1", {
      definitionId: "onr_v1_243_fetch-4-0-1",
      rulesText:
        "[Subroutine] Trace 3 - If trace is successful, give Runner a tag.",
      rezCost: 0,
    });
    const input = corpInput({
      credits: 5,
      hq: [
        agenda("agenda-in-hq"),
        fetch,
        corpIce("other-ice-1"),
        corpIce("other-ice-2"),
        corpIce("other-ice-3"),
      ],
      servers: [server("hq", []), server("rd", [])],
    });

    const candidate = corpIcePlacementCandidateForAction({
      input,
      action: installIceAction(fetch, "hq"),
      serverId: "hq",
      server: input.playerView.servers[0],
      sourceCard: fetch,
      actionCreditCost: 1,
      iceRezCost: 0,
    });

    expect(candidate?.components.serverNeed).toBeLessThan(900);
    expect(candidate?.recommendation).toBe("hold_for_later");
    expect(candidate?.evidence).toContain("raw_server_need:1350");
    expect(candidate?.evidence).toContain("server_need_score:350");

    const component = corpIcePlacementScoreComponent({
      input,
      action: installIceAction(fetch, "hq"),
      serverId: "hq",
      server: input.playerView.servers[0],
      sourceCard: fetch,
      actionCreditCost: 1,
      iceRezCost: 0,
    });

    expect(component?.value).toBe(0);
    expect(component?.reason).toContain("recommendation:hold_for_later");
  });

  it("improves outside-scaling ICE once a rezzed outside layer exists", () => {
    const huntingPack = corpIce("hunting-pack", {
      title: "Hunting Pack",
      rulesText:
        "For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one Trace subroutine.",
      rezCost: 3,
    });
    const emptyInput = corpInput({
      credits: 6,
      hq: [huntingPack],
      servers: [server("remote_1", [])],
    });
    const layeredInput = corpInput({
      credits: 6,
      hq: [huntingPack],
      servers: [
        server("remote_1", [
          corpIce("outside-wall", { rulesText: "*End the run.", rezzed: true }),
        ]),
      ],
    });

    const emptyCandidate = corpIcePlacementCandidateForAction({
      input: emptyInput,
      action: installIceAction(huntingPack, "remote_1"),
      serverId: "remote_1",
      server: emptyInput.playerView.servers[0],
      sourceCard: huntingPack,
      actionCreditCost: 1,
      iceRezCost: 3,
    });
    const layeredCandidate = corpIcePlacementCandidateForAction({
      input: layeredInput,
      action: installIceAction(huntingPack, "remote_1"),
      serverId: "remote_1",
      server: layeredInput.playerView.servers[0],
      sourceCard: huntingPack,
      actionCreditCost: 1,
      iceRezCost: 3,
    });

    expect(layeredCandidate?.score).toBeGreaterThan(emptyCandidate?.score ?? 0);
    expect(emptyCandidate?.components.futureRunSynergy).toBeLessThan(0);
    expect(layeredCandidate?.components.futureRunSynergy).toBeGreaterThan(0);
  });

  it("exposes an AI score component with bounded evidence", () => {
    const ice = corpIce("data-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 5,
      hq: [agenda("agenda-in-hq"), ice],
      servers: [server("hq", [])],
    });

    const component = corpIcePlacementScoreComponent({
      input,
      action: installIceAction(ice, "hq"),
      serverId: "hq",
      server: input.playerView.servers[0],
      sourceCard: ice,
      actionCreditCost: 1,
      iceRezCost: 2,
    });

    expect(component).toMatchObject({
      key: "corp_ice_placement_evaluator",
      label: "ICE-Platzierung",
    });
    expect(component?.reason).toContain("server:hq");
    expect(component?.reason).toContain("recommendation:install_now");
  });

  it("routes urgent HQ agenda-flood protection above remote setup", () => {
    const hqWall = corpIce("hq-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const remoteWall = corpIce("remote-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 6,
      hq: [agenda("agenda-in-hq"), hqWall, remoteWall],
      servers: [server("hq", []), server("rd", []), server("remote_1", [])],
    });

    const hqCandidate = candidateFor(input, hqWall, "hq");
    const remoteCandidate = candidateFor(input, remoteWall, "remote_1");

    expect(hqCandidate?.score).toBeGreaterThan(remoteCandidate?.score ?? 0);
    expect(hqCandidate?.evidence).toContain("hq_agenda_risk:true");
  });

  it("routes visible R&D multiaccess pressure to R&D before HQ when HQ has no agenda", () => {
    const hqWall = corpIce("hq-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const rdWall = corpIce("rd-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 6,
      hq: [hqWall, rdWall],
      servers: [server("hq", []), server("rd", [])],
      runnerRig: [
        card("rd-interface", "hardware", {
          title: "R&D Interface",
          rulesText: "Whenever you access R&D, access 1 additional card.",
        }),
      ],
    });

    const rdCandidate = candidateFor(input, rdWall, "rd");
    const hqCandidate = candidateFor(input, hqWall, "hq");

    expect(rdCandidate?.score).toBeGreaterThan(hqCandidate?.score ?? 0);
    expect(rdCandidate?.evidence).toContain("rd_pressure:true");
  });

  it("prioritizes a scoreline remote over quiet central over-icing", () => {
    const remoteWall = corpIce("remote-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const hqWall = corpIce("hq-wall", {
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 6,
      hq: [remoteWall, hqWall],
      servers: [
        server("hq", [corpIce("existing-hq-wall", { rulesText: "*End the run." })]),
        server("rd", [corpIce("existing-rd-wall", { rulesText: "*End the run." })]),
        server("remote_1", [], [agenda("remote-agenda")]),
      ],
    });

    const remoteCandidate = candidateFor(input, remoteWall, "remote_1");
    const hqCandidate = candidateFor(input, hqWall, "hq");

    expect(remoteCandidate?.score).toBeGreaterThan(hqCandidate?.score ?? 0);
    expect(remoteCandidate?.evidence).toContain("remote_scoreline_root:true");
  });

  it("defers unrezzable ICE in favor of economy when the server need is low", () => {
    const expensiveIce = corpIce("expensive-ice", {
      rulesText: "*End the run.",
      rezCost: 8,
    });
    const input = corpInput({
      credits: 2,
      hq: [expensiveIce],
      servers: [server("remote_1", [])],
    });

    const candidate = candidateFor(input, expensiveIce, "remote_1", {
      actionCreditCost: 1,
      iceRezCost: 8,
    });

    expect(candidate?.recommendation).toBe("prefer_economy");
    expect(candidate?.evidence).toContain("defer_reason:rez_reserve_too_low");
  });

  it("waits on high-density dead first ICE but installs it under low ICE density and urgent HQ need", () => {
    const comboIce = corpIce("combo-ice", {
      title: "Combo ICE",
      rulesText:
        "For each rezzed piece of ice installed outside Combo ICE, trace the Runner.",
      rezCost: 2,
    });
    const highDensityInput = corpInput({
      credits: 5,
      hq: [
        agenda("agenda-in-hq"),
        comboIce,
        corpIce("other-ice-1"),
        corpIce("other-ice-2"),
        corpIce("other-ice-3"),
      ],
      servers: [server("hq", []), server("rd", [])],
    });
    const lowDensityInput = corpInput({
      credits: 5,
      hq: [
        agenda("agenda-in-hq"),
        card("operation-1", "operation"),
        card("operation-2", "operation"),
        card("asset-1", "asset"),
        card("upgrade-1", "upgrade"),
        comboIce,
      ],
      servers: [server("hq", []), server("rd", [])],
    });

    const highDensityCandidate = candidateFor(highDensityInput, comboIce, "hq");
    const lowDensityCandidate = candidateFor(lowDensityInput, comboIce, "hq");

    expect(highDensityCandidate?.recommendation).toBe("hold_for_later");
    expect(lowDensityCandidate?.score).toBeGreaterThan(
      highDensityCandidate?.score ?? 0,
    );
    expect(lowDensityCandidate?.recommendation).toBe("install_now");
    expect(lowDensityCandidate?.evidence).toContain("ice_density_class:low");
  });

  it("halves first-ICE position penalties for mobile reposition ICE without removing them", () => {
    const staticCombo = corpIce("static-combo", {
      rulesText:
        "For each rezzed piece of ice installed outside this ice, trace the Runner.",
      rezCost: 2,
    });
    const mobileCombo = corpIce("mobile-combo", {
      rulesText:
        "For each rezzed piece of ice installed outside this ice, trace the Runner. You may move this ice.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 5,
      hq: [staticCombo, mobileCombo],
      servers: [server("remote_1", [])],
    });

    const staticCandidate = candidateFor(input, staticCombo, "remote_1");
    const mobileCandidate = candidateFor(input, mobileCombo, "remote_1");

    expect(staticCandidate?.components.positionFit).toBe(-1300);
    expect(mobileCandidate?.components.positionFit).toBe(-650);
  });

  it("returns bestDeferReason for poor install portfolios without creating a fake action", () => {
    const comboIce = corpIce("combo-ice", {
      rulesText:
        "For each rezzed piece of ice installed outside Combo ICE, trace the Runner.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 5,
      hq: [comboIce],
      servers: [server("remote_1", [])],
    });
    const action = installIceAction(comboIce, "remote_1");

    const evaluation = corpIcePlacementEvaluationForActions(input, [action], {
      serverIdForAction: () => "remote_1",
      serverForId: () => input.playerView.servers[0],
      actionCreditCost: () => 1,
      visibleIceRezCost: () => 2,
    });

    expect(evaluation.bestInstall?.actionId).toBe(action.actionId);
    expect(evaluation.bestInstall?.recommendation).toBe("hold_for_later");
    expect(evaluation.bestDeferReason).toBe("bad_first_ice_wait_for_followup");
    expect(evaluation.candidates).toHaveLength(1);
  });

  it("replaces legacy future-run assessment diagnostics from the placement profile", () => {
    const ballAndChain = corpIce("ball-and-chain", {
      title: "Ball and Chain",
      definitionId: "onr_v1_222_ball-and-chain",
      rulesText: "For the remainder of this run, the next ice is stronger.",
      rezCost: 2,
    });
    const directIce = corpIce("direct-ice", {
      definitionId: "simple_barrier_ice",
      rulesText: "*End the run.",
      rezCost: 2,
    });
    const input = corpInput({
      credits: 5,
      hq: [ballAndChain, directIce],
      servers: [server("remote_1", [])],
    });
    const action = installIceAction(ballAndChain, "remote_1");
    input.legalActions = [action, installIceAction(directIce, "remote_1")];

    expect(assessCorpIcePlacementForDiagnostics(input, action)).toMatchObject({
      futureRunIceClass: "ball_and_chain",
      installedOnEmptyServer: true,
      deadEffect: true,
      directImpactAlternativeCount: 1,
    });
  });
});

function corpInput(overrides: {
  credits?: number;
  hq?: VisibleCard[];
  archives?: VisibleCard[];
  servers?: AiDecisionInput["playerView"]["servers"];
  stackOrRdCount?: number;
  runnerRig?: VisibleCard[];
} = {}): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    eventTail: [],
    difficulty: "normal",
    seed: "corp-ice-placement-test",
    decisionId: "corp-ice-placement-test.1",
    actionNumber: 1,
    profileId: "test-corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action",
      own: {
        identity: card("corp-id", "identity"),
        credits: overrides.credits ?? 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: overrides.hq ?? [],
        stackOrRdCount: overrides.stackOrRdCount ?? 20,
        heapOrArchives: overrides.archives ?? [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 30,
        discardCount: 0,
        scoreArea: [],
        rig: overrides.runnerRig ?? [],
      },
      servers: overrides.servers ?? [server("hq", []), server("rd", [])],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function candidateFor(
  input: AiDecisionInput,
  ice: VisibleCard,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  options: { actionCreditCost?: number; iceRezCost?: number } = {},
) {
  return corpIcePlacementCandidateForAction({
    input,
    action: installIceAction(ice, serverId),
    serverId,
    server: input.playerView.servers.find((server) => server.id === serverId),
    sourceCard: ice,
    actionCreditCost: options.actionCreditCost ?? 1,
    iceRezCost: options.iceRezCost ?? ice.rezCost ?? 0,
  });
}

function server(
  id: "hq" | "rd" | "archives" | `remote_${number}`,
  ice: VisibleCard[],
  root: VisibleCard[] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function installIceAction(ice: VisibleCard, serverId: string): LegalAction {
  return {
    actionId: `install-${ice.instanceId}-${serverId}`,
    side: "corp",
    type: "install_card",
    label: `Install ${ice.title ?? ice.instanceId}`,
    source: ice.instanceId,
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      placement: "ice",
      serverId,
    },
  };
}

function agenda(instanceId: string): VisibleCard {
  return card(instanceId, "agenda", {
    title: "Project Test",
    advancementRequirement: 3,
    agendaPoints: 2,
  });
}

function corpIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return card(instanceId, "ice", overrides);
}

function card(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    title: instanceId,
    type,
    ...overrides,
  };
}
