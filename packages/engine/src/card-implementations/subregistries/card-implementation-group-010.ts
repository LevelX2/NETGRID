import type { CardImplementationDefinition } from "../types";
import { topRunnersConferenceImplementation } from "../onr-v1/runner/resources/top-runners-conference";
import { traumaTeamImplementation } from "../onr-v1/runner/resources/trauma-team";
import { umbrellaPolicyImplementation } from "../onr-v1/runner/resources/umbrella-policy";
import { artificialSecurityDirectorsImplementation } from "../onr-v1/corp/agendas/artificial-security-directors";
import { aiChiefFinancialOfficerImplementation } from "../onr-v1/corp/agendas/ai-chief-financial-officer";
import { bioweaponsEngineeringImplementation } from "../onr-v1/corp/agendas/bioweapons-engineering";
import { blackIceQualityAssuranceImplementation } from "../onr-v1/corp/agendas/black-ice-quality-assurance";
import { corporateBoonImplementation } from "../onr-v1/corp/agendas/corporate-boon";
import { corporateCoupImplementation } from "../onr-v1/corp/agendas/corporate-coup";
import { corporateDownsizingImplementation } from "../onr-v1/corp/agendas/corporate-downsizing";
import { corporateRetreatImplementation } from "../onr-v1/corp/agendas/corporate-retreat";
import { corporateWarImplementation } from "../onr-v1/corp/agendas/corporate-war";
import { dataFortReclamationImplementation } from "../onr-v1/corp/agendas/data-fort-reclamation";
import { detroitPoliceContractImplementation } from "../onr-v1/corp/agendas/detroit-police-contract";
import { employeeEmpowermentImplementation } from "../onr-v1/corp/agendas/employee-empowerment";
import { encryptionBreakthroughImplementation } from "../onr-v1/corp/agendas/encryption-breakthrough";
import { executiveExtractionImplementation } from "../onr-v1/corp/agendas/executive-extraction";
import { geneticsVisionaryAcquisitionImplementation } from "../onr-v1/corp/agendas/genetics-visionary-acquisition";
import { hostileTakeoverImplementation } from "../onr-v1/corp/agendas/hostile-takeover";
import { iceTransmutationImplementation } from "../onr-v1/corp/agendas/ice-transmutation";

export const CARD_IMPLEMENTATION_GROUP_010 = [
  topRunnersConferenceImplementation,
  traumaTeamImplementation,
  umbrellaPolicyImplementation,
  artificialSecurityDirectorsImplementation,
  aiChiefFinancialOfficerImplementation,
  bioweaponsEngineeringImplementation,
  blackIceQualityAssuranceImplementation,
  corporateBoonImplementation,
  corporateCoupImplementation,
  corporateDownsizingImplementation,
  corporateRetreatImplementation,
  corporateWarImplementation,
  dataFortReclamationImplementation,
  detroitPoliceContractImplementation,
  employeeEmpowermentImplementation,
  encryptionBreakthroughImplementation,
  executiveExtractionImplementation,
  geneticsVisionaryAcquisitionImplementation,
  hostileTakeoverImplementation,
  iceTransmutationImplementation,
] as const satisfies readonly CardImplementationDefinition[];
