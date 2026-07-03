import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  buildCorpIceCardPlacementProfile,
  buildCorpIceDensityProfile,
  buildCorpServerNeedProfile,
  corpIcePlacementCandidateForAction,
  corpIcePlacementScoreComponent,
} from "./corp-ice-placement";

describe("corp ICE placement profile", () => {
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
});

function corpInput(overrides: {
  credits?: number;
  hq?: VisibleCard[];
  archives?: VisibleCard[];
  servers?: AiDecisionInput["playerView"]["servers"];
  stackOrRdCount?: number;
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
        rig: [],
      },
      servers: overrides.servers ?? [server("hq", []), server("rd", [])],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
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
