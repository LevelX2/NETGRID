import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  assessCorpScorelineWindow,
  scorelineAssessmentToTerminalWindowLike,
} from "./semantic-runtime-corp-scoreline-assessment";
import { semanticRuntimeCorpPassiveScoreLinePenalty } from "../semantic-runtime-corp-passive-scoreline";
import { semanticRuntimeCorpScoreNowSafetyGate } from "../semantic-runtime-corp-score-safety";

describe("assessCorpScorelineWindow", () => {
  it("allows safe score-now and penalizes passive draw, economy and end turn", () => {
    const score = action("score", "score_agenda", "agenda-installed", "remote_1");
    const gain = action("gain", "gain_credit", "basic_action");
    const draw = action("draw", "draw_card", "basic_action");
    const endTurn = action("end", "end_turn", "game_rule");
    const input = inputWithActions([score, gain, draw, endTurn], {
      servers: [remote("remote_1", { ice: [ice("ice-1")], root: [agenda("agenda-installed")] })],
    });
    const assessment = scoreline(input);

    expect(assessment.windowKind).toBe("score_now");
    expect(assessment.bestPath).toMatchObject({
      actionId: "score",
      recommendedNextStep: "score_now",
      blocked: false,
    });
    expect(
      semanticRuntimeCorpScoreNowSafetyGate(input, score, consumerDeps(assessment)),
    ).toMatchObject({ allowed: true });
    for (const passive of [gain, draw, endTurn]) {
      expect(
        semanticRuntimeCorpPassiveScoreLinePenalty(
          input,
          passive,
          passiveDeps(assessment),
        ),
      ).toEqual(expect.objectContaining({ key: "corp_passive_scoreline_available" }));
    }
  });

  it("does not mark score or advance safe when the remote is unsafe", () => {
    const advance = action("advance", "advance_card", "agenda-installed", "remote_1");
    const gain = action("gain", "gain_credit", "basic_action");
    const input = inputWithActions([advance, gain], {
      servers: [remote("remote_1", { root: [agenda("agenda-installed", 2, 1)] })],
      runnerCredits: 4,
    });
    const assessment = scoreline(input, { advanceCompletesActionIds: ["advance"] });
    const path = pathFor(assessment, "advance");

    expect(path.safe).toBe(false);
    expect(path.blockers).toContain("cheap_contest");
    expect(
      semanticRuntimeCorpPassiveScoreLinePenalty(input, gain, passiveDeps(assessment)),
    ).toBeUndefined();
  });

  it("recognizes economy that funds a blocked scoreline and does not punish it as passive", () => {
    const score = {
      ...action("score", "score_agenda", "agenda-installed", "remote_1"),
      costs: [{ credits: 5 }],
    };
    const gain = action("gain", "gain_credit", "basic_action");
    const input = inputWithActions([score, gain], {
      credits: 0,
      servers: [remote("remote_1", { ice: [ice("ice-1")], root: [agenda("agenda-installed")] })],
    });
    const assessment = scoreline(input, { creditsAfterAction: { gain: 5 } });

    expect(pathFor(assessment, "score").blockers).toContain("credits");
    expect(pathFor(assessment, "gain")).toMatchObject({
      actionRoles: ["fund_scoreline"],
      recommendedNextStep: "fund_scoreline",
      blocked: false,
    });
    expect(
      semanticRuntimeCorpPassiveScoreLinePenalty(input, gain, passiveDeps(assessment)),
    ).toBeUndefined();
  });

  it("does not treat hidden-zone reveal wrappers as scoreline funding", () => {
    const score = {
      ...action("score", "score_agenda", "agenda-installed", "remote_1"),
      costs: [{ credits: 5 }],
    };
    const gain = action("gain", "gain_credit", "basic_action");
    const reveal = action("reveal-rd-top", "gain_credit", "agenda-scored", undefined, {
      abilityFamily: "hidden-zone",
      effectKind: "hidden_zone",
      agendaAbility: "v1919_scored_agenda_reveal_rd_top",
    });
    const input = inputWithActions([score, gain, reveal], {
      credits: 0,
      servers: [remote("remote_1", { ice: [ice("ice-1")], root: [agenda("agenda-installed")] })],
    });
    const assessment = scoreline(input, {
      creditsAfterAction: { gain: 1, "reveal-rd-top": 1 },
    });

    expect(pathFor(assessment, "gain")).toMatchObject({
      actionRoles: ["fund_scoreline"],
      recommendedNextStep: "fund_scoreline",
    });
    expect(
      assessment.paths.some((path) => path.actionId === "reveal-rd-top"),
    ).toBe(false);
  });

  it("lets central pressure support score-now while blocking agenda install and recommending central protection", () => {
    const score = action("score", "score_agenda", "agenda-installed", "remote_1");
    const installAgenda = action("install-agenda", "install_card", "agenda-hand", "remote_1");
    const protectHq = action("protect-hq", "install_card", "ice-hand", "hq", {
      placement: "ice",
    });
    const input = inputWithActions([score, installAgenda, protectHq], {
      servers: [
        remote("remote_1", { ice: [ice("ice-1")], root: [agenda("agenda-installed")] }),
        central("hq"),
      ],
      hand: [agenda("agenda-hand"), ice("ice-hand")],
    });
    const assessment = scoreline(input, { centralThreatHigh: true });

    expect(pathFor(assessment, "score")).toMatchObject({
      recommendedNextStep: "score_now",
      blocked: false,
    });
    expect(pathFor(assessment, "install-agenda").blockers).toContain(
      "central_threat",
    );
    expect(pathFor(assessment, "protect-hq")).toMatchObject({
      recommendedNextStep: "protect_central",
      blocked: false,
    });
  });

  it("classifies advance actions that complete the agenda as advance-to-score", () => {
    const advance = action("advance", "advance_card", "agenda-installed", "remote_1");
    const input = inputWithActions([advance], {
      servers: [remote("remote_1", { ice: [ice("ice-1")], root: [agenda("agenda-installed", 2, 1)] })],
    });
    const assessment = scoreline(input, { advanceCompletesActionIds: ["advance"] });

    expect(assessment.advanceToScoreActionIds).toEqual(["advance"]);
    expect(pathFor(assessment, "advance")).toMatchObject({
      actionRoles: ["advance_to_score"],
      recommendedNextStep: "advance_agenda",
    });
  });

  it("marks agenda install as scoreline path only for effectively protected remotes", () => {
    const protectedInstall = action(
      "install-protected",
      "install_card",
      "agenda-hand",
      "remote_1",
    );
    const nakedInstall = action(
      "install-naked",
      "install_card",
      "agenda-hand",
      "remote_2",
    );
    const input = inputWithActions([protectedInstall, nakedInstall], {
      hand: [agenda("agenda-hand")],
      servers: [
        remote("remote_1", { ice: [ice("ice-1")] }),
        remote("remote_2"),
      ],
    });
    const assessment = scoreline(input);

    expect(assessment.agendaInstallActionIds).toEqual(["install-protected"]);
    expect(assessment.paths.some((path) => path.actionId === "install-naked")).toBe(
      false,
    );
  });

  it("keeps central protection out of scoreline paths when central threat is not high", () => {
    const installAgenda = action(
      "install-agenda",
      "install_card",
      "agenda-hand",
      "remote_1",
    );
    const protectHq = action("protect-hq", "install_card", "ice-hand", "hq", {
      placement: "ice",
    });
    const input = inputWithActions([installAgenda, protectHq], {
      credits: 10,
      hand: [agenda("agenda-hand"), ice("ice-hand")],
      servers: [
        remote("remote_1", { ice: [ice("ice-1")] }),
        central("hq"),
      ],
    });

    const assessment = scoreline(input, { centralThreatHigh: false });

    expect(pathFor(assessment, "install-agenda")).toMatchObject({
      actionRoles: ["agenda_install"],
    });
    expect(
      assessment.paths.some((path) => path.actionId === "protect-hq"),
    ).toBe(false);
    expect(assessment.evidence).not.toContain(
      "corp_scoreline_best_action:install_card:central_protection:hq",
    );
  });

  it("keeps no-score-path states as none/defer without passive penalty", () => {
    const draw = action("draw", "draw_card", "basic_action");
    const endTurn = action("end", "end_turn", "game_rule");
    const input = inputWithActions([draw, endTurn]);
    const assessment = scoreline(input);

    expect(assessment.windowKind).toBe("none");
    expect(assessment.recommendedNextStep).toBe("defer");
    expect(assessment.terminalWindow).toBe(false);
    expect(
      semanticRuntimeCorpPassiveScoreLinePenalty(input, draw, passiveDeps(assessment)),
    ).toBeUndefined();
  });

  it("does not emit fixed true evidence when no scoreline window exists", () => {
    const input = inputWithActions([action("draw", "draw_card", "basic_action")]);
    const assessment = scoreline(input);
    const terminal = scorelineAssessmentToTerminalWindowLike(assessment);

    expect(assessment.evidence).toContain("corp_scoreline_terminal_window:false");
    expect(assessment.evidence).not.toContain("corp_score_terminal_window:true");
    expect(terminal.evidence).not.toContain("corp_score_terminal_window:true");
  });
});

