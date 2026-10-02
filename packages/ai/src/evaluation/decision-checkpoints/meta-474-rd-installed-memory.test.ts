import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r10-g25-d283.json";
import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { reconstructBeliefState } from "../../belief-state";

function fixture(): AiDecisionInput {
  expect(
    Object.values(checkpoint.validation).every((value) => value === true),
  ).toBe(true);
  return structuredClone(checkpoint.input) as unknown as AiDecisionInput;
}

it("SP-478 retains the publicly rezzed R&D ICE identity after Olivia derezzes it", () => {
  const input = fixture();
  const viewBefore = structuredClone(input.playerView);
  const belief = reconstructBeliefState(input);
  expect(belief.runnerOpponentModel?.knownPositionMemory).toContainEqual(
    expect.objectContaining({
      zone: "rd",
      positionKey: "installed-position-v1:735a9fc9",
      definitionId: "onr_v1_223_banpei",
      sourceEventId: "evt_270",
    }),
  );
  expect(input.playerView).toEqual(viewBefore);
  expect(
    input.playerView.servers.find((server) => server.id === "rd")!.ice[1],
  ).toMatchObject({ known: false, rezzed: false });
});

it("does not invent an identity for unrevealed R&D ICE", () => {
  const input = fixture();
  input.eventTail = [];
  input.playerView.publicEvents = [];
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).toEqual([]);
});

it("keeps installed R&D ICE knowledge when only the hidden deck is shuffled", () => {
  const input = fixture();
  const last = input.eventTail.at(-1)!;
  input.eventTail.push({
    ...last,
    eventId: "test_rd_deck_shuffle",
    type: "resolve_choice",
    stateVersionBefore: input.playerView.stateVersion - 1,
    stateVersionAfter: input.playerView.stateVersion,
    publicPayload: {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "rd",
      hiddenZoneMutationKind: "shuffle",
      hiddenZoneAffectedCardCount: 10,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: true,
    },
  } as PublicGameEvent);
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).toContainEqual(
    expect.objectContaining({ zone: "rd", definitionId: "onr_v1_223_banpei" }),
  );
});

it("invalidates R&D installed identity after an actual public board reorder", () => {
  const input = fixture();
  const last = input.eventTail.at(-1)!;
  input.eventTail.push({
    ...last,
    eventId: "test_public_board_reorder",
    type: "resolve_choice",
    stateVersionBefore: input.playerView.stateVersion - 1,
    stateVersionAfter: input.playerView.stateVersion,
    publicPayload: {
      actor: "corp",
      actionType: "resolve_choice",
      serverId: "rd",
      hiddenZoneAction: "conceal_and_reorder_installed_ice",
      hiddenZoneMutationKind: "reorder",
      hiddenZoneAffectedCardCount: 2,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: true,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: false,
    },
  } as PublicGameEvent);
  expect(
    reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory,
  ).not.toContainEqual(
    expect.objectContaining({ zone: "rd", definitionId: "onr_v1_223_banpei" }),
  );
});
