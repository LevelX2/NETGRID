import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "./semantic-choice-ranking";
import {
  aiInput,
  bestHandCardMapping,
  choice,
  legalAction,
  planMapping,
  scoreComponentEvidence,
} from "./choice-ranking/semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice match 23d6 regressions", () => {
  it("yields a mandatory random-action install to a materially stronger bank load", () => {
    const install = legalAction("install-random-resource", "install_card");
    const bank = legalAction("load-bank", "activated_card_ability");
    const mappedInstall = choice(install, 177, [], {
      key: "runner_persistent_install_fit",
      value: 218,
      reason: "delta:new_coverage|duplicate:useful_backup|fit:870",
    });
    mappedInstall.scoreBreakdown.push({
      key: "runner_install_mandatory_random_action_risk",
      label: "Zufällige Pflichtaktion",
      value: -500,
      reason: "mandatory_action|random_outcome",
    });
    const bankChoice = choice(
      bank,
      1312,
      scoreComponentEvidence("runner_bank_investment_commitment"),
      {
        key: "runner_bank_investment_commitment",
        value: 1250,
        reason: "bankCommitmentStatus:build_first_load",
      },
    );

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [bankChoice, mappedInstall],
      bestHandCardMapping([install]),
      bankChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("load-bank");
    expect(result.overrideReason).toBe("deferred_development_mapping_yield");
  });

  it("lets a first bank load interrupt funding that cannot convert this turn", () => {
    const gain = legalAction("gain", "gain_credit");
    const bank = legalAction("load-bank", "activated_card_ability");
    const bankChoice = choice(bank, 1312, [], {
      key: "runner_bank_investment_commitment",
      value: 1250,
      reason: "bankCommitmentStatus:build_first_load",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [bankChoice, choice(gain, 554)],
      planMapping("runner.develop_hand_card", [gain], {
        evidence: ["funding_same_turn_convertible:false"],
      }),
      bankChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("load-bank");
    expect(result.overrideReason).toBe("unconvertible_funding_bank_yield");
  });

  it("keeps immediately convertible liquid funding over a bank load", () => {
    const gain = legalAction("gain", "gain_credit");
    const bank = legalAction("load-bank", "activated_card_ability");
    const bankChoice = choice(bank, 1312, [], {
      key: "runner_bank_investment_commitment",
      value: 1250,
      reason: "bankCommitmentStatus:build_first_load",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [bankChoice, choice(gain, 554)],
      planMapping("runner.develop_hand_card", [gain], {
        evidence: ["funding_same_turn_convertible:true"],
      }),
      bankChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
  });

  it("lets concrete coverage-search installation interrupt generic funding", () => {
    const gain = legalAction("gain", "gain_credit");
    const search = legalAction("install-search", "install_card");
    const searchChoice = choice(search, 1904, [], {
      key: "runner_install_coverage_search",
      value: 1400,
      reason: "required:breaker_sentry|server:remote_2",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [searchChoice, choice(gain, 1169)],
      planMapping("runner.develop_hand_card", [gain]),
      searchChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-search");
    expect(result.overrideReason).toBe("urgent_coverage_search_install_yield");
  });

  it("does not let a generic search install interrupt funding without a concrete need", () => {
    const gain = legalAction("gain", "gain_credit");
    const search = legalAction("install-search", "install_card");
    const searchChoice = choice(search, 1904);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [searchChoice, choice(gain, 1169)],
      planMapping("runner.develop_hand_card", [gain]),
      searchChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
  });
});
