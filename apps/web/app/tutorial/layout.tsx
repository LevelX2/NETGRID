import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { testCardsEnabledFromEnvironment } from "@netgrid/shared";

export default function TutorialLayout({ children }: { children: ReactNode }) {
  if (!testCardsEnabledFromEnvironment(process.env)) notFound();
  return children;
}
