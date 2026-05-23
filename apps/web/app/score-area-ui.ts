import type { Side, VisibleCard } from "@netgrid/shared";

export const GENETICS_VISIONARY_ACQUISITION_ID = "onr_v1_202_genetics-visionary-acquisition";

export type ScoredAgendaEffectLine = {
  key: string;
  value: string;
  label: string;
  tone: "action" | "effect" | "agenda";
};

type ScoreAreaModifierCard = Pick<VisibleCard, "known" | "definitionId" | "type" | "subtypes" | "selectedServerLabel">;

export function scoredAgendaEffectLineForScoreArea(card: Pick<VisibleCard, "definitionId" | "selectedServerLabel"> | string | undefined, scoreAreaSide: Side): ScoredAgendaEffectLine | null {
  if (scoreAreaSide !== "corp") return null;
  const definitionId = typeof card === "string" || card === undefined ? card : card.definitionId;
  const selectedServerLabel = typeof card === "object" ? card.selectedServerLabel : undefined;
  switch (definitionId) {
    case "onr_v1_188_ai-chief-financial-officer":
      return { key: "effect-ai-cfo", value: "Aktion", label: "HQ/Archiv in R&D mischen, 5 ziehen", tone: "action" };
    case "onr_v1_201_executive-extraction":
      return { key: "effect-executive-extraction", value: "Aktiv", label: "Gray-Ops-Agendas brauchen 1 Entwicklung weniger", tone: "effect" };
    case GENETICS_VISIONARY_ACQUISITION_ID:
      return { key: "effect-genetics-visionary", value: "Aktiv", label: "Research-Agendas brauchen 1 Entwicklung weniger", tone: "effect" };
    case "onr_v1_200_encryption-breakthrough":
      return { key: "effect-encryption-breakthrough", value: "Aktiv", label: "Code-Gates haben +1 Stärke", tone: "effect" };
    case "onr_v1_207_netwatch-operations-office":
      return { key: "effect-netwatch", value: "Aktion", label: "Trace 7: bei Erfolg 1 Tag", tone: "action" };
    case "onr_v1_208_on-call-solo-team":
      return { key: "effect-on-call", value: "Aktion", label: "1 Meat Damage, wenn Runner getaggt ist", tone: "action" };
    case "onr_v1_211_polymer-breakthrough":
      return { key: "effect-polymer", value: "Aktiv", label: "+1 Credit zu Beginn jedes Korp-Zugs", tone: "effect" };
    case "onr_v1_213_private-cybernet-police":
      return { key: "effect-private-police", value: "Aktion", label: "Trace 5: bei Erfolg 1 Tag", tone: "action" };
    case "onr_v1_215_security-net-optimization":
      return { key: "effect-security-net", value: "Aktiv", label: selectedServerLabel ? `${selectedServerLabel}: ICE hat +1 Stärke` : "ICE hat +1 Stärke", tone: "effect" };
    case "onr_v1_217_strike-force-kali":
      return { key: "effect-kali", value: "Aktion", label: "2 Meat Damage, wenn Runner getaggt ist", tone: "action" };
    case "onr_v1_219_superior-net-barriers":
      return { key: "effect-superior-barriers", value: "Aktiv", label: "Wall-ICE hat +1 Stärke", tone: "effect" };
    case "onr_v1_191_black-ice-quality-assurance":
      return { key: "effect-black-ice-quality", value: "Aktiv", label: "Black ICE hat +2 Stärke", tone: "effect" };
    default:
      return null;
  }
}

export function corpScoredGeneticsVisionaryAcquisitionActive(corpScoreAreaCards: readonly ScoreAreaModifierCard[]): boolean {
  return corpScoreAreaCards.some((card) => card.known && card.definitionId === GENETICS_VISIONARY_ACQUISITION_ID);
}

export function researchAgendaDifficultyModifierLineForCard(card: ScoreAreaModifierCard, corpScoreAreaCards: readonly ScoreAreaModifierCard[]): ScoredAgendaEffectLine | null {
  if (!card.known || card.type !== "agenda" || !card.subtypes?.includes("research")) return null;
  if (!corpScoredGeneticsVisionaryAcquisitionActive(corpScoreAreaCards)) return null;
  return {
    key: "modifier-research-difficulty-genetics-visionary",
    value: "Diff -1",
    label: "Genetics-Visionary Acquisition: braucht 1 Entwicklung weniger",
    tone: "agenda"
  };
}
