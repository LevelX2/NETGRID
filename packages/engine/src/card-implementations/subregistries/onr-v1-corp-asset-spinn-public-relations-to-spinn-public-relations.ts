import type { CardImplementationDefinition } from "../types";
import { spinnPublicRelationsImplementation } from "../onr-v1/corp/assets/spinn-public-relations";

export const ONR_V1_CORP_ASSET_SPINN_PUBLIC_RELATIONS_TO_SPINN_PUBLIC_RELATIONS_IMPLEMENTATIONS =
  [
    spinnPublicRelationsImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
