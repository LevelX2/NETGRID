export const TEST_CARD_SET_ID = "testset";
export const TEST_CARD_ENVIRONMENT_VARIABLE = "NETGRID_ENABLE_TEST_CARDS";

export function testCardsEnabledFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  const raw = environment[TEST_CARD_ENVIRONMENT_VARIABLE]?.trim().toLowerCase();
  if (
    raw === undefined ||
    raw === "" ||
    raw === "0" ||
    raw === "false" ||
    raw === "off"
  )
    return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  throw new Error("invalid_test_card_availability_configuration");
}
