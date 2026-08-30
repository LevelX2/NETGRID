import type { CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGameAfterSetup } from "../../index";
import { projectInstalledCorpSequenceRezPayment } from "./corp-rez-cost";

describe("Data Fort Reclamation sequence rez payment projection", () => {
  it("fails closed for variable-rez ICE without reconstructing a fixed cost", () => {
    const state = createGameAfterSetup({
      seed: "data-fort-variable-rez-projection",
    });
    const cardId = state.corp.hq[0] as CardInstanceId;
    state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [cardId],
      root: [],
    });
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      definitionId: "onr_proteus_013_caryatid",
      owner: "corp",
      controller: "corp",
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
    };

    expect(projectInstalledCorpSequenceRezPayment(state, cardId, 10)).toEqual({
      complete: false,
    });
  });

  it("refuses a sequence payment projection outside the new remote", () => {
    const state = createGameAfterSetup({
      seed: "data-fort-central-rez-projection",
    });
    const cardId = state.corp.hq[0] as CardInstanceId;
    state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
    const hq = state.corp.servers.find((server) => server.id === "hq");
    if (!hq) throw new Error("Missing HQ");
    hq.ice.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      definitionId: "simple_barrier_ice",
      owner: "corp",
      controller: "corp",
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
    };

    expect(projectInstalledCorpSequenceRezPayment(state, cardId, 10)).toEqual({
      complete: false,
    });
  });
});
