import type { CardImplementationDefinition } from "../types";
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
import { proteusSkeletonPasskeysImplementation } from "../proteus/runner/programs/skeleton-passkeys";
import { proteusSkullcapImplementation } from "../proteus/runner/programs/skullcap";
import { proteusTaxmanImplementation } from "../proteus/runner/programs/taxman";
import { proteusVienna22Implementation } from "../proteus/runner/programs/vienna-22";
import { proteusViralPipelineImplementation } from "../proteus/runner/programs/viral-pipeline";
import { proteusWreckingBallImplementation } from "../proteus/runner/programs/wrecking-ball";

// Subregistries are catalog-only. They group declarative card files and must
// not execute abilities or add runtime conditions.
export const PROTEUS_RUNNER_PROGRAM_IMPLEMENTATIONS = [
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
  proteusSkeletonPasskeysImplementation,
  proteusSkullcapImplementation,
  proteusTaxmanImplementation,
  proteusVienna22Implementation,
  proteusViralPipelineImplementation,
  proteusWreckingBallImplementation,
] as const satisfies readonly CardImplementationDefinition[];
