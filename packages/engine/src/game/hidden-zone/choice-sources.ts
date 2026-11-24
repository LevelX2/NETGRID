const HIDDEN_ZONE_CHOICE_PREFIX = "hidden_zone.";
const SUCCESSFUL_RUN_FORT_ICE_REORDER_CHOICE_PREFIX =
  "hidden_zone.successful_run_fort_ice_reorder:";
const SECRET_SPEND_GUESS_TARGETED_BYPASS_RUN_CHOICE_PREFIX =
  "hidden_zone.secret_spend_guess_then_targeted_bypass_run.";
const CONCEAL_AND_REORDER_INSTALLED_ICE_CHOICE_PREFIX =
  "hidden_zone.conceal_and_reorder_installed_ice:";

// Hidden replacement choices use functional source prefixes; card files may
// name cards, but runtime replay/stale guards should describe the reusable path.
export function isHiddenZoneChoiceSource(source: string): boolean {
  return source.startsWith(HIDDEN_ZONE_CHOICE_PREFIX);
}

export function isSuccessfulRunFortIceReorderChoiceSource(
  source: string,
): boolean {
  return source.startsWith(SUCCESSFUL_RUN_FORT_ICE_REORDER_CHOICE_PREFIX);
}

export function isSecretSpendGuessTargetedBypassRunChoiceSource(
  source: string,
): boolean {
  return source.startsWith(
    SECRET_SPEND_GUESS_TARGETED_BYPASS_RUN_CHOICE_PREFIX,
  );
}

export function isConcealAndReorderInstalledIceChoiceSource(
  source: string,
): boolean {
  return source.startsWith(CONCEAL_AND_REORDER_INSTALLED_ICE_CHOICE_PREFIX);
}
