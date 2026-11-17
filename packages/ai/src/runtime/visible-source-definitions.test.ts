import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import type { PlayerView, VisibleCard } from "@netgrid/shared";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";

describe("visibleSourceDefinitionsByInstanceId", () => {
  it("binds known installed ICE and root cards without exposing unknown cards", () => {
    const identity = card(
      "corp-identity",
      syntheticCardDefinitionId("test-corp-identity"),
      "identity",
    );
    const knownIce = card("known-ice", 481, "ice");
    const knownRoot = card("known-root", 559, "asset");
    const unknownRoot = {
      ...card("unknown-root", 552, "asset"),
      known: false,
    };
    const playerView = {
      own: {
        identity,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      servers: [
        {
          id: "r1",
          label: "Remote 1",
          ice: [knownIce],
          root: [knownRoot, unknownRoot],
        },
      ],
    } as unknown as PlayerView;

    expect(visibleSourceDefinitionsByInstanceId(playerView)).toEqual({
      [identity.instanceId]: identity.definitionId,
      "known-ice": 481,
      "known-root": 559,
    });
  });

  it("binds the currently revealed accessed card for access-step semantics", () => {
    const identity = card(
      "runner-identity",
      syntheticCardDefinitionId("test-runner-identity"),
      "identity",
    );
    const accessed = card("accessed-krumz", 542, "asset");
    const playerView = {
      own: {
        identity,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      run: {
        attackedServerId: "hq",
        phase: "access",
        position: { kind: "server", serverId: "hq" },
        successful: true,
        accessedCard: accessed,
      },
      servers: [],
    } as unknown as PlayerView;

    expect(visibleSourceDefinitionsByInstanceId(playerView)).toEqual({
      [identity.instanceId]: identity.definitionId,
      "accessed-krumz": 542,
    });
  });
});

function card(
  instanceId: string,
  definitionId: number,
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
