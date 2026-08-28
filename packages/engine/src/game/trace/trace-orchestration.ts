import type {
  ActivatedCardAbilityImplementation,
  IncreaseTraceLinkEffectImplementation,
} from "../../ability-engine/definition-types";
import type { LegalAction, PlayerAction } from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import { installedTraceBaseLinkCardImplementation } from "./base-link";
import * as core from "./trace-orchestration-core";
import { traceRulesDefinitionForTrace } from "./trace-rules-profile";

export * from "./trace-orchestration-core";

type CurrentTrace = NonNullable<core.TraceOrchestrationHost["state"]["trace"]>;

type ClassicBaseLinkModifier = {
  sourceTitle: string;
  creditCost: number;
  linkDelta: number;
};

export type ClassicRunnerLinkBidOption = {
  paymentAmount: number;
  linkDelta: number;
};

/**
 * The 1996 trace protocol does not grant the Runner a generic 1-credit/+1-link
 * conversion. In Classic profiles, the hidden Runner spend is the printed
 * repeatable link modifier of the one selected Base Link card. The existing
 * core payment machinery still pays the committed amount; this adapter binds
 * the resulting link delta separately so payment and link strength cannot be
 * conflated.
 */
export function resolveTraceChoice(
  host: core.TraceOrchestrationHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  bindClassicRunnerLinkStrength(host, playerAction);
  core.resolveTraceChoice(classicAwareTraceHost(host), legalAction, playerAction);
  normalizeClassicTraceChoice(host);
}

export function buildClassicRunnerLinkBidOptions(
  paymentCapacity: number,
  modifier: Pick<ClassicBaseLinkModifier, "creditCost" | "linkDelta"> | undefined,
): ClassicRunnerLinkBidOption[] {
  const capacity = Math.max(0, Math.floor(paymentCapacity));
  if (!modifier) return [{ paymentAmount: 0, linkDelta: 0 }];
  if (
    !Number.isInteger(modifier.creditCost) ||
    modifier.creditCost <= 0 ||
    !Number.isInteger(modifier.linkDelta) ||
    modifier.linkDelta <= 0
  ) {
    throw new Error("Die Classic-Base-Link-Modifikation ist ungueltig.");
  }
  const maxUses = Math.floor(capacity / modifier.creditCost);
  return Array.from({ length: maxUses + 1 }, (_, uses) => ({
    paymentAmount: uses * modifier.creditCost,
    linkDelta: uses * modifier.linkDelta,
  }));
}

function normalizeClassicTraceChoice(host: core.TraceOrchestrationHost): void {
  const trace = host.state.trace;
  if (!trace || !usesClassicCardLinkSpend(trace)) return;
  const choice = host.state.pendingChoice;
  if (!choice) return;

  if (
    trace.status === "base_link" &&
    choice.source === `trace_base_link:${trace.traceId}`
  ) {
    // Original 1996 protocol: the Runner states the Base Link card before the
    // simultaneous spend reveal. The Corp has already committed its hidden bid.
    host.state.pendingChoice = { ...choice, visibility: "public" };
    return;
  }

  if (
    trace.status !== "runner_bid" ||
    choice.source !== `trace:${trace.traceId}` ||
    choice.kind !== "bid_amount"
  ) {
    return;
  }

  const paymentCapacity = choice.options.reduce((maximum, option) => {
    const amount = typeof option.value === "number" ? option.value : 0;
    return Number.isInteger(amount) && amount >= 0
      ? Math.max(maximum, amount)
      : maximum;
  }, 0);
  const modifier = classicBaseLinkModifierForTrace(host, trace);
  const options = buildClassicRunnerLinkBidOptions(paymentCapacity, modifier);
  const baseLink = trace.runnerLink ?? core.calculateRunnerLink(host);
  host.state.pendingChoice = {
    ...choice,
    prompt: modifier
      ? `Verdeckte Runner-Linkausgabe waehlen (${modifier.sourceTitle}: ${modifier.creditCost} Credits fuer +${modifier.linkDelta} Link; aktueller Link ${baseLink})`
      : `Verdeckte Runner-Linkausgabe waehlen (kein ausgewaehlter Base-Link-Modifikator; aktueller Link ${baseLink})`,
    options: options.map((option) => ({
      id: `bid_${option.paymentAmount}`,
      label: `${option.paymentAmount} Credits (+${option.linkDelta} Link)`,
      publicLabel: `${option.paymentAmount} Credits`,
      value: option.paymentAmount,
      metadata: {
        amount: option.linkDelta,
        ...(modifier ? { cardTitle: modifier.sourceTitle } : {}),
      },
    })),
  };
}

