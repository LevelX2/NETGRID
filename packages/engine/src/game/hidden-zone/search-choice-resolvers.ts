import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";

type SearchToGripFilter = "program" | "any_card";
type SearchSourceZone = "heap" | "stack";
type SearchInstallCost = "normal" | "free";
type SearchCardType =
  | "program"
  | "event"
  | "hardware"
  | "resource";

export type SearchToGripSelectionResult = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  filter: SearchToGripFilter;
  sourceZone: SearchSourceZone;
  selectedCardId: CardInstanceId;
  revealToCorp: boolean;
  shuffleNeeded: boolean;
};

export type SearchStackInstallSelectionResult = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  filter: "program";
  installCost: SearchInstallCost;
  selectedCardId: CardInstanceId;
  shuffleNeeded: true;
};

export type LookTopStackTakeMatchingSelectionResult = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  count: number;
  allowedTypes: SearchCardType[];
  costPerTaken: number;
  selectedCardIds: CardInstanceId[];
  paidCredits: number;
  shuffleNeeded: true;
};

export type SneakPreviewProgramSelectionResult = {
  selectedCardId: CardInstanceId;
  sourceZone: SearchSourceZone;
  sourceDefinitionId: CardDefinitionId;
  isCardImplementationChoice: boolean;
  shuffleNeeded: boolean;
};

export type SelfModifyingCodeSelectionResult = {
  selectedCardId: CardInstanceId;
  shuffleNeeded: true;
};

export type MysteryBoxInstallSelectionResult = {
  sourceCardId: CardInstanceId;
  selectedCardId: CardInstanceId;
  shuffleNeeded: true;
};

export function resolveSearchToGripSelection(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  legalTargetIdsFor: (input: {
    sourceZone: SearchSourceZone;
    filter: SearchToGripFilter;
  }) => readonly CardInstanceId[];
}): SearchToGripSelectionResult {
  const choice = input.choice;
  if (!choice) throw new Error("Es ist keine CardImplementation-Search-Choice offen.");
  const sourceParts = choice.source.split(":");
  const kind = sourceParts[0];
  const sourceCardId = sourceParts[1] as CardInstanceId | undefined;
  const sourceDefinitionId = sourceParts[2] as CardDefinitionId | undefined;
  const filter = sourceParts[3] as SearchToGripFilter | undefined;
  if (
    (kind !== "p3_37.search_trash_to_grip" &&
      kind !== "p3_37.search_stack_to_grip") ||
    !sourceCardId ||
    !sourceDefinitionId ||
    (filter !== "program" && filter !== "any_card")
  )
    throw new Error("Die CardImplementation-Search-Choice ist ungueltig.");
  const sourceZone = kind === "p3_37.search_trash_to_grip" ? "heap" : "stack";
  const legalTargetIds = input.legalTargetIdsFor({ sourceZone, filter });
  if (!input.selectedCardId || !legalTargetIds.includes(input.selectedCardId))
    throw new Error("Die gewaehlte Karte ist fuer diese Suche nicht legal.");
  const shuffleNeeded = sourceZone === "stack" && sourceParts[5] === "shuffle";
  return {
    sourceCardId,
    sourceDefinitionId,
    filter,
    sourceZone,
    selectedCardId: input.selectedCardId,
    revealToCorp: sourceParts[4] === "reveal",
    shuffleNeeded,
  };
}

export function resolveSearchStackInstallSelection(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  legalTargetIdsFor: (input: {
    filter: "program";
    installCost: SearchInstallCost;
  }) => readonly CardInstanceId[];
}): SearchStackInstallSelectionResult {
  const choice = input.choice;
  if (!choice || !choice.source.startsWith("p3_38.search_stack_install"))
    throw new Error("Es ist keine CardImplementation-Install-Choice offen.");
  const [
    ,
    sourceCardId = "",
    sourceDefinitionId = "",
    filter = "",
    installCostRaw = "",
    shuffleRaw = "",
  ] = choice.source.split(":");
  if (
    !sourceCardId ||
    !sourceDefinitionId ||
    filter !== "program" ||
    (installCostRaw !== "normal" && installCostRaw !== "free") ||
    shuffleRaw !== "shuffle"
  )
    throw new Error("Die CardImplementation-Install-Choice ist ungueltig.");
  const legalTargetIds = input.legalTargetIdsFor({
    filter,
    installCost: installCostRaw,
  });
  if (!input.selectedCardId || !legalTargetIds.includes(input.selectedCardId))
    throw new Error("Das gewaehlte Programm ist nicht legal installierbar.");
  return {
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    filter,
    installCost: installCostRaw,
    selectedCardId: input.selectedCardId,
    shuffleNeeded: true,
  };
}

