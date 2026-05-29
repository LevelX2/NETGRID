#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runCli } from "./build-ai-compiled-hints.mjs";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli(["--check", ...process.argv.slice(2).filter((arg) => arg !== "--check")]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
