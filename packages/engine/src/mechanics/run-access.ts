import { lucidrineBoosterDrugImplementation } from "../card-implementations/onr-v1/runner/preps/lucidrine-booster-drug";
import { socialEngineeringImplementation } from "../card-implementations/onr-v1/runner/preps/social-engineering";
import { stumbleThroughWilderspaceImplementation } from "../card-implementations/onr-v1/runner/preps/stumble-through-wilderspace";

export const RUN_REPLACEMENT_OVERLAP_EVENT_SOURCE =
  lucidrineBoosterDrugImplementation.cardDefinitionId;

export const RUN_ACCESS_PRESSURE_EVENT_SOURCE =
  socialEngineeringImplementation.cardDefinitionId;

export const TRACE_AWARE_RUN_EVENT_SOURCE =
  stumbleThroughWilderspaceImplementation.cardDefinitionId;
