import {
  isRunId,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { exactCurrentChoiceAction } from "../../runtime/plan-bound-choice-contract";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { corpRedirectServerExposure } from "./defense-choice-signals";

type Redirect = Extract<
  NonNullable<CorpGenericDefenseSignal["choiceResolution"]>,
  { kind: "start_run_redirect" }
>;
type Option = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>["options"][number];

function quotedDestination(input: AiDecisionInput, option: Option) {
  if (
    typeof option.value !== "string" ||
    option.id !== `redirect_${option.value}`
  )
    return undefined;
  const creditCost = option.metadata?.creditCost;
  if (
    typeof creditCost !== "number" ||
    !Number.isSafeInteger(creditCost) ||
    creditCost < 0
  )
    return undefined;
  const server = input.playerView.servers.find((fort) =>
    fort.root.some((card) => card.instanceId === option.value),
  );
  const card = server?.root.find((card) => card.instanceId === option.value);
  if (
    !server ||
    !card?.known ||
    card.rezzed !== true ||
    typeof card.definitionId !== "number" ||
    server.id === input.playerView.run?.attackedServerId
  )
    return undefined;
  return {
    sourceCardInstanceId: option.value,
    sourceDefinitionId: card.definitionId,
    serverId: server.id,
    creditCost,
  };
}

export function corpStartRunRedirectDefenseChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  allocation: CorpCentralDefenseAllocation | undefined,
  reserve: number,
): CorpGenericDefenseSignal | undefined {
  const { run, pendingChoice: choice } = input.playerView;
  if (
    input.side !== "corp" ||
    !run ||
    !isRunId(run.runId) ||
    !choice ||
    choice.source !==
      `corp.start_of_run_redirect:${run.runId}:${run.attackedServerId}` ||
    choice.side !== "corp" ||
    choice.visibility !== "public" ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    choice.stateVersion !== input.playerView.stateVersion
  )
    return undefined;
  const action = exactCurrentChoiceAction(input, choice);
  if (
    !action ||
    !candidates.some(
      (c) =>
        c.actionId === action.actionId &&
        c.actorSide === "corp" &&
        c.stateVersion === choice.stateVersion &&
        c.semanticActionType === "choice.resolve",
    )
  )
    return undefined;
  const pass = choice.options.filter(
    (o) => o.id === "pass" && o.selectable !== false,
  );
  if (pass.length !== 1 || choice.options.length < 2) return undefined;
  const exposure = corpRedirectServerExposure(
    input,
    run.attackedServerId,
    allocation,
  );
  const hasAgendaInHq = input.playerView.own.gripOrHq.some(
    (card) => card.type === "agenda",
  );
  let bestGain = 0;
  let selectedOptionId = pass[0]!.id;
  let target: Redirect["target"];
  const sources = new Set<number>();
  for (const option of choice.options) {
    if (option.id === "pass") continue;
    const quote = quotedDestination(input, option);
    if (!quote || option.selectable === false) return undefined;
    sources.add(quote.sourceDefinitionId);
    if (
      input.playerView.own.credits - quote.creditCost < reserve ||
      (run.attackedServerId === "hq" && !hasAgendaInHq)
    )
      continue;
    const gain =
      exposure -
      corpRedirectServerExposure(input, quote.serverId, allocation) -
      quote.creditCost * 250;
    if (gain > bestGain) {
      bestGain = gain;
      selectedOptionId = option.id;
      target = quote;
    }
  }
  return {
    kind: "generic",
    defenseId: `start-run-redirect:${choice.choiceId}`,
    serverId: target ? target.serverId : run.attackedServerId,
    phase: "resolve_run_redirect",
    sourceDefinitionIds: [...sources],
    actionIds: [action.actionId],
    urgent: true,
    value: 1000 + bestGain,
    evidenceCode: "start_run_redirect_owned_by_corp_defend_servers",
    choiceResolution: {
      kind: "start_run_redirect",
      choiceId: choice.choiceId,
      sourceStateVersion: choice.stateVersion,
      runId: run.runId,
      originalServerId: run.attackedServerId,
      selectedOptionId,
      ...(target ? { target } : {}),
    },
  };
}

function boundStartRunRedirectOption(
  input: AiDecisionInput,
  action: LegalAction,
  resolution: Redirect,
): string | undefined {
  const { run, pendingChoice: choice } = input.playerView;
  if (
    !choice ||
    input.side !== "corp" ||
    choice.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    !run ||
    run.runId !== resolution.runId ||
    run.attackedServerId !== resolution.originalServerId ||
    choice.source !==
      `corp.start_of_run_redirect:${run.runId}:${run.attackedServerId}` ||
    choice.choiceId !== resolution.choiceId ||
    choice.stateVersion !== resolution.sourceStateVersion ||
    choice.stateVersion !== input.playerView.stateVersion ||
    exactCurrentChoiceAction(input, choice)?.actionId !== action.actionId
  )
    return undefined;
  const option = choice.options.find(
    (o) => o.id === resolution.selectedOptionId && o.selectable !== false,
  );
  if (!option) return undefined;
  if (!resolution.target) return option.id === "pass" ? option.id : undefined;
  const quote = quotedDestination(input, option);
  return quote &&
    quote.sourceCardInstanceId === resolution.target.sourceCardInstanceId &&
    quote.sourceDefinitionId === resolution.target.sourceDefinitionId &&
    quote.serverId === resolution.target.serverId &&
    quote.creditCost === resolution.target.creditCost
    ? option.id
    : undefined;
}

export function planBoundStartRunRedirectSelection(
  input: AiDecisionInput,
  action: LegalAction,
  moduleState: unknown,
) {
  const state = moduleState as
    | { kind?: string; signals?: CorpGenericDefenseSignal[] }
    | undefined;
  if (state?.kind !== "defense") return undefined;
  const matches = state.signals?.filter(
    (s) =>
      s.kind === "generic" &&
      s.phase === "resolve_run_redirect" &&
      s.actionIds?.length === 1 &&
      s.actionIds[0] === action.actionId &&
      s.choiceResolution?.kind === "start_run_redirect",
  );
  const resolution =
    matches?.length === 1 ? matches[0]?.choiceResolution : undefined;
  if (resolution?.kind !== "start_run_redirect") return undefined;
  const id = boundStartRunRedirectOption(input, action, resolution);
  return id
    ? { choiceId: resolution.choiceId, selectedOptionIds: [id] }
    : undefined;
}
