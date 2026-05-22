import { custodialPositionImplementation } from "../card-implementations/onr-v1/runner/preps/custodial-position";
import { editedShippingManifestsImplementation } from "../card-implementations/onr-v1/runner/preps/edited-shipping-manifests";
import { executiveWiretapsImplementation } from "../card-implementations/onr-v1/runner/preps/executive-wiretaps";
import { lucidrineBoosterDrugImplementation } from "../card-implementations/onr-v1/runner/preps/lucidrine-booster-drug";
import { priorityWreckImplementation } from "../card-implementations/onr-v1/runner/preps/priority-wreck";
import { privateLdlAccessImplementation } from "../card-implementations/onr-v1/runner/preps/private-ldl-access";
import { socialEngineeringImplementation } from "../card-implementations/onr-v1/runner/preps/social-engineering";
import { stumbleThroughWilderspaceImplementation } from "../card-implementations/onr-v1/runner/preps/stumble-through-wilderspace";
import { weatherToFinancePipeImplementation } from "../card-implementations/onr-v1/runner/preps/weather-to-finance-pipe";

export const RD_MULTIACCESS_EVENT_CARD_ID =
  custodialPositionImplementation.cardDefinitionId;

export const HQ_MULTIACCESS_EVENT_CARD_ID =
  executiveWiretapsImplementation.cardDefinitionId;

export const HQ_ACCESS_REPLACEMENT_DRAW_EVENT_CARD_ID =
  editedShippingManifestsImplementation.cardDefinitionId;

export const HQ_RUN_ACCESS_RD_EVENT_CARD_ID =
  privateLdlAccessImplementation.cardDefinitionId;

export const HQ_ACCESS_REPLACEMENT_CREDIT_LOSS_EVENT_CARD_ID =
  weatherToFinancePipeImplementation.cardDefinitionId;

export const RUN_REPLACEMENT_OVERLAP_EVENT_CARD_ID =
  lucidrineBoosterDrugImplementation.cardDefinitionId;

export const RUN_MULTIACCESS_EVENT_CARD_ID =
  priorityWreckImplementation.cardDefinitionId;

export const RUN_ACCESS_PRESSURE_EVENT_CARD_ID =
  socialEngineeringImplementation.cardDefinitionId;

export const TRACE_AWARE_RUN_EVENT_CARD_ID =
  stumbleThroughWilderspaceImplementation.cardDefinitionId;
