import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
import {
  aiInput,
  choice,
  legalAction,
  remoteContestMapping,
  scoreComponentEvidence,
  scoreConversionMapping,
  scorelineSupportMapping,
  strategicEvidence,
} from "./semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice Corp board-triage overrides", () => {
  it("lets runner-matchpoint HQ protection interrupt remote support", () => {
    const protectRemote = legalAction("protect-remote", "install_card");
    const protectHq = legalAction("protect-hq", "install_card");
    const hqChoice = choice(
      protectHq,
      1000,
      scoreComponentEvidence("corp_matchpoint_hq_protection_alignment"),
      {
        key: "corp_matchpoint_hq_protection_alignment",
        value: 2200,
        reason: "runner_at_matchpoint:true",
      },
    );
    const input = aiInput();
    input.side = "corp";
    const result = tacticalPlanMappedChoice(
      input,
      [choice(protectRemote, 3000), hqChoice],
      scorelineSupportMapping([protectRemote]),
      choice(protectRemote, 3000),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("protect-hq");
    expect(result.overrideReason).toBe(
      "corp_matchpoint_central_protection_controller",
    );
  });

  it("lets a better burst-economy operation build the progressing rez reserve", () => {
    const gain = legalAction("gain", "gain_credit");
    const burstEconomy = legalAction("burst-economy", "play_operation");
    const alternative = choice(
      burstEconomy,
      -423,
      scoreComponentEvidence("economy_credit_base"),
      {
        key: "economy_credit_base",
        value: 150,
        reason: "economy_net_liquid_gain:2",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [alternative, choice(gain, -1681)],
      scorelineSupportMapping([gain], { stepKind: "build_rez_reserve" }),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("burst-economy");
  });

  it("keeps the basic rez-reserve action when burst economy cannot draw", () => {
    const gain = legalAction("gain", "gain_credit");
    const burstEconomy = legalAction("burst-economy", "play_operation");
    const input = aiInput();
    input.playerView.own.stackOrRdCount = 0;
    const alternative = choice(
      burstEconomy,
      -423,
      scoreComponentEvidence("economy_credit_base"),
      {
        key: "economy_credit_base",
        value: 150,
        reason: "economy_net_liquid_gain:2",
      },
    );
    const result = tacticalPlanMappedChoice(
      input,
      [alternative, choice(gain, -1681)],
      scorelineSupportMapping([gain], { stepKind: "build_rez_reserve" }),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedReason).toBe(
      "corp_scoreline_support_plan_controller",
    );
  });

  it("lets board triage reject an overbuilt remote protection target", () => {
    const remoteIce = legalAction("install-remote-ice", "install_card", {
      serverId: "remote_1",
      placement: "ice",
    });
    const rdIce = legalAction("install-rd-ice", "install_card", {
      serverId: "rd",
      placement: "ice",
    });
    const mapped = choice(
      remoteIce,
      -636,
      scoreComponentEvidence("corp_board_triage_mismatch"),
    );
    const alternative = choice(
      rdIce,
      4193,
      scoreComponentEvidence("corp_board_triage_context"),
    );

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [alternative, mapped],
      scorelineSupportMapping([remoteIce]),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-rd-ice");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("lets board triage stop score-window funding after its need is stale", () => {
    const gain = legalAction("gain", "gain_credit");
    const rdIce = legalAction("install-rd-ice", "install_card", {
      serverId: "rd",
      placement: "ice",
    });
    const mapped = choice(
      gain,
      119,
      scoreComponentEvidence("corp_board_triage_mismatch"),
    );
    const alternative = choice(
      rdIce,
      3943,
      scoreComponentEvidence("corp_board_triage_context"),
    );

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [alternative, mapped],
      scorelineSupportMapping([gain], { stepKind: "build_rez_reserve" }),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-rd-ice");
    expect(result.overrideReason).toBe("corp_board_triage_mismatch_yield");
  });

  it("does not protect a progressing score window without conversion guarantee", () => {
    const installAgenda = legalAction("install-agenda", "install_card");
    const offPlanCredit = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(offPlanCredit, 5000), choice(installAgenda, 50)],
      scoreConversionMapping([installAgenda], {
        status: "progressing",
        evidence: [],
      }),
      choice(offPlanCredit, 5000),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
  });

  it("lets semantic ranking override a mapped Corp action that conflicts with board triage", () => {
    const mappedInstall = legalAction("install-remote-ice", "install_card", {
      serverId: "remote_1",
      placement: "ice",
    });
    const economy = legalAction("burst-economy", "play_operation");
    const mappedChoice = choice(mappedInstall, 1169, [
      ...strategicEvidence("exact"),
      ...scoreComponentEvidence("corp_board_triage_mismatch"),
    ]);
    const economyChoice = choice(economy, 1839, [
      ...scoreComponentEvidence("corp_board_triage_context"),
    ]);

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [economyChoice, mappedChoice],
      remoteContestMapping([mappedInstall]),
      economyChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("burst-economy");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-remote-ice",
    );
    expect(result.overrideReason).toBe("corp_board_triage_mismatch_yield");
    expect(result.scoreGap).toBe(670);
    expect(result.overrideThreshold).toBe(900);
  });
});
