import { describe, expect, it } from "vitest";
import type { PlayerView, VisibleCard } from "@netgrid/shared";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";

describe("visibleSourceDefinitionsByInstanceId", () => {
  it("binds known installed ICE and root cards without exposing unknown cards", () => {
    const knownIce = card("known-ice", "onr_v1_269_shotgun-wire", "ice");
    const knownRoot = card("known-root", "onr_v1_347_vapor-ops", "asset");
    const unknownRoot = {
      ...card("unknown-root", "onr_v1_340_setup", "asset"),
      known: false,
    };
    const playerView = {
      own: {
        identity: card("corp-identity", "test-corp-identity", "identity"),
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [knownIce],
          root: [knownRoot, unknownRoot],
        },
      ],
    } as unknown as PlayerView;

    expect(visibleSourceDefinitionsByInstanceId(playerView)).toEqual({
      "corp-identity": "test-corp-identity",
      "known-ice": "onr_v1_269_shotgun-wire",
      "known-root": "onr_v1_347_vapor-ops",
    });
  });
});

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    type,
    known: true,
    owner: "corp",
  } as VisibleCard;
}
