import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const engineSource = path.join(root, "packages", "engine", "src");
const allowed = new Set(["game/create-game.ts", "game/economy/credit-gain.ts"]);
const violations = [];

for (const file of await sourceFiles(engineSource)) {
  const relative = path.relative(engineSource, file).replaceAll("\\", "/");
  if (
    relative.endsWith(".test.ts") ||
    relative.includes("/test-fixtures/") ||
    allowed.has(relative)
  )
    continue;
  const source = await readFile(file, "utf8");
  for (const [index, line] of source.split(/\r?\n/u).entries()) {
    if (
      /\b(?:[A-Za-z_$][\w$]*\.)*state\.(?:corp|runner)\.credits\s*\+=/u.test(
        line,
      )
    )
      violations.push(`${relative}:${index + 1}: ${line.trim()}`);
  }
}

if (violations.length > 0) {
  console.error("Unzulässige direkte Pool-Creditgewinne gefunden:");
  for (const violation of violations) console.error(`- ${violation}`);
  console.error(
    "Normale Creditgewinne müssen applyCreditGain oder den delegierenden credits-Host verwenden.",
  );
  process.exitCode = 1;
} else {
  console.log(
    "ENGINE_CREDIT_GAIN_BOUNDARY_OK: direkte Pool-Gains bleiben auf Kern und Setup begrenzt.",
  );
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(target)));
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files;
}
