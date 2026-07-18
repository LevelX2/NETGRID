import type { CardImplementationDefinition } from "../types";
import { iGotARockImplementation } from "../onr-v1/corp/assets/i-got-a-rock";
import { investmentFirmImplementation } from "../onr-v1/corp/assets/investment-firm";
import { krumzImplementation } from "../onr-v1/corp/assets/krumz";
import { nevinyrralImplementation } from "../onr-v1/corp/assets/nevinyrral";
import { newsgroupTauntingImplementation } from "../onr-v1/corp/assets/newsgroup-taunting";
import { omniscienceFoundationImplementation } from "../onr-v1/corp/assets/omniscience-foundation";
import { pacificaRegionalAiImplementation } from "../onr-v1/corp/assets/pacifica-regional-ai";
import { reschedulerImplementation } from "../onr-v1/corp/assets/rescheduler";
import { schlaghundImplementation } from "../onr-v1/corp/assets/schlaghund";
import { skaldervikenSaBetaTestSiteImplementation } from "../onr-v1/corp/assets/skalderviken-sa-beta-test-site";
import { soloSquadImplementation } from "../onr-v1/corp/assets/solo-squad";
import { remoteFacilityImplementation } from "../onr-v1/corp/assets/remote-facility";
import { rockerboyPromotionImplementation } from "../onr-v1/corp/assets/rockerboy-promotion";
import { rustbeltHqBranchImplementation } from "../onr-v1/corp/assets/rustbelt-hq-branch";
import { setupImplementation } from "../onr-v1/corp/assets/setup";
import { vaporOpsImplementation } from "../onr-v1/corp/assets/vapor-ops";
import { trapImplementation } from "../onr-v1/corp/assets/trap";
import { advancementCoreDamageAssetImplementation } from "../onr-v1/corp/assets/vacant-soulkiller";
import { advancementNetDamageAssetImplementation } from "../onr-v1/corp/assets/virus-test-site";
import { southAfricanMiningCorpImplementation } from "../onr-v1/corp/assets/south-african-mining-corp";

export const ONR_V1_CORP_ASSET_I_GOT_A_ROCK_TO_SOUTH_AFRICAN_MINING_CORP_IMPLEMENTATIONS =
  [
    iGotARockImplementation,
    investmentFirmImplementation,
    krumzImplementation,
    nevinyrralImplementation,
    newsgroupTauntingImplementation,
    omniscienceFoundationImplementation,
    pacificaRegionalAiImplementation,
    reschedulerImplementation,
    schlaghundImplementation,
    skaldervikenSaBetaTestSiteImplementation,
    soloSquadImplementation,
    remoteFacilityImplementation,
    rockerboyPromotionImplementation,
    rustbeltHqBranchImplementation,
    setupImplementation,
    vaporOpsImplementation,
    trapImplementation,
    advancementCoreDamageAssetImplementation,
    advancementNetDamageAssetImplementation,
    southAfricanMiningCorpImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
