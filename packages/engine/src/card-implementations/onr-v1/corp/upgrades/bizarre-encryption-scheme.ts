import type { CardImplementationDefinition } from "../../../types";

// card name: Bizarre Encryption Scheme
// text: Runner does not score any agenda (or agendas) during a run in which Bizarre Encryption Scheme is accessed; return that agenda to the fort instead. Runner scores the agenda at the start of his or her next turn if neither you nor Runner has scored it by then. This does not affect any further runs.
export const bizarreEncryptionSchemeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
  hiddenReplacementLongtail: {
    kind: "bizarre_encryption_scheme_access_replacement",
    visibility: "hidden_info_barrier",
  },
};
