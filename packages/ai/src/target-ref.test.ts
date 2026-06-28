import { describe, expect, it } from "vitest";
import {
  buildTargetRef,
  targetRefFromIdentity,
  targetRefIsCompleteOrIrrelevant,
  targetRefIsRedactionSafe,
} from "./target-ref";

describe("TargetRef v1", () => {
  it("keeps server targets stable", () => {
    expect(buildTargetRef({ kind: "server", serverId: "rd" })).toMatchObject({
      schemaVersion: "target-ref-v1",
      kind: "server",
      identity: "server:rd",
      sideSafe: true,
      snapshotStable: true,
      redactionPolicy: "public",
    });
  });

  it("keeps ICE targets stable by server and position without private definition data", () => {
    const ref = buildTargetRef({ kind: "ice", serverId: "remote_1", position: 2 });

    expect(ref).toMatchObject({
      kind: "ice",
      identity: "ice:remote_1:2",
      redactionPolicy: "public",
    });
    expect(JSON.stringify(ref)).not.toContain("cardInstances");
  });

  it("keeps choice options stable when both ids are present", () => {
    expect(
      buildTargetRef({ kind: "choice", choiceId: "choice_1", optionId: "option_a" }),
    ).toMatchObject({
      kind: "choice",
      identity: "choice:choice_1:option_a",
      sideSafe: true,
    });
  });

  it("blocks hidden targets instead of emitting private references", () => {
    const ref = buildTargetRef({
      kind: "ownInstalled",
      actorSafeRef: "cardInstances.runner.stack.0",
    });

    expect(ref.kind).toBe("hidden_blocked");
    expect(ref.blocker).toBe("hidden_info_marker_detected");
    expect(targetRefIsRedactionSafe(ref)).toBe(true);
    expect(JSON.stringify(ref)).not.toContain("cardInstances");
  });

  it("bounds hidden-info marker detection to exact tokens", () => {
    const ref = buildTargetRef({
      kind: "ownInstalled",
      actorSafeRef: "cardInstancesish.runner.stack.0",
      evidence: ["privatePayloadish_evidence"],
    });

    expect(ref).toMatchObject({
      kind: "ownInstalled",
      identity: "ownInstalled:cardInstancesish.runner.stack.0",
      sideSafe: true,
      snapshotStable: true,
    });
    expect(targetRefIsRedactionSafe({ evidence: ["privatePayloadish_evidence"] })).toBe(true);
  });

  it("maps ability source identities as actor-private side-safe refs", () => {
    const ref = targetRefFromIdentity("ability:self_modifying_code:search_install");

    expect(ref).toMatchObject({
      kind: "abilitySource",
      identity: "abilitySource:self_modifying_code:search_install",
      redactionPolicy: "actor_private",
    });
    expect(targetRefIsCompleteOrIrrelevant(ref)).toBe(true);
  });

  it("turns missing server and choice identities into precise blockers", () => {
    expect(targetRefFromIdentity("server:unknown")).toMatchObject({
      kind: "unknown_unprojected",
      blocker: "server_target_missing",
    });
    expect(targetRefFromIdentity("choice:choice_1:unknown")).toMatchObject({
      kind: "choice",
      blocker: "choice_option_missing",
    });
  });
});
