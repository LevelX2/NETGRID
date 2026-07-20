export async function mapWithConcurrencyInOrder<T, R>(params: {
  values: readonly T[];
  concurrency: number;
  run: (value: T, index: number) => Promise<R>;
}): Promise<R[]> {
  if (!Number.isInteger(params.concurrency) || params.concurrency < 1)
    throw new Error("Worker concurrency must be a positive integer.");
  if (params.values.length === 0) return [];

  const results = new Array<R>(params.values.length);
  const errors: unknown[] = [];
  let nextIndex = 0;
  let stopScheduling = false;

  async function worker(): Promise<void> {
    while (!stopScheduling) {
      const index = nextIndex;
      if (index >= params.values.length) return;
      nextIndex += 1;
      try {
        results[index] = await params.run(params.values[index]!, index);
      } catch (error) {
        errors.push(error);
        stopScheduling = true;
      }
    }
  }

  const workerCount = Math.min(params.concurrency, params.values.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (errors.length > 0) throw errors[0];
  return results;
}
