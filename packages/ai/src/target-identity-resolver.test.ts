import { describe, expect, it } from "vitest";
import { resolveCandidateTargetIdentity } from "./target-identity-resolver";

describe("target identity resolver", () => {
  it("keeps side-safe server identities stable", () => {
    expect(
      resolveCandidateTargetIdentity({
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
      resolveCandidateTargetIdentity({
        actionType: "rez_ice",
        targetIdentity: "ice:r1:0:public_ice",
      }).status,
    ).toBe("complete");
    expect(
      resolveCandidateTargetIdentity({
        actionType: "rez_ice",
        targetIdentity: "ice:unknown",
      }).status,
    ).toBe("blocked_unresolved");
  });

  it("blocks hidden targets instead of emitting private identity", () => {
    const resolution = resolveCandidateTargetIdentity({
      actionType: "trigger_ability",
      targetIdentity: "unknown_hidden_blocked",
    });

    expect(resolution.status).toBe("blocked_hidden_info");
    expect(resolution.blocker).toBe("hidden_target_identity_blocked");
  });

  it("keeps side-safe choice option ids stable", () => {
    expect(
      resolveCandidateTargetIdentity({
        actionType: "resolve_choice",
        targetIdentity: "choice:choice_1:option_a",
      }),
    ).toMatchObject({
      status: "complete",
      kind: "choice",
      identity: "choice:choice_1:option_a",
    });
  });

  it("v2 marks no-target candidate actions as irrelevant", () => {
    expect(
      resolveCandidateTargetIdentity({
        actionType: "gain_credit",
        targetIdentity: "unknown_target",
      }),
    ).toMatchObject({
      schemaVersion: "target-identity-resolution-v2",
      status: "irrelevant",
      kind: "none",
      identity: "none",
      playerActionTargetRequired: false,
    });
  });

  it("v2 derives actor-known card references only from redacted snapshot evidence", () => {
    expect(
      resolveCandidateTargetIdentity({
        actionType: "install_card",
        targetIdentity: "unknown_target",
        sourceDefinitionId: 491,
      }),
    ).toMatchObject({
      status: "complete",
      kind: "installedOwnCard",
      identity: "installedOwnCard:actorKnownRef:491",
      sideSafe: true,
      snapshotStable: true,
    });
  });

  it("v2 keeps missing server and choice targets blocked", () => {
    expect(
      resolveCandidateTargetIdentity({
        actionType: "start_run",
        targetIdentity: "server:unknown",
      }).blocker,
    ).toBe("server_target_missing");
    expect(
      resolveCandidateTargetIdentity({
        actionType: "resolve_choice",
        targetIdentity: "choice:unknown",
      }).blocker,
    ).toBe("choice_option_missing");
  });

  it("v2 derives side-safe ability identities when source and ability are present", () => {
    expect(
      resolveCandidateTargetIdentity({
        actionType: "trigger_ability",
        targetIdentity: "unknown_target",
        sourceDefinitionId: 363,
        abilityId: "search_install",
      }),
    ).toMatchObject({
      status: "complete",
      kind: "ability",
      identity: "ability:363:search_install",
    });
  });
});
