import { describe, expect, it } from "vitest";
import {
  assertSemanticObjectSideSafe,
  containsForbiddenSemanticMarker,
  findForbiddenSemanticPath,
  redactSemanticString,
} from "./semantic-redaction";

describe("semantic-redaction", () => {
  it("detects forbidden object keys case-insensitively", () => {
    const value = {
      safe: {
        PrivatePayload: { opponentHand: ["hidden"] },
      },
    };

    expect(containsForbiddenSemanticMarker(value)).toBe(true);
    expect(findForbiddenSemanticPath(value)).toBe("value.safe.PrivatePayload");
  });

  it("detects forbidden string values case-insensitively", () => {
    const value = {
      evidence: ["safe", "FULLGAMESTATE:opponent_hand"],
    };

    expect(containsForbiddenSemanticMarker(value)).toBe(true);
    expect(findForbiddenSemanticPath(value)).toBe("value.evidence[1]");
  });

  it("redacts unsafe report strings and preserves safe strings", () => {
    expect(redactSemanticString("privatePayload_bad_reason")).toBe("[redacted]");
    expect(redactSemanticString("PRIvatePAYload_bad_reason")).toBe(
      "[redacted]",
    );
    expect(redactSemanticString("cardInstances:runner_grip")).toBe(
      "[redacted]",
    );
    expect(redactSemanticString("deckOrder:top_card")).toBe("[redacted]");
    expect(redactSemanticString("sessionToken:abc")).toBe("[redacted]");
    expect(redactSemanticString("runtime_action_legal:true")).toBe(
      "runtime_action_legal:true",
    );
    expect(redactSemanticString("remote_1:known_payoff")).toBe(
      "remote_1:known_payoff",
    );
    expect(redactSemanticString("server_1:central")).toBe("server_1:central");
    expect(redactSemanticString("scenario_1:fixture")).toBe(
      "scenario_1:fixture",
    );
  });

  it("bounds forbidden semantic marker detection to exact tokens", () => {
    expect(redactSemanticString("privatePayloadish_bad_reason")).toBe(
      "privatePayloadish_bad_reason",
    );
    expect(
      containsForbiddenSemanticMarker({
        privatePayloadish: "visible diagnostic noise",
      }),
    ).toBe(false);
  });

  it("throws for unsafe semantic objects with a caller label", () => {
    expect(() =>
      assertSemanticObjectSideSafe(
        { trace: { evidence: ["hiddenRemoteIdentity:remote_1"] } },
        "SemanticTrace",
      ),
    ).toThrow(/SemanticTrace contains forbidden hidden-info marker/);
  });

  it("accepts side-safe semantic objects", () => {
    expect(() =>
      assertSemanticObjectSideSafe(
        { trace: { evidence: ["server_kind:remote"] } },
        "SemanticTrace",
      ),
    ).not.toThrow();
  });
});
