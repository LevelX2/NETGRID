import type { Side } from "@netgrid/shared";

export type ScoredAgendaEffectLine = {
  key: string;
  value: string;
  label: string;
  tone: "action" | "effect";
};

export function scoredAgendaEffectLineForScoreArea(definitionId: string | undefined, scoreAreaSide: Side): ScoredAgendaEffectLine | null {
  if (scoreAreaSide !== "corp") return null;
  switch (definitionId) {
    case "onr_v1_188_ai-chief-financial-officer":
      return { key: "effect-ai-cfo", value: "Aktion", label: "HQ/Archiv in R&D mischen, 5 ziehen", tone: "action" };
    case "onr_v1_201_executive-extraction":
      return { key: "effect-executive-extraction", value: "Aktiv", label: "Gray-Ops-Agendas brauchen 1 Entwicklung weniger", tone: "effect" };
    case "onr_v1_207_netwatch-operations-office":
      return { key: "effect-netwatch", value: "Aktion", label: "Trace 7: bei Erfolg 1 Tag", tone: "action" };
    case "onr_v1_208_on-call-solo-team":
      return { key: "effect-on-call", value: "Aktion", label: "1 Meat Damage, wenn Runner getaggt ist", tone: "action" };
    case "onr_v1_211_polymer-breakthrough":
      return { key: "effect-polymer", value: "Aktiv", label: "+1 Credit zu Beginn jedes Korp-Zugs", tone: "effect" };
    case "onr_v1_213_private-cybernet-police":
      return { key: "effect-private-police", value: "Aktion", label: "Trace 5: bei Erfolg 1 Tag", tone: "action" };
    case "onr_v1_215_security-net-optimization":
      return { key: "effect-security-net", value: "Aktiv", label: "ICE hat +1 Stärke", tone: "effect" };
    case "onr_v1_217_strike-force-kali":
      return { key: "effect-kali", value: "Aktion", label: "2 Meat Damage, wenn Runner getaggt ist", tone: "action" };
    case "onr_v1_219_superior-net-barriers":
      return { key: "effect-superior-barriers", value: "Aktiv", label: "Wall-ICE hat +1 Stärke", tone: "effect" };
    default:
      return null;
  }
}

export function scoredAgendaCreditCounterSource(definitionId: string | undefined): string | null {
  if (definitionId === "onr_v1_193_corporate-coup") return "Corporate Coup";
  if (definitionId === "onr_v1_209_political-coup") return "Political Coup";
  return null;
}
