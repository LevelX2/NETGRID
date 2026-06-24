import type { CardImplementationDefinition } from "../types";
import { proteusManhuntImplementation } from "../proteus/corp/operations/manhunt";
import { proteusRentToOwnContractImplementation } from "../proteus/corp/operations/rent-to-own-contract";
import { proteusSchlaghundPointersImplementation } from "../proteus/corp/operations/schlaghund-pointers";
import { proteusUnderworldMoleImplementation } from "../proteus/corp/operations/underworld-mole";
import { proteusToughoniumWallImplementation } from "../proteus/corp/ice/toughonium-wall";
import { proteusBugZapperImplementation } from "../proteus/corp/ice/bug-zapper";
import { proteusCaryatidImplementation } from "../proteus/corp/ice/caryatid";
import { proteusColonelFailureImplementation } from "../proteus/corp/ice/colonel-failure";
import { proteusCreditBlocksImplementation } from "../proteus/corp/ice/credit-blocks";
import { proteusDatacombImplementation } from "../proteus/corp/ice/datacomb";
import { proteusDeathYoYoImplementation } from "../proteus/corp/ice/death-yo-yo";
import { proteusDigicondaImplementation } from "../proteus/corp/ice/digiconda";
import { proteusDogPileImplementation } from "../proteus/corp/ice/dog-pile";
import { proteusFoodFightImplementation } from "../proteus/corp/ice/food-fight";
import { proteusGalateaImplementation } from "../proteus/corp/ice/galatea";
import { proteusGatekeeperImplementation } from "../proteus/corp/ice/gatekeeper";
import { proteusHomingMissileImplementation } from "../proteus/corp/ice/homing-missile";
import { proteusHuntingPackImplementation } from "../proteus/corp/ice/hunting-pack";
import { proteusIcebergImplementation } from "../proteus/corp/ice/iceberg";
import { proteusLesserArcanaImplementation } from "../proteus/corp/ice/lesser-arcana";

export const CARD_IMPLEMENTATION_GROUP_020 = [
  proteusManhuntImplementation,
  proteusRentToOwnContractImplementation,
  proteusSchlaghundPointersImplementation,
  proteusUnderworldMoleImplementation,
  proteusToughoniumWallImplementation,
  proteusBugZapperImplementation,
  proteusCaryatidImplementation,
  proteusColonelFailureImplementation,
  proteusCreditBlocksImplementation,
  proteusDatacombImplementation,
  proteusDeathYoYoImplementation,
  proteusDigicondaImplementation,
  proteusDogPileImplementation,
  proteusFoodFightImplementation,
  proteusGalateaImplementation,
  proteusGatekeeperImplementation,
  proteusHomingMissileImplementation,
  proteusHuntingPackImplementation,
  proteusIcebergImplementation,
  proteusLesserArcanaImplementation,
] as const satisfies readonly CardImplementationDefinition[];
