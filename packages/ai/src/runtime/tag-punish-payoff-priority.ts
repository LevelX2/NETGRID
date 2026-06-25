import { type StructuredTagPunishPayoffKind } from "../tag-punish-ontology-consumer";

export function tagPunishPayoffPriorityBonus(assessment: {
  payoffKind: StructuredTagPunishPayoffKind;
}): number {
  switch (assessment.payoffKind) {
    case "damage":
    case "scored_agenda_damage_like":
      return 55;
    case "economic":
      return 35;
    case "resource_trash":
    case "hardware_trash":
      return 25;
    default:
      return 10;
  }
}
