# Array creation: hypotheses and measured conclusions

Source: benchmark-results.json, measured 2026-10-10T06:45:08.029Z; v21.6.2, linux x64.

Every implementation creates [1..n]. Calls the three existing custom TypeScript functions, plus an independent Array.from reference.

These observations compare implementations as executed in this harness. Runtime includes result consumption and the declared copying policy. Allocation estimates use statistical sampling. Peak heap is a profiling-batch metric, not a per-call memory bound. Differences are descriptive, not statistical significance claims. Rerunning the benchmark regenerates this report.

## Preallocation improves runtime over push

**Hypothesis:** A preallocated loop is faster than push.

**Reason and caveats:** Avoids output growth, but small-input overhead and engine optimization can reverse the result.

Comparing **preallocated** with **push** using microsecondsPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 5%.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 0.816 | 0.131 | 525.185% | Opposite direction |
| 16 | 0.843 | 0.202 | 316.993% | Opposite direction |
| 64 | 0.787 | 0.831 | -5.350% | Matches hypothesis |
| 256 | 1.009 | 2.709 | -62.752% | Matches hypothesis |
| 1024 | 3.047 | 10.632 | -71.339% | Matches hypothesis |
| 2048 | 5.992 | 24.053 | -75.088% | Matches hypothesis |

**Result:** 4 sizes match, 2 point in the opposite direction, 0 are close, and 0 have unreliable readings.

**Conclusion:** Results depend on input size; this is not a consistent improvement. All versions remain O(n); changing constants does not change complexity.

## Preallocation retains less memory than push

**Hypothesis:** A preallocated array retains less heap than a grown array.

**Reason and caveats:** push may reserve spare capacity; closely sized outputs need not differ materially.

Comparing **preallocated** with **push** using retainedBytesPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 1% or 8 bytes, whichever is larger.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 80.528 | 237.748 | -66.129% | Unstable reading; excluded |
| 16 | 176.504 | 184.452 | -4.309% | Close at descriptive threshold |
| 64 | 560.504 | 704.452 | -20.434% | Matches hypothesis |
| 256 | 2096.504 | 2912.452 | -28.016% | Matches hypothesis |
| 1024 | 8239.951 | 10359.951 | -20.463% | Matches hypothesis |
| 2048 | 16431.906 | 23599.906 | -30.373% | Matches hypothesis |

**Result:** 4 sizes match, 0 point in the opposite direction, 1 are close, and 1 have unreliable readings.

**Conclusion:** The reliable measurements support the direction of this hypothesis in this run. This describes result storage, not total allocations.

## Array.from callback costs runtime

**Hypothesis:** Array.from is slower than a preallocated loop.

**Reason and caveats:** Mapping callbacks and engine-specific implementation add constant costs.

Comparing **arrayFrom** with **preallocated** using microsecondsPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 5%.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 1.627 | 0.816 | 99.281% | Matches hypothesis |
| 16 | 2.013 | 0.843 | 138.850% | Matches hypothesis |
| 64 | 6.577 | 0.787 | 735.734% | Matches hypothesis |
| 256 | 19.192 | 1.009 | 1802.138% | Matches hypothesis |
| 1024 | 76.555 | 3.047 | 2412.321% | Matches hypothesis |
| 2048 | 181.526 | 5.992 | 2929.458% | Matches hypothesis |

**Result:** 6 sizes match, 0 point in the opposite direction, 0 are close, and 0 have unreliable readings.

**Conclusion:** The reliable measurements support the direction of this hypothesis in this run. For small one-off lists, readability can matter more than microseconds.

## Overall interpretation

All array-creation methods have O(n) time and O(n) output space. Larger runtime ratios do not imply different asymptotic complexity. Retained heap may match even when runtime and total allocations differ. VM/host-context differences also affect the reference comparison.

Retained output size and allocated bytes answer different questions: a method can keep a smaller result while allocating more temporary memory. Peak heap depends on GC timing and batch count. When retained samples vary by over 25% of their median or are nonpositive, this report excludes them from hypothesis conclusions. Runtime and allocation thresholds are conservative descriptive filters, not confidence intervals. Inspect raw samples and repeat runs before relying on small differences.
