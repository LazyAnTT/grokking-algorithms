const test = require('node:test')
const assert = require('node:assert/strict')
const { median, shuffled } = require('../lib/common')
const runtime = require('../lib/runtime')
const { retained, peak } = require('../lib/memory')
const allocations = require('../lib/allocations')
function runOperation() { return new Array(128).fill(7) }
const consume = result => result.length + result[0]
const settings = { rounds: 3, repetitions: 1000, memoryCount: 1000, profileCount: 1000, samplingInterval: 512 }
test('seeded input is a reproducible permutation', () => {
 assert.deepEqual(shuffled(64),shuffled(64))
 assert.deepEqual(shuffled(64).sort((a,b)=>a-b),Array.from({length:64},(_,i)=>i+1))
 assert.equal(median([9,1,4]),4)
})
test('runtime consumes every result', () => {
 const result=runtime(runOperation,consume,settings)
 assert.equal(result.checksum,135*3000)
 assert.equal(result.samples.length,3)
 assert.ok(result.microsecondsPerOperation>0)
})
test('retained measurement keeps outputs alive', () => {
 const result=retained(runOperation,consume,settings)
 assert.equal(result.checksum,135*3000)
 assert.ok(result.retainedBytesPerOperation>500)
 assert.equal(result.retainedBytesPerOperation,median(result.samples))
})
test('peak is a batch increase, not normalized per call', () => {
 const result=peak(runOperation,consume,settings)
 assert.equal(result.estimatedPeakHeapIncreaseBytes,median(result.samples))
 assert.ok(result.estimatedPeakHeapIncreaseBytes>0)
 assert.equal(result.checksum,135*3000)
})
test('allocation sampling includes discarded workload allocations', async () => {
 const result=await allocations(runOperation,consume,settings)
 assert.ok(result.estimatedAllocatedBytesPerOperation>100)
 assert.equal(result.profiles.length,3)
 assert.equal(result.checksum,135*3000)
})

const { analyze } = require('../lib/analysis')
test('hypothesis report excludes noisy retained readings', () => {
 const suite={title:'Test',notes:'',hypotheses:[{title:'Retention',candidate:'a',baseline:'b',metric:'retainedBytesPerOperation',direction:'lower',relativeTolerance:.01,expectation:'lower',reason:'test',conclusion:'test'}]}
 const rows=[{length:4,method:'a',retainedBytesPerOperation:-1,phases:{retained:{samples:[-1,-1,-1]}}},{length:4,method:'b',retainedBytesPerOperation:20,phases:{retained:{samples:[20,20,20]}}}]
 const report=analyze(suite,{measuredAt:'test',node:'test',platform:'test'},rows)
 assert.ok(report.includes('Unstable reading; excluded'))
 assert.ok(report.includes('does not distinguish the hypothesis reliably'))
})
