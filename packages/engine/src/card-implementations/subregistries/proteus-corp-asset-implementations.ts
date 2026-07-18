import type { CardImplementationDefinition } from "../types";
import { proteusCybertechThinkTankImplementation } from "../proteus/corp/assets/cybertech-think-tank";
import { proteusDepartmentOfMisinformationImplementation } from "../proteus/corp/assets/department-of-misinformation";
import { proteusGovernmentContractImplementation } from "../proteus/corp/assets/government-contract";
import { proteusExecutiveBootCampImplementation } from "../proteus/corp/assets/executive-boot-camp";
import { proteusLdlTrafficAnalyzersImplementation } from "../proteus/corp/assets/ldl-traffic-analyzers";
import { proteusSirenImplementation } from "../proteus/corp/assets/siren";
import { proteusSydMeyerSuperstoresImplementation } from "../proteus/corp/assets/syd-meyer-superstores";
import { belDigmoAntibodyImplementation } from "../proteus/corp/assets/bel-digmo-antibody";
import { doppelgangerAntibodyImplementation } from "../proteus/corp/assets/doppelganger-antibody";
import { pattelAntibodyImplementation } from "../proteus/corp/assets/pattel-antibody";
import { stereogramAntibodyImplementation } from "../proteus/corp/assets/stereogram-antibody";

export const PROTEUS_CORP_ASSET_IMPLEMENTATIONS = [
  proteusCybertechThinkTankImplementation,
  proteusDepartmentOfMisinformationImplementation,
  proteusGovernmentContractImplementation,
  proteusExecutiveBootCampImplementation,
  proteusLdlTrafficAnalyzersImplementation,
  proteusSirenImplementation,
  proteusSydMeyerSuperstoresImplementation,
  belDigmoAntibodyImplementation,
  doppelgangerAntibodyImplementation,
  pattelAntibodyImplementation,
  stereogramAntibodyImplementation,
] as const satisfies readonly CardImplementationDefinition[];
