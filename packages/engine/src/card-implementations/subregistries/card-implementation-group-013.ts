import type { CardImplementationDefinition } from "../types";
import { teamRestructuringImplementation } from "../onr-v1/corp/operations/team-restructuring";
import { trojanHorseImplementation } from "../onr-v1/corp/operations/trojan-horse";
import { urbanRenewalImplementation } from "../onr-v1/corp/operations/urban-renewal";
import { acmeSavingsAndLoanImplementation } from "../onr-v1/corp/assets/acme-savings-and-loan";
import { bbsWhisperingCampaignImplementation } from "../onr-v1/corp/assets/bbs-whispering-campaign";
import { bloodCatImplementation } from "../onr-v1/corp/assets/blood-cat";
import { braindanceCampaignImplementation } from "../onr-v1/corp/assets/braindance-campaign";
import { chicagoBranchImplementation } from "../onr-v1/corp/assets/chicago-branch";
import { citySurveillanceImplementation } from "../onr-v1/corp/assets/city-surveillance";
import { corporateNegotiatingCenterImplementation } from "../onr-v1/corp/assets/corporate-negotiating-center";
import { hardwareTrashByAdvancementAssetImplementation } from "../onr-v1/corp/assets/corprunners-shattered-remains";
import { cowboySysopImplementation } from "../onr-v1/corp/assets/cowboy-sysop";
import { dataMasonsHostingImplementation } from "../onr-v1/corp/assets/data-masons-hosting";
import { departmentOfTruthEnhancementImplementation } from "../onr-v1/corp/assets/department-of-truth-enhancement";
import { disinfectantIncImplementation } from "../onr-v1/corp/assets/disinfectant-inc";
import { encoderIncImplementation } from "../onr-v1/corp/assets/encoder-inc";
import { esaContractImplementation } from "../onr-v1/corp/assets/esa-contract";
import { euromarketConsortiumImplementation } from "../onr-v1/corp/assets/euromarket-consortium";
import { programTrashByAdvancementAssetImplementation } from "../onr-v1/corp/assets/experimental-ai";
import { fortressArchitectsImplementation } from "../onr-v1/corp/assets/fortress-architects";

export const CARD_IMPLEMENTATION_GROUP_013 = [
  teamRestructuringImplementation,
  trojanHorseImplementation,
  urbanRenewalImplementation,
  acmeSavingsAndLoanImplementation,
  bbsWhisperingCampaignImplementation,
  bloodCatImplementation,
  braindanceCampaignImplementation,
  chicagoBranchImplementation,
  citySurveillanceImplementation,
  corporateNegotiatingCenterImplementation,
  hardwareTrashByAdvancementAssetImplementation,
  cowboySysopImplementation,
  dataMasonsHostingImplementation,
  departmentOfTruthEnhancementImplementation,
  disinfectantIncImplementation,
  encoderIncImplementation,
  esaContractImplementation,
  euromarketConsortiumImplementation,
  programTrashByAdvancementAssetImplementation,
  fortressArchitectsImplementation,
] as const satisfies readonly CardImplementationDefinition[];
