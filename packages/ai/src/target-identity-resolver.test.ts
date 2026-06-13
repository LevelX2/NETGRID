import { describe, expect, it } from "vitest";
import { resolveTargetIdentity } from "./target-identity-resolver";

describe("target identity resolver", () => {
  it("keeps side-safe server identities stable", () => {
    expect(
      resolveTargetIdentity({
        actionType: "start_run",
        targetIdentity: "server:rd",
      }),
    ).toMatchObject({
      status: "complete",
      kind: "server",
      identity: "server:rd",
    });
  });

  it("keeps side-safe ICE identities stable only when server and position are present", () => {
    expect(
      resolveTargetIdentity({
        actionType: "rez_ice",
        targetIdentity: "ice:remote_1:0:public_ice",
      }).status,
    ).toBe("complete");
    expect(
      resolveTargetIdentity({
        actionType: "rez_ice",
        targetIdentity: "ice:unknown",
      }).status,
    ).toBe("blocked_unresolved");
  });

  it("blocks hidden targets instead of emitting private identity", () => {
    const resolution = resolveTargetIdentity({
      actionType: "trigger_ability",
      targetIdentity: "unknown_hidden_blocked",
    });

    expect(resolution.status).toBe("blocked_hidden_info");
    expect(resolution.blocker).toBe("hidden_target_identity_blocked");
  });

  it("keeps side-safe choice option ids stable", () => {
    expect(
      resolveTargetIdentity({
        actionType: "resolve_choice",
        targetIdentity: "choice:choice_1:option_a",
      }),
    ).toMatchObject({
      status: "complete",
      kind: "choice",
      identity: "choice:choice_1:option_a",
    });
  });
});
