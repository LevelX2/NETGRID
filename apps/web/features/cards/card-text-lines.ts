import { neededDevelopmentLabel } from "./card-detail-lines";

export type CardTextLineCard = {
  type: string;
  subtypes: string[];
};

export type CardTextLineDetail = {
  numeric: Record<string, number | null | undefined>;
};

const CARD_NUMERIC_LABELS: Record<string, string> = {
  cost: "Kosten",
  installCost: "Install",
  memoryCost: "MU",
  strength: "Stärke",
  rezCost: "Rez",
  trashCost: "Trash",
  advancementRequirement: "Benötigt",
  agendaPoints: "Agenda",
};

export function cardMetricLine(
  detail: CardTextLineDetail | null | undefined,
): string {
  if (!detail) return "";
  return Object.entries(CARD_NUMERIC_LABELS)
    .map(([key, label]) => {
      const value = detail.numeric[key];
      return cardNumericLabel(key, label, value);
    })
    .filter(Boolean)
    .join(" · ");
}

export function formatCardTypeLine(card: CardTextLineCard): string {
  const type = formatCardTerm(card.type);
  const subtypes = card.subtypes.map(formatCardTerm).join(" / ");
  return [type, subtypes].filter(Boolean).join(" - ");
}

export function formatCardTerm(value: string): string {
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

function cardNumericLabel(
  key: string,
  label: string,
  value: number | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (key === "advancementRequirement") return neededDevelopmentLabel(value);
  return `${label} ${value}`;
}
