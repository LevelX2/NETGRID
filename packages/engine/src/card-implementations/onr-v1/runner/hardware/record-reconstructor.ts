import type { CardImplementationDefinition } from "../../../types";

// card name: Record Reconstructor
// text: A: Make a run on the Archives. If run is successful, do not access cards from the Archives; instead, shuffle the face-up pile of the Archives and then put the top two cards from that pile on R&D.
export const recordReconstructorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_142_record-reconstructor",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Record Reconstructor: Run auf Archives",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "archives" },
          successfulRunAccessReplacement: "archives_faceup_to_rd",
          successfulRunArchivesMoveCount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
