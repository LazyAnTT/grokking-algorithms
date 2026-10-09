"use strict"

// Plain DOM and SVG APIs: no chart libraries or external dependencies.
const source = "../01_introduction_to_algorithms/ts/benchmark-results.json"
const methods = {
  push: { label: "Push", color: "#1764bd", dash: "" },
  preallocated: { label: "Preallocated", color: "#087e66", dash: "8 4" },
  arrayFrom: { label: "Array.from", color: "#ae4b0d", dash: "2 4" },
}
const metrics = {
  microsecondsPerArray: { title: "Runtime", unit: "µs per array", note: "Median construction time per array. Includes allocation and automatic garbage collection pauses." },
  constructionBytesPerArray: { title: "Heap at construction end", unit: "bytes per array", note: "Approximate heap growth before explicit garbage collection. This is not peak memory or total allocated bytes." },
  retainedBytesPerArray: { title: "Retained heap", unit: "bytes per array", note: "Approximate heap growth after garbage collection while the completed arrays remain in use." },
}
let data = null
const $ = id => document.getElementById(id)
const format = value => value.toLocaleString(undefined, { maximumFractionDigits: 3 })

function svgElement(tag, attributes = {}, text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag)
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
  if (text !== undefined) node.textContent = text
  return node
}

function validate(candidate) {
  if (!candidate || !Array.isArray(candidate.rows) || !candidate.rows.length) {
    throw new Error("The file must contain a nonempty rows array.")
  }
  const seen = new Set()
  for (const row of candidate.rows) {
    const key = row ? `${row.method}:${row.length}` : "invalid"
    if (!row || !Object.hasOwn(methods, row.method) || !Number.isInteger(row.length) || row.length <= 0 ||
        !Object.keys(metrics).every(metric => Number.isFinite(row[metric])) || seen.has(key)) {
      throw new Error("Invalid or duplicate benchmark row.")
    }
    seen.add(key)
  }
  return candidate
}

