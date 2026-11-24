import {
  isCardDefinitionId,
  isRunId,
  type CardDefinitionId,
  type CardInstanceId,
  type RunId,
  type SubroutineProvenance,
} from "./index";

export type DamageRandomSource =
  | readonly ["s", RunId, CardInstanceId, SubroutineProvenance]
  | readonly ["c", CardDefinitionId, CardInstanceId?]
  | readonly ["g", number];

const validIndex = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const validInstance = (value: unknown): value is CardInstanceId =>
  typeof value === "string" && value.length > 0;

export function isSubroutineProvenance(
  value: unknown,
): value is SubroutineProvenance {
  if (!Array.isArray(value)) return false;
  switch (value[0]) {
    case "p":
    case "v":
    case "t":
      return (
        value.length === 3 &&
        isCardDefinitionId(value[1]) &&
        validIndex(value[2])
      );
    case "a":
      return (
        (value.length === 4 || value.length === 5) &&
        isCardDefinitionId(value[1]) &&
        validInstance(value[2]) &&
        validIndex(value[3]) &&
        (value.length === 4 || validIndex(value[4]))
      );
    case "e":
    case "c":
    case "r":
      return (
        value.length === 4 &&
        isCardDefinitionId(value[1]) &&
        validInstance(value[2]) &&
        validIndex(value[3])
      );
    case "m":
      return (
        value.length === 3 &&
        isSubroutineProvenance(value[1]) &&
        validIndex(value[2])
      );
    default:
      return false;
  }
}

export function isDamageRandomSource(
  value: unknown,
): value is DamageRandomSource {
  if (!Array.isArray(value)) return false;
  switch (value[0]) {
    case "s":
      return (
        value.length === 4 &&
        isRunId(value[1]) &&
        validInstance(value[2]) &&
        isSubroutineProvenance(value[3])
      );
    case "c":
      return (
        (value.length === 2 || value.length === 3) &&
        isCardDefinitionId(value[1]) &&
        (value.length === 2 || validInstance(value[2]))
      );
    case "g":
      return value.length === 2 && validIndex(value[1]);
    default:
      return false;
  }
}
