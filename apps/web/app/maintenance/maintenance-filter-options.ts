import type { AppLocale } from "../../i18n/locale";
import { modeLabel, statusLabel } from "../maintenance";

const matchStatusValues = [
  "pending",
  "waiting_for_runner",
  "waiting_for_corp",
  "waiting_for_joiner_decks",
  "ready_check",
  "countdown",
  "active",
  "cancelled",
  "abandoned",
  "forfeited",
  "finished",
] as const;

const matchModeValues = [
  "human_vs_human",
  "human_runner_vs_corp_ai",
  "human_corp_vs_runner_ai",
] as const;

export function buildMaintenanceFilterOptions(
  locale: AppLocale,
  labels: Readonly<{
    allOption: string;
    nonTerminalOption: string;
    terminalOption: string;
  }>,
) {
  return {
    statusOptions: [
      ["", labels.allOption],
      ...matchStatusValues.map(
        (status) => [status, statusLabel(status, locale)] as [string, string],
      ),
    ] satisfies Array<[string, string]>,
    terminalOptions: [
      ["all", labels.allOption],
      ["false", labels.nonTerminalOption],
      ["true", labels.terminalOption],
    ] satisfies Array<[string, string]>,
    modeOptions: [
      ["", labels.allOption],
      ...matchModeValues.map(
        (mode) => [mode, modeLabel(mode, locale)] as [string, string],
      ),
    ] satisfies Array<[string, string]>,
  };
}
