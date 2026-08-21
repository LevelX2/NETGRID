import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panelSource = readFileSync(
  new URL("../features/catalog/CatalogPanel.tsx", import.meta.url),
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
    expect(resetBody).toContain('onSetAddon("classic", false)');
    expect(resetBody).toContain('onSetAddon("proteus", false)');
    expect(resetBody).toContain("onSelectAllTypes()");
    expect(resetBody).not.toContain("onSearch");
  });

  it("keeps search and filter controls responsive on small viewports", () => {
    expect(css).toContain(".catalogQuickTools");
    expect(css).toContain("flex-basis: 100%;");
    expect(css).toContain(".catalogQuickSearch input");
    expect(css).toContain("width: 100%;");
  });
});
