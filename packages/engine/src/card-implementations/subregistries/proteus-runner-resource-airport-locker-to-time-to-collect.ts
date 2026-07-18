import type { CardImplementationDefinition } from "../types";
import { proteusAirportLockerImplementation } from "../proteus/runner/resources/airport-locker";
import { proteusBargainWithViacoxImplementation } from "../proteus/runner/resources/bargain-with-viacox";
import { proteusBackDoorToNetwatchImplementation } from "../proteus/runner/resources/back-door-to-netwatch";
import { proteusBackDoorToRivalsImplementation } from "../proteus/runner/resources/back-door-to-rivals";
import { proteusBoltHoleImplementation } from "../proteus/runner/resources/bolt-hole";
import { proteusChibaBankAccountImplementation } from "../proteus/runner/resources/chiba-bank-account";
import { proteusCreditSubversionImplementation } from "../proteus/runner/resources/credit-subversion";
import { proteusDeathFromAboveImplementation } from "../proteus/runner/resources/death-from-above";
import { proteusExpendableFamilyMemberImplementation } from "../proteus/runner/resources/expendable-family-member";
import { proteusGetReadyToRumbleImplementation } from "../proteus/runner/resources/get-ready-to-rumble";
import { proteusHqMoleImplementation } from "../proteus/runner/resources/hq-mole";
import { proteusLiberatedSavingsAccountImplementation } from "../proteus/runner/resources/liberated-savings-account";
import { proteusMercenarySubcontractImplementation } from "../proteus/runner/resources/mercenary-subcontract";
import { proteusPrecisionBriberyImplementation } from "../proteus/runner/resources/precision-bribery";
import { proteusRAndDMoleImplementation } from "../proteus/runner/resources/r-and-d-mole";
import { proteusRunnerSenseiImplementation } from "../proteus/runner/resources/runner-sensei";
import { proteusSimulacrumImplementation } from "../proteus/runner/resources/simulacrum";
import { proteusStreetwareDistributorImplementation } from "../proteus/runner/resources/streetware-distributor";
import { proteusSwissBankAccountImplementation } from "../proteus/runner/resources/swiss-bank-account";
import { proteusTimeToCollectImplementation } from "../proteus/runner/resources/time-to-collect";

export const PROTEUS_RUNNER_RESOURCE_AIRPORT_LOCKER_TO_TIME_TO_COLLECT_IMPLEMENTATIONS =
  [
    proteusAirportLockerImplementation,
    proteusBargainWithViacoxImplementation,
    proteusBackDoorToNetwatchImplementation,
    proteusBackDoorToRivalsImplementation,
    proteusBoltHoleImplementation,
    proteusChibaBankAccountImplementation,
    proteusCreditSubversionImplementation,
    proteusDeathFromAboveImplementation,
    proteusExpendableFamilyMemberImplementation,
    proteusGetReadyToRumbleImplementation,
    proteusHqMoleImplementation,
    proteusLiberatedSavingsAccountImplementation,
    proteusMercenarySubcontractImplementation,
    proteusPrecisionBriberyImplementation,
    proteusRAndDMoleImplementation,
    proteusRunnerSenseiImplementation,
    proteusSimulacrumImplementation,
    proteusStreetwareDistributorImplementation,
    proteusSwissBankAccountImplementation,
    proteusTimeToCollectImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
