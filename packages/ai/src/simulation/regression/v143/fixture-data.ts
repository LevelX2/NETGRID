import exploitFixtures143Data from "../../../../../../data/scenarios/ai-v143-exploit-regression-fixtures.json";
import type { ExploitFixture } from "./fixture-types";

export const EXPLOIT_FIXTURES = exploitFixtures143Data as Readonly<{
  version: "1.4.3";
  fixtures: readonly Readonly<ExploitFixture>[];
}>;
