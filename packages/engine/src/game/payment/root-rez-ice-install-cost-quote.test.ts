import { describe, expect, it } from "vitest";
import {
  type GameState,
  type LegalAction,
  ORIGINALSET_DEFAULT_DECKS,
} from "@netgrid/shared";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  validateGameState,
} from "../../index";
import {
  apply,
  removeEverywhere,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { quoteCorpRootRezIceInstallCosts } from "./root-rez-ice-install-cost-quote";
const cards = [
  { id: 400, quantity: 2 },
  { id: 403, quantity: 2 },
  { id: 416, quantity: 3 },
  { id: 432, quantity: 1 },
  { id: 434, quantity: 2 },
  { id: 440, quantity: 2 },
  { id: 449, quantity: 3 },
  { id: 450, quantity: 2 },
  { id: 459, quantity: 2 },
  { id: 470, quantity: 2 },
  { id: 473, quantity: 2 },
  { id: 480, quantity: 2 },
  { id: 490, quantity: 2 },
  { id: 491, quantity: 2 },
  { id: 508, quantity: 2 },
  { id: 521, quantity: 2 },
  { id: 526, quantity: 2 },
  { id: 536, quantity: 2 },
  { id: 564, quantity: 2 },
  { id: 575, quantity: 2 },
  { id: 579, quantity: 2 },
  { id: 580, quantity: 2 },
  { id: 586, quantity: 2 },
];
function setup(
  depth: number,
  otherFort = false,
  sourceDefinitionId = 564,
) {
  const state = createGameAfterSetup({
    seed: "sp337-cost-proof-" + depth,
    corpDeck: { ...ORIGINALSET_DEFAULT_DECKS.corp, cards },
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.credits = 10;
  state.corp.clicks = 3;
  const hq = state.corp.servers.find((s) => s.id === "hq")!;
  const source = Object.values(state.cardInstances).find(
    (c) => c.definitionId === sourceDefinitionId,
  )!.instanceId;
  const walls = Object.values(state.cardInstances)
    .filter((c) =>
      [449, 450].includes(
        c.definitionId,
      ),
    )
    .map((c) => c.instanceId);
  for (const [i, id] of walls.slice(0, depth + 1).entries()) {
    removeEverywhere(state, id);
    const c = state.cardInstances[id]!;
    c.rezzed = false;
    c.faceup = false;
    if (i < depth) {
      c.zone = { side: "corp", zone: "serverIce", serverId: "hq" };
      hq.ice.push(id);
    } else {
      c.zone = { side: "corp", zone: "hq" };
      state.corp.hq.push(id);
    }
  }
  removeEverywhere(state, source);
  const sourceServer = otherFort ? "rd" : "hq";
  state.cardInstances[source]!.zone = {
    side: "corp",
    zone: "serverRoot",
    serverId: sourceServer,
  };
  state.corp.servers.find((s) => s.id === sourceServer)!.root.push(source);
  const target = walls[depth]!;
  const install = (a: LegalAction) =>
    a.type === "install_card" &&
    a.source === target &&
    a.payload?.serverId === "hq" &&
    a.payload?.placement === "ice";
  const rez = getLegalActions(state, "corp").find(
    (a) => a.type === "rez_card" && a.source === source,
  )!;
  return { state, target, source, install, rez };
}
describe("Engine quote for free root rez and actual ICE installation scope", () => {
  it("quotes the real global saving on another fort's ICE installation", () => {
    const { state, target, source, install, rez } = setup(
      2,
      true,
      536,
    );
    const initialHash = hashState(state);
    const quote = quoteCorpRootRezIceInstallCosts(state, rez);
    expect(hashState(state)).toBe(initialHash);
    const direct = apply(state, "corp", install);
    const rezzed = apply(state, "corp", (a) => a.actionId === rez.actionId);
    const discounted = apply(rezzed, "corp", install);
    expect(rezzed.cardInstances[source]?.rezzed).toBe(true);
    expect(rezzed.corp.credits).toBe(state.corp.credits);
    expect(rezzed.corp.clicks).toBe(state.corp.clicks);
    expect(direct.corp.credits).toBe(8);
    expect(discounted.corp.credits).toBe(9);
    expect(discounted.corp.clicks).toBe(direct.corp.clicks);
    expect(validateGameState(discounted)).toEqual({ ok: true, errors: [] });
    expect(quote).toMatchObject({
      schemaVersion: "corp-root-rez-ice-install-cost-quote-v2",
      sourceServerId: "rd",
    });
    expect(quote?.installs).toContainEqual({
      cardInstanceId: target,
      targetServerId: "hq",
      beforeCredits: 2,
      afterCredits: 1,
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "rootRezIceInstallCostQuoteJson",
    );
    expect(JSON.stringify(rezzed.eventLog.at(-1)?.publicPayload)).not.toContain(
      target,
    );
  });
  for (const depth of [0, 1, 2, 3])
    it("matches real transitions at ICE depth " + depth, () => {
      const { state, target, source, install, rez } = setup(depth);
      const before = hashState(state),
        quote = quoteCorpRootRezIceInstallCosts(state, rez);
      expect(hashState(state)).toBe(before);
      if (depth === 0) expect(quote).toBeUndefined();
      else
        expect(quote?.installs).toContainEqual({
          cardInstanceId: target,
          targetServerId: "hq",
          beforeCredits: depth,
          afterCredits: Math.max(0, depth - 2),
        });
      const direct = apply(state, "corp", install);
      const rezzed = apply(state, "corp", (a) => a.actionId === rez.actionId);
      expect(rezzed.corp.credits).toBe(state.corp.credits);
      expect(rezzed.corp.clicks).toBe(state.corp.clicks);
      expect(rezzed.cardInstances[source]?.rezzed).toBe(true);
      const discounted = apply(rezzed, "corp", install);
      expect(discounted.corp.credits - direct.corp.credits).toBe(
        Math.min(2, depth),
      );
      expect(discounted.corp.clicks).toBe(direct.corp.clicks);
      expect(validateGameState(direct)).toEqual({ ok: true, errors: [] });
      expect(validateGameState(discounted)).toEqual({ ok: true, errors: [] });
      expect(
        JSON.stringify(rezzed.eventLog.at(-1)?.publicPayload),
      ).not.toContain(target);
      expect(
        JSON.stringify(rezzed.eventLog.at(-1)?.publicPayload),
      ).not.toContain("rootRezIceInstallCostQuoteJson");
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        "rootRezIceInstallCostQuoteJson",
      );
    });
  it("does not transfer a discount from another fort", () => {
    const { state, rez, target } = setup(2, true);
    expect(
      quoteCorpRootRezIceInstallCosts(state, rez)?.installs.some(
        (x) => x.cardInstanceId === target && x.targetServerId === "hq",
      ),
    ).not.toBe(true);
  });
  for (const [name, change] of [
    [
      "paid rez",
      (_s: GameState, a: LegalAction) => {
        a.costs = [{ credits: 1 }];
      },
    ],
    [
      "stale action",
      (_s: GameState, a: LegalAction) => {
        a.expiresAtStateVersion--;
      },
    ],
    [
      "no install click",
      (s: GameState) => {
        s.corp.clicks = 0;
      },
    ],
    [
      "already rezzed",
      (s: GameState, a: LegalAction) => {
        s.cardInstances[a.source!]!.rezzed = true;
      },
    ],
  ] as const)
    it("does not certify " + name, () => {
      const { state, rez } = setup(2);
      change(state, rez);
      expect(quoteCorpRootRezIceInstallCosts(state, rez)).toBeUndefined();
    });
});
