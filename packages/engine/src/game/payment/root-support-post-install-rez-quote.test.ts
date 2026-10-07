import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "../../index";
import {
  apply,
  MECHANIC_SMOKE_DECKS,
  moveCorpCardToHq,
  putCorpIceOnServer,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { projectGlobalRootSupportRezAfterInstall } from "./root-support-post-install-rez-quote";

describe("global root support installation payment facts", () => {
  const game = (seed: string) =>
    createGameAfterSetup({
      seed,
      runnerDeck: MECHANIC_SMOKE_DECKS.runAccess.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.runAccess.corp,
        cards: [
          ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
            (c) =>
              ![
                "onr_v1_320_encoder-inc",
                "onr_v1_326_holovid-campaign",
                "onr_v1_244_filter",
              ].includes(c.id),
          ),
          { id: "onr_v1_320_encoder-inc", quantity: 1 },
          { id: "onr_v1_326_holovid-campaign", quantity: 1 },
          { id: "onr_v1_244_filter", quantity: 1 },
        ],
      },
    });
  it("quotes the real following rez without mutation and applies global support on another fort", () => {
    let state = game("sp207-native-root-support");
    state = apply(state, "corp", (a) => a.type === "mandatory_draw");
    state.corp.credits = 20;
    const id = moveCorpCardToHq(state, "onr_v1_320_encoder-inc");
    const ice = putCorpIceOnServer(state, "hq", "onr_v1_244_filter");
    state.cardInstances[ice]!.rezzed = true;
    state.cardInstances[ice]!.faceup = true;
    const beforeHash = hashState(state);
    const before = getPlayerView(state, "corp").servers.find(
      (s) => s.id === "hq",
    )!.ice[0]!.effectiveRunQuote!;
    const install = getLegalActions(state, "corp").find(
      (a) =>
        a.type === "install_card" &&
        a.source === id &&
        a.payload?.serverId === "new_remote",
    )!;
    expect(install.payload).toMatchObject({
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCardId: id,
      postInstallRezQuoteTargetServerId: "new_remote",
      postInstallRezQuoteProjectedServerId: "remote_1",
      postInstallRezQuoteExpiresAtStateVersion: state.stateVersion,
      postInstallRezQuoteFinalCredits: 0,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    });
    expect(hashState(state)).toBe(beforeHash);
    state = apply(state, "corp", (a) => a.actionId === install.actionId);
    const rez = getLegalActions(state, "corp").find(
      (a) => a.type === "rez_card" && a.source === id,
    )!;
    expect(rez.costs.reduce((n, c) => n + (c.credits ?? 0), 0)).toBe(
      install.payload!.postInstallRezQuoteFinalCredits,
    );
    state = apply(state, "corp", (a) => a.actionId === rez.actionId);
    const after = getPlayerView(state, "corp").servers.find(
      (s) => s.id === "hq",
    )!.ice[0]!.effectiveRunQuote!;
    expect(after.subroutines.length).toBe(before.subroutines.length + 1);
    expect(after.subroutines.at(-1)?.type).toBe("end_the_run");
  });
  it("does not add prospective private payment facts for ordinary assets", () => {
    const state = game("sp207-ordinary-asset");
    const id = moveCorpCardToHq(state, "onr_v1_326_holovid-campaign");
    expect(
      projectGlobalRootSupportRezAfterInstall(state, id, "new_remote"),
    ).toBeUndefined();
  });
});
