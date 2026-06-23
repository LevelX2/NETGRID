import { X } from "lucide-react";
import type { ReactNode } from "react";

export function OptionsDialog({ children, onDismiss }: { children: ReactNode; onDismiss(): void }) {
  return (
    <div className="optionsDialogOverlay" role="dialog" aria-modal="true" aria-labelledby="options-dialog-title">
      <div className="optionsDialogBackdrop" aria-hidden="true" onClick={onDismiss} />
      <section className="optionsDialogPanel">
        <div className="optionsDialogHeader">
          <div>
            <p className="eyebrow">Lokal</p>
            <h2 id="options-dialog-title">Optionen</h2>
          </div>
          <button className="button iconOnly" onClick={onDismiss} aria-label="Optionen schließen" title="Schließen" type="button">
            <X size={16} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
