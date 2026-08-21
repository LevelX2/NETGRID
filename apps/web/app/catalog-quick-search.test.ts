import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panelSource = readFileSync(
  new URL("../features/catalog/CatalogPanel.tsx", import.meta.url),
  "utf8",
);
const workspaceSource = readFileSync(
  new URL("../features/catalog/useCatalogWorkspace.ts", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("catalog quick search", () => {
  it("renders exactly one search control outside the collapsible advanced filters", () => {
    expect(panelSource.match(/id="catalogSearch"/g)).toHaveLength(1);
    expect(panelSource.indexOf('id="catalogSearch"')).toBeLessThan(
      panelSource.indexOf("{filtersOpen ? ("),
    );
    expect(panelSource).toContain('className="searchBox catalogQuickSearch"');
    expect(panelSource).toContain('onClick={() => onSearch("")}');
  });

  it("connects the compact filter button to its advanced region and active badge", () => {
    expect(panelSource).toContain('aria-controls="catalogAdvancedFilters"');
    expect(panelSource).toContain('id="catalogAdvancedFilters"');
    expect(panelSource).toContain('className="catalogFilterBadge"');
    expect(panelSource).toContain("activeSpecialFilterLabels.length");
  });

  it("resets special filters without clearing the quick search", () => {
    const resetBody = panelSource.slice(
      panelSource.indexOf("const resetSpecialFilters"),
      panelSource.indexOf("useEffect(() =>", panelSource.indexOf("const resetSpecialFilters")),
    );
    expect(resetBody).toContain('onSetAddon("classic", true)');
    expect(resetBody).toContain('onSetAddon("proteus", true)');
    expect(resetBody).toContain("onSelectAllTypes()");
    expect(resetBody).not.toContain("onSearch");
  });

  it("includes Classic and Proteus by default and removes obsolete filter controls", () => {
    expect(workspaceSource).toContain("{ classic: true, proteus: true }");
    expect(panelSource).not.toContain('t("blockStatus")');
    expect(panelSource).not.toContain('t("aiHints")');
    expect(panelSource).not.toContain("StatusBadges");
    expect(panelSource).not.toContain("catalogExpertToggle");
    expect(panelSource).not.toContain("statusOptions");
  });

  it("keeps search and filter controls responsive on small viewports", () => {
    expect(css).toContain(".catalogQuickTools");
    expect(css).toContain("flex-basis: 100%;");
    expect(css).toContain(".catalogQuickSearch input");
    expect(css).toContain("width: 100%;");
  });

  it("uses the compact catalog-only filter layout", () => {
    expect(css).toContain(
      "grid-template-columns: minmax(420px, 2fr) repeat(2, minmax(130px, 0.6fr));",
    );
    expect(css).toContain("grid-template-columns: repeat(5, minmax(0, 1fr));");
    expect(css).not.toContain(".catalogExpertToggle");
  });
});
