import { describe, expect, it } from "vitest";
import {
  TEST_CARD_ENVIRONMENT_VARIABLE,
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
});