function scoreline(
  input: AiDecisionInput,
  overrides: {
    advanceCompletesActionIds?: readonly string[];
    centralThreatHigh?: boolean;
    creditsAfterAction?: Readonly<Record<string, number>>;
  } = {},
) {
  return assessCorpScorelineWindow(input, {
    actionServerId: (_input, action) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    server: (runtimeInput, serverId) =>
      runtimeInput.playerView.servers.find((server) => server.id === serverId),
    actionCreditCost: (action) =>
      action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
    actionIsScoreLine: (runtimeInput, action) =>
      action.type === "score_agenda" ||
      sourceCard(runtimeInput, action)?.type === "agenda",
    advanceCompletesScore: (_input, action) =>
      overrides.advanceCompletesActionIds?.includes(action.actionId) === true,
    remoteHasScoreLine: (server) =>
      server?.root.some(
        (card) =>
          (card.known && card.type === "agenda") ||
          (card.advancementCounters ?? 0) > 0,
      ) === true,
    isRemoteServerTarget: (serverId) => serverId?.startsWith("remote_") === true,
    visibleIceRezCost: (card) => card.rezCost ?? 0,
    actionSourceCard: sourceCard,
    rolesForAction: (_input, action) =>
      action.type === "gain_credit" ? ["economy"] : [],
    projectedCreditsAfterAction: (runtimeInput, action) =>
      overrides.creditsAfterAction?.[action.actionId] ??
      runtimeInput.playerView.own.credits -
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
    remoteIsProtected: (server) => (server?.ice.length ?? 0) > 0,
    remoteContestabilityAssessment: (runtimeInput, action) => {
      const serverId =
        typeof action.payload?.serverId === "string"
          ? action.payload.serverId
          : undefined;
      const server = runtimeInput.playerView.servers.find(
        (candidate) => candidate.id === serverId,
      );
      if (!serverId?.startsWith("remote_") || (server?.ice.length ?? 0) > 0) {
        return undefined;
      }
      return {
        serverId,
        contestable: true,
        evidence: [`server:${serverId}`, "remote_contestable_by_runner:true"],
      };
    },
    centralThreatHigh: () => overrides.centralThreatHigh === true,
    actionIsEconomy: (_input, action) => action.type === "gain_credit",
  });
}

