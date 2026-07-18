import type { CardImplementationDefinition } from "../types";
import { punitiveCounterstrikeImplementation } from "../onr-v1/corp/operations/punitive-counterstrike";
import { scorchedEarthImplementation } from "../onr-v1/corp/operations/scorched-earth";
import { silverLiningRecoveryProtocolImplementation } from "../onr-v1/corp/operations/silver-lining-recovery-protocol";
import { systematicLayoffsImplementation } from "../onr-v1/corp/operations/systematic-layoffs";
import { teamRestructuringImplementation } from "../onr-v1/corp/operations/team-restructuring";
import { trojanHorseImplementation } from "../onr-v1/corp/operations/trojan-horse";
import { urbanRenewalImplementation } from "../onr-v1/corp/operations/urban-renewal";

export const ONR_V1_CORP_OPERATION_PUNITIVE_COUNTERSTRIKE_TO_URBAN_RENEWAL_IMPLEMENTATIONS =
  [
    punitiveCounterstrikeImplementation,
    scorchedEarthImplementation,
    silverLiningRecoveryProtocolImplementation,
    systematicLayoffsImplementation,
    teamRestructuringImplementation,
    trojanHorseImplementation,
    urbanRenewalImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
