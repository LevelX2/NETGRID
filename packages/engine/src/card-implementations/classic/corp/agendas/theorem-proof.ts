import type { CardImplementationDefinition } from "../../../types";

// card name: Theorem Proof
// text: If Runner accesses Theorem Proof, he or she does not score it, but instead may install it as a 2 MU program that has the ability "A: Score Theorem Proof" but is removed from the game if it leaves play in any other way.
export const classicTheoremProofImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_004_theorem-proof",
  agendaAccessReplacement: {
    kind: "install_as_runner_program",
    memoryCost: 2,
    scoreAsAgendaAction: true,
    removeFromGameOnLeavePlay: true,
    visibility: "public",
  },
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "score_source_as_agenda",
          visibility: "public",
        },
      ],
      label: "Theorem Proof scoren",
    },
  ],
};
