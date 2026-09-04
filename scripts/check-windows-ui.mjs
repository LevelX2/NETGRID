import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  readFileSync(
    path.join(projectRoot, "apps/windows/Common/windows-ui-strings.json"),
    "utf8",
  ),
);
const languages = ["de", "en", "fr"];
const reference = Object.keys(catalog.en).sort();
if (!existsSync(path.join(projectRoot, "apps/web/public/brand/netgrid.ico")))
  throw new Error("windows_ui_icon_missing");
for (const project of [
  "Netgrid.SetupHost",
  "Netgrid.FirstRun",
  "Netgrid.Launcher",
  "Netgrid.Updater",
]) {
  const source = readFileSync(
    path.join(projectRoot, "apps/windows", project, `${project}.csproj`),
    "utf8",
  );
  if (
    !source.includes(
      "<ApplicationIcon>..\\..\\web\\public\\brand\\netgrid.ico</ApplicationIcon>",
    )
  )
    throw new Error(`windows_ui_project_icon_missing:${project}`);
}
for (const language of languages) {
  const keys = Object.keys(catalog[language] ?? {}).sort();
  if (JSON.stringify(keys) !== JSON.stringify(reference))
    throw new Error(`windows_ui_keys_incomplete:${language}`);
  for (const key of reference) {
    const value = catalog[language][key];
    if (!value?.trim())
      throw new Error(`windows_ui_string_empty:${language}:${key}`);
    const placeholders = [...value.matchAll(/\{\d+\}/g)]
      .map((match) => match[0])
      .sort();
    const expected = [...catalog.en[key].matchAll(/\{\d+\}/g)]
      .map((match) => match[0])
      .sort();
    if (JSON.stringify(placeholders) !== JSON.stringify(expected))
      throw new Error(`windows_ui_placeholders_invalid:${language}:${key}`);
  }
}

const matrixRoot = option("--matrix");
if (matrixRoot) {
  for (const language of languages)
    for (const scale of [100, 125, 150]) {
      const file = path.join(matrixRoot, `setup-${language}-${scale}.png`);
      if (!existsSync(file) || statSync(file).size < 10_000)
        throw new Error(`windows_ui_preview_invalid:${language}:${scale}`);
    }
}
process.stdout.write(
  `WINDOWS_UI_CHECK_OK languages=${languages.join(",")} strings=${reference.length} scales=100,125,150\n`,
);

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : path.resolve(process.argv[index + 1]);
}
