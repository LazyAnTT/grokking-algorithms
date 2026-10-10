const v8 = require('node:v8')
const { median } = require('./common')
function retained(runOperation, consume, settings) {
  const samples = [], snapshotSamples = []
  let checksum = 0
  for (let round = 0; round < settings.rounds; round++) {
    const results = new Array(settings.memoryCount).fill(null)
    global.gc()
    const before = process.memoryUsage().heapUsed
    for (let i = 0; i < results.length; i++) results[i] = runOperation()
    const snapshot = process.memoryUsage().heapUsed
    global.gc()
    const after = process.memoryUsage().heapUsed
    samples.push((after - before) / results.length)
    snapshotSamples.push((snapshot - before) / results.length)
    for (const result of results) checksum += consume(result)
    results.fill(null)
  }
  return { retainedBytesPerOperation: median(samples), heapSnapshotBytesPerOperation: median(snapshotSamples), samples, snapshotSamples, checksum }
}
function peak(runOperation, consume, settings) {
  if (typeof v8.GCProfiler !== 'function') throw Error('Peak profiling requires Node with v8.GCProfiler (Node 19.6+).')
  const samples = []
  let checksum = 0
  for (let round = 0; round < settings.rounds; round++) {
    const profiler = new v8.GCProfiler()
    global.gc()
    profiler.start()
    const baseline = process.memoryUsage().heapUsed
    let observed = baseline
    // Results are consumed then released, so this is a non-retaining batch.
    // Samples between calls miss short peaks, but pre/post-GC readings improve coverage.
    for (let i = 0; i < settings.profileCount; i++) {
      let result = runOperation()
      observed = Math.max(observed, process.memoryUsage().heapUsed)
      checksum += consume(result)
      result = null
    }
    const report = profiler.stop()
    for (const event of report.statistics) {
      observed = Math.max(observed, event.beforeGC.heapStatistics.usedHeapSize,
        event.afterGC.heapStatistics.usedHeapSize)
    }
    samples.push(Math.max(0, observed - baseline))
  }
  // Batch high-water mark: deliberately NOT divided by operation count.
  return { estimatedPeakHeapIncreaseBytes: median(samples), samples, checksum }
}
module.exports = { retained, peak }
