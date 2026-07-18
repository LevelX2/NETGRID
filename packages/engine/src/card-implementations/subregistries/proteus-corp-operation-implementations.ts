import type { CardImplementationDefinition } from "../types";
import { proteusCorporateGuardRTempsImplementation } from "../proteus/corp/operations/corporate-guard-r-temps";
import { proteusCreditConsolidationImplementation } from "../proteus/corp/operations/credit-consolidation";
import { proteusDataSiftersImplementation } from "../proteus/corp/operations/data-sifters";
import { proteusEmergencyRigImplementation } from "../proteus/corp/operations/emergency-rig";
import { proteusManhuntImplementation } from "../proteus/corp/operations/manhunt";
import { proteusRentToOwnContractImplementation } from "../proteus/corp/operations/rent-to-own-contract";
import { proteusSchlaghundPointersImplementation } from "../proteus/corp/operations/schlaghund-pointers";
import { proteusUnderworldMoleImplementation } from "../proteus/corp/operations/underworld-mole";

export const PROTEUS_CORP_OPERATION_IMPLEMENTATIONS = [
  proteusCorporateGuardRTempsImplementation,
  proteusCreditConsolidationImplementation,
  proteusDataSiftersImplementation,
  proteusEmergencyRigImplementation,
  proteusManhuntImplementation,
  proteusRentToOwnContractImplementation,
  proteusSchlaghundPointersImplementation,
  proteusUnderworldMoleImplementation,
] as const satisfies readonly CardImplementationDefinition[];
