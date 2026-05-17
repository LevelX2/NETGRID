import { describe, expect, it } from "vitest";
import {
  findObservabilityRedactionViolations,
  OBSERVABILITY_ALLOWED_TECHNICAL_LABELS,
  redactSensitiveText,
  redactedHealth,
  type DeploymentConfig
} from "./internet-hardening";

describe("V2.7 observability redaction baseline", () => {
  it("detects forbidden operational data patterns before they become labels or logs", () => {
    const violations = findObservabilityRedactionViolations({
      sessionToken: "runner-session-secret",
      cookie: "ng_account_session=account-cookie-secret",
      sessionTokenHash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      deckHash: "fnv1a:deadbeef",
      cards: [{ cardId: "Hidden Priority Agenda", quantity: 3 }],
      privatePayload: { cardInstances: ["hidden-card"] },
      AIInput: { DecisionDebug: { beliefState: "side-private" } },
      localPath: "C:\\Users\\Lui\\AppData\\Local\\NetGrid\\Decks\\deck.json"
    });

    expect(violations.map((violation) => violation.id)).toEqual(expect.arrayContaining(["raw_token", "token_hash", "deck_private", "hidden_info", "ai_debug", "local_path"]));
  });

  it("allows the explicitly approved technical label set", () => {
    expect(OBSERVABILITY_ALLOWED_TECHNICAL_LABELS).toEqual(expect.arrayContaining(["rulesBaseline", "cardPoolVersion", "formatProfileId", "aiVersion", "rateLimitCategory"]));
    expect(
      findObservabilityRedactionViolations({
        rulesBaseline: "rules-baseline-mvp-0.99",
        cardPoolVersion: "private-local-onr-v1",
        formatProfileId: "netgrid_private_local_v1",
        aiVersion: "plan-v2",
        release: "V2.7",
        profile: "private_internet",
        rateLimitCategory: "token_probe",
        errorCode: "rate_limited",
        latencyBucket: "100-250ms"
      })
    ).toEqual([]);
  });

  it("keeps redacted health and sanitized log text inside the baseline", () => {
    const config: DeploymentConfig = {
      profile: "private_internet",
      webBaseUrl: "https://netgrid.example",
      serverBaseUrl: "https://netgrid.example",
      allowedOrigins: ["https://netgrid.example"],
      tokenSalt: "private-secret",
      rateLimitProfile: "private_internet",
      trustProxyHeaders: false,
      healthDetail: "safe"
    };
    const health = redactedHealth(
      {
        ok: true,
        kind: "sqlite",
        schemaVersion: 1,
        storageFormat: "netgrid_multiplayer_sqlite",
        database: "netgrid.sqlite",
        matchCount: 12,
        legacyImport: "completed"
      },
      config
    );

    expect(findObservabilityRedactionViolations(health)).toEqual([]);

    const sanitized = redactSensitiveText(
      `ng_account_session=account-cookie-secret sessionToken=runner-session-secret deckHash=fnv1a:deadbeef AIInput DecisionDebug privatePayload FullState C:\\Users\\Lui\\deck.json`
    );
    expect(sanitized).not.toMatch(/account-cookie-secret|runner-session-secret|fnv1a:deadbeef|AIInput|DecisionDebug|privatePayload|FullState|C:\\Users\\Lui/i);
    expect(findObservabilityRedactionViolations(sanitized)).toEqual([]);
  });
});
