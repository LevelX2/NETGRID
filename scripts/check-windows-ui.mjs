import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
  if (!source.includes('Common\\WindowsUiLanguage.cs'))
    throw new Error(`windows_ui_language_policy_missing:${project}`);
}
const commonUiSource = readFileSync(path.join(projectRoot, 'apps/windows/Common/WindowsUiStrings.cs'), 'utf8');
if (!commonUiSource.includes('WindowsUiLanguage.Resolve(WindowsUiLanguage.ReadPreference()'))
  throw new Error('windows_ui_installed_preference_not_loaded');
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

const setupDirectory = path.join(projectRoot, "apps/windows/Netgrid.SetupHost");
const setupSource = readdirSync(setupDirectory)
  .filter((file) => file.endsWith(".cs"))
  .map((file) => readFileSync(path.join(setupDirectory, file), "utf8"))
  .join("\n");
const setupErrorCodes = new Set(
  [...setupSource.matchAll(/new SetupException\("([a-z_]+)"/g)].map(
    (match) => match[1],
  ),
);
if (!setupSource.includes('Property("NETGRID_UI_LANGUAGE", UiText.Language)'))
  throw new Error('windows_setup_language_choice_not_forwarded');
for (const code of setupErrorCodes)
  for (const language of languages)
    if (!catalog[language][`setup.failure.${code}`])
      throw new Error(`windows_setup_error_untranslated:${language}:${code}`);
if (setupSource.includes("exception.Message"))
  throw new Error("windows_setup_raw_exception_message");
if (setupSource.includes('GetValue("DesktopShortcut")'))
  throw new Error("windows_setup_desktop_preference_second_authority");

const matrixRoot = option("--matrix");
if (matrixRoot) {
  for (const language of languages)
    for (const scale of [100, 125, 150]) {
      const languageFile = path.join(matrixRoot, `language-${language}-${scale}.png`);
      if (!existsSync(languageFile) || statSync(languageFile).size < 2_000)
        throw new Error(`windows_ui_language_preview_invalid:${language}:${scale}`);
      const file = path.join(matrixRoot, `setup-${language}-${scale}.png`);
      if (!existsSync(file) || statSync(file).size < 10_000)
        throw new Error(`windows_ui_preview_invalid:${language}:${scale}`);
      const uninstallFile = path.join(
        matrixRoot,
        `uninstall-${language}-${scale}.png`,
      );
      if (!existsSync(uninstallFile) || statSync(uninstallFile).size < 10_000)
        throw new Error(
          `windows_ui_uninstall_preview_invalid:${language}:${scale}`,
        );
    }
}
process.stdout.write(
  `WINDOWS_UI_CHECK_OK languages=${languages.join(",")} strings=${reference.length} scales=100,125,150\n`,
);

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : path.resolve(process.argv[index + 1]);
}
