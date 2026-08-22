import {
  DEFAULT_CARD_IMAGE_COLLECTION_ID,
  resolveManagedCardImage,
} from "./runtime";
import { CardImageStore } from "./store";

const selectionStore = new CardImageStore();
const collection = await selectionStore.readCollection(
  DEFAULT_CARD_IMAGE_COLLECTION_ID,
);
const printingId =
  process.argv[2] ?? Object.keys(collection.bindings).sort()[0];
if (!printingId || !collection.bindings[printingId])
  throw new Error(
    "Der Runtime-Benchmark benötigt eine vorhandene persönliche Kartenbildbindung.",
  );

const store = new CardImageStore();
const results = [];
results.push(await measure(store, printingId, "cold-1", 1, false));
results.push(
  await measure(store, printingId, "warm-sequential-100", 100, false),
);
results.push(await measure(store, printingId, "warm-parallel-100", 100, true));

console.log(
  JSON.stringify(
    {
      schemaVersion: "card-image-runtime-benchmark-v1",
      collectionRevision: collection.revision,
      printingId,
      variant: "thumb",
      results,
    },
    null,
    2,
  ),
);

async function measure(
  store: CardImageStore,
  targetPrintingId: string,
  label: string,
  count: number,
  parallel: boolean,
) {
  const started = performance.now();
  if (parallel) {
    await Promise.all(
      Array.from({ length: count }, () =>
        resolveManagedCardImage(store, targetPrintingId, "thumb"),
      ),
    );
  } else {
    for (let index = 0; index < count; index += 1)
      await resolveManagedCardImage(store, targetPrintingId, "thumb");
  }
  return {
    label,
    count,
    durationMs: Math.round((performance.now() - started) * 10) / 10,
  };
}
