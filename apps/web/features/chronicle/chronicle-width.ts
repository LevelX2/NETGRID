export type ChronicleWidth = "off" | "wide" | "medium" | "narrow";

export function nextChronicleWidth(width: ChronicleWidth): ChronicleWidth {
  switch (width) {
    case "off": return "wide";
    case "wide": return "medium";
    case "medium": return "narrow";
    case "narrow": return "off";
  }
}
