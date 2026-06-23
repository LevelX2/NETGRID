import type { CardImplementationDefinition } from "../types";
import { proteusCorticalCybermodemImplementation } from "../proteus/runner/hardware/cortical-cybermodem";
import { proteusCorticalStimulatorsImplementation } from "../proteus/runner/hardware/cortical-stimulators";
import { proteusDeckTheImplementation } from "../proteus/runner/hardware/deck-the";
import { proteusEurocorpseTmSpinChipImplementation } from "../proteus/runner/hardware/eurocorpse-tm-spin-chip";
import { proteusLucidrineDripFeedImplementation } from "../proteus/runner/hardware/lucidrinetm-drip-feed";
import { proteusSunburstCranialInterfaceImplementation } from "../proteus/runner/hardware/sunburst-cranial-interface";

// Subregistries are catalog-only. They group declarative card files and must
// not execute abilities or add runtime conditions.
export const PROTEUS_RUNNER_HARDWARE_IMPLEMENTATIONS = [
  proteusCorticalCybermodemImplementation,
  proteusCorticalStimulatorsImplementation,
  proteusDeckTheImplementation,
  proteusEurocorpseTmSpinChipImplementation,
  proteusLucidrineDripFeedImplementation,
  proteusSunburstCranialInterfaceImplementation,
] as const satisfies readonly CardImplementationDefinition[];
