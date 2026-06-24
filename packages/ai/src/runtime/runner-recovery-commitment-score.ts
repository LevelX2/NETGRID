import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export type RunnerRecoveryCommitmentScoreDependencies = {
  muPressureFundingScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  handBufferNeedScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  blinkRecoveryScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  junkyardRecoveryScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  lowValueRecoveryRepeatScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  viral15JackOutScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  lateNoFundingCreditRepeatScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  multiRunEventScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  bankInvestmentCommitmentScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  noRunEconomyCommitmentScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
};

export function runnerRecoveryCommitmentScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRecoveryCommitmentScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  if (action.type === "gain_credit") {
    const muPressureFunding = dependencies.muPressureFundingScoreComponent(
      input,
      action,
    );
    if (muPressureFunding) components.push(muPressureFunding);
  }
  const handBufferComponent = dependencies.handBufferNeedScoreComponent(
    input,
    action,
  );
  if (handBufferComponent) components.push(handBufferComponent);
  const blinkRecoveryComponent = dependencies.blinkRecoveryScoreComponent(
    input,
    action,
  );
  if (blinkRecoveryComponent) components.push(blinkRecoveryComponent);
  const junkyardRecoveryComponent = dependencies.junkyardRecoveryScoreComponent(
    input,
    action,
  );
  if (junkyardRecoveryComponent) components.push(junkyardRecoveryComponent);
  const lowValueRecoveryRepeatComponent =
    dependencies.lowValueRecoveryRepeatScoreComponent(input, action);
  if (lowValueRecoveryRepeatComponent) {
    components.push(lowValueRecoveryRepeatComponent);
  }
  const viral15JackOutComponent = dependencies.viral15JackOutScoreComponent(
    input,
    action,
  );
  if (viral15JackOutComponent) components.push(viral15JackOutComponent);
  const lateNoFundingCreditRepeatComponent =
    dependencies.lateNoFundingCreditRepeatScoreComponent(input, action);
  if (lateNoFundingCreditRepeatComponent) {
    components.push(lateNoFundingCreditRepeatComponent);
  }
  const multiRunEventComponent = dependencies.multiRunEventScoreComponent(
    input,
    action,
  );
  if (multiRunEventComponent) components.push(multiRunEventComponent);
  components.push(
    ...dependencies.bankInvestmentCommitmentScoreComponents(input, action),
  );
  components.push(
    ...dependencies.noRunEconomyCommitmentScoreComponents(input, action),
  );
  return components;
}
