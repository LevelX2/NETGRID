#!/usr/bin/env node
import { runCli } from "./check-ai-derived-facts.mjs";

runCli(process.argv.slice(2), {
  defaultReportPath:
    "docs/reviews/ai/ai-derived-basic-facts-prototype-2026-05-25.json",
});
