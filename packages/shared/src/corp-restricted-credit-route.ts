export const CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION =
  "corp-restricted-credit-route-v1" as const;

/** Stored counters are a conditional future payment capability, never liquid credits. */
export type CorpRestrictedCreditBankQuote = {
  schemaVersion: "corp-restricted-credit-bank-v1";
  sourceCardInstanceId: string;
  serverId: string;
  expiresAtStateVersion: number;
  advancementCounters: number;
  generalCreditsAvailable: number;
  creditsPerCounter: number;
  payoutCounterCost: 1;
  payoutClickCost: 0;
  payoutGeneralCreditCost: 0;
  usableFor: "corp_install_or_rez";
  payoutCleanup: "end_of_turn";
  condition: "source_remains_installed_and_rezzed_at_paid_window";
  /** Exact affordable setup prefixes inside the current Corp turn. No payout is liquid yet. */
  setupRoutes?: Array<{
    headActionId: string;
    headKind: "advance_card" | "rez_card";
    setupCredits: number;
    setupClicks: number;
    targetCounters: number;
    remainingGeneralCredits: number;
  }>;
};

/** A semantic consumer, never a future LegalAction ID. Its plan retains target ownership. */
export type CorpRestrictedCreditConsumer = {
  actionType: "install_card" | "rez_card" | "rez_ice";
  sourceCardInstanceId: string;
  serverId: string;
};

export type CorpRestrictedCreditRouteRequest = {
  matchId: string;
  stateVersion: number;
  timingPoint: string;
  side: "corp";
  payoutActionId: string;
  consumer: CorpRestrictedCreditConsumer;
};

export type CorpRestrictedCreditRouteQuote = {
  schemaVersion: typeof CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION;
  request: CorpRestrictedCreditRouteRequest;
  payoutSourceCardInstanceId: string;
  payoutSourceAbilityId: string;
  payoutCredits: number;
  /** Exact same-window payouts needed before this consumer becomes legal. */
  payoutCount: number;
  payoutClickCost: number;
  payoutGeneralCreditCost: number;
  payoutAdvancementCounterCost: number;
  consumer: CorpRestrictedCreditConsumer & {
    availableBeforePayout: boolean;
    sourceCardDefinitionId: string;
    clickCost: number;
    creditCost: number;
    restrictedCreditsApplied: number;
    newlyProvidedCreditsApplied: number;
    generalCreditsRequired: number;
    generalCreditsRemainingAfterConsumer: number;
    /** Current visible break route only, not a guarantee against later Runner choices. */
    currentRunAccessBlock?: {
      runId: string;
      hardEndTheRunSubroutineCount: number;
      reason:
        | "no_visible_eligible_breaker"
        | "visible_break_route_unaffordable";
    };
  };
  remainingRestrictedCreditsAfterConsumer: number;
  cleanup: "end_of_turn";
  /** Only funding and immediate availability are proven, not the consumer's strategic payoff. */
  guarantee: "exact_current_funding_prefix";
};

export type CorpRestrictedCreditRouteResult =
  | { status: "quoted"; quote: CorpRestrictedCreditRouteQuote }
  | {
      status: "unavailable";
      reason:
        | "stale_request"
        | "invalid_current_payout"
        | "consumer_not_owned"
        | "consumer_not_available_after_payout"
        | "consumer_invocation_not_exact"
        | "consumer_has_no_restricted_payment"
        | "payout_boundary";
    }
  | { status: "failed"; reason: "legal_payout_execution_failed" };