function render() {
  if (!data) return
  const metric = $("metric").value
  const info = metrics[metric]
  const selected = [...document.querySelectorAll('fieldset input:checked')].map(input => input.value)
  const sizes = [...new Set(data.rows.map(row => row.length))].sort((a, b) => a - b)
  const visible = data.rows.filter(row => selected.includes(row.method))
  $("chart-heading").textContent = info.title
  $("metric-note").textContent = info.note
  $("table-caption").textContent = `${info.title} (${info.unit}). Lower values are better.`

  // Build an accessible table containing the same visible series as the chart.
  const header = document.createElement("tr")
  for (const name of ["List length", ...selected.map(method => methods[method].label)]) {
    const cell = document.createElement("th")
    cell.scope = "col"
    cell.textContent = name
    header.append(cell)
  }
  $("results").querySelector("thead").replaceChildren(header)
  const body = $("results").querySelector("tbody")
  body.replaceChildren()
  for (const length of sizes) {
    const tr = document.createElement("tr")
    const heading = document.createElement("th")
    heading.scope = "row"
    heading.textContent = length
    tr.append(heading)
    for (const method of selected) {
      const row = visible.find(row => row.length === length && row.method === method)
      const td = document.createElement("td")
      td.textContent = row ? format(row[metric]) : "—"
      tr.append(td)
    }
    body.append(tr)
  }

  const chart = $("chart")
  chart.replaceChildren(
    svgElement("title", { id: "svg-title" }, `${info.title} by list length`),
    svgElement("desc", { id: "svg-description" }, `${selected.map(name => methods[name].label).join(", ") || "No methods selected"}. Values are also available in the table below.`)
  )
  if (!visible.length) {
    $("status").textContent = "Select a method to display its measurements."
    chart.append(svgElement("text", { x: 480, y: 230, "text-anchor": "middle" }, "Select a method to display its measurements."))
    return
  }

  // Scale data values into SVG coordinates. Logarithmic axes require positives.
  const logX = $("x-scale").value === "log"
  const logY = $("y-scale").value === "log"
  const plotted = visible.filter(row => !logY || row[metric] > 0)
  if (!plotted.length) {
    $("status").textContent = "No positive values. Choose a linear Y-axis."
    chart.append(svgElement("text", { x: 480, y: 230, "text-anchor": "middle" }, "No positive values. Choose a linear Y-axis."))
    return
  }
  const left = 100, top = 30, width = 830, height = 370
  const transformX = value => logX ? Math.log2(value) : value
  const transformY = value => logY ? Math.log10(value) : value
  const minX = transformX(sizes[0]), maxX = transformX(sizes.at(-1))
  const minValue = Math.min(...plotted.map(row => row[metric]))
  const maxValue = Math.max(...plotted.map(row => row[metric]))
  const minY = logY ? transformY(minValue) - .1 : Math.min(0, minValue)
  const maxY = logY ? transformY(maxValue) + .1 : Math.max(1, maxValue * 1.1)
  const x = value => left + (transformX(value) - minX) / (maxX - minX || 1) * width
  const y = value => top + height - (transformY(value) - minY) / (maxY - minY || 1) * height

  for (let i = 0; i <= 5; i++) {
    const coordinate = top + height - i / 5 * height
    const tick = minY + i / 5 * (maxY - minY)
    const value = logY ? 10 ** tick : tick
    chart.append(svgElement("line", { x1: left, x2: left + width, y1: coordinate, y2: coordinate, stroke: "#e1e8f0" }))
    chart.append(svgElement("text", { x: left - 12, y: coordinate + 4, "text-anchor": "end" }, format(value)))
  }
  // Label each tested size in log mode; use evenly spaced ticks in linear mode.
  const ticks = logX ? sizes : Array.from({ length: 5 }, (_, i) => sizes[0] + i / 4 * (sizes.at(-1) - sizes[0]))
  for (const tick of ticks) {
    chart.append(svgElement("text", { x: x(tick), y: top + height + 24, "text-anchor": "middle" }, format(tick)))
  }
  chart.append(svgElement("line", { x1: left, x2: left + width, y1: top + height, y2: top + height, stroke: "#9aabbe" }))
  chart.append(svgElement("text", { x: left + width / 2, y: 462, "text-anchor": "middle" }, `List length (${logX ? "logarithmic" : "linear"})`))
  chart.append(svgElement("text", { transform: "translate(20 215) rotate(-90)", "text-anchor": "middle" }, `${info.unit} (${logY ? "logarithmic" : "linear"})`))

  for (const method of selected) {
    const style = methods[method]
    const rows = plotted.filter(row => row.method === method).sort((a, b) => a.length - b.length)
    chart.append(svgElement("polyline", {
      points: rows.map(row => `${x(row.length)},${y(row[metric])}`).join(" "),
      fill: "none", stroke: style.color, "stroke-width": 2.5, "stroke-dasharray": style.dash,
    }))
    for (const row of rows) {
      const description = `${style.label}: ${row.length} numbers, ${format(row[metric])} ${info.unit}`
      const point = svgElement("circle", {
        cx: x(row.length), cy: y(row[metric]), r: 5, fill: style.color,
        tabindex: "0", class: "point", "aria-label": description,
      })
      point.append(svgElement("title", {}, description))
      point.addEventListener("focus", () => { $("status").textContent = description })
      point.addEventListener("mouseenter", () => { $("status").textContent = description })
      chart.append(point)
    }
  }
  $("status").textContent = logY && plotted.length !== visible.length
    ? "Nonpositive values are omitted on the logarithmic Y-axis; they remain in the table."
    : "Showing measured data. Select methods and scales above."
}

function load(candidate, label) {
  data = validate(candidate)
  const meta = data.metadata || {}
  $("metadata").textContent = `${label} · ${meta.node || "Unknown Node version"} · ${meta.platform || "Unknown platform"}${meta.measuredAt ? ` · Measured ${meta.measuredAt}` : ""}`
  render()
}
for (const control of document.querySelectorAll(".controls input, .controls select")) {
  control.addEventListener("change", render)
}
$("file").addEventListener("change", async event => {
  const file = event.target.files[0]
  if (!file) return
  try { load(JSON.parse(await file.text()), file.name) }
  catch (error) { $("status").textContent = `Could not load file: ${error.message}` }
})
fetch(source)
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  })
  .then(candidate => load(candidate, "Repository benchmark"))
  .catch(() => {
    $("status").textContent = "Could not load data automatically. Start the local server described in README.md, or choose your benchmark-results.json file below."
  })
