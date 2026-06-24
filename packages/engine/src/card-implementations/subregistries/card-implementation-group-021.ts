import type { CardImplementationDefinition } from "../types";
import { proteusMarionetteImplementation } from "../proteus/corp/ice/marionette";
import { proteusMastermindImplementation } from "../proteus/corp/ice/mastermind";
import { proteusMisleadingAccessMenusImplementation } from "../proteus/corp/ice/misleading-access-menus";
import { proteusMobileBarricadeImplementation } from "../proteus/corp/ice/mobile-barricade";
import { proteusRoadblockImplementation } from "../proteus/corp/ice/roadblock";
import { proteusSandstormImplementation } from "../proteus/corp/ice/sandstorm";
import { proteusScaffoldingImplementation } from "../proteus/corp/ice/scaffolding";
import { proteusSnowbankImplementation } from "../proteus/corp/ice/snowbank";
import { proteusSphinx2006Implementation } from "../proteus/corp/ice/sphinx-2006";
import { proteusSumo2008Implementation } from "../proteus/corp/ice/sumo-2008";
import { proteusTumblersImplementation } from "../proteus/corp/ice/tumblers";
import { proteusTwistyPassagesImplementation } from "../proteus/corp/ice/twisty-passages";
import { proteusWalkingWallImplementation } from "../proteus/corp/ice/walking-wall";
import { proteusWashedUpSoloConstructImplementation } from "../proteus/corp/ice/washed-up-solo-construct";
import { proteusMinotaurImplementation } from "../proteus/corp/ice/minotaur";
import { proteusRiddlerImplementation } from "../proteus/corp/ice/riddler";
import { proteusHermanRevistaImplementation } from "../proteus/corp/upgrades/herman-revista";
import { proteusCybertechThinkTankImplementation } from "../proteus/corp/assets/cybertech-think-tank";
import { proteusDepartmentOfMisinformationImplementation } from "../proteus/corp/assets/department-of-misinformation";
import { proteusGovernmentContractImplementation } from "../proteus/corp/assets/government-contract";

export const CARD_IMPLEMENTATION_GROUP_021 = [
  proteusMarionetteImplementation,
  proteusMastermindImplementation,
  proteusMisleadingAccessMenusImplementation,
  proteusMobileBarricadeImplementation,
  proteusRoadblockImplementation,
  proteusSandstormImplementation,
  proteusScaffoldingImplementation,
  proteusSnowbankImplementation,
  proteusSphinx2006Implementation,
  proteusSumo2008Implementation,
  proteusTumblersImplementation,
  proteusTwistyPassagesImplementation,
  proteusWalkingWallImplementation,
  proteusWashedUpSoloConstructImplementation,
  proteusMinotaurImplementation,
  proteusRiddlerImplementation,
  proteusHermanRevistaImplementation,
  proteusCybertechThinkTankImplementation,
  proteusDepartmentOfMisinformationImplementation,
  proteusGovernmentContractImplementation,
] as const satisfies readonly CardImplementationDefinition[];
