import { describe, expect, it } from "vitest";
import {
  RUNTIME_PROFILE_ENVIRONMENT_VARIABLE,
  TEST_CARD_ENVIRONMENT_VARIABLE,
  resolveTestCardAvailability,
  runtimeProfileFromEnvironment,
  testCardsEnabledFromEnvironment,
} from "./test-card-availability";

describe("test card availability", () => {
  it("is disabled when the backend setting is absent", () => {
    expect(testCardsEnabledFromEnvironment({})).toBe(false);
  });

  it.each(["1", "true", "on", " TRUE "])(
    "accepts the explicit enabled value %s",
    (value) => {
      expect(
        testCardsEnabledFromEnvironment({
          [TEST_CARD_ENVIRONMENT_VARIABLE]: value,
        }),
      ).toBe(true);
    },
  );

  it.each(["0", "false", "off", ""])(
    "accepts the explicit disabled value %s",
    (value) => {
      expect(
        testCardsEnabledFromEnvironment({
          [TEST_CARD_ENVIRONMENT_VARIABLE]: value,
        }),
      ).toBe(false);
    },
  );

  it("fails closed for an unknown value", () => {
    expect(() =>
      testCardsEnabledFromEnvironment({
        [TEST_CARD_ENVIRONMENT_VARIABLE]: "sometimes",
      }),
    ).toThrow("invalid_test_card_availability_configuration");
  });

  it("defaults to the development profile and validates explicit profiles", () => {
    expect(runtimeProfileFromEnvironment({})).toBe("development");
    expect(
      runtimeProfileFromEnvironment({
        [RUNTIME_PROFILE_ENVIRONMENT_VARIABLE]: "release",
      }),
    ).toBe("release");
    expect(() =>
      runtimeProfileFromEnvironment({
        [RUNTIME_PROFILE_ENVIRONMENT_VARIABLE]: "production-ish",
      }),
    ).toThrow("invalid_runtime_profile_configuration");
  });

  it("fails closed when test content is requested in a release profile", () => {
    const releaseEnvironment = {
      [RUNTIME_PROFILE_ENVIRONMENT_VARIABLE]: "release",
      [TEST_CARD_ENVIRONMENT_VARIABLE]: "true",
    };

    expect(() => testCardsEnabledFromEnvironment(releaseEnvironment)).toThrow(
      "test_content_forbidden_in_release_profile",
    );
    expect(() =>
      resolveTestCardAvailability(
        { [RUNTIME_PROFILE_ENVIRONMENT_VARIABLE]: "release" },
        true,
      ),
    ).toThrow("test_content_forbidden_in_release_profile");
    expect(
      resolveTestCardAvailability(
        { [RUNTIME_PROFILE_ENVIRONMENT_VARIABLE]: "release" },
        false,
      ),
    ).toBe(false);
  });
});