function consumerDeps(assessment: ReturnType<typeof scoreline>) {
  return {
    scoreTerminalWindow: () => scorelineAssessmentToTerminalWindowLike(assessment),
    scorelineWindowAssessment: () => assessment,
  };
}

function passiveDeps(assessment: ReturnType<typeof scoreline>) {
  return {
    ...consumerDeps(assessment),
    actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) =>
      sourceCard(input, action)?.type === "agenda",
    rolesForAction: (_input: AiDecisionInput, action: LegalAction) =>
      action.type === "gain_credit" ? ["economy"] : [],
  };
}

function pathFor(assessment: ReturnType<typeof scoreline>, actionId: string) {
  const path = assessment.paths.find((candidate) => candidate.actionId === actionId);
  expect(path, actionId).toBeDefined();
  return path!;
}

function inputWithActions(
  legalActions: readonly LegalAction[],
  options: {
    credits?: number;
    runnerCredits?: number;
    hand?: readonly VisibleCard[];
    servers?: AiDecisionInput["playerView"]["servers"];
  } = {},
): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [...legalActions],
    eventTail: [],
    difficulty: "normal",
    seed: "scoreline-test",
    decisionId: "scoreline-test",
    actionNumber: 1,
    profileId: "test",
    playerView: {
      stateVersion: 1,
      side: "corp",
      own: {
        clicks: 3,
        credits: options.credits ?? 5,
        agendaPoints: 0,
        gripOrHq: [...(options.hand ?? [])],
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        clicks: 3,
        credits: options.runnerCredits ?? 0,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        tags: 0,
      },
      servers: options.servers ?? [],
      publicEvents: [],
      legalActions: [...legalActions],
      agendaPointsToWin: 7,
      winner: null,
    },
  } as unknown as AiDecisionInput;
}

function action(
  actionId: string,
  type: LegalAction["type"],
  source: LegalAction["source"],
  serverId?: string,
  payload: Record<string, string | number | boolean> = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source,
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      ...(serverId ? { serverId } : {}),
      ...(type === "install_card" ? { placement: "root" } : {}),
      ...payload,
    },
  };
}

function remote(
  id: string,
  options: { ice?: readonly VisibleCard[]; root?: readonly VisibleCard[] } = {},
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    ice: [...(options.ice ?? [])],
    root: [...(options.root ?? [])],
  } as AiDecisionInput["playerView"]["servers"][number];
}

function central(id: "hq" | "rd"): AiDecisionInput["playerView"]["servers"][number] {
  return remote(id);
}

function agenda(
  instanceId: string,
  advancementRequirement = 2,
  advancementCounters = 2,
): VisibleCard {
  return {
    instanceId,
    definitionId: `agenda-${instanceId}`,
    title: instanceId,
    type: "agenda",
    known: true,
    advancementRequirement,
    advancementCounters,
    agendaPoints: 2,
  } as unknown as VisibleCard;
}

function ice(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: `ice-${instanceId}`,
    title: instanceId,
    type: "ice",
    known: true,
    rezCost: 0,
    rezzed: true,
    effectiveRunQuote: {
      subroutines: [{ type: "end_the_run" }],
    },
  } as unknown as VisibleCard;
}

function sourceCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  if (action.source === "basic_action" || action.source === "game_rule") {
    return undefined;
  }
  const allCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  return allCards.find((card) => card.instanceId === action.source);
}
