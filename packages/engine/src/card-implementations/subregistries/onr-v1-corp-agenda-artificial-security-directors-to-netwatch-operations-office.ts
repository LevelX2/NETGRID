import type { CardImplementationDefinition } from "../types";
import { artificialSecurityDirectorsImplementation } from "../onr-v1/corp/agendas/artificial-security-directors";
import { aiChiefFinancialOfficerImplementation } from "../onr-v1/corp/agendas/ai-chief-financial-officer";
import { bioweaponsEngineeringImplementation } from "../onr-v1/corp/agendas/bioweapons-engineering";
import { blackIceQualityAssuranceImplementation } from "../onr-v1/corp/agendas/black-ice-quality-assurance";
import { corporateBoonImplementation } from "../onr-v1/corp/agendas/corporate-boon";
import { corporateCoupImplementation } from "../onr-v1/corp/agendas/corporate-coup";
import { corporateDownsizingImplementation } from "../onr-v1/corp/agendas/corporate-downsizing";
import { corporateRetreatImplementation } from "../onr-v1/corp/agendas/corporate-retreat";
import { corporateWarImplementation } from "../onr-v1/corp/agendas/corporate-war";
import { detroitPoliceContractImplementation } from "../onr-v1/corp/agendas/detroit-police-contract";
import { employeeEmpowermentImplementation } from "../onr-v1/corp/agendas/employee-empowerment";
import { encryptionBreakthroughImplementation } from "../onr-v1/corp/agendas/encryption-breakthrough";
import { executiveExtractionImplementation } from "../onr-v1/corp/agendas/executive-extraction";
import { geneticsVisionaryAcquisitionImplementation } from "../onr-v1/corp/agendas/genetics-visionary-acquisition";
import { hostileTakeoverImplementation } from "../onr-v1/corp/agendas/hostile-takeover";
import { iceTransmutationImplementation } from "../onr-v1/corp/agendas/ice-transmutation";
import { mainOfficeRelocationImplementation } from "../onr-v1/corp/agendas/main-office-relocation";
import { marineArcologyImplementation } from "../onr-v1/corp/agendas/marine-arcology";
import { netwatchOperationsOfficeImplementation } from "../onr-v1/corp/agendas/netwatch-operations-office";

export const ONR_V1_CORP_AGENDA_ARTIFICIAL_SECURITY_DIRECTORS_TO_NETWATCH_OPERATIONS_OFFICE_IMPLEMENTATIONS =
  [
    artificialSecurityDirectorsImplementation,
    aiChiefFinancialOfficerImplementation,
    bioweaponsEngineeringImplementation,
    blackIceQualityAssuranceImplementation,
    corporateBoonImplementation,
    corporateCoupImplementation,
    corporateDownsizingImplementation,
    corporateRetreatImplementation,
    corporateWarImplementation,
    detroitPoliceContractImplementation,
    employeeEmpowermentImplementation,
    encryptionBreakthroughImplementation,
    executiveExtractionImplementation,
    geneticsVisionaryAcquisitionImplementation,
    hostileTakeoverImplementation,
    iceTransmutationImplementation,
    mainOfficeRelocationImplementation,
    marineArcologyImplementation,
    netwatchOperationsOfficeImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
