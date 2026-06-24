import { cowboySysopImplementation } from "../card-implementations/onr-v1/corp/assets/cowboy-sysop";
import { disinfectantIncImplementation } from "../card-implementations/onr-v1/corp/assets/disinfectant-inc";
import { setupImplementation } from "../card-implementations/onr-v1/corp/assets/setup";
import { trapImplementation } from "../card-implementations/onr-v1/corp/assets/trap";

export const COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID =
  cowboySysopImplementation.cardDefinitionId;

export const DISINFECTANT_VIRUS_COUNTER_ASSET_ID =
  disinfectantIncImplementation.cardDefinitionId;

export const SETUP_ACCESS_AMBUSH_ASSET_SOURCE =
  setupImplementation.cardDefinitionId;

export const TRAP_ACCESS_AMBUSH_ASSET_SOURCE =
  trapImplementation.cardDefinitionId;
