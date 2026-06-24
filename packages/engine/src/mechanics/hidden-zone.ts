import { corporateNegotiatingCenterImplementation } from "../card-implementations/onr-v1/corp/assets/corporate-negotiating-center";
import { offSiteBackupsImplementation } from "../card-implementations/onr-v1/corp/operations/off-site-backups";
import { planningConsultantsImplementation } from "../card-implementations/onr-v1/corp/operations/planning-consultants";
import { singaporeCityGridImplementation } from "../card-implementations/onr-v1/corp/upgrades/singapore-city-grid";
import { ifYouWantItDoneRightImplementation } from "../card-implementations/onr-v1/runner/preps/if-you-want-it-done-right";
import { organDonorImplementation } from "../card-implementations/onr-v1/runner/preps/organ-donor";
import { iSpyImplementation } from "../card-implementations/onr-v1/runner/programs/i-spy";
import { mouseImplementation } from "../card-implementations/onr-v1/runner/programs/mouse";
import { seeyaImplementation } from "../card-implementations/onr-v1/runner/programs/seeya";
import { selfModifyingCodeImplementation } from "../card-implementations/onr-v1/runner/programs/self-modifying-code";
import { aujourdhuiImplementation } from "../card-implementations/onr-v1/runner/resources/aujourdhui";
import { nEtoImplementation } from "../card-implementations/onr-v1/runner/resources/n-e-t-o";
import { roninAroundImplementation } from "../card-implementations/onr-v1/runner/resources/ronin-around";
import { theShortCircuitImplementation } from "../card-implementations/onr-v1/runner/resources/the-short-circuit";

export const CORP_HQ_AGENDA_REVEAL_SOURCE =
  corporateNegotiatingCenterImplementation.cardDefinitionId;

export const SERVER_ICE_SWAP_UPGRADE_SOURCE =
  singaporeCityGridImplementation.cardDefinitionId;

export const RUNNER_STACK_TOP5_EVENT_SOURCE =
  ifYouWantItDoneRightImplementation.cardDefinitionId;

export const AUJOURD_OUI_RESOURCE_SOURCE =
  aujourdhuiImplementation.cardDefinitionId;

export const RUNNER_GRIP_TRASH_EVENT_SOURCE =
  organDonorImplementation.cardDefinitionId;

export const CORP_ARCHIVES_TO_HQ_OPERATION_SOURCE =
  offSiteBackupsImplementation.cardDefinitionId;

export const CORP_RD_TOP5_REORDER_OPERATION_SOURCE =
  planningConsultantsImplementation.cardDefinitionId;

export const SERVER_EXPOSE_PROGRAM_SOURCES = new Set([
  mouseImplementation.cardDefinitionId,
  seeyaImplementation.cardDefinitionId,
]);

export const STACK_SEARCH_PROGRAM_SOURCES = new Set([
  selfModifyingCodeImplementation.cardDefinitionId,
  AUJOURD_OUI_RESOURCE_SOURCE,
  nEtoImplementation.cardDefinitionId,
  theShortCircuitImplementation.cardDefinitionId,
]);

export const COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE =
  iSpyImplementation.cardDefinitionId;

export const STACK_TOP_REORDER_RESOURCE_SOURCE =
  roninAroundImplementation.cardDefinitionId;

export const SHORT_CIRCUIT_RESOURCE_SOURCE =
  theShortCircuitImplementation.cardDefinitionId;