export function resolveLookTopStackTakeMatchingSelection(input: {
  choice: ChoiceRequest | undefined;
  selectedCardIds: readonly CardInstanceId[];
  topCardIdsForCount: (count: number) => readonly CardInstanceId[];
  legalTargetIdsFor: (input: {
    count: number;
    allowedTypes: readonly SearchCardType[];
  }) => readonly CardInstanceId[];
  runnerCredits: number;
}): LookTopStackTakeMatchingSelectionResult {
  const choice = input.choice;
  if (
    !choice ||
    !choice.source.startsWith("p3_37.look_top_stack_take_matching")
  )
    throw new Error("Es ist keine Stack-Look-Choice offen.");
  const [
    ,
    sourceCardId = "",
    sourceDefinitionId = "",
    countRaw = "0",
    allowedTypesRaw = "",
    costPerTakenRaw = "0",
    revealRaw = "",
    shuffleRaw = "",
  ] = choice.source.split(":");
  const count = Number(countRaw);
  const costPerTaken = Number(costPerTakenRaw);
  const allowedTypes = allowedTypesRaw
    .split(",")
    .filter(
      (type): type is SearchCardType =>
        type === "program" ||
        type === "event" ||
        type === "hardware" ||
        type === "resource",
    );
  if (
    !sourceCardId ||
    !sourceDefinitionId ||
    !Number.isInteger(count) ||
    count <= 0 ||
    !Number.isInteger(costPerTaken) ||
    costPerTaken < 0 ||
    revealRaw !== "reveal" ||
    shuffleRaw !== "shuffle"
  )
    throw new Error("Die Stack-Look-Choice ist ungueltig.");
  const topCardIds = input.topCardIdsForCount(count);
  const selectedCardIds = [...input.selectedCardIds];
  const selectedSet = new Set(selectedCardIds);
  const legalTargets = new Set(
    input.legalTargetIdsFor({ count, allowedTypes }),
  );
  if (
    selectedSet.size !== selectedCardIds.length ||
    selectedCardIds.some(
      (cardId) => !topCardIds.includes(cardId) || !legalTargets.has(cardId),
    )
  )
    throw new Error("Eine gewaehlte Stack-Karte ist fuer diesen Effekt nicht legal.");
  const paidCredits = selectedCardIds.length * costPerTaken;
  if (input.runnerCredits < paidCredits)
    throw new Error("Der Runner kann die gewaehlten Stack-Karten nicht bezahlen.");
  return {
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    count,
    allowedTypes,
    costPerTaken,
    selectedCardIds,
    paidCredits,
    shuffleNeeded: true,
  };
}

export function resolveSelfModifyingCodeSearchInstallSelection(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  stackCardIds: readonly CardInstanceId[];
  isSelectedProgram: boolean;
}): SelfModifyingCodeSelectionResult {
  const choice = input.choice;
  if (!choice || !choice.source.startsWith("v1911.hidden_stack_program_install"))
    throw new Error("Es ist keine Self-Modifying-Code-Choice offen.");
  if (!input.selectedCardId || !input.stackCardIds.includes(input.selectedCardId))
    throw new Error("Die gewählte Karte liegt nicht im Stack.");
  if (!input.isSelectedProgram)
    throw new Error("Self-Modifying Code kann nur Programme installieren.");
  return {
    selectedCardId: input.selectedCardId,
    shuffleNeeded: true,
  };
}

export function resolveTemporaryProgramSearchInstallSelection(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  legalTargetIds: readonly CardInstanceId[];
  defaultSourceDefinitionId: CardDefinitionId;
}): SneakPreviewProgramSelectionResult {
  const choice = input.choice;
  if (!choice) throw new Error("Es ist keine Sneak-Preview-Programmauswahl offen.");
  const sourceZone = choice.source.startsWith("v1911.sneak_preview_heap_install")
    ? "heap"
    : choice.source.startsWith("v1911.sneak_preview_stack_install")
      ? "stack"
      : choice.source.startsWith("p3_38.stack_or_trash_program_install")
        ? (choice.source.split(":")[3] as SearchSourceZone | undefined)
        : undefined;
  if (sourceZone !== "heap" && sourceZone !== "stack")
    throw new Error("Die Sneak-Preview-Choice ist ungueltig.");
  const isCardImplementationChoice = choice.source.startsWith(
    "p3_38.stack_or_trash_program_install",
  );
  const sourceDefinitionId = isCardImplementationChoice
    ? (choice.source.split(":")[2] as CardDefinitionId | undefined)
    : input.defaultSourceDefinitionId;
  if (!sourceDefinitionId) throw new Error("Die Sneak-Preview-Choice ist ungueltig.");
  if (!input.selectedCardId)
    throw new Error("Es wurde kein Programm fuer Sneak Preview gewaehlt.");
  if (!input.legalTargetIds.includes(input.selectedCardId))
    throw new Error("Dieses Programm ist nicht mehr legal installierbar.");
  return {
    selectedCardId: input.selectedCardId,
    sourceZone,
    sourceDefinitionId,
    isCardImplementationChoice,
    shuffleNeeded: sourceZone === "stack",
  };
}

export function resolveMysteryBoxInstallSelection(input: {
  choice: ChoiceRequest | undefined;
  selectedCardId: CardInstanceId | undefined;
  currentTopCardIds: readonly CardInstanceId[];
  isSelectedProgram: boolean;
}): MysteryBoxInstallSelectionResult {
  const choice = input.choice;
  if (!choice || !choice.source.startsWith("v1915.mystery_box"))
    throw new Error("Es ist keine Mystery-Box-Choice offen.");
  const sourceCardId = choice.source.split(":")[1] as CardInstanceId | undefined;
  if (!sourceCardId) throw new Error("Mystery Box ist nicht mehr installiert.");
  if (!input.selectedCardId || !input.currentTopCardIds.includes(input.selectedCardId))
    throw new Error("Das gewaehlte Programm liegt nicht mehr im Reveal-Fenster.");
  if (!input.isSelectedProgram)
    throw new Error("Der offengelegte Stack-Plan kann nur ein Programm installieren.");
  return {
    sourceCardId,
    selectedCardId: input.selectedCardId,
    shuffleNeeded: true,
  };
}
