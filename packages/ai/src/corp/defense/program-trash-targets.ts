import { programTrashCoverageLosses } from "./program-trash-coverage";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

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
  contextId: string;
  sourceIceId: string;
  subroutineIndex: number;
  sourceDefinitionId: string;
  subroutineId: string;
  subroutineType: string;
  continuation: "encounter" | "trace_success";
};

/** The Engine encodes a run id for encounter choices and a trace id for
 * trace-success choices. The latter remains authoritative after finishRun. */
export function corpProgramTrashChoiceContext(
  input: AiDecisionInput,
  choice: PendingChoice,
) {
  const context = parseProgramTrashChoiceSource(choice.source);
  if (!context) return undefined;
  const run = input.playerView.run;
  if (context.continuation === "encounter") {
    const ice = run?.encounteredIce;
    const quote = ice?.effectiveRunQuote;
    const subroutine = quote?.subroutines[context.subroutineIndex];
    if (
      run?.runId !== context.contextId ||
      ice?.instanceId !== context.sourceIceId ||
      ice.definitionId !== context.sourceDefinitionId ||
      quote?.iceInstanceId !== context.sourceIceId ||
      quote.iceDefinitionId !== context.sourceDefinitionId ||
      subroutine?.id !== context.subroutineId ||
      subroutine.type !== context.subroutineType ||
      context.subroutineType === "initiate_trace"
    )
      return undefined;
    return {
      ...context,
      serverId: run.attackedServerId,
      origin: { kind: "encounter" as const, runId: context.contextId },
    };
  }
  const trace = input.playerView.trace;
  const traceParts = /^(run_[0-9]+)\.(.+)\.([0-9]+)\.trace$/.exec(
    context.contextId,
  );
  const sources = input.playerView.servers.flatMap((server) =>
    server.ice
      .filter((ice) => ice.instanceId === context.sourceIceId)
      .map((ice) => ({ ice, serverId: server.id })),
  );
  if (sources.length !== 1) return undefined;
  const { ice, serverId } = sources[0]!;
  const quote = ice.effectiveRunQuote;
  const subroutine = quote?.subroutines[context.subroutineIndex];
  if (
    run !== undefined ||
    trace?.phase !== "trace_success_program_trash" ||
    trace.traceId !== context.contextId ||
    trace.sourceCardInstanceId !== context.sourceIceId ||
    trace.sourceDefinitionId !== context.sourceDefinitionId ||
    !traceParts ||
    traceParts[2] !== context.sourceIceId ||
    traceParts[3] !== String(context.subroutineIndex) ||
    ice.known !== true ||
    ice.controller !== "corp" ||
    ice.type !== "ice" ||
    ice.rezzed !== true ||
    ice.definitionId !== context.sourceDefinitionId ||
    quote?.iceInstanceId !== context.sourceIceId ||
    quote.iceDefinitionId !== context.sourceDefinitionId ||
    subroutine?.id !== context.subroutineId ||
    subroutine.type !== "initiate_trace" ||
    context.subroutineType !== "initiate_trace" ||
    subroutine.traceSuccessEffect?.type !== "end_run_trash_program_and_run_lock"
  )
    return undefined;
  return {
    ...context,
    serverId,
    origin: { kind: "trace_success" as const, traceId: trace.traceId },
  };
}

/**
 * Validates and ranks the mandatory public target choice opened by a program-trash ICE
 * subroutine. The encounter/Trace and choice were already selected by the Engine;
 * the Defense owner binds a target before the turn route is selected.
 */
export function rankCorpProgramTrashChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  rolesForCardId: (cardId: string | undefined) => readonly string[],
): string[] | undefined {
  const context = corpProgramTrashChoiceContext(input, choice);
  const requirement = action.choiceRequirements?.[0];
  if (
    !context ||
    input.side !== "corp" ||
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

  const losses = programTrashCoverageLosses(input, [
    ...visiblePrograms.values(),
  ]);
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
          loss: losses.get(card.instanceId)!,
          score: programTrashTargetScore(
            card,
            rolesForCardId(card.definitionId),
          ),
        };
      })
      .sort(
        (left, right) =>
          right.loss.lostAffordableIce - left.loss.lostAffordableIce ||
          right.loss.additionalCredits - left.loss.additionalCredits ||
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
    contextId: decoded[0]!,
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
    card.controller === "runner" &&
    (card.type === "program" || card.installedAsRunnerProgram !== undefined) &&
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
    (roles.includes("icebreaker") ? 100_000 : 0) +
    counters * 1_000 +
    Math.max(0, card.installCost ?? 0) * 10 +
    Math.max(0, card.memoryCost ?? 0)
  );
}
