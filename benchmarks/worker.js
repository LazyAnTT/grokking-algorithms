const { load } = require('./lib/loader')
const runtime = require('./lib/runtime')
const { retained, peak } = require('./lib/memory')
const allocations = require('./lib/allocations')
async function main() {
  if (!global.gc) throw Error('Worker needs --expose-gc')
  const [suitePath, method, sizeText, phase, compiledJSON, settingsJSON] = process.argv.slice(2)
  const suite = require(suitePath), size = Number(sizeText)
  const implementations = load(suite, JSON.parse(compiledJSON))
  const implementation = implementations[method]
  if (!implementation) throw Error('Unknown implementation')
  suite.validate(implementation.run, size)
  const input = suite.makeInput(size)
  // Named frame is used by the allocation profiler to attribute only workload allocations.
  function runOperation() { return suite.invoke(implementation.run, input) }
  const settings = JSON.parse(settingsJSON)
  let warmupChecksum = 0
  for (let i = 0; i < settings.warmup; i++) warmupChecksum += suite.consume(runOperation())
  const measurement = await ({ runtime, retained, peak, allocations }[phase])(runOperation, suite.consume, settings)
  process.stdout.write(JSON.stringify({ ...measurement, warmupChecksum }))
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 })
