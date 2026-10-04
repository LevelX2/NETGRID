import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { readExactCurrentInstalledCorpIceRezQuote } from "../../runtime/corp-exact-ice-rez-route";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";
import { scoreContinuationClaims } from "./corp-defense-score-reserve";
import { sanitizeForcedIceRezChoiceQuote } from "../../runtime/forced-ice-rez-choice-quote";
import { selectForcedRezVariant } from "./forced-rez-variant-selection";

export function validCorpRezOrTrashChoiceResolution(
  value: unknown,
  signal: Record<string, unknown>,
): boolean {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  const keys = new Set([
    "kind",
    "choiceId",
    "choiceSource",
    "sourceStateVersion",
    "targetIceInstanceId",
    "selectedOptionId",
    "preservedScoreProjectId",
  ]);
  return (
    Object.keys(r).every((key) => keys.has(key)) &&
    r.kind === "rez_or_trash_ice" &&
    typeof r.choiceId === "string" &&
    r.choiceId.length > 0 &&
    typeof r.choiceSource === "string" &&
    r.choiceSource.length > 0 &&
    Number.isSafeInteger(r.sourceStateVersion) &&
    (r.sourceStateVersion as number) >= 0 &&
    typeof r.targetIceInstanceId === "string" &&
    r.targetIceInstanceId.length > 0 &&
    signal.targetIceInstanceId === r.targetIceInstanceId &&
    (r.selectedOptionId === "trash_ice" ||
      (typeof r.selectedOptionId === "string" &&
        /^rez_ice(?:_[1-9][0-9]*)?$/.test(r.selectedOptionId))) &&
    (r.preservedScoreProjectId === undefined ||
      (typeof r.preservedScoreProjectId === "string" &&
        r.preservedScoreProjectId.length > 0)) &&
    Array.isArray(signal.actionIds) &&
    signal.actionIds.length === 1 &&
    typeof signal.actionIds[0] === "string" &&
    signal.actionIds[0].length > 0
  );
}

