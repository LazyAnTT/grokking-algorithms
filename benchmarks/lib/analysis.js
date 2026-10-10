// Descriptive hypothesis checks, not significance tests. Recomputed on every run.
function analyze(suite, metadata, rows) {
  const format = value => Number.isFinite(value) ? value.toFixed(3) : 'n/a'
  const parts = [`# ${suite.title}: hypotheses and measured conclusions`,
    `Source: benchmark-results.json, measured ${metadata.measuredAt}; ${metadata.node}, ${metadata.platform}.`,
    suite.notes,
    'These observations compare implementations as executed in this harness. Runtime includes result consumption and the declared copying policy. Allocation estimates use statistical sampling. Peak heap is a profiling-batch metric, not a per-call memory bound. Differences are descriptive, not statistical significance claims. Rerunning the benchmark regenerates this report.',
  ]
  for (const hypothesis of suite.hypotheses || []) {
    const comparison = []
    const sizes = [...new Set(rows.map(row => row.length))].sort((a,b)=>a-b)
    let supported = 0, opposite = 0, close = 0, unreliable = 0
    for (const length of sizes) {
      const candidate = rows.find(row => row.length === length && row.method === hypothesis.candidate)
      const baseline = rows.find(row => row.length === length && row.method === hypothesis.baseline)
      if (!candidate || !baseline) continue
      const a = candidate[hypothesis.metric], b = baseline[hypothesis.metric]
      const noisyRetained = row => {
        if (hypothesis.metric !== 'retainedBytesPerOperation') return false
        const samples = row.phases.retained.samples
        return row.retainedBytesPerOperation <= 0 || (Math.max(...samples)-Math.min(...samples)) / Math.abs(row.retainedBytesPerOperation) > .25
      }
      const unreliableReading = !Number.isFinite(a) || !Number.isFinite(b) || b <= 0 || noisyRetained(candidate) || noisyRetained(baseline)
      const percent = b > 0 ? (a / b - 1) * 100 : NaN
      const tolerance = Math.max(hypothesis.absoluteTolerance || 0, Math.abs(b) * hypothesis.relativeTolerance)
      let observation
      if (unreliableReading) { observation='Unstable reading; excluded'; unreliable++ }
      else if (Math.abs(a-b) <= tolerance) { observation='Close at descriptive threshold'; close++ }
      else if ((hypothesis.direction === 'lower' && a < b) || (hypothesis.direction === 'higher' && a > b)) {
        observation='Matches hypothesis'; supported++
      } else { observation='Opposite direction'; opposite++ }
      comparison.push(`| ${length} | ${format(a)} | ${format(b)} | ${format(percent)}% | ${observation} |`)
    }
    parts.push(`## ${hypothesis.title}`, `**Hypothesis:** ${hypothesis.expectation}`, `**Reason and caveats:** ${hypothesis.reason}`,
      `Comparing **${hypothesis.candidate}** with **${hypothesis.baseline}** using ${hypothesis.metric}. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: ${hypothesis.relativeTolerance*100}%${hypothesis.absoluteTolerance ? ` or ${hypothesis.absoluteTolerance} bytes, whichever is larger` : ''}.`,
      '| Length | Candidate | Baseline | Difference | Observation |\n| --- | --- | --- | --- | --- |\n'+comparison.join('\n'),
      `**Result:** ${supported} sizes match, ${opposite} point in the opposite direction, ${close} are close, and ${unreliable} have unreliable readings.`,
      `**Conclusion:** ${supported && !opposite ? 'The reliable measurements support the direction of this hypothesis in this run.' : opposite && !supported ? 'The reliable measurements do not support the expected direction in this run.' : supported && opposite ? 'Results depend on input size; this is not a consistent improvement.' : 'This run does not distinguish the hypothesis reliably.'} ${hypothesis.conclusion}`)
  }
  parts.push('## Overall interpretation', suite.conclusions || 'Choose an implementation using both behavior and measured cost; do not infer a universal winner from one machine.',
    'Retained output size and allocated bytes answer different questions: a method can keep a smaller result while allocating more temporary memory. Peak heap depends on GC timing and batch count. When retained samples vary by over 25% of their median or are nonpositive, this report excludes them from hypothesis conclusions. Runtime and allocation thresholds are conservative descriptive filters, not confidence intervals. Inspect raw samples and repeat runs before relying on small differences.')
  return parts.join('\n\n')+'\n'
}
module.exports = { analyze }
