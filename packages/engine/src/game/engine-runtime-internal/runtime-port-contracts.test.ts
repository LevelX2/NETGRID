import { describe, expect, it } from "vitest";
import {
  RuntimePortRegistry,
  defineRuntimePortSet,
  type RuntimePortGroups,
} from "./runtime-port-contracts";

describe("typed runtime port contracts", () => {
  it("fails explicitly before a required group is installed", () => {
    const registry = new RuntimePortRegistry<
      Pick<RuntimePortGroups, "turnCorpRuntime">
    >();

    expect(() => registry.require("turnCorpRuntime")).toThrow(
      "Runtime port group is not installed: turnCorpRuntime",
    );
  });

  it("returns the exact installed group and rejects recomposition", () => {
    type Ports = Pick<RuntimePortGroups, "turnCorpRuntime">;
    const turnCorpRuntime = {
      marker: "typed-port",
    } as unknown as Ports["turnCorpRuntime"];
    const ports = defineRuntimePortSet({ turnCorpRuntime });
    const registry = new RuntimePortRegistry<Ports>();

    registry.install(ports);

    expect(registry.require("turnCorpRuntime")).toBe(turnCorpRuntime);
    expect(() => registry.install(ports)).toThrow(
      "Runtime ports are already installed.",
    );
  });
});
