import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpGlobalIceSupportAssetInstallSignal } from "../../corp/defense/defense-discovery-support";
import {
  v162CardReleaseGame,
  moveCorpCardToHq,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { projectGlobalRootSupportRezAfterInstall } from "../../../../engine/src/game/payment/root-support-post-install-rez-quote";
import { corpIcePostInstallRezProjectionPayload } from "../../../../engine/src/game/payment/corp-rez-cost";

function checkpoint() {
  const native = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta496-g4-d48.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
  const input = structuredClone(
    native.input,
  ) as AiDecisionInputWithDeckCapabilities;
  const source = input.playerView.own.gripOrHq.find(
    (c) => c.definitionId === "onr_v1_320_encoder-inc",
  )!;
  const action = input.legalActions.find(
    (a) => a.source === source.instanceId && a.type === "install_card",
  )!;
  // Explicit current-contract counterline: native board has no active cost
  // modifiers. Obtain the payment from the Engine and rebind only identity.
  const state = v162CardReleaseGame("sp207-payment-counterline");
  const id = moveCorpCardToHq(state, source.definitionId!);
  state.corp.servers = input.playerView.servers.map((s) => ({
    id: s.id,
    kind:
      s.id === "hq" || s.id === "rd" || s.id === "archives" ? s.id : "remote",
    label: s.label,
    ice: [],
    root: [],
  }));
  const quote = projectGlobalRootSupportRezAfterInstall(state, id)!;
  expect(quote).toMatchObject({ complete: true, finalCredits: 0 });
  action.payload = {
    ...action.payload,
    ...corpIcePostInstallRezProjectionPayload({
      ...quote,
      cardId: source.instanceId,
      expiresAtStateVersion: input.playerView.stateVersion,
    }),
  };
  const projected = { ...input, ...buildAiDecisionInputDto(input) };
  const candidate = buildActionSemanticCandidates({
    legalActions: [
      projected.legalActions.find((a) => a.actionId === action.actionId)!,
    ],
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [source.instanceId]: source.definitionId!,
    },
  })[0]!;
  return {
    input: projected,
    runtime: native.runtime,
    candidate,
    actionId: action.actionId,
  };
}

describe("global ICE support installation admission (SP-207)", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it("binds installation to funded Code Gates on other forts through the existing Defense owner", () => {
    const { input, candidate, runtime, actionId } = checkpoint();
    expect(
      corpGlobalIceSupportAssetInstallSignal(input, candidate, []),
    ).toMatchObject({
      kind: "generic",
      phase: "install_defense_support",
      serverId: "new_remote",
      actionIds: [actionId],
    });
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(actionId);
    expect(
      selected.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("plan:corp.defend_servers:");
  });
  it.each([
    "targets",
    "missing",
    "stale",
    "wrong_source",
    "existing_target",
    "unfunded",
  ] as const)("does not admit a %s preparation", (condition) => {
    const { input, candidate, actionId } = checkpoint();
    const p = input.legalActions.find((a) => a.actionId === actionId)!.payload!;
    if (condition === "targets")
      for (const s of input.playerView.servers) s.ice = [];
    if (condition === "missing") delete p.postInstallRezQuoteComplete;
    if (condition === "stale")
      p.postInstallRezQuoteExpiresAtStateVersion =
        input.playerView.stateVersion - 1;
    if (condition === "wrong_source")
      p.postInstallRezQuoteCardId = "wrong_source";
    if (condition === "existing_target")
      input.playerView.servers.push({
        id: p.postInstallRezQuoteProjectedServerId as `remote_${number}`,
        label: "Already existing target",
        ice: [],
        root: [],
      });
    if (condition === "unfunded")
      p.postInstallRezQuoteFinalCredits = input.playerView.own.credits + 1;
    expect(
      corpGlobalIceSupportAssetInstallSignal(input, candidate, []),
    ).toBeUndefined();
  });
});