/** Current Engine choice facts; no selection or strategic judgment. */
export function currentCorpRezOrTrashChoice(
  input: AiDecisionInput,
  action: LegalAction,
) {
  const choice = input.playerView.pendingChoice;
  const match =
    choice &&
    /^card_implementation\.corp_choice_rez_or_trash_ice_decision:([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const requirement = action.choiceRequirements?.[0];
  if (
    !Number.isSafeInteger(input.playerView.own.credits) ||
    input.playerView.own.credits < 0 ||
    !Number.isSafeInteger(input.playerView.own.agendaPoints) ||
    input.playerView.own.agendaPoints < 0 ||
    !choice ||
    !match ||
    input.side !== "corp" ||
    choice.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    Number(match[2]) !== choice.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== choice.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== choice.options.length ||
    new Set(requirement.optionIds).size !== requirement.optionIds.length ||
    choice.options.some(
      (option) =>
        !requirement.optionIds.includes(option.id) ||
        option.selectable === false ||
        option.value !== option.id ||
        (option.id !== "trash_ice" &&
          !/^rez_ice(?:_[1-9][0-9]*)?$/.test(option.id)),
    )
  )
    return undefined;
  const server = input.playerView.servers.find((s) =>
    s.ice.some((ice) => ice.instanceId === match[1]),
  );
  const ice = server?.ice.find((ice) => ice.instanceId === match[1]);
  if (
    !server ||
    !ice ||
    ice.known !== true ||
    ice.type !== "ice" ||
    ice.rezzed !== false ||
    !ice.definitionId ||
    !choice.options.some((option) => option.id === "trash_ice")
  )
    return undefined;
  const rezOptions = choice.options.filter(
    (option) => option.id !== "trash_ice",
  );
  const rezOffered = rezOptions.length > 0;
  const rez = rezOffered
    ? readExactCurrentInstalledCorpIceRezQuote({
        input,
        sourceCard: ice,
        targetServerId: server.id,
      })
    : undefined;
  if (
    rezOffered &&
    (!rez ||
      rez.totalRezCredits > input.playerView.own.credits ||
      rez.quote.mandatoryAdditionalCosts.agendaPoints >
        input.playerView.own.agendaPoints)
  )
    return undefined;
  const variable = rez?.quote.costKind === "variable";
  if (
    rezOffered &&
    !variable &&
    (rezOptions.length !== 1 || rezOptions[0]?.id !== "rez_ice")
  )
    return undefined;
  const variants = variable
    ? rezOptions.map((option) =>
        sanitizeForcedIceRezChoiceQuote(
          option.forcedIceRezQuote,
          {
            choice,
            option,
            stateVersion: input.playerView.stateVersion,
            ownCredits: input.playerView.own.credits,
            ownAgendaPoints: input.playerView.own.agendaPoints,
            ice,
            serverId: server.id,
          },
          (value) =>
            value as
              | import("@netgrid/shared").VisibleEffectiveIceRunQuote
              | undefined,
        ),
      )
    : [];
  if (
    variable &&
    (variants.some(
      (quote) =>
        !quote ||
        quote.rezCredits < rez!.totalRezCredits ||
        quote.mandatoryAgendaPointCost !==
          rez!.quote.mandatoryAdditionalCosts.agendaPoints,
    ) ||
      new Set(variants.map((quote) => quote?.rezActionId)).size !==
        variants.length)
  )
    return undefined;
  return {
    choice,
    server,
    ice,
    rezOffered,
    rez,
    variants: variants.filter(
      (quote): quote is NonNullable<typeof quote> => quote !== undefined,
    ),
  };
}

/** Defense owns the mandatory rez-or-trash decision, including its reserve use. */
export function corpRezOrTrashDefenseChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpGenericDefenseSignal | undefined {
  const action = input.legalActions.find(
    (a) => a.type === "resolve_choice" && a.side === "corp",
  );
  const context = action && currentCorpRezOrTrashChoice(input, action);
  if (
    !action ||
    !context ||
    !candidates.some(
      (c) =>
        c.actionId === action.actionId &&
        c.semanticActionType === "choice.resolve",
    )
  )
    return undefined;
  const { choice, server, ice } = context;
  const selectedVariant = context.variants.length
    ? selectForcedRezVariant(
        input,
        server,
        ice,
        context.variants,
        scoreProjects,
      )
    : undefined;
  if (context.variants.length && !selectedVariant) return undefined;
  const rez =
    selectedVariant && context.rez
      ? {
          totalRezCredits: selectedVariant.rezCredits,
          quote: {
            ...context.rez.quote,
            mandatoryAdditionalCosts: {
              agendaPoints: selectedVariant.mandatoryAgendaPointCost,
            },
          },
        }
      : context.rez;
  let selectedOptionId: string = context.rezOffered
    ? context.variants.length
      ? selectedVariant!.optionId
      : "rez_ice"
    : "trash_ice";
  let preservedScoreProjectId: string | undefined;
  let evidenceCode = context.rezOffered
    ? "corp_rez_or_trash_current_affordable_rez"
    : "corp_rez_or_trash_rez_not_offered";
  if (rez) {
    const claim = scoreContinuationClaims(scoreProjects)[0];
    const consumesScoreReserve =
      claim &&
      (input.playerView.own.credits - rez.totalRezCredits <
        claim.requiredCreditsBeforeNextCorpTurn ||
        (claim.terminalScore &&
          input.playerView.own.agendaPoints -
            rez.quote.mandatoryAdditionalCosts.agendaPoints +
            claim.agendaPoints <
            input.playerView.agendaPointsToWin));
    if (consumesScoreReserve) {
      const runnerRig = input.playerView.opponent.rig;
      if (!Array.isArray(runnerRig)) return undefined;
      const withoutTarget = assessCorpScoreProtection({
        serverIce: server.ice.filter(
          (card) => card.instanceId !== ice.instanceId,
        ),
        serverRoot: server.root,
        runnerRig,
        ...(input.playerView.specialZones?.setAside !== undefined
          ? { runnerSetAside: input.playerView.specialZones.setAside }
          : {}),
        ...(input.playerView.opponent.memoryUsed !== undefined
          ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
          : {}),
        ...(input.playerView.opponent.memoryLimit !== undefined
          ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
          : {}),
        runnerCredits: input.playerView.opponent.credits,
        maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      });
      // An unknown path is never a certificate that the extra ICE is redundant.
      // A known existing stop makes keeping the published score reserve stronger
      // than a second, resource-consuming stop against the same visible rig.
      if (withoutTarget.knowledge === "known" && withoutTarget.protectsScore) {
        selectedOptionId = "trash_ice";
        preservedScoreProjectId = claim.projectId;
        evidenceCode =
          "corp_rez_or_trash_redundant_ice_preserves_score_continuation";
      }
    }
  }
  return {
    kind: "generic",
    defenseId: `rez-or-trash:${choice.choiceId}`,
    serverId: server.id,
    phase: "resolve_rez_or_trash",
    sourceDefinitionIds: [ice.definitionId!],
    actionIds: [action.actionId],
    targetIceInstanceId: ice.instanceId,
    urgent: true,
    value: 1_000,
    evidenceCode,
    choiceResolution: {
      kind: "rez_or_trash_ice",
      choiceId: choice.choiceId,
      choiceSource: choice.source,
      sourceStateVersion: choice.stateVersion,
      targetIceInstanceId: ice.instanceId,
      selectedOptionId,
      ...(preservedScoreProjectId ? { preservedScoreProjectId } : {}),
    },
  };
}
