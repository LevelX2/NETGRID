import { describe, expect, it } from "vitest";
import {
  resolveCandidateTargetIdentity,
  resolveTargetIdentity,
} from "./target-identity-resolver";

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
        sourceDefinitionId: "Wall of Static",
      }),
    ).toMatchObject({
      status: "complete",
      kind: "installedOwnCard",
      identity: "installedOwnCard:actorKnownRef:wall_of_static",
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
        sourceDefinitionId: "Self-Modifying Code",
        abilityId: "search_install",
      }),
    ).toMatchObject({
      status: "complete",
      kind: "ability",
      identity: "ability:self_modifying_code:search_install",
    });
  });
});
