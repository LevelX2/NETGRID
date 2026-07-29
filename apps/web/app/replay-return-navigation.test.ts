import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const publicGamesSource = readFileSync(
  new URL("../features/games/PublicGamesPanel.tsx", import.meta.url),
  "utf8",
);
const recentGamesSource = readFileSync(
  new URL("../features/recent/RecentGamesPanel.tsx", import.meta.url),
  "utf8",
);

describe("replay return navigation", () => {
  it("keeps replay transitions inside the Next.js router", () => {
    expect(publicGamesSource).toContain('import Link from "next/link"');
    expect(publicGamesSource).toMatch(
      /<Link\s+className="button primary"\s+href=\{target\}/,
    );
    expect(recentGamesSource).toContain('import Link from "next/link"');
    expect(recentGamesSource).toContain("<Link");
    expect(pageSource).toContain('import { useRouter } from "next/navigation"');
    expect(pageSource).toContain("router.push(");
  });
});
