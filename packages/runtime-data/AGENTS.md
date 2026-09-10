# Runtime data rules

- This package is the pure product-data authority for versioned static runtime
  JSON consumed by normal Web, Server, Catalog and AI paths.
- No React, browser, Engine, database, file-system, networking, clocks,
  randomness or environment dependencies.
- Development benchmarks, soak seeds, replay corpora, test fixtures and local
  runtime data must not be exported here.
- A new export requires classification in
  `scripts/release-product-boundary.json` and a focused contract test.
