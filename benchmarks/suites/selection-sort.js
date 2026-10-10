const assert = require('node:assert/strict')
const { sizes, shuffled } = require('../lib/common')
module.exports = {
  title: 'Selection sort', operation: 'sort', sizes,
  outputDirectory: '02_selection_sort/ts',
  notes: 'Same seeded shuffled 1..n for all methods. Every invocation receives an input slice, included in measurement; internal copies also count. Built-in numeric Array.sort is a general-purpose sorting baseline, not selection sort.',
  hypotheses: [
    { title: 'Preallocation reduces retained output memory', candidate: 'mySelectionSort2', baseline: 'mySelectionSort', metric: 'retainedBytesPerOperation', direction: 'lower', relativeTolerance: .01, absoluteTolerance: 8,
      expectation: 'Variant 2 retains less output heap than variant 1.', reason: 'An output of known length avoids push growth/spare capacity, but the internal input copy may increase allocation volume.', conclusion: 'This addresses retained results, not total memory spent while sorting.' },
    { title: 'Array.from callback adds runtime overhead', candidate: 'mySelectionSort3', baseline: 'mySelectionSort2', metric: 'microsecondsPerOperation', direction: 'higher', relativeTolerance: .05,
      expectation: 'Variant 3 is slower than the preallocated loop in variant 2.', reason: 'Both use input copies and splice; the callback introduces different engine optimization opportunities. Syntax does not change O(n²) work.', conclusion: 'Callback syntax is a readability choice; actual overhead is engine-dependent.' },
    { title: 'Swap/pop reduces allocation volume', candidate: 'mySelectionSort4', baseline: 'mySelectionSort3', metric: 'estimatedAllocatedBytesPerOperation', direction: 'lower', relativeTolerance: .20,
      expectation: 'Variant 4 allocates fewer estimated bytes than variant 3.', reason: 'pop avoids the removed-element arrays returned by splice. Changes to remaining order may also change comparison patterns. Sampling estimates include collected objects.', conclusion: 'Lower allocation volume can help GC pressure without guaranteeing faster sorting.' },
    { title: 'Swap/pop improves runtime', candidate: 'mySelectionSort4', baseline: 'mySelectionSort3', metric: 'microsecondsPerOperation', direction: 'lower', relativeTolerance: .05,
      expectation: 'Variant 4 sorts faster than variant 3 by avoiding element shifts.', reason: 'Removal is O(1), but repeated minimum scans remain O(n²), and both versions still create callbacks and copies.', conclusion: 'Removing splice does not change the quadratic time complexity.' },
    { title: 'Built-in numeric sort is a practical runtime baseline', candidate: 'nativeNumericSort', baseline: 'mySelectionSort4', metric: 'microsecondsPerOperation', direction: 'lower', relativeTolerance: .05,
      expectation: 'The built-in numeric sort is faster than variant 4, particularly on larger arrays.', reason: 'The built-in uses a different engine implementation and executes in the host context; this is not an isolated comparison of selection-sort syntax.', conclusion: 'Use selection sort to study the algorithm; treat the built-in as a practical alternative, not proof about a specific engine algorithm.' },
  ],
  conclusions: 'All four custom variants and the repository reference remain O(n²) time with O(n) extra space. The input-consuming variant and preserving variants have different contracts; the harness supplies a fresh slice for every call and counts internal copies. Prefer descriptive names (push/splice, preallocated/splice, Array.from/splice, Array.from/swap-pop) over assuming numbered variants are successive optimizations. An in-place swap-based selection sort would be a separate O(1)-extra-space implementation, not any of these four.',
  sources: {
    custom: { file: '02_selection_sort/ts/01_my_selection_sort.ts', symbols: ['mySelectionSort', 'mySelectionSort2', 'mySelectionSort3', 'mySelectionSort4'] },
    reference: { file: '02_selection_sort/ts/01_selection_sort.ts', symbols: ['selectionSort'] },
  },
  implementations(symbols) {
    return {
      ...Object.fromEntries(['mySelectionSort', 'mySelectionSort2', 'mySelectionSort3', 'mySelectionSort4'].map(name => [name, { run: symbols[name], category: 'custom' }])),
      referenceSelectionSort: { run: symbols.selectionSort, category: 'reference' },
      nativeNumericSort: { run: numbers => numbers.sort((a, b) => a - b), category: 'built-in' },
    }
  },
  makeInput: shuffled,
  invoke: (sort, input) => sort(input.slice()),
  consume: result => result.length ? result[result.length - 1] + result.length : 0,
  validate(sort, size) {
    for (const input of [[], [1], [3, -1, 3, 0], shuffled(size)]) {
      assert.equal(JSON.stringify(sort(input.slice())), JSON.stringify(input.slice().sort((a, b) => a - b)))
    }
  },
  settings(size) {
    return { repetitions: Math.max(3, Math.min(10000, Math.floor(2000000 / size ** 2))),
      memoryCount: Math.max(256, Math.min(1000, Math.floor(200000 / size))),
      profileCount: Math.max(20, Math.min(1000, Math.floor(20000 / size))),
      warmup: Math.max(10, Math.min(300, Math.floor(2000000 / size ** 2))) }
  },
}
