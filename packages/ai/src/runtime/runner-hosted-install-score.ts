import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import { AI_HINTS_BY_CARD } from "../ai-hints";

export function runnerHostedInstallScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    action.type !== "install_card"
  ) {
    return undefined;
  }
  const hostSetup = input.playerView.own.gripOrHq.find(
    (card) =>
      card.instanceId === action.source &&
      card.definitionId !== undefined &&
      hostSupportsHostedBreakerEconomy(card),
  );
  if (hostSetup && hostableBreakerAfterSetup(input, action, hostSetup)) {
    return {
      key: "runner_hosted_breaker_economy_setup",
      label: "Host mit sofort nutzbarem Breaker installieren",
      value: 900,
      reason: [
        `host_definition:${hostSetup.definitionId}`,
        "host_target:icebreaker",
        "hostable_breaker_available:true",
      ].join("|"),
    };
  }
  const handCount = input.playerView.own.gripOrHq.length;
  const effectiveMaxHandSize = input.playerView.own.maxHandSize ?? 5;
  if (handCount < effectiveMaxHandSize) return undefined;
  const host = (input.playerView.own.rig ?? []).find((card) =>
    actionTargetsInstalledHost(action, card),
  );
  if (!host?.definitionId || !hostSupportsHostedBreakerEconomy(host)) {
    return undefined;
  }

  return {
    key: "runner_hosted_breaker_economy_install",
    label: "Breaker mit gehosteter Finanzierung installieren",
    value: 1_600,
    reason: [
      `host_definition:${host.definitionId}`,
      "host_target:icebreaker",
      "recurring_breaker_economy:true",
      `hand:${handCount}`,
      `effective_max_hand:${effectiveMaxHandSize}`,
    ].join("|"),
  };
}

function hostableBreakerAfterSetup(
  input: AiDecisionInput,
  action: LegalAction,
  host: VisibleCard,
): boolean {
  const clicksAfterSetup =
    input.playerView.own.clicks -
    action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0);
  const creditsAfterSetup =
    input.playerView.own.credits -
    action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
  if (clicksAfterSetup < 1 || creditsAfterSetup < 0) return false;
  return (input.legalActions ?? []).some((candidateAction) => {
    if (
      candidateAction.actionId === action.actionId ||
      candidateAction.type !== "install_card" ||
      candidateAction.source === host.instanceId
    ) {
      return false;
    }
    const candidateCard = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === candidateAction.source,
    );
    if (!candidateCard || !cardIsBreaker(candidateCard)) return false;
    const creditCost = candidateAction.costs.reduce(
      (sum, cost) => sum + (cost.credits ?? 0),
      0,
    );
    return creditCost <= creditsAfterSetup;
  });
}

function cardIsBreaker(card: VisibleCard): boolean {
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  return (
    (card.subtypes ?? []).some((subtype) =>
      subtype.toLowerCase().includes("icebreaker"),
    ) ||
    hint?.breakerProfile !== undefined ||
    (hint?.roles ?? []).some(
      (role) => role === "icebreaker" || role.startsWith("breaker_"),
    )
  );
}

function actionTargetsInstalledHost(
  action: LegalAction,
  host: VisibleCard,
): boolean {
  if (action.actionId.split(".").includes(host.instanceId)) return true;
  const payloadValues = Object.values(action.payload ?? {});
  return payloadValues.some((value) => value === host.instanceId);
}

function hostSupportsHostedBreakerEconomy(host: VisibleCard): boolean {
  const hint = host.definitionId
    ? AI_HINTS_BY_CARD.get(host.definitionId)
    : undefined;
  if (!hint) return false;
  const hostsIcebreaker =
    (hint.effects ?? []).some((effect) => {
      const record = effect as unknown as Record<string, unknown>;
      return record.kind === "program_host" && record.target === "icebreaker";
    }) ||
    (hint.targetProfiles ?? []).some((profile) => {
      const record = profile as unknown as Record<string, unknown>;
      return (
        record.kind === "hosted_install_target" &&
        record.targetType === "icebreaker"
      );
    });
  const fundsIcebreaker = (hint.effects ?? []).some((effect) => {
    const record = effect as unknown as Record<string, unknown>;
    return (
      record.kind === "recurring_economy" && record.target === "icebreaker"
    );
  });
  return hostsIcebreaker && fundsIcebreaker;
}
