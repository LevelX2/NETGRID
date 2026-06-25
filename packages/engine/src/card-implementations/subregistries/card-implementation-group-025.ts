import type { CardImplementationDefinition } from "../types";
import { proteusSunburstCranialInterfaceImplementation } from "../proteus/runner/hardware/sunburst-cranial-interface";
import { proteusPoisonedWaterSupplyImplementation } from "../proteus/runner/events/poisoned-water-supply";
import { proteusStakeoutImplementation } from "../proteus/runner/events/stakeout";
import { proteusArmageddonImplementation } from "../proteus/runner/programs/armageddon";
import { proteusBlackWidowImplementation } from "../proteus/runner/programs/black-widow";
import { proteusBigFrackinGunImplementation } from "../proteus/runner/programs/big-frackin-gun";
import { proteusBoringBitImplementation } from "../proteus/runner/programs/boring-bit";
import { proteusBulldozerImplementation } from "../proteus/runner/programs/bulldozer";
import { proteusCorrosionImplementation } from "../proteus/runner/programs/corrosion";
import { proteusCrumbleImplementation } from "../proteus/runner/programs/crumble";
import { proteusDisintegratorImplementation } from "../proteus/runner/programs/disintegrator";
import { proteusEnterpriseIncShieldsImplementation } from "../proteus/runner/programs/enterprise-inc-shields";
import { proteusForwardsLegacyImplementation } from "../proteus/runner/programs/forwards-legacy";
import { proteusFubarImplementation } from "../proteus/runner/programs/fubar";
import { proteusGarbageInImplementation } from "../proteus/runner/programs/garbage-in";
import { proteusHighlighterImplementation } from "../proteus/runner/programs/highlighter";
import { proteusLockjawImplementation } from "../proteus/runner/programs/lockjaw";
import { proteusMorphingToolImplementation } from "../proteus/runner/programs/morphing-tool";
import { proteusRedecoratorImplementation } from "../proteus/runner/programs/redecorator";
import { proteusScaldanImplementation } from "../proteus/runner/programs/scaldan";

export const CARD_IMPLEMENTATION_GROUP_025 = [
  proteusSunburstCranialInterfaceImplementation,
  proteusPoisonedWaterSupplyImplementation,
  proteusStakeoutImplementation,
  proteusArmageddonImplementation,
  proteusBlackWidowImplementation,
  proteusBigFrackinGunImplementation,
  proteusBoringBitImplementation,
  proteusBulldozerImplementation,
  proteusCorrosionImplementation,
  proteusCrumbleImplementation,
  proteusDisintegratorImplementation,
  proteusEnterpriseIncShieldsImplementation,
  proteusForwardsLegacyImplementation,
  proteusFubarImplementation,
  proteusGarbageInImplementation,
  proteusHighlighterImplementation,
  proteusLockjawImplementation,
  proteusMorphingToolImplementation,
  proteusRedecoratorImplementation,
  proteusScaldanImplementation,
] as const satisfies readonly CardImplementationDefinition[];
