import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import { remoteAccessFingerprint } from "./remote-access-fingerprint";

describe("remote access fingerprint", () => {
  it("includes side-safe identity, definition, position, counters and root count", () => {
    const definitionId = syntheticCardDefinitionId("asset-a");
    expect(
      remoteAccessFingerprint({
        serverId: "remote_1",
        root: [
          {
            instanceId: "asset-1",
            definitionId,
            known: true,
            rezzed: true,
            counters: { bit: 3 },
          },
        ],
      }),
    ).toBe(
      `server:remote_1;root_count:1;pos:0|instance:asset-1|definition:${definitionId}|known:true|rezzed:true|adv:0|counters:bit:3`,
    );
  });

  it("changes when the same definition is replaced by another instance", () => {
    const previous = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [{ instanceId: "a", definitionId: syntheticCardDefinitionId("same"), known: true }],
    });
    const current = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [{ instanceId: "b", definitionId: syntheticCardDefinitionId("same"), known: true }],
    });

    expect(previous).not.toBe(current);
  });

  it("changes when visible counters or root count changes", () => {
    const previous = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [
        {
          instanceId: "a",
          definitionId: syntheticCardDefinitionId("asset"),
          known: true,
          counters: { bit: 1 },
        },
      ],
    });
    const current = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [
        {
          instanceId: "a",
          definitionId: syntheticCardDefinitionId("asset"),
          known: true,
          counters: { bit: 2 },
        },
        { instanceId: "b", definitionId: syntheticCardDefinitionId("upgrade"), known: true },
      ],
    });

    expect(previous).not.toBe(current);
  });
});
