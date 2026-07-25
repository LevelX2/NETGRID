import {
  type CardInstance,
  type CardInstanceId,
  type GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { createRemote } from "../state/zone-mutation";
import { validateGameState } from "../validation";
import { buildPlayerViewProjection } from "../view/player-view-projection";
import {
  buildCorpNewRemoteIceInstallAction,
  buildCorpServerIceInstallAction,
} from "../turn/corp-install-actions";
import {
  projectCorpIceRezCostAfterInstall,
  projectInstalledCorpIceRezCost,
} from "./corp-rez-cost";

const WALL = "onr_v1_279_wall-of-static";
const GLACIER = "onr_classic_011_glacier";
const JERUSALEM_CITY_GRID = "onr_v1_360_jerusalem-city-grid";
const VARIABLE_REZ_ICE = "onr_proteus_020_digiconda";

function instance(
  instanceId: CardInstanceId,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    instanceId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone,
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters: 0,
    strengthModifier: 0,
    ...options,
  };
}

function stateWithHandIce(
  definitionId = WALL,
  cardId = "corp_projection_ice" as CardInstanceId,
): { state: GameState; cardId: CardInstanceId } {
  const state = createGame({
    seed: `corp-rez-projection-${definitionId}`,
    setupMode: "completed",
  });
  state.stateVersion = 17;
  state.cardInstances[cardId] = instance(cardId, definitionId, {
    side: "corp",
    zone: "hq",
  });
  state.corp.hq.push(cardId);
  return { state, cardId };
}

function installRezzedRoot(
  state: GameState,
  definitionId: string,
  serverId: "hq" | "rd",
): CardInstanceId {
  const cardId = `root_${definitionId}_${serverId}` as CardInstanceId;
  state.cardInstances[cardId] = instance(
    cardId,
    definitionId,
    { side: "corp", zone: "serverRoot", serverId },
    { faceup: true, rezzed: true },
  );
  state.corp.servers
    .find((server) => server.id === serverId)!
    .root.push(cardId);
  return cardId;
}

