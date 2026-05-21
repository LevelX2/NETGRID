import type { CardImplementationDefinition } from "../../../types";

// card name: Namatoki Plaza
// text: Rez Namatoki Plaza when you install it. Install Namatoki Plaza only if you can pay to rez it. Install only inside a subsidiary data fort. That fort may have an additional agenda or node installed inside it. If Namatoki Plaza leaves play while installed, and this results in the fort having too many agendas and nodes installed inside it, trash one of those agendas or nodes.
export const namatokiPlazaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_361_namatoki-plaza",
  installCapabilities: [
    {
      kind: "rez_on_install",
      installOnlyIfRezAffordable: true,
      visibility: "public",
    },
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  fortCapacityModifiers: [
    {
      kind: "additional_agenda_or_node_slot_inside_fort",
      amount: 1,
      activeWhile: "installed",
      visibility: "public",
    },
  ],
  leavePlayCleanup: [
    {
      kind: "trash_agenda_or_node_if_fort_over_capacity",
      target: "agenda_or_node_inside_same_fort",
      selection: "deterministic_lowest_instance_id",
      visibility: "public",
    },
  ],
};
