const inspector = require('node:inspector')
const { median } = require('./common')
const post = (session, method, params = {}) => new Promise((resolve, reject) => {
  session.post(method, params, (error, result) => error ? reject(error) : resolve(result))
})
function attributedBytes(node, inside = false) {
  const included = inside || node.callFrame.functionName === 'runOperation'
  return (included ? node.selfSize : 0) +
    (node.children || []).reduce((sum, child) => sum + attributedBytes(child, included), 0)
}
module.exports = async function allocations(runOperation, consume, settings) {
  const session = new inspector.Session()
  session.connect()
  const samples = [], profiles = []
  let checksum = 0
  try {
    for (let round = 0; round < settings.rounds; round++) {
      global.gc()
      await post(session, 'HeapProfiler.startSampling', {
        samplingInterval: settings.samplingInterval,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true,
      })
      for (let i = 0; i < settings.profileCount; i++) checksum += consume(runOperation())
      const { profile } = await post(session, 'HeapProfiler.stopSampling')
      samples.push(attributedBytes(profile.head) / settings.profileCount)
      profiles.push(profile)
    }
  } finally { session.disconnect() }
  // selfSize is V8's statistical byte estimate; do not multiply by samplingInterval.
  // Filter to runOperation descendants to exclude inspector/export infrastructure.
  return { estimatedAllocatedBytesPerOperation: median(samples), samples, profiles, checksum }
}
