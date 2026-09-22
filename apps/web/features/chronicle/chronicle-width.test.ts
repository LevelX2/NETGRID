import { expect, it } from "vitest";
import { nextChronicleWidth, type ChronicleWidth } from "./chronicle-width";

it("cycles through all chronicle widths and returns to off", () => {
  let width: ChronicleWidth = "off";
  const visited: ChronicleWidth[] = [];
  for (let index = 0; index < 4; index++) {
    width = nextChronicleWidth(width);
    visited.push(width);
  }
  expect(visited).toEqual(["wide", "medium", "narrow", "off"]);
});
