import { bloodCatImplementation } from "../card-implementations/onr-v1/corp/assets/blood-cat";
import {
  DR_DREFF_COUNTER_RUN_TAX_UPGRADE_ID,
  OMNI_KISMET_TAG_CONDITION_UPGRADE_ID,
  PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
  TWENTY_FOUR_HOUR_SURVEILLANCE_RUN_TAX_UPGRADE_ID,
} from "./server-upgrades";

export const TRACE_ASSET_CARD_IDS = new Set([
  bloodCatImplementation.cardDefinitionId,
]);

export const RUN_TAX_UPGRADE_CARD_IDS = new Set([
  DR_DREFF_COUNTER_RUN_TAX_UPGRADE_ID,
  TWENTY_FOUR_HOUR_SURVEILLANCE_RUN_TAX_UPGRADE_ID,
]);

export const TAG_CONDITION_UPGRADE_CARD_IDS = new Set([
  OMNI_KISMET_TAG_CONDITION_UPGRADE_ID,
  PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
]);
