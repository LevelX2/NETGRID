"use client";

import {
  Award,
  Gamepad2,
  Layers3,
  ListFilter,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "use-intl/react";

export type ActiveMatchWorkspace =
  | "game"
  | "games"
  | "catalog"
  | "decks"
  | "recent"
  | "options";
export type ConnectionState = "offline" | "connecting" | "online";

export function AppBrand({
  appName,
  iconSrc,
  wordmarkSrc,
}: {
  appName: string;
  iconSrc: string;
  wordmarkSrc: string;
}) {
  return (
    <div className="brand">
      <div className="mark">
        <img className="brandLogo" src={iconSrc} alt="" aria-hidden="true" />
      </div>
      <div className="brandLockup">
        <img
          className="brandWordmark"
          src={wordmarkSrc}
          alt=""
          aria-hidden="true"
        />
        <h1 className="srOnly">{appName}</h1>
      </div>
    </div>
  );
}

export function ConnectionBadge({
  text,
  state,
}: {
  text: string;
  state: ConnectionState;
}) {
  return <span className={`connection ${state}`}>{text}</span>;
}

export function ActiveMatchWorkspaceNav({
  workspace,
  onWorkspace,
}: {
  workspace: ActiveMatchWorkspace;
  onWorkspace(workspace: ActiveMatchWorkspace): void;
}) {
  const t = useTranslations("AppShell.navigation");
  const items: Array<{
    id: ActiveMatchWorkspace;
    label: string;
    title: string;
    icon: ReactNode;
  }> =
    workspace === "game"
      ? [
          {
            id: "catalog",
            label: t("catalog"),
            title: t("openCatalog"),
            icon: <ListFilter size={16} />,
          },
          {
            id: "decks",
            label: t("decks"),
            title: t("openDecks"),
            icon: <Layers3 size={16} />,
          },
          {
            id: "games",
            label: t("games"),
            title: t("openPublicGames"),
            icon: <Gamepad2 size={16} />,
          },
          {
            id: "recent",
            label: t("recent"),
            title: t("openRecent"),
            icon: <Award size={16} />,
          },
          {
            id: "options",
            label: t("options"),
            title: t("openOptions"),
            icon: <SlidersHorizontal size={16} />,
          },
        ]
      : [
          {
            id: "game",
            label: t("activeGame"),
            title: t("backToActiveGame"),
            icon: <Play size={16} />,
          },
          {
            id: "catalog",
            label: t("catalog"),
            title: t("openCatalog"),
            icon: <ListFilter size={16} />,
          },
          {
            id: "decks",
            label: t("decks"),
            title: t("openDecks"),
            icon: <Layers3 size={16} />,
          },
          {
            id: "games",
            label: t("games"),
            title: t("openPublicGames"),
            icon: <Gamepad2 size={16} />,
          },
          {
            id: "recent",
            label: t("recent"),
            title: t("openRecent"),
            icon: <Award size={16} />,
          },
          {
            id: "options",
            label: t("options"),
            title: t("openOptions"),
            icon: <SlidersHorizontal size={16} />,
          },
        ];

  return (
    <nav
      className={`activeWorkspaceNav ${workspace === "game" ? "compact" : ""}`}
      aria-label={t("ariaLabel")}
    >
      {items.map((item) => (
        <button
          className={`button activeWorkspaceButton ${workspace === item.id ? "active" : ""} ${item.id === "game" && workspace !== "game" ? "runningGame" : ""}`}
          key={item.id}
          onClick={() => onWorkspace(item.id)}
          type="button"
          title={item.title}
          aria-label={item.title}
          aria-current={workspace === item.id ? "page" : undefined}
        >
          {item.icon}
          <span className="workspaceLabel">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
