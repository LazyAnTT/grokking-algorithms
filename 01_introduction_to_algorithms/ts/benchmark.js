const { performance } = require("node:perf_hooks")
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")

// Run: node --expose-gc benchmark.js
// Exports benchmark-results.csv, benchmark-results.md, and benchmark-results.json.
// Powers of four, plus the requested endpoint (2048 is not a power of four).
const sizes = [4, 16, 64, 256, 1024, 2048]
const repetitions = 10_000
const runtimeRounds = 7
const memoryArrays = 2000
const memoryRounds = 5

// ===== METHOD 1: APPEND WITH PUSH =====
function push(length) {
  const list = []
  for (let i = 0; i < length; i++) list.push(i + 1)
  return list
}

// ===== METHOD 2: PREALLOCATE, THEN FILL =====
function preallocated(length) {
  const list = new Array(length)
  for (let i = 0; i < length; i++) list[i] = i + 1
  return list
}

// ===== METHOD 3: ARRAY.FROM WITH A CALLBACK =====
function arrayFrom(length) {
  return Array.from({ length }, (_, i) => i + 1)
}

const methods = { push, preallocated, arrayFrom }
function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

// Each method/size runs in a fresh process to reduce interference.
function measure(name, length) {
  const create = methods[name]
  const sample = create(length)
  if (sample.length !== length || !sample.every((value, i) => value === i + 1)) {
    throw new Error(`Incorrect output: ${name}, length ${length}`)
  }
  let checksum = 0
  for (let i = 0; i < 3000; i++) checksum += create(length)[length - 1]

  // ===== RUNTIME: ELAPSED CONSTRUCTION TIME =====
  // Includes allocation, loop/callback overhead, and any automatic GC pauses.
  // Explicit GC happens outside the timed sections. Logging also stays outside.
  const times = []
  for (let round = 0; round < runtimeRounds; round++) {
    global.gc()
    const start = performance.now()
    for (let i = 0; i < repetitions; i++) {
      const list = create(length)
      checksum += list[list.length - 1]
    }
    times.push(performance.now() - start)
  }

  // ===== MEMORY: HEAP AFTER CONSTRUCTION AND AFTER COLLECTION =====
  // The holder is allocated before the baseline so its storage is excluded.
  // Reading before GC approximates heap growth at the end of construction.
  // It is NOT peak memory or total allocated bytes: automatic GC may run earlier.
  // Reading after GC measures retained arrays, including any spare capacity.
  const construction = []
  const retained = []
  for (let round = 0; round < memoryRounds; round++) {
    const arrays = new Array(memoryArrays).fill(null)
    global.gc()
    const before = process.memoryUsage().heapUsed
    for (let i = 0; i < memoryArrays; i++) arrays[i] = create(length)
    const afterConstruction = process.memoryUsage().heapUsed
    global.gc()
    const afterGC = process.memoryUsage().heapUsed
    construction.push((afterConstruction - before) / memoryArrays)
    retained.push((afterGC - before) / memoryArrays)
    // Consume every result after both memory readings so it remains live.
    for (const array of arrays) checksum += array[length - 1]
    arrays.fill(null)
  }
  const runtimeMs = median(times)
  return {
    length, method: name, runtimeMs,
    microsecondsPerArray: runtimeMs * 1000 / repetitions,
    constructionBytesPerArray: median(construction),
    retainedBytesPerArray: median(retained),
    runtimeSamplesMs: times,
    constructionSamplesBytesPerArray: construction,
    retainedSamplesBytesPerArray: retained,
    checksum,
  }
}

if (process.argv[2] === "--worker") {
  if (!global.gc) throw new Error("Worker requires --expose-gc")
  const name = process.argv[3]
  const length = Number(process.argv[4])
  if (!Object.hasOwn(methods, name) || !sizes.includes(length)) {
    throw new Error("Unknown method or size")
  }
  process.stdout.write(JSON.stringify(measure(name, length)))
} else {
  const rows = []
  for (const length of sizes) {
    for (const name of Object.keys(methods)) {
      console.log(`Measuring ${name}: ${length} numbers...`)
      const child = spawnSync(process.execPath,
        ["--expose-gc", __filename, "--worker", name, String(length)],
        { encoding: "utf8" })
      if (child.error) throw child.error
      if (child.status !== 0) throw new Error(child.stderr || "Worker failed")
      rows.push(JSON.parse(child.stdout))
    }
  }

  // ===== EXPORT: TABLE, CSV, AND RAW SAMPLES =====
  const headers = ["Length", "Method", "Runtime ms / 10000 arrays", "Runtime us / array",
    "Heap at construction end B / array", "Retained heap B / array"]
  const values = rows.map(row => [row.length, row.method, row.runtimeMs.toFixed(3),
    row.microsecondsPerArray.toFixed(3), row.constructionBytesPerArray.toFixed(1),
    row.retainedBytesPerArray.toFixed(1)])
  const metadata = {
    measuredAt: new Date().toISOString(), node: process.version,
    platform: `${process.platform} ${process.arch}`, cpu: os.cpus()[0]?.model,
    repetitions, runtimeRounds, memoryArrays, memoryRounds,
  }
  const explanation = [
    "# Array creation benchmark",
    `Measured: ${metadata.measuredAt}. Node ${metadata.node}, ${metadata.platform}. CPU: ${metadata.cpu}.`,
    "Sizes: powers of four through 1024, followed by the requested endpoint 2048.",
    `Each method/size uses a fresh Node process. Runtime: median of ${runtimeRounds} batches of ${repetitions} arrays after warm-up. Memory: median of ${memoryRounds} batches retaining ${memoryArrays} arrays.`,
    "Runtime includes allocation and automatic GC pauses; explicit GC is outside timing. Memory excludes the preallocated holder array. Heap at construction end is an approximate snapshot before explicit GC, not peak usage or total allocations. Retained heap is measured after GC. Memory readings include measurement overhead and can be noisy, particularly for small arrays. The two memory columns have independently computed medians.",
    "Lower values are better. All methods remain O(n) time and O(n) space. Results depend on Node version, machine, and system load; rerun to compare.",
  ].join("\n\n")
  const table = ["| " + headers.join(" | ") + " |",
    "| " + headers.map(() => "---").join(" | ") + " |",
    ...values.map(value => "| " + value.join(" | ") + " |")].join("\n")
  fs.writeFileSync(path.join(__dirname, "benchmark-results.csv"),
    [headers.join(","), ...values.map(value => value.join(","))].join("\n") + "\n")
  fs.writeFileSync(path.join(__dirname, "benchmark-results.md"), explanation + "\n\n" + table + "\n")
  fs.writeFileSync(path.join(__dirname, "benchmark-results.json"),
    JSON.stringify({ metadata, rows }, null, 2) + "\n")
  console.table(rows.map(row => ({ length: row.length, method: row.method,
    "us/array": row.microsecondsPerArray.toFixed(3),
    "construction-end B/array": row.constructionBytesPerArray.toFixed(1),
    "retained B/array": row.retainedBytesPerArray.toFixed(1) })))
  console.log("Exported benchmark-results.csv, benchmark-results.md, benchmark-results.json")
}
