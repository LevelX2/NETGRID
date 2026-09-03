export const TEST_CARD_SET_ID = "testset";
export const TEST_CARD_ENVIRONMENT_VARIABLE = "NETGRID_ENABLE_TEST_CARDS";
export const RUNTIME_PROFILE_ENVIRONMENT_VARIABLE = "NETGRID_RUNTIME_PROFILE";
export type RuntimeProfile = "development" | "release";

export function runtimeProfileFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): RuntimeProfile {
  const raw = environment[RUNTIME_PROFILE_ENVIRONMENT_VARIABLE]
    ?.trim()
    .toLowerCase();
  if (raw === undefined || raw === "" || raw === "development")
    return "development";
  if (raw === "release") return "release";
  throw new Error("invalid_runtime_profile_configuration");
}

export function testCardsEnabledFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  return resolveTestCardAvailability(environment);
}

export function resolveTestCardAvailability(
  environment: Readonly<Record<string, string | undefined>>,
  override?: boolean,
): boolean {
  const raw = environment[TEST_CARD_ENVIRONMENT_VARIABLE]?.trim().toLowerCase();
  let enabled: boolean;
  if (
    raw === undefined ||
    raw === "" ||
    raw === "0" ||
    raw === "false" ||
    raw === "off"
  )
    enabled = false;
  else if (raw === "1" || raw === "true" || raw === "on") enabled = true;
  else throw new Error("invalid_test_card_availability_configuration");

  const requested = override ?? enabled;
  if (runtimeProfileFromEnvironment(environment) === "release" && requested)
    throw new Error("test_content_forbidden_in_release_profile");
  return requested;
}
