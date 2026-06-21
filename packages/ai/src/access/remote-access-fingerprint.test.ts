import { describe, expect, it } from "vitest";
import {
  remoteAccessFingerprint,
  remoteAccessFingerprintChanged,
} from "./remote-access-fingerprint";

describe("remote access fingerprint", () => {
  it("includes side-safe identity, definition, position, counters and root count", () => {
    expect(
      remoteAccessFingerprint({
        serverId: "remote_1",
        root: [
          {
            instanceId: "asset-1",
            definitionId: "asset-a",
            known: true,
            rezzed: true,
            counters: { bit: 3 },
          },
        ],
      }),
    ).toBe(
      "server:remote_1;root_count:1;pos:0|instance:asset-1|definition:asset-a|known:true|rezzed:true|adv:0|counters:bit:3",
    );
  });

  it("changes when the same definition is replaced by another instance", () => {
    const previous = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [{ instanceId: "a", definitionId: "same", known: true }],
    });
    const current = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [{ instanceId: "b", definitionId: "same", known: true }],
    });

    expect(remoteAccessFingerprintChanged({
      previousFingerprint: previous,
      currentFingerprint: current,
    })).toBe(true);
  });

  it("changes when visible counters or root count changes", () => {
    const previous = remoteAccessFingerprint({
      serverId: "remote_1",
      root: [
        {
          instanceId: "a",
          definitionId: "asset",
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
          definitionId: "asset",
          known: true,
          counters: { bit: 2 },
        },
        { instanceId: "b", definitionId: "upgrade", known: true },
      ],
    });

    expect(remoteAccessFingerprintChanged({
      previousFingerprint: previous,
      currentFingerprint: current,
    })).toBe(true);
  });
});
