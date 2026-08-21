import type deMessages from "../messages/de.json";
import type deMaintenanceMessages from "../messages/maintenance/de.json";
import type { AppLocale } from "./locale";

type AppMessages = Omit<typeof deMessages, "Maintenance"> & {
  Maintenance: typeof deMessages.Maintenance & typeof deMaintenanceMessages;
};

declare module "use-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}
