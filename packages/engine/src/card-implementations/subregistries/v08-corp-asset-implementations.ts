import type { CardImplementationDefinition } from "../types";
import { v08CashoutAssetImplementation } from "../v08/corp/assets/cashout-asset";

export const V08_CORP_ASSET_IMPLEMENTATIONS = [
  v08CashoutAssetImplementation,
] as const satisfies readonly CardImplementationDefinition[];
