import type { CardImplementationDefinition } from "../types";
import { CLASSIC_CARD_IMPLEMENTATIONS } from "./classic-card-implementations";
import { CARD_IMPLEMENTATION_GROUP_001 } from "./card-implementation-group-001";
import { CARD_IMPLEMENTATION_GROUP_002 } from "./card-implementation-group-002";
import { CARD_IMPLEMENTATION_GROUP_003 } from "./card-implementation-group-003";
import { CARD_IMPLEMENTATION_GROUP_004 } from "./card-implementation-group-004";
import { CARD_IMPLEMENTATION_GROUP_005 } from "./card-implementation-group-005";
import { CARD_IMPLEMENTATION_GROUP_006 } from "./card-implementation-group-006";
import { CARD_IMPLEMENTATION_GROUP_007 } from "./card-implementation-group-007";
import { CARD_IMPLEMENTATION_GROUP_008 } from "./card-implementation-group-008";
import { CARD_IMPLEMENTATION_GROUP_009 } from "./card-implementation-group-009";
import { CARD_IMPLEMENTATION_GROUP_010 } from "./card-implementation-group-010";
import { CARD_IMPLEMENTATION_GROUP_011 } from "./card-implementation-group-011";
import { CARD_IMPLEMENTATION_GROUP_012 } from "./card-implementation-group-012";
import { CARD_IMPLEMENTATION_GROUP_013 } from "./card-implementation-group-013";
import { CARD_IMPLEMENTATION_GROUP_014 } from "./card-implementation-group-014";
import { CARD_IMPLEMENTATION_GROUP_015 } from "./card-implementation-group-015";
import { CARD_IMPLEMENTATION_GROUP_016 } from "./card-implementation-group-016";
import { CARD_IMPLEMENTATION_GROUP_017 } from "./card-implementation-group-017";
import { CARD_IMPLEMENTATION_GROUP_018 } from "./card-implementation-group-018";
import { CARD_IMPLEMENTATION_GROUP_019 } from "./card-implementation-group-019";
import { CARD_IMPLEMENTATION_GROUP_020 } from "./card-implementation-group-020";
import { CARD_IMPLEMENTATION_GROUP_021 } from "./card-implementation-group-021";
import { CARD_IMPLEMENTATION_GROUP_022 } from "./card-implementation-group-022";
import { CARD_IMPLEMENTATION_GROUP_023 } from "./card-implementation-group-023";
import { CARD_IMPLEMENTATION_GROUP_024 } from "./card-implementation-group-024";
import { CARD_IMPLEMENTATION_GROUP_025 } from "./card-implementation-group-025";
import { CARD_IMPLEMENTATION_GROUP_026 } from "./card-implementation-group-026";
import { CARD_IMPLEMENTATION_GROUP_027 } from "./card-implementation-group-027";

export const CARD_IMPLEMENTATION_CATALOG = [
  ...CLASSIC_CARD_IMPLEMENTATIONS,
  ...CARD_IMPLEMENTATION_GROUP_001,
  ...CARD_IMPLEMENTATION_GROUP_002,
  ...CARD_IMPLEMENTATION_GROUP_003,
  ...CARD_IMPLEMENTATION_GROUP_004,
  ...CARD_IMPLEMENTATION_GROUP_005,
  ...CARD_IMPLEMENTATION_GROUP_006,
  ...CARD_IMPLEMENTATION_GROUP_007,
  ...CARD_IMPLEMENTATION_GROUP_008,
  ...CARD_IMPLEMENTATION_GROUP_009,
  ...CARD_IMPLEMENTATION_GROUP_010,
  ...CARD_IMPLEMENTATION_GROUP_011,
  ...CARD_IMPLEMENTATION_GROUP_012,
  ...CARD_IMPLEMENTATION_GROUP_013,
  ...CARD_IMPLEMENTATION_GROUP_014,
  ...CARD_IMPLEMENTATION_GROUP_015,
  ...CARD_IMPLEMENTATION_GROUP_016,
  ...CARD_IMPLEMENTATION_GROUP_017,
  ...CARD_IMPLEMENTATION_GROUP_018,
  ...CARD_IMPLEMENTATION_GROUP_019,
  ...CARD_IMPLEMENTATION_GROUP_020,
  ...CARD_IMPLEMENTATION_GROUP_021,
  ...CARD_IMPLEMENTATION_GROUP_022,
  ...CARD_IMPLEMENTATION_GROUP_023,
  ...CARD_IMPLEMENTATION_GROUP_024,
  ...CARD_IMPLEMENTATION_GROUP_025,
  ...CARD_IMPLEMENTATION_GROUP_026,
  ...CARD_IMPLEMENTATION_GROUP_027,
] as const satisfies readonly CardImplementationDefinition[];
