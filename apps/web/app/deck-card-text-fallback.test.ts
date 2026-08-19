import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("deck card image fallback", () => {
  it("switches the thumbnail to text after all image variants fail", () => {
    const source = readFileSync(
      new URL("../features/decks/DeckCardThumb.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("const [imageUnavailable, setImageUnavailable] = useState(false)");
    expect(source).toContain("onUnavailable={() => setImageUnavailable(true)}");
    expect(source).toContain("<CardTextPreview");
    expect(source).not.toContain("title.slice(0, 1)");
  });
});
