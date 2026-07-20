import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { gunzipSync, createGzip } from "node:zlib";
import type { AiBehaviorBaselineResult } from "../packages/ai/src/simulation/ai-behavior-baseline";

export type AiBehaviorBaselineRawArtifact = {
  schemaVersion: "ai-behavior-baseline-v1-raw";
  result: AiBehaviorBaselineResult;
  slots: unknown[];
};

export async function writeAiBehaviorBaselineRawArtifact(params: {
  outputPath: string;
  result: AiBehaviorBaselineResult;
  slotFragmentPaths: readonly string[];
}): Promise<void> {
  const outputPath = resolve(params.outputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
  const source = Readable.from(
    rawArtifactChunks(params.result, params.slotFragmentPaths),
  );
  try {
    if (outputPath.toLowerCase().endsWith(".gz")) {
      await pipeline(
        source,
        createGzip(),
        createWriteStream(temporaryPath, { flags: "wx" }),
      );
    } else {
      await pipeline(source, createWriteStream(temporaryPath, { flags: "wx" }));
    }
    renameSync(temporaryPath, outputPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

export function readAiBehaviorBaselineRawArtifact(
  inputPath: string,
): AiBehaviorBaselineRawArtifact {
  const resolvedPath = resolve(inputPath);
  const bytes = readFileSync(resolvedPath);
  const json = resolvedPath.toLowerCase().endsWith(".gz")
    ? gunzipSync(bytes).toString("utf8")
    : bytes.toString("utf8");
  return JSON.parse(json) as AiBehaviorBaselineRawArtifact;
}

async function* rawArtifactChunks(
  result: AiBehaviorBaselineResult,
  slotFragmentPaths: readonly string[],
): AsyncGenerator<string | Buffer> {
  yield `{"schemaVersion":"ai-behavior-baseline-v1-raw","result":${JSON.stringify(result)},"slots":[`;
  for (let index = 0; index < slotFragmentPaths.length; index += 1) {
    if (index > 0) yield ",";
    for await (const chunk of createReadStream(slotFragmentPaths[index]!)) {
      yield chunk;
    }
  }
  yield "]}\n";
}
