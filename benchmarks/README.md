# Reusable algorithm benchmarks

Requires Node 20+ with `v8.GCProfiler`, `tsc` on PATH. No npm dependencies.

From the repository root:

```bash
node benchmarks/run.js selection-sort
node benchmarks/run.js array-creation
# Quick correctness/integration run, separate output so production data is preserved:
node benchmarks/run.js selection-sort --quick --output /tmp/selection-smoke
```

Sizes: 4, 16, 64, 256, 1024, 2048. Load the resulting JSON into `benchmark-viewer/`. The old per-chapter `benchmark.js` commands are wrappers around this runner.

## Separation of responsibilities

- `suites/*.js`: algorithm-specific implementations, input generation, copy policy, correctness checks, result consumption, and batch sizes.
- `lib/loader.js`: compiles existing standalone TypeScript examples into temporary directories and loads functions without demo logging. Algorithms need no benchmark-specific edits.
- `lib/runtime.js`: warmed-up elapsed runtime, without memory instrumentation.
- `lib/memory.js`: retained-result heap and estimated non-retaining batch peak, with GCProfiler pre/post-GC observations.
- `lib/allocations.js`: statistical allocation profiling including objects collected by major/minor GC. Attributes samples to workload call stacks only.
- `worker.js`: one isolated process per method/size/phase.
- `lib/export.js`: versioned metric definitions, JSON raw measurements, CSV and Markdown tables. Raw `.heapprofile` files can be opened in Chrome DevTools' Memory panel; these are separate artifacts.

## Reading measurements

Retained heap is bytes per live result after collection. Peak heap increase is bytes **per profiling batch**, with operation count shown; it is not divided by calls. Measurements between calls and at GC events can miss brief within-call peaks; profiling adds overhead. Allocations are estimated bytes per operation from V8 sampling, including objects later collected, not an exact count. A zero allocation estimate means sampling may have missed small allocations. Heap snapshot after construction remains available as a diagnostic, explicitly not a peak/total metric.

These are JS heap measurements, excluding external buffers, native allocation, and RSS. Variability and occasional negative retained/snapshot deltas are measurement noise; raw samples are preserved. Use repeated runs and larger batches to assess stability. Copying policies are explicit: selection sort copies inputs for every function, including mutating versions. Existing internal copies also count. TS implementations execute in VM contexts, so cross-context/built-in comparisons include that execution environment.

Reference and custom implementations share correctness checks, input seeds, and settings. Built-in sort uses a different sorting algorithm, so its category is `built-in`, not a selection-sort variant.

## Add an algorithm

Copy a suite file, then define:

- `title`, `operation`, `sizes`, `outputDirectory`, `notes`.
- `sources`: TS file paths relative to the repository and symbol names to load (may be empty for JS implementations).
- `implementations(symbols)`: `{ name: { run: function, category: 'custom' | 'reference' | 'built-in' } }`.
- `makeInput(size)`, `invoke(fn, input)` (copy/mutation policy), `consume(result)` (allocation-free numeric checksum), and `validate(fn, size)`.
- `settings(size)`: repetitions, memoryCount, profileCount, warmup.

Run `node benchmarks/run.js your-suite`. The shared runner and viewer require no algorithm-specific changes. This runner currently benchmarks synchronous JS/TS algorithms; Python/C/PHP require separate language adapters with their own memory semantics.

Protocol references: [V8 GCProfiler](https://nodejs.org/api/v8.html#class-v8gcprofiler), [HeapProfiler sampling](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/).

Run measurement checks with `node --expose-gc --test benchmarks/tests/metrics.test.js`. Suite hypotheses define candidate/baseline comparisons and descriptive thresholds. Each run regenerates `<suite>-analysis.md`; unstable retained samples are excluded from conclusions.
