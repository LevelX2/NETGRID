import type { CardImplementationDefinition } from "../types";
import { fangTwoPointZeroImplementation } from "../onr-v1/corp/ice/fang-2-0";
import { fatalAttractorImplementation } from "../onr-v1/corp/ice/fatal-attractor";
import { fetchFourPointZeroPointOneImplementation } from "../onr-v1/corp/ice/fetch-4-0-1";
import { filterImplementation } from "../onr-v1/corp/ice/filter";
import { fireWallImplementation } from "../onr-v1/corp/ice/fire-wall";
import { fragmentationStormImplementation } from "../onr-v1/corp/ice/fragmentation-storm";
import { hauntingInquisitionImplementation } from "../onr-v1/corp/ice/haunting-inquisition";
import { homewreckerImplementation } from "../onr-v1/corp/ice/homewrecker";
import { hunterImplementation } from "../onr-v1/corp/ice/hunter";
import { icePickWillieImplementation } from "../onr-v1/corp/ice/ice-pick-willie";
import { jackAttackImplementation } from "../onr-v1/corp/ice/jack-attack";
import { keeperImplementation } from "../onr-v1/corp/ice/keeper";
import { laserWireImplementation } from "../onr-v1/corp/ice/laser-wire";
import { licheImplementation } from "../onr-v1/corp/ice/liche";
import { mastiffImplementation } from "../onr-v1/corp/ice/mastiff";
import { mazerImplementation } from "../onr-v1/corp/ice/mazer";
import { nerveLabyrinthImplementation } from "../onr-v1/corp/ice/nerve-labyrinth";
import { neuralBladeImplementation } from "../onr-v1/corp/ice/neural-blade";
import { piInTheFaceImplementation } from "../onr-v1/corp/ice/pi-in-the-face";
import { pocketVirtualRealityImplementation } from "../onr-v1/corp/ice/pocket-virtual-reality";

export const ONR_V1_CORP_ICE_FANG_2_0_TO_POCKET_VIRTUAL_REALITY_IMPLEMENTATIONS =
  [
    fangTwoPointZeroImplementation,
    fatalAttractorImplementation,
    fetchFourPointZeroPointOneImplementation,
    filterImplementation,
    fireWallImplementation,
    fragmentationStormImplementation,
    hauntingInquisitionImplementation,
    homewreckerImplementation,
    hunterImplementation,
    icePickWillieImplementation,
    jackAttackImplementation,
    keeperImplementation,
    laserWireImplementation,
    licheImplementation,
    mastiffImplementation,
    mazerImplementation,
    nerveLabyrinthImplementation,
    neuralBladeImplementation,
    piInTheFaceImplementation,
    pocketVirtualRealityImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
