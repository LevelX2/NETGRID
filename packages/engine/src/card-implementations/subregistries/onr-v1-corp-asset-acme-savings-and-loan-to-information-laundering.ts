import type { CardImplementationDefinition } from "../types";
import { acmeSavingsAndLoanImplementation } from "../onr-v1/corp/assets/acme-savings-and-loan";
import { bbsWhisperingCampaignImplementation } from "../onr-v1/corp/assets/bbs-whispering-campaign";
import { bloodCatImplementation } from "../onr-v1/corp/assets/blood-cat";
import { braindanceCampaignImplementation } from "../onr-v1/corp/assets/braindance-campaign";
import { chicagoBranchImplementation } from "../onr-v1/corp/assets/chicago-branch";
import { citySurveillanceImplementation } from "../onr-v1/corp/assets/city-surveillance";
import { corporateNegotiatingCenterImplementation } from "../onr-v1/corp/assets/corporate-negotiating-center";
import { hardwareTrashByAdvancementAssetImplementation } from "../onr-v1/corp/assets/corprunners-shattered-remains";
import { cowboySysopImplementation } from "../onr-v1/corp/assets/cowboy-sysop";
import { departmentOfTruthEnhancementImplementation } from "../onr-v1/corp/assets/department-of-truth-enhancement";
import { disinfectantIncImplementation } from "../onr-v1/corp/assets/disinfectant-inc";
import { encoderIncImplementation } from "../onr-v1/corp/assets/encoder-inc";
import { esaContractImplementation } from "../onr-v1/corp/assets/esa-contract";
import { euromarketConsortiumImplementation } from "../onr-v1/corp/assets/euromarket-consortium";
import { programTrashByAdvancementAssetImplementation } from "../onr-v1/corp/assets/experimental-ai";
import { fortressArchitectsImplementation } from "../onr-v1/corp/assets/fortress-architects";
import { holovidCampaignImplementation } from "../onr-v1/corp/assets/holovid-campaign";
import { hackerTrackerCentralImplementation } from "../onr-v1/corp/assets/hacker-tracker-central";
import { informationLaunderingImplementation } from "../onr-v1/corp/assets/information-laundering";

export const ONR_V1_CORP_ASSET_ACME_SAVINGS_AND_LOAN_TO_INFORMATION_LAUNDERING_IMPLEMENTATIONS =
  [
    acmeSavingsAndLoanImplementation,
    bbsWhisperingCampaignImplementation,
    bloodCatImplementation,
    braindanceCampaignImplementation,
    chicagoBranchImplementation,
    citySurveillanceImplementation,
    corporateNegotiatingCenterImplementation,
    hardwareTrashByAdvancementAssetImplementation,
    cowboySysopImplementation,
    departmentOfTruthEnhancementImplementation,
    disinfectantIncImplementation,
    encoderIncImplementation,
    esaContractImplementation,
    euromarketConsortiumImplementation,
    programTrashByAdvancementAssetImplementation,
    fortressArchitectsImplementation,
    holovidCampaignImplementation,
    hackerTrackerCentralImplementation,
    informationLaunderingImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