function bindClassicRunnerLinkStrength(
  host: core.TraceOrchestrationHost,
  playerAction: PlayerAction,
): void {
  const trace = host.state.trace;
  const choice = host.state.pendingChoice;
  if (
    !trace ||
    !usesClassicCardLinkSpend(trace) ||
    trace.status !== "runner_bid" ||
    trace.runnerStrength !== undefined ||
    !choice ||
    choice.source !== `trace:${trace.traceId}` ||
    choice.kind !== "bid_amount"
  ) {
    return;
  }
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selected = choice.options.find((option) => option.id === selectedId);
  const linkDelta = selected?.metadata?.amount;
  if (
    typeof linkDelta !== "number" ||
    !Number.isInteger(linkDelta) ||
    linkDelta < 0
  ) {
    throw new Error("Die Classic-Runner-Linkausgabe ist ungueltig.");
  }
  const baseLink = trace.runnerLink ?? core.calculateRunnerLink(host);
  const runnerStrength = baseLink + linkDelta;
  host.state.trace = {
    ...trace,
    runnerLink: runnerStrength,
    runnerStrength,
  };
}

function classicAwareTraceHost(
  host: core.TraceOrchestrationHost,
): core.TraceOrchestrationHost {
  const trace = host.state.trace;
  if (!trace || !usesClassicCardLinkSpend(trace)) return host;
  return {
    ...host,
    cards: {
      ...host.cards,
      activatedTraceAbilities: (definition, timing) => {
        const abilities = host.cards.activatedTraceAbilities(definition, timing);
        if (
          timing !== "trace_post_bid_link_window" ||
          !installedTraceBaseLinkCardImplementation(definition)
        ) {
          return abilities;
        }
        // A Base Link card may be used only as the one declared Base Link card.
        // Its repeatable +Link ability belongs to the hidden Classic spend and
        // must not reappear in the after-reveal link window. Explicitly
        // after-reveal non-Base-Link cards (Signpost, Springboard, etc.) remain.
        return abilities.filter(
          ({ ability }) => classicRepeatableLinkModifier(ability) === undefined,
        );
      },
    },
  };
}

function classicBaseLinkModifierForTrace(
  host: core.TraceOrchestrationHost,
  trace: CurrentTrace,
): ClassicBaseLinkModifier | undefined {
  const sourceId = trace.baseLinkSourceId;
  if (!sourceId) return undefined;
  const definition = host.cards.definitionFor(sourceId);
  if (!installedTraceBaseLinkCardImplementation(definition)) return undefined;
  const candidates = host.cards
    .activatedTraceAbilities(definition, "trace_post_bid_link_window")
    .flatMap(({ ability }) => {
      const modifier = classicRepeatableLinkModifier(ability);
      return modifier
        ? [{ sourceTitle: definition.title, ...modifier }]
        : [];
    });
  if (candidates.length > 1) {
    throw new Error(
      "Eine Base-Link-Karte hat mehrere wiederholbare Classic-Link-Modifikatoren.",
    );
  }
  return candidates[0];
}

function classicRepeatableLinkModifier(
  ability: ActivatedCardAbilityImplementation,
): Pick<ClassicBaseLinkModifier, "creditCost" | "linkDelta"> | undefined {
  if (ability.limit !== undefined) return undefined;
  const creditCosts = ability.costs.filter((cost) => cost.kind === "credit");
  if (
    ability.costs.length !== 1 ||
    creditCosts.length !== 1 ||
    !Number.isInteger(creditCosts[0]?.amount) ||
    (creditCosts[0]?.amount ?? 0) <= 0
  ) {
    return undefined;
  }
  const linkEffects = ability.effects.filter(
    (effect): effect is IncreaseTraceLinkEffectImplementation =>
      effect.kind === "increase_trace_link",
  );
  if (
    linkEffects.length !== 1 ||
    !Number.isInteger(linkEffects[0]?.amount) ||
    (linkEffects[0]?.amount ?? 0) <= 0 ||
    linkEffects[0]?.visibility !== "public"
  ) {
    return undefined;
  }
  return {
    creditCost: creditCosts[0]!.amount,
    linkDelta: linkEffects[0]!.amount,
  };
}

function usesClassicCardLinkSpend(trace: CurrentTrace): boolean {
  return (
    traceRulesDefinitionForTrace(trace).runnerLinkSpendMode ===
    "printed_card_modifiers"
  );
}
