const { performance } = require('node:perf_hooks')
const { median } = require('./common')
module.exports = function runtime(runOperation, consume, settings) {
  const samples = []
  let checksum = 0
  for (let round = 0; round < settings.rounds; round++) {
    global.gc()
    const start = performance.now()
    for (let i = 0; i < settings.repetitions; i++) checksum += consume(runOperation())
    samples.push((performance.now() - start) * 1000 / settings.repetitions)
  }
  return { microsecondsPerOperation: median(samples), samples, checksum }
}