describe("Corp ICE rez projection contract", () => {
  it("projects same-server public rez modifiers in the hypothetical post-install position", () => {
    const { state, cardId } = stateWithHandIce();
    installRezzedRoot(state, JERUSALEM_CITY_GRID, "hq");

    expect(projectCorpIceRezCostAfterInstall(state, cardId, "hq")).toEqual({
      context: "post_install",
      cardId,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: 17,
      complete: true,
      baseCredits: 3,
      finalCredits: 1,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
      reductionSourceDefinitionIds: [JERUSALEM_CITY_GRID],
    });
    expect(
      projectCorpIceRezCostAfterInstall(state, cardId, "rd"),
    ).toMatchObject({
      complete: true,
      baseCredits: 3,
      finalCredits: 3,
      targetServerId: "rd",
      projectedServerId: "rd",
    });
    expect(state.cardInstances[cardId]?.zone).toEqual({
      side: "corp",
      zone: "hq",
    });
  });

  it("binds each install action projection to card, target server and state version", () => {
    const { state, cardId } = stateWithHandIce();
    const action = buildCorpServerIceInstallAction(
      state,
      cardId,
      { id: "hq", label: "HQ" },
      {
        baseCost: 0,
        additionalCost: 0,
        reduction: 0,
        totalCost: 0,
      },
    );

    expect(action.expiresAtStateVersion).toBe(17);
    expect(action.payload).toMatchObject({
      cardId,
      serverId: "hq",
      placement: "ice",
      iceInstallBaseCost: 0,
      iceInstallAdditionalCost: 0,
      iceInstallReduction: 0,
      iceInstallTotalCost: 0,
      postInstallRezQuoteCardId: cardId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 17,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    });
  });

  it("projects new_remote through the exact next concrete remote position", () => {
    const { state, cardId } = stateWithHandIce();
    state.corp.servers.push({
      id: "remote_4",
      kind: "remote",
      label: "Remote 4",
      ice: [],
      root: [],
    });
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(action.payload).toMatchObject({
      cardId,
      serverId: "new_remote",
      postInstallRezQuoteTargetServerId: "new_remote",
      postInstallRezQuoteProjectedServerId: "remote_5",
      postInstallRezQuoteExpiresAtStateVersion: 17,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteFinalCredits: 3,
    });
    expect(createRemote(state).id).toBe("remote_5");
  });

  it("exposes mandatory agenda-point rez cost without folding it into credits", () => {
    const { state, cardId } = stateWithHandIce(GLACIER);
    const projection = projectCorpIceRezCostAfterInstall(
      state,
      cardId,
      "new_remote",
    );
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(projection).toMatchObject({
      context: "post_install",
      complete: true,
      baseCredits: 0,
      finalCredits: 0,
      mandatoryAdditionalCosts: { agendaPoints: 1 },
    });
    expect(action.payload).toMatchObject({
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
      postInstallRezQuoteMandatoryAgendaPointCost: 1,
    });
  });

  it("aggregates every mandatory agenda-point rez cost exactly once", () => {
    const implementation = cardImplementationForDefinitionId(GLACIER);
    if (!implementation) throw new Error("Glacier implementation missing.");
    const original = implementation.selfRezAdditionalCosts;
    const mutableImplementation = implementation as unknown as {
      selfRezAdditionalCosts: typeof original;
    };
    mutableImplementation.selfRezAdditionalCosts = [
      { kind: "agenda_point", amount: 1, visibility: "public" },
      { kind: "agenda_point", amount: 2, visibility: "public" },
    ];
    try {
      const { state, cardId } = stateWithHandIce(GLACIER);
      const projection = projectCorpIceRezCostAfterInstall(
        state,
        cardId,
        "new_remote",
      );
      const action = buildCorpNewRemoteIceInstallAction(state, cardId);
      expect(projection).toMatchObject({
        complete: true,
        mandatoryAdditionalCosts: { agendaPoints: 3 },
      });
      expect(action.payload).toMatchObject({
        postInstallRezQuoteMandatoryAgendaPointCost: 3,
      });
    } finally {
      mutableImplementation.selfRezAdditionalCosts = original;
    }
  });

  it("fails closed when the Engine cannot certify an exact rez cost", () => {
    const { state, cardId } = stateWithHandIce(VARIABLE_REZ_ICE);
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(action.payload).toMatchObject({
      postInstallRezQuoteCardId: cardId,
      postInstallRezQuoteTargetServerId: "new_remote",
      postInstallRezQuoteExpiresAtStateVersion: 17,
      postInstallRezQuoteComplete: false,
    });
    expect(action.payload).not.toHaveProperty(
      "postInstallRezQuoteFinalCredits",
    );
  });

  it("adds complete current quotes only to own Corp unrezzed ICE", () => {
    const { state, cardId } = stateWithHandIce();
    state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
    state.corp.servers.find((server) => server.id === "hq")!.ice.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
    };

    expect(projectInstalledCorpIceRezCost(state, cardId)).toMatchObject({
      context: "installed",
      cardId,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: 17,
      complete: true,
      finalCredits: 3,
    });
    expect(
      buildPlayerViewProjection(state, "corp", []).servers
        .find((server) => server.id === "hq")
        ?.ice.find((card) => card.instanceId === cardId)
        ?.effectiveRezCostQuote,
    ).toMatchObject({ cardId, complete: true, finalCredits: 3 });
    expect(
      JSON.stringify(buildPlayerViewProjection(state, "runner", [])),
    ).not.toContain("effectiveRezCostQuote");
  });

  it("shares one fail-closed canonical next-remote rule with createRemote", () => {
    const { state, cardId } = stateWithHandIce();
    state.corp.servers.push({
      id: "remote_01" as "remote_1",
      kind: "remote",
      label: "Invalid Remote",
      ice: [],
      root: [],
    });

    const projection = projectCorpIceRezCostAfterInstall(
      state,
      cardId,
      "new_remote",
    );
    expect(projection).toEqual({
      context: "post_install",
      cardId,
      targetServerId: "new_remote",
      expiresAtStateVersion: 17,
      complete: false,
    });
    expect(JSON.stringify(projection)).not.toContain("NaN");
    expect(validateGameState(state).errors).toContain(
      "Corp server IDs must be canonical and unique.",
    );
    expect(() => createRemote(state)).toThrow(/nichtkanonischem Serverzustand/);

    state.corp.servers.pop();
    state.corp.servers.push({ ...state.corp.servers[0]! });
    expect(validateGameState(state).errors).toContain(
      "Corp server IDs must be canonical and unique.",
    );
  });

  it("projects repeatedly without cloning the full GameState", () => {
    const { state, cardId } = stateWithHandIce();
    const originalStructuredClone = globalThis.structuredClone;
    globalThis.structuredClone = (() => {
      throw new Error("full GameState clone is forbidden");
    }) as typeof structuredClone;
    try {
      for (let index = 0; index < 250; index += 1) {
        expect(
          projectCorpIceRezCostAfterInstall(state, cardId, "hq").complete,
        ).toBe(true);
      }
    } finally {
      globalThis.structuredClone = originalStructuredClone;
    }
  });
});
