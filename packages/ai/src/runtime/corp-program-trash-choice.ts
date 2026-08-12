import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import { rolesHaveBreakerRole } from "./breaker-role-match";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const PROGRAM_TRASH_CHOICE_SOURCE_PREFIX =
  "card_implementation.trash_installed_program";
const PROGRAM_TRASH_SUBROUTINE_TYPES = new Set([
  "initiate_trace",
  "trash_installed_program",
  "trash_installed_program_unless_runner_pays",
]);

type ProgramTrashChoiceContext = {
  runId: string;
  sourceIceId: string;
  subroutineIndex: number;
  sourceDefinitionId: string;
  subroutineId: string;
  subroutineType: string;
  continuation: "encounter" | "trace_success";
};

/**
 * Completes the mandatory public target choice opened by a program-trash ICE
 * subroutine. The run and choice have already been selected by the Engine;
 * this resolver only supplies the payload for that exact response window.
 */
export function selectedCorpProgramTrashChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  rolesForCardId: (cardId: string | undefined) => readonly string[],
): string[] | undefined {
  const context = parseProgramTrashChoiceSource(choice.source);
  const requirement = action.choiceRequirements?.[0];
  const run = input.playerView.run;
  const encounteredIce = run?.encounteredIce;
  const encounteredServer = input.playerView.servers.find(
    (server) => server.id === run?.position?.serverId,
  );
  const boardIce =
    run?.position?.kind === "ice"
      ? encounteredServer?.ice[run.position.iceIndex]
      : undefined;
  const subroutine =
    boardIce?.effectiveRunQuote?.subroutines[context?.subroutineIndex ?? -1];
  if (
    !context ||
    input.side !== "corp" ||
    encounteredIce?.instanceId !== context.sourceIceId ||
    encounteredIce.definitionId !== context.sourceDefinitionId ||
    boardIce?.instanceId !== context.sourceIceId ||
    boardIce.definitionId !== context.sourceDefinitionId ||
    boardIce.effectiveRunQuote?.iceInstanceId !== context.sourceIceId ||
    boardIce.effectiveRunQuote.iceDefinitionId !== context.sourceDefinitionId ||
    subroutine?.id !== context.subroutineId ||
    subroutine.type !== context.subroutineType ||
    (context.continuation === "encounter" &&
      context.subroutineType === "initiate_trace") ||
    (context.continuation === "trace_success" &&
      (context.subroutineType !== "initiate_trace" ||
        subroutine.traceSuccessEffect?.type !==
          "end_run_trash_program_and_run_lock")) ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    selectableOptions.length === 0 ||
    requirement.optionIds.length !== selectableOptions.length
  ) {
    return undefined;
  }

  const visiblePrograms = new Map(
    (input.playerView.opponent.rig ?? [])
      .filter(isKnownInstalledRunnerProgram)
      .map((card) => [card.instanceId, card] as const),
  );
  const optionBindings = selectableOptions.map((option) => ({
    optionId: option.id,
    cardId: typeof option.value === "string" ? option.value : undefined,
  }));
  const optionIds = optionBindings.map((binding) => binding.optionId).sort();
  const requirementIds = requirement.optionIds.slice().sort();
  const optionCardIds = optionBindings
    .map((binding) => binding.cardId)
    .filter((cardId): cardId is string => cardId !== undefined);
  const completeBinding =
    visiblePrograms.size === optionBindings.length &&
    new Set(optionCardIds).size === optionCardIds.length &&
    optionBindings.every(
      (binding) =>
        binding.cardId !== undefined &&
        binding.optionId === `card_${binding.cardId}` &&
        visiblePrograms.has(binding.cardId),
    ) &&
    optionIds.length === requirementIds.length &&
    optionIds.every((optionId, index) => optionId === requirementIds[index]);
  if (!completeBinding) return undefined;

  return [
    optionBindings
      .map((binding) => {
        const card = visiblePrograms.get(binding.cardId!);
        if (!card?.definitionId)
          throw new Error(
            "A bound public Runner program lacks a definition id.",
          );
        return {
          optionId: binding.optionId,
          score: programTrashTargetScore(
            card,
            rolesForCardId(card.definitionId),
          ),
        };
      })
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.optionId.localeCompare(right.optionId),
      )[0]!.optionId,
  ];
}

function parseProgramTrashChoiceSource(
  source: string,
): ProgramTrashChoiceContext | undefined {
  const parts = source.split(":");
  if (parts.length !== 8 || parts[0] !== PROGRAM_TRASH_CHOICE_SOURCE_PREFIX)
    return undefined;
  const subroutineIndex = Number(parts[3]);
  if (!Number.isSafeInteger(subroutineIndex) || subroutineIndex < 0)
    return undefined;
  const decoded = parts.slice(1, 3).concat(parts.slice(4, 6)).map(decodePart);
  if (decoded.some((part) => part === undefined || part.length === 0))
    return undefined;
  const subroutineType = parts[6]!;
  if (!PROGRAM_TRASH_SUBROUTINE_TYPES.has(subroutineType)) return undefined;
  const continuation = parts[7];
  if (continuation !== "encounter" && continuation !== "trace_success")
    return undefined;
  return {
    runId: decoded[0]!,
    sourceIceId: decoded[1]!,
    subroutineIndex,
    sourceDefinitionId: decoded[2]!,
    subroutineId: decoded[3]!,
    subroutineType,
    continuation,
  };
}

function decodePart(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function isKnownInstalledRunnerProgram(card: VisibleCard): boolean {
  return (
    card.known === true &&
    card.owner === "runner" &&
    card.controller === "runner" &&
    card.type === "program" &&
    typeof card.definitionId === "string" &&
    card.definitionId.length > 0
  );
}

function programTrashTargetScore(
  card: VisibleCard,
  roles: readonly string[],
): number {
  const counters = Object.values(card.counters ?? {}).reduce(
    (sum, amount) => sum + (typeof amount === "number" ? amount : 0),
    0,
  );
  return (
    (rolesHaveBreakerRole(roles) ? 100_000 : 0) +
    counters * 1_000 +
    Math.max(0, card.installCost ?? 0) * 10 +
    Math.max(0, card.memoryCost ?? 0)
  );
}
