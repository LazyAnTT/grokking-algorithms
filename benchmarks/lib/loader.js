const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { spawnSync } = require('node:child_process')
// Existing standalone TS examples stay unchanged; demo logging is suppressed.
function compile(suite, repository, directory) {
  const compiled = {}
  for (const [id, source] of Object.entries(suite.sources)) {
    const output = path.join(directory, id)
    const result = spawnSync('tsc', [path.join(repository, source.file), '--strict',
      '--lib', 'es2015,dom', '--outDir', output], { encoding: 'utf8' })
    if (result.error) throw result.error
    if (result.status !== 0) throw Error(result.stdout + result.stderr)
    compiled[id] = path.join(output, path.basename(source.file, '.ts') + '.js')
  }
  return compiled
}
function load(suite, compiled) {
  const symbols = {}
  for (const [id, source] of Object.entries(suite.sources)) {
    const context = vm.createContext({ console: { log() {} } })
    new vm.Script(fs.readFileSync(compiled[id], 'utf8')).runInContext(context)
    // Evaluate symbols so both function declarations and const arrow functions work.
    for (const symbol of source.symbols) symbols[symbol] = new vm.Script(symbol).runInContext(context)
  }
  return suite.implementations(symbols)
}
module.exports = { compile, load }
