"use client";

import { useTranslations } from "use-intl/react";

export default function MaintenancePage() {
  const t = useTranslations("Maintenance.storage");
  return (
    <main>
      <p style={{ color: "var(--muted)", margin: 0 }}>{t("chooseSection")}</p>
    </main>
  );
}
