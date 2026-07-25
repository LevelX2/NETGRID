import type { CardImplementationDefinition } from "../types";
import { simpleEconomyAssetImplementation } from "../demo/corp/assets/simple-economy-asset";

export const DEMO_CORP_ASSET_IMPLEMENTATIONS = [
  simpleEconomyAssetImplementation,
] as const satisfies readonly CardImplementationDefinition[];
