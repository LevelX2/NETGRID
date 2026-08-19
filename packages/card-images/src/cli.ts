import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRuntimeCardsById, type CatalogSide } from "@netgrid/catalog";
import { importCardImagesFromCsv } from "./importer";
import {
  buildPrivateCardImagePack,
  buildPrivateCardImagePackZip,
  importPrivateCardImagePack,
  importPrivateCardImagePackZip,
  privateCardImagePackProfile,
  writePrivateCardImagePackTemplate,
  type PrivateCardImagePackProfileId,
} from "./packs";
import { CardImageStore } from "./store";
import { createCurrentCardImageMappingTemplate } from "./template";

export async function runCardImageCli(args: readonly string[]): Promise<void> {
  const [command, ...rest] = args;
  const options = parseOptions(rest);
  if (command === "template") {
    const output = requiredOption(options, "output");
    const collectionId = optionalString(options.collection) ?? "personal";
    const store = new CardImageStore();
    const currentBindings = (await store.readCollection(collectionId)).bindings;
    const allCards = Object.values(createRuntimeCardsById());
    const missingPrintingIds = options["missing-only"]
      ? new Set(
          allCards
            .filter((card) => !currentBindings[card.printingId])
            .map((card) => card.printingId),
        )
      : undefined;
    const side = optionalSide(options.side);
    const setId = optionalString(options.set);
    const content = createCurrentCardImageMappingTemplate({
      ...(setId ? { setId } : {}),
      ...(side ? { side } : {}),
      ...(missingPrintingIds ? { missingPrintingIds } : {}),
    });
    const target = path.resolve(output);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
    process.stdout.write(
      `${JSON.stringify({ ok: true, command, output: target, collectionId })}\n`,
    );
    return;
  }
  if (command === "pack-template") {
    const profileId = requiredProfile(options);
    const output = await writePrivateCardImagePackTemplate(profileId, {
      replace: options.replace === true,
    });
    process.stdout.write(
      `${JSON.stringify({ ok: true, command, profileId, output })}\n`,
    );
    return;
  }
  if (command === "pack-build") {
    const profileId = requiredProfile(options);
    const format = packFormat(options);
    const buildOptions = {
      profileId,
      mappingFile: requiredOption(options, "file"),
      replace: options.replace === true,
    };
    const result =
      format === "zip"
        ? await buildPrivateCardImagePackZip(buildOptions)
        : await buildPrivateCardImagePack(buildOptions);
    process.stdout.write(
      `${JSON.stringify({ ok: true, command, profileId, format, output: "outputFile" in result ? result.outputFile : result.outputDirectory, manifest: result.manifest }, null, 2)}\n`,
    );
    return;
  }
  if (command === "pack-import") {
    const directory = optionalString(options.directory);
    const archiveFile = optionalString(options.zip);
    if (Boolean(directory) === Boolean(archiveFile))
      throw new Error(
        "Pack-Import benötigt genau eine Option: --directory oder --zip.",
      );
    const importOptions = {
      collectionId: optionalString(options.collection) ?? "personal",
      onExisting: conflictMode(options),
      dryRun: options["dry-run"] === true,
    };
    const report = archiveFile
      ? await importPrivateCardImagePackZip({ archiveFile, ...importOptions })
      : await importPrivateCardImagePack({
          packDirectory: directory!,
          ...importOptions,
        });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  if (command === "import" || command === "import-https") {
    const mappingFile = requiredOption(options, "file");
    const mode = conflictMode(options);
    const report = await importCardImagesFromCsv({
      mappingFile,
      collectionId: optionalString(options.collection) ?? "personal",
      onExisting: mode,
      dryRun: options["dry-run"] === true,
      allowHttpsSources: command === "import-https",
      rightsConfirmed: options["confirm-rights"] === true,
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  throw new Error(
    "Aufruf: card-images template --output <datei> [--set <setId>] [--side runner|corp] [--missing-only], card-images import --file <datei> [--dry-run] [--on-existing fail|skip|replace], card-images import-https --file <datei> --confirm-rights [--dry-run] [--on-existing fail|skip|replace], card-images pack-template --profile originalset|proteus|classic [--replace], card-images pack-build --profile originalset|proteus|classic --file <datei> [--format directory|zip] [--replace] oder card-images pack-import (--directory <paket> | --zip <paket.zip>) [--collection personal] [--dry-run] [--on-existing fail|skip|replace]",
  );
}

function packFormat(
  options: Record<string, string | true>,
): "directory" | "zip" {
  const format = optionalString(options.format) ?? "directory";
  if (format === "directory" || format === "zip") return format;
  throw new Error("--format muss directory oder zip sein.");
}

function conflictMode(
  options: Record<string, string | true>,
): "fail" | "skip" | "replace" {
  const mode = optionalString(options["on-existing"]) ?? "fail";
  if (mode === "fail" || mode === "skip" || mode === "replace") return mode;
  throw new Error("--on-existing muss fail, skip oder replace sein.");
}

function requiredProfile(
  options: Record<string, string | true>,
): PrivateCardImagePackProfileId {
  const profile = requiredOption(options, "profile");
  return privateCardImagePackProfile(profile).profileId;
}

function parseOptions(args: readonly string[]): Record<string, string | true> {
  const options: Record<string, string | true> = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (!argument.startsWith("--"))
      throw new Error(`Unerwartetes Argument ${argument}.`);
    const key = argument.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) options[key] = true;
    else {
      options[key] = next;
      index += 1;
    }
  }
  return options;
}

function requiredOption(
  options: Record<string, string | true>,
  key: string,
): string {
  const value = optionalString(options[key]);
  if (!value) throw new Error(`--${key} fehlt.`);
  return value;
}

function optionalString(value: string | true | undefined): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (value === true) throw new Error("Option erwartet einen Wert.");
  return undefined;
}

function optionalSide(
  value: string | true | undefined,
): CatalogSide | undefined {
  const side = optionalString(value);
  if (side === undefined) return undefined;
  if (side === "runner" || side === "corp") return side;
  throw new Error("--side muss runner oder corp sein.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    await runCardImageCli(process.argv.slice(2));
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "card_image_cli_failed";
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: { code, message } })}\n`,
    );
    process.exitCode = 1;
  }
}
