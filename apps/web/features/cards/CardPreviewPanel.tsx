import { ChevronDown, ChevronUp } from "lucide-react";
import type { Side } from "@netgrid/shared";

import { CardDisplayModeSelector } from "../settings/OptionsPanel";
import type { CardDisplayMode } from "../settings/settings-model";
import { CardView } from "./CardView";
import type { DisplayVisibleCard } from "./card-view-model";

export function CardPreviewPanel({
  card,
  displayMode,
  onDisplayMode,
  hiddenSide,
  collapsed,
  onCollapsed
}: {
  card: DisplayVisibleCard | null;
  displayMode: CardDisplayMode;
  onDisplayMode(value: CardDisplayMode): void;
  hiddenSide?: Side;
  collapsed: boolean;
  onCollapsed(value: boolean): void;
}) {
  return (
    <section className={`section cardPreviewPanel ${collapsed ? "collapsed" : ""}`} data-testid="card-preview">
      <div className="previewTitleLine">
        <div>
          <h2>Vorschau</h2>
          <p className="meta">Kartenanzeige</p>
        </div>
        <div className="previewControls">
          {!collapsed ? <CardDisplayModeSelector mode={displayMode} onChange={onDisplayMode} iconOnly /> : null}
          <button
            className="button iconOnly previewToggle"
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Kartenvorschau ausklappen" : "Kartenvorschau einklappen"}
            title={collapsed ? "Kartenvorschau ausklappen" : "Kartenvorschau einklappen"}
            onClick={() => onCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && card ? (
        <div className={`previewModeShell mode-${displayMode}`}>
          <CardView card={card} displayMode={displayMode} {...(hiddenSide ? { hiddenSide } : {})} preview />
        </div>
      ) : null}
      {!collapsed && !card ? (
        <p className="meta">Wähle eine Karte für die Vorschau.</p>
      ) : null}
    </section>
  );
}
