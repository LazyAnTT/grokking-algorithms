const fs = require('node:fs')
const path = require('node:path')
const metrics = [
  { key: 'microsecondsPerOperation', label: 'Runtime', unit: 'µs / operation', description: 'Median unprofiled runtime, including the suite input-copy policy and result consumption.' },
  { key: 'retainedBytesPerOperation', label: 'Retained heap', unit: 'B / result', description: 'Heap increase after GC with results retained; holder storage excluded. Approximate, includes measurement noise.' },
  { key: 'estimatedPeakHeapIncreaseBytes', label: 'Estimated peak heap increase', unit: 'B / batch', description: 'Median observed high-water heap increase over a non-retaining profiling batch. Includes heap samples after calls and pre/post-GC readings. Not exact peak, not divided by operations, and includes profiling overhead.' },
  { key: 'estimatedAllocatedBytesPerOperation', label: 'Estimated total allocations', unit: 'B / operation', description: 'V8 sampling estimate attributed to runOperation and descendants, including collected objects. Not exact bytes; zero can mean no sampled allocation.' },
  { key: 'heapSnapshotBytesPerOperation', label: 'Heap snapshot after construction', unit: 'B / result', description: 'End-of-retaining-batch heap reading before explicit GC. Noisy snapshot, not peak memory or total allocations.' },
]
function csvCell(value) { return '"' + String(value).replaceAll('"', '""') + '"' }
function exportResults(directory, suite, metadata, rows) {
  fs.mkdirSync(directory, { recursive: true })
  const data = { schemaVersion: 2, metadata, metrics, rows }
  fs.writeFileSync(path.join(directory, 'benchmark-results.json'), JSON.stringify(data, null, 2) + '\n')
  const headers = ['Length', 'Method', 'Category', 'Runtime operations per batch', 'Retained results per batch', 'Peak/allocation operations per batch', ...metrics.map(m => `${m.label} (${m.unit})`)]
  const values = rows.map(row => [row.length, row.method, row.category, row.repetitions, row.memoryCount, row.profileCount, ...metrics.map(m => row[m.key].toFixed(3))])
  fs.writeFileSync(path.join(directory, 'benchmark-results.csv'), [headers, ...values].map(row => row.map(csvCell).join(',')).join('\n') + '\n')
  const table = ['| ' + headers.join(' | ') + ' |', '| ' + headers.map(() => '---').join(' | ') + ' |', ...values.map(row => '| ' + row.join(' | ') + ' |')].join('\n')
  const notes = [`# ${suite.title} benchmark`, `Measured ${metadata.measuredAt}. Node ${metadata.node}; ${metadata.platform}; ${metadata.cpu}.`, suite.notes,
    'Each method, size, and measurement phase runs in a fresh process. Runtime is measured without memory profiling. Samples use warmed-up functions; explicit GC is outside runtime timing. All exports contain per-phase sample counts and raw measurements.',
    'Peak is a batch metric, not a per-call measurement: batch sizes differ by input size and are shown in the table. Small peak differences across differently sized batches should not be interpreted as algorithmic space scaling. Heap metrics exclude external buffers/native allocations and process RSS.',
    `Sampling interval: ${metadata.samplingInterval} bytes. Peak/allocation profiling has overhead. All figures are estimates; no metric is an exact total-memory bill. Existing TS functions execute in VM contexts; the reference built-in executes in the host context. Compare implementations as executed here, not language-level guarantees.`,
    ...metrics.map(m => `**${m.label} (${m.unit}):** ${m.description}`), table].join('\n\n')
  fs.writeFileSync(path.join(directory, 'benchmark-results.md'), notes + '\n')
  const { analyze } = require('./analysis')
  fs.writeFileSync(path.join(directory, (metadata.suite || 'benchmark') + '-analysis.md'), analyze(suite, metadata, rows))
  return data
}
module.exports = { metrics, exportResults }
