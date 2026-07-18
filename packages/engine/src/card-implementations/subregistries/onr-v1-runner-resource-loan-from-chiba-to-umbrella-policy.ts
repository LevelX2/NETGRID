import type { CardImplementationDefinition } from "../types";
import { loanFromChibaImplementation } from "../onr-v1/runner/resources/loan-from-chiba";
import { nEtoImplementation } from "../onr-v1/runner/resources/n-e-t-o";
import { nomadAlliesImplementation } from "../onr-v1/runner/resources/nomad-allies";
import { preyingMantisImplementation } from "../onr-v1/runner/resources/preying-mantis";
import { questForCattekinImplementation } from "../onr-v1/runner/resources/quest-for-cattekin";
import { roninAroundImplementation } from "../onr-v1/runner/resources/ronin-around";
import { wilsonWeeflerunnerApprenticeImplementation } from "../onr-v1/runner/resources/wilson-weeflerunner-apprentice";
import { riggedInvestmentsImplementation } from "../onr-v1/runner/resources/rigged-investments";
import { restrictiveNetZoningImplementation } from "../onr-v1/runner/resources/restrictive-net-zoning";
import { shortTermContractImplementation } from "../onr-v1/runner/resources/short-term-contract";
import { siliconSaloonFranchiseImplementation } from "../onr-v1/runner/resources/silicon-saloon-franchise";
import { smithsPawnshopImplementation } from "../onr-v1/runner/resources/smiths-pawnshop";
import { technicianLoverImplementation } from "../onr-v1/runner/resources/technician-lover";
import { submarineUplinkImplementation } from "../onr-v1/runner/resources/submarine-uplink";
import { theSpringboardImplementation } from "../onr-v1/runner/resources/the-springboard";
import { theShortCircuitImplementation } from "../onr-v1/runner/resources/the-short-circuit";
import { theShellTradersImplementation } from "../onr-v1/runner/resources/the-shell-traders";
import { topRunnersConferenceImplementation } from "../onr-v1/runner/resources/top-runners-conference";
import { traumaTeamImplementation } from "../onr-v1/runner/resources/trauma-team";
import { umbrellaPolicyImplementation } from "../onr-v1/runner/resources/umbrella-policy";

export const ONR_V1_RUNNER_RESOURCE_LOAN_FROM_CHIBA_TO_UMBRELLA_POLICY_IMPLEMENTATIONS =
  [
    loanFromChibaImplementation,
    nEtoImplementation,
    nomadAlliesImplementation,
    preyingMantisImplementation,
    questForCattekinImplementation,
    roninAroundImplementation,
    wilsonWeeflerunnerApprenticeImplementation,
    riggedInvestmentsImplementation,
    restrictiveNetZoningImplementation,
    shortTermContractImplementation,
    siliconSaloonFranchiseImplementation,
    smithsPawnshopImplementation,
    technicianLoverImplementation,
    submarineUplinkImplementation,
    theSpringboardImplementation,
    theShortCircuitImplementation,
    theShellTradersImplementation,
    topRunnersConferenceImplementation,
    traumaTeamImplementation,
    umbrellaPolicyImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
