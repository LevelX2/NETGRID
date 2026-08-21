import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "use-intl/react";

export function OptionsDialog({ children, onDismiss }: { children: ReactNode; onDismiss(): void }) {
  const t = useTranslations("AppShell.optionsDialog");
  return (
    <div className="optionsDialogOverlay" role="dialog" aria-modal="true" aria-labelledby="options-dialog-title">
      <div className="optionsDialogBackdrop" aria-hidden="true" onClick={onDismiss} />
      <section className="optionsDialogPanel">
        <div className="optionsDialogHeader">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 id="options-dialog-title">{t("title")}</h2>
          </div>
          <button className="button iconOnly" onClick={onDismiss} aria-label={t("closeOptions")} title={t("close")} type="button">
            <X size={16} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
