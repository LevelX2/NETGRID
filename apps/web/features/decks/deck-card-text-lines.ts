import { neededDevelopmentLabel } from "../cards/card-detail-lines";

export type DeckTextCard = {
  type: string;
  subtypes: string[];
};

export type DeckTextDetail = {
  numeric: Record<string, number | null | undefined>;
};

const CATALOG_NUMERIC_LABELS: Record<string, string> = {
  cost: "Kosten",
  installCost: "Install",
  memoryCost: "MU",
  strength: "Stärke",
  rezCost: "Rez",
  trashCost: "Trash",
  advancementRequirement: "Benötigt",
  agendaPoints: "Agenda",
};

export function deckCardMetricLine(detail: DeckTextDetail | undefined): string {
  if (!detail) return "";
  return Object.entries(CATALOG_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = detail.numeric[key];
      return deckCardNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
}

export function formatDeckCardTypeLine(card: DeckTextCard): string {
  const type = formatDeckCardTerm(card.type);
  const subtypes = card.subtypes.map(formatDeckCardTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

export function formatDeckCardTerm(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "ice") return "ICE";
  if (normalized === "event") return "Prep";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function deckCardNumericLabel(
  key: string,
  label: string,
  value: number | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}
