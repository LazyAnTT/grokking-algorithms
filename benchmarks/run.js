const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { spawnSync } = require('node:child_process')
const { compile, load } = require('./lib/loader')
const { exportResults } = require('./lib/export')
function run(suiteName = 'selection-sort', options = {}) {
  if (!/^[a-z0-9-]+$/.test(suiteName)) throw Error('Invalid suite name')
  const suitePath = path.join(__dirname, 'suites', suiteName + '.js')
  const suite = require(suitePath)
  const repository = path.resolve(__dirname, '..')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'algorithm-benchmark-'))
  const rounds = options.quick ? 1 : 3
  const samplingInterval = 512
  try {
    const compiled = compile(suite, repository, temporary)
    const implementations = load(suite, compiled)
    const rows = []
    for (const length of options.quick ? [4, 16] : suite.sizes) {
      for (const [method, implementation] of Object.entries(implementations)) {
        console.log(`${suite.title}: ${method}, n=${length}`)
        const settings = { ...suite.settings(length), rounds, samplingInterval }
        if (options.quick) Object.assign(settings, { repetitions: 20, memoryCount: 20, profileCount: 20, warmup: 20 })
        const phases = {}
        for (const phase of ['runtime', 'retained', 'peak', 'allocations']) {
          const child = spawnSync(process.execPath, ['--expose-gc', path.join(__dirname, 'worker.js'), suitePath,
            method, String(length), phase, JSON.stringify(compiled), JSON.stringify(settings)],
            { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
          if (child.error) throw child.error
          if (child.status !== 0) throw Error(child.stderr)
          phases[phase] = JSON.parse(child.stdout)
        }
        // Store allocation profiles separately so the viewer's JSON stays compact.
        const profiles = phases.allocations.profiles
        delete phases.allocations.profiles
        const profileDirectory = path.join(options.outputDirectory || path.join(repository, suite.outputDirectory), 'benchmark-profiles')
        fs.mkdirSync(profileDirectory, { recursive: true })
        profiles.forEach((profile, round) => fs.writeFileSync(path.join(profileDirectory, `${method}-${length}-${round}.heapprofile`), JSON.stringify(profile)))
        rows.push({ length, method, category: implementation.category,
          repetitions: settings.repetitions, memoryCount: settings.memoryCount, profileCount: settings.profileCount,
          microsecondsPerOperation: phases.runtime.microsecondsPerOperation,
          retainedBytesPerOperation: phases.retained.retainedBytesPerOperation,
          heapSnapshotBytesPerOperation: phases.retained.heapSnapshotBytesPerOperation,
          estimatedPeakHeapIncreaseBytes: phases.peak.estimatedPeakHeapIncreaseBytes,
          estimatedAllocatedBytesPerOperation: phases.allocations.estimatedAllocatedBytesPerOperation,
          phases })
      }
    }
    const metadata = { title: suite.title, operation: suite.operation, suite: suiteName,
      measuredAt: new Date().toISOString(), node: process.version, platform: `${process.platform} ${process.arch}`,
      cpu: os.cpus()[0]?.model, rounds, samplingInterval, quick: !!options.quick, notes: suite.notes }
    const output = options.outputDirectory || path.join(repository, suite.outputDirectory)
    exportResults(output, suite, metadata, rows)
    console.log(`Exported ${rows.length} rows to ${output}`)
    return rows
  } finally { fs.rmSync(temporary, { recursive: true, force: true }) }
}
module.exports = { run }
if (require.main === module) {
  const args = process.argv.slice(2)
  const outputIndex = args.indexOf('--output')
  try { run(args[0] || 'selection-sort', { quick: args.includes('--quick'), outputDirectory: outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : undefined }) }
  catch (error) { console.error(error.stack); process.exitCode = 1 }
}
