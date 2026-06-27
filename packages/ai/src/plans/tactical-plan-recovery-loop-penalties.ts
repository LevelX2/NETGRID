export type RecoveryLoopPenalties = {
  repeatedRecoverySameCardPenalty: number;
  repeatedEconomyRecoveryLoopPenalty: number;
  noProgressOnRequiredCapabilityPenalty: number;
  fundingNeedReducesRecoveryLoopPenalty: boolean;
};

export function noRecoveryLoopPenalties(): RecoveryLoopPenalties {
  return {
    repeatedRecoverySameCardPenalty: 0,
    repeatedEconomyRecoveryLoopPenalty: 0,
    noProgressOnRequiredCapabilityPenalty: 0,
    fundingNeedReducesRecoveryLoopPenalty: false,
  };
}

export function recoveryLoopPenaltiesForCoverageSearch(
  fundingNeed: boolean,
  supportsActiveCapabilityNeed: boolean,
  supportsCreditNeed: boolean,
): RecoveryLoopPenalties {
  if (supportsActiveCapabilityNeed) return noRecoveryLoopPenalties();
  if (supportsCreditNeed) {
    return {
      repeatedRecoverySameCardPenalty: fundingNeed ? 20 : 80,
      repeatedEconomyRecoveryLoopPenalty: fundingNeed ? 60 : 220,
      noProgressOnRequiredCapabilityPenalty: fundingNeed ? 90 : 180,
      fundingNeedReducesRecoveryLoopPenalty: fundingNeed,
    };
  }
  return {
    repeatedRecoverySameCardPenalty: 50,
    repeatedEconomyRecoveryLoopPenalty: 0,
    noProgressOnRequiredCapabilityPenalty: 160,
    fundingNeedReducesRecoveryLoopPenalty: false,
  };
}

export function economyFalseMatchLoopPenalties(
  fundingNeed: boolean,
  supportsCreditNeed: boolean,
): RecoveryLoopPenalties {
  if (!supportsCreditNeed) return noRecoveryLoopPenalties();
  return {
    repeatedRecoverySameCardPenalty: 0,
    repeatedEconomyRecoveryLoopPenalty: fundingNeed ? 40 : 120,
    noProgressOnRequiredCapabilityPenalty: fundingNeed ? 80 : 160,
    fundingNeedReducesRecoveryLoopPenalty: fundingNeed,
  };
}

export function recoveryLoopPenaltyEvidence(
  penalties: RecoveryLoopPenalties,
): string[] {
  return [
    `repeatedRecoverySameCardPenalty:${penalties.repeatedRecoverySameCardPenalty}`,
    `repeatedEconomyRecoveryLoopPenalty:${penalties.repeatedEconomyRecoveryLoopPenalty}`,
    `noProgressOnRequiredCapabilityPenalty:${penalties.noProgressOnRequiredCapabilityPenalty}`,
    `fundingNeedReducesRecoveryLoopPenalty:${penalties.fundingNeedReducesRecoveryLoopPenalty}`,
  ];
}
