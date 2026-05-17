import { describe, expect, it } from "vitest";
import {
  findModerationEvidenceRedactionViolations,
  isStandardModeratorAccessAllowed,
  moderationAccessFor,
  MODERATION_DATA_CLASSES,
  MODERATION_RBAC_MATRIX,
  MODERATION_ROLES
} from "./moderation-rbac";

describe("V2.6 moderation RBAC and redaction test harness", () => {
  it("covers every role and data class in the RBAC matrix", () => {
    for (const dataClass of MODERATION_DATA_CLASSES) {
      expect(Object.keys(MODERATION_RBAC_MATRIX[dataClass]).sort()).toEqual([...MODERATION_ROLES].sort());
    }
  });

  it("keeps hidden match data, AI debug and break-glass paths out of standard moderator access", () => {
    expect(moderationAccessFor("moderator", "D0_public_lobby_metadata")).toBe("allow");
    expect(moderationAccessFor("moderator", "D3_public_replay_projection")).toBe("allow");
    expect(moderationAccessFor("moderator", "D4_side_private_projection")).toBe("break_glass");
    expect(moderationAccessFor("moderator", "D5_hidden_match_data")).toBe("deny");
    expect(moderationAccessFor("moderator", "D6_ai_debug_data")).toBe("deny");
    expect(moderationAccessFor("admin", "D5_hidden_match_data")).toBe("break_glass");

    expect(isStandardModeratorAccessAllowed("moderator", "D4_side_private_projection")).toBe(false);
    expect(isStandardModeratorAccessAllowed("admin", "D5_hidden_match_data")).toBe(false);
  });

  it("allows public-safe evidence metadata without private fields", () => {
    expect(
      findModerationEvidenceRedactionViolations({
        reportId: "report_1",
        matchId: "match_1",
        dataClass: "D3_public_replay_projection",
        replay: {
          stateHashAfter: "fnv1a:12345678",
          eventFamily: "run_access",
          hiddenInfoBarrier: true
        },
        audit: {
          action: "evidence_viewed",
          actorRole: "moderator",
          result: "allowed"
        }
      })
    ).toEqual([]);
  });

  it("rejects copied hidden, token, deck and AI debug material as moderation evidence", () => {
    const violations = findModerationEvidenceRedactionViolations({
      dataClass: "D5_hidden_match_data",
      sessionToken: "runner-session-secret",
      tokenHash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      privatePayload: { cardInstances: ["hidden-card"] },
      privateDeckSnapshots: { runner: { cards: [{ cardId: "Hidden Priority Agenda", quantity: 3 }] } },
      AIInput: { DecisionDebug: { beliefState: "side-private" } },
      localPath: "C:\\Users\\Lui\\AppData\\Local\\NetGrid\\moderation.json"
    });

    expect(violations.map((violation) => violation.id)).toEqual(expect.arrayContaining(["raw_token", "token_hash", "deck_private", "hidden_info", "ai_debug", "local_path"]));
  });
});
