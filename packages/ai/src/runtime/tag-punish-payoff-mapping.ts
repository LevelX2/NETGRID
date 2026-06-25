import { type StructuredTagPunishPayoffKind } from "../tag-punish-ontology-consumer";

export function corpVisibleTagPayoffCategoryFromOntology(
  payoffKind: StructuredTagPunishPayoffKind,
) {
  switch (payoffKind) {
    case "damage":
    case "scored_agenda_damage_like":
      return "damage";
    case "economic":
      return "economic";
    case "resource_trash":
    case "hardware_trash":
      return "trash";
    default:
      return "unknown";
  }
}

export function corpPunishKindFromOntologyPayoff(
  payoffKind: StructuredTagPunishPayoffKind,
) {
  switch (payoffKind) {
    case "damage":
      return "scorched_earth_like";
    case "economic":
      return "closed_accounts_like";
    case "resource_trash":
      return "resource_trash_like";
    case "hardware_trash":
      return "power_grid_overload_like";
    case "scored_agenda_damage_like":
      return "scored_agenda_damage_like";
    case "scored_agenda_trace_tag_like":
      return "scored_agenda_trace_tag_like";
    default:
      return "unknown";
  }
}
