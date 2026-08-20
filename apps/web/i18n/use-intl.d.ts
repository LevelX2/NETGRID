import type deMessages from "../messages/de.json";
import type { AppLocale } from "./locale";

declare module "use-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof deMessages;
  }
}

