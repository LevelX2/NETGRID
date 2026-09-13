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
  { id: "onr_v1_188_ai-chief-financial-officer", quantity: 2 },
  { id: "onr_v1_191_black-ice-quality-assurance", quantity: 2 },
  { id: "onr_v1_204_ice-transmutation", quantity: 3 },
  { id: "onr_v1_220_tycho-extension", quantity: 1 },
  { id: "onr_v1_222_ball-and-chain", quantity: 2 },
  { id: "onr_v1_228_cinderella", quantity: 2 },
  { id: "onr_v1_237_data-wall", quantity: 3 },
  { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
  { id: "onr_v1_247_haunting-inquisition", quantity: 2 },
  { id: "onr_v1_258_neural-blade", quantity: 2 },
  { id: "onr_v1_261_quandary", quantity: 2 },
  { id: "onr_v1_268_shock-r", quantity: 2 },
  { id: "onr_v1_278_wall-of-ice", quantity: 2 },
  { id: "onr_v1_279_wall-of-static", quantity: 2 },
  { id: "onr_v1_296_off-site-backups", quantity: 2 },
  { id: "onr_v1_309_bbs-whispering-campaign", quantity: 2 },
  { id: "onr_v1_314_corporate-negotiating-center", quantity: 2 },
  { id: "onr_v1_352_chester-mix", quantity: 2 },
  { id: "onr_v1_363_olivia-salazar", quantity: 2 },
  { id: "onr_v1_367_rio-de-janeiro-city-grid", quantity: 2 },
  { id: "onr_v1_368_roving-submarine", quantity: 2 },
  { id: "onr_v1_374_washington-d-c-city-grid", quantity: 2 },
];
function setup(depth: number, otherFort = false) {
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
    (c) => c.definitionId === "onr_v1_352_chester-mix",
  )!.instanceId;
  const walls = Object.values(state.cardInstances)
    .filter((c) =>
      ["onr_v1_237_data-wall", "onr_v1_238_data-wall-2-0"].includes(
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
describe("Engine quote for free root rez and same-fort ICE installation", () => {
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
        (x) => x.cardInstanceId === target,
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
