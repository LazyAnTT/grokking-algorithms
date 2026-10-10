const assert = require('node:assert/strict')
const { sizes } = require('../lib/common')
module.exports = {
  title: 'Array creation', operation: 'array', sizes,
  outputDirectory: '01_introduction_to_algorithms/ts',
  notes: 'Every implementation creates [1..n]. Calls the three existing custom TypeScript functions, plus an independent Array.from reference.',
  hypotheses: [
    { title: 'Preallocation improves runtime over push', candidate: 'preallocated', baseline: 'push', metric: 'microsecondsPerOperation', direction: 'lower', relativeTolerance: .05,
      expectation: 'A preallocated loop is faster than push.', reason: 'Avoids output growth, but small-input overhead and engine optimization can reverse the result.', conclusion: 'All versions remain O(n); changing constants does not change complexity.' },
    { title: 'Preallocation retains less memory than push', candidate: 'preallocated', baseline: 'push', metric: 'retainedBytesPerOperation', direction: 'lower', relativeTolerance: .01, absoluteTolerance: 8,
      expectation: 'A preallocated array retains less heap than a grown array.', reason: 'push may reserve spare capacity; closely sized outputs need not differ materially.', conclusion: 'This describes result storage, not total allocations.' },
    { title: 'Array.from callback costs runtime', candidate: 'arrayFrom', baseline: 'preallocated', metric: 'microsecondsPerOperation', direction: 'higher', relativeTolerance: .05,
      expectation: 'Array.from is slower than a preallocated loop.', reason: 'Mapping callbacks and engine-specific implementation add constant costs.', conclusion: 'For small one-off lists, readability can matter more than microseconds.' },
  ],
  conclusions: 'All array-creation methods have O(n) time and O(n) output space. Larger runtime ratios do not imply different asymptotic complexity. Retained heap may match even when runtime and total allocations differ. VM/host-context differences also affect the reference comparison.',
  sources: { custom: { file: '01_introduction_to_algorithms/ts/01_my_binary_search.ts', symbols: ['numberList', 'numberPreallocatedList', 'numberListWithArrCon'] } },
  implementations(s) { return {
    push: { run: s.numberList, category: 'custom' },
    preallocated: { run: s.numberPreallocatedList, category: 'custom' },
    arrayFrom: { run: s.numberListWithArrCon, category: 'custom' },
    referenceArrayFrom: { run: length => Array.from({ length }, (_, i) => i + 1), category: 'reference' },
  } },
  makeInput: size => size,
  invoke: (create, size) => create(size),
  consume: result => result.length ? result[result.length - 1] + result.length : 0,
  validate(create, size) {
    for (const length of [0, 1, size]) assert.equal(JSON.stringify(create(length)), JSON.stringify(Array.from({ length }, (_, i) => i + 1)))
  },
  settings(size) { return { repetitions: 10000, memoryCount: Math.max(512, Math.min(2000, Math.floor(1000000 / size))), profileCount: 1000, warmup: 1000 } },
}
