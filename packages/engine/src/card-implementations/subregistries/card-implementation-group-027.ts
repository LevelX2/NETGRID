import type { CardImplementationDefinition } from "../types";
import { proteusRAndDMoleImplementation } from "../proteus/runner/resources/r-and-d-mole";
import { proteusRunnerSenseiImplementation } from "../proteus/runner/resources/runner-sensei";
import { proteusSimulacrumImplementation } from "../proteus/runner/resources/simulacrum";
import { proteusStreetwareDistributorImplementation } from "../proteus/runner/resources/streetware-distributor";
import { proteusSwissBankAccountImplementation } from "../proteus/runner/resources/swiss-bank-account";
import { proteusTimeToCollectImplementation } from "../proteus/runner/resources/time-to-collect";
import { proteusWiredSwitchboardImplementation } from "../proteus/runner/resources/wired-switchboard";

export const CARD_IMPLEMENTATION_GROUP_027 = [
  proteusRAndDMoleImplementation,
  proteusRunnerSenseiImplementation,
  proteusSimulacrumImplementation,
  proteusStreetwareDistributorImplementation,
  proteusSwissBankAccountImplementation,
  proteusTimeToCollectImplementation,
  proteusWiredSwitchboardImplementation,
] as const satisfies readonly CardImplementationDefinition[];
