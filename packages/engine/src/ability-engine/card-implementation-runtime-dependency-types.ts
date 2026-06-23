import type {
  CardImplementationRuntimeCoreDependencies,
  RuntimeEffectCollector,
} from "./card-implementation-runtime-core-deps";
import type { CardImplementationRuntimeExtendedDependencies } from "./card-implementation-runtime-extended-deps";
import type { CardImplementationRuntimeHiddenDependencies } from "./card-implementation-runtime-hidden-deps";

export type { RuntimeEffectCollector };

export type CardImplementationRuntimeDependencies =
  CardImplementationRuntimeCoreDependencies &
    CardImplementationRuntimeHiddenDependencies &
    CardImplementationRuntimeExtendedDependencies;
