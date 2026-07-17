import exploitFixtures143Data from "../../../../../../data/scenarios/ai-v143-exploit-regression-fixtures.json";
import type { ExploitFixture } from "./fixture-types";

export const EXPLOIT_FIXTURES = exploitFixtures143Data as {
  version: "1.4.3";
  fixtures: ExploitFixture[];
};

export function listExploitFixtures(): ExploitFixture[] {
  return EXPLOIT_FIXTURES.fixtures.map((fixture) => ({ ...fixture }));
}
