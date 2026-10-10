# Selection sort: hypotheses and measured conclusions

Source: benchmark-results.json, measured 2026-10-10T06:44:26.781Z; v21.6.2, linux x64.

Same seeded shuffled 1..n for all methods. Every invocation receives an input slice, included in measurement; internal copies also count. Built-in numeric Array.sort is a general-purpose sorting baseline, not selection sort.

These observations compare implementations as executed in this harness. Runtime includes result consumption and the declared copying policy. Allocation estimates use statistical sampling. Peak heap is a profiling-batch metric, not a per-call memory bound. Differences are descriptive, not statistical significance claims. Rerunning the benchmark regenerates this report.

## Preallocation reduces retained output memory

**Hypothesis:** Variant 2 retains less output heap than variant 1.

**Reason and caveats:** An output of known length avoids push growth/spare capacity, but the internal input copy may increase allocation volume.

Comparing **mySelectionSort2** with **mySelectionSort** using retainedBytesPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 1% or 8 bytes, whichever is larger.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 81.024 | 184.056 | -55.979% | Matches hypothesis |
| 16 | 176.000 | 183.952 | -4.323% | Close at descriptive threshold |
| 64 | 560.000 | 703.952 | -20.449% | Unstable reading; excluded |
| 256 | 2095.939 | 2911.939 | -28.023% | Matches hypothesis |
| 1024 | 8239.813 | 10359.813 | -20.464% | Matches hypothesis |
| 2048 | 16431.813 | 23599.813 | -30.373% | Matches hypothesis |

**Result:** 4 sizes match, 0 point in the opposite direction, 1 are close, and 1 have unreliable readings.

**Conclusion:** The reliable measurements support the direction of this hypothesis in this run. This addresses retained results, not total memory spent while sorting.

## Array.from callback adds runtime overhead

**Hypothesis:** Variant 3 is slower than the preallocated loop in variant 2.

**Reason and caveats:** Both use input copies and splice; the callback introduces different engine optimization opportunities. Syntax does not change O(n²) work.

Comparing **mySelectionSort3** with **mySelectionSort2** using microsecondsPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 5%.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 2.964 | 2.769 | 7.053% | Matches hypothesis |
| 16 | 7.748 | 5.308 | 45.977% | Matches hypothesis |
| 64 | 36.710 | 22.810 | 60.935% | Matches hypothesis |
| 256 | 305.632 | 134.018 | 128.054% | Matches hypothesis |
| 1024 | 1567.283 | 1278.207 | 22.616% | Matches hypothesis |
| 2048 | 4950.224 | 4044.307 | 22.400% | Matches hypothesis |

**Result:** 6 sizes match, 0 point in the opposite direction, 0 are close, and 0 have unreliable readings.

**Conclusion:** The reliable measurements support the direction of this hypothesis in this run. Callback syntax is a readability choice; actual overhead is engine-dependent.

## Swap/pop reduces allocation volume

**Hypothesis:** Variant 4 allocates fewer estimated bytes than variant 3.

**Reason and caveats:** pop avoids the removed-element arrays returned by splice. Changes to remaining order may also change comparison patterns. Sampling estimates include collected objects.

Comparing **mySelectionSort4** with **mySelectionSort3** using estimatedAllocatedBytesPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 20%.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 763.688 | 1011.104 | -24.470% | Matches hypothesis |
| 16 | 1407.744 | 2316.600 | -39.232% | Matches hypothesis |
| 64 | 5602.436 | 9159.718 | -38.836% | Matches hypothesis |
| 256 | 23214.256 | 37620.513 | -38.294% | Matches hypothesis |
| 1024 | 91911.600 | 148492.400 | -38.103% | Matches hypothesis |
| 2048 | 192452.000 | 308952.000 | -37.708% | Matches hypothesis |

**Result:** 6 sizes match, 0 point in the opposite direction, 0 are close, and 0 have unreliable readings.

**Conclusion:** The reliable measurements support the direction of this hypothesis in this run. Lower allocation volume can help GC pressure without guaranteeing faster sorting.

## Swap/pop improves runtime

**Hypothesis:** Variant 4 sorts faster than variant 3 by avoiding element shifts.

**Reason and caveats:** Removal is O(1), but repeated minimum scans remain O(n²), and both versions still create callbacks and copies.

Comparing **mySelectionSort4** with **mySelectionSort3** using microsecondsPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 5%.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 2.951 | 2.964 | -0.430% | Close at descriptive threshold |
| 16 | 5.580 | 7.748 | -27.978% | Matches hypothesis |
| 64 | 26.775 | 36.710 | -27.064% | Matches hypothesis |
| 256 | 246.679 | 305.632 | -19.289% | Matches hypothesis |
| 1024 | 1988.677 | 1567.283 | 26.887% | Opposite direction |
| 2048 | 4254.228 | 4950.224 | -14.060% | Matches hypothesis |

**Result:** 4 sizes match, 1 point in the opposite direction, 1 are close, and 0 have unreliable readings.

**Conclusion:** Results depend on input size; this is not a consistent improvement. Removing splice does not change the quadratic time complexity.

## Built-in numeric sort is a practical runtime baseline

**Hypothesis:** The built-in numeric sort is faster than variant 4, particularly on larger arrays.

**Reason and caveats:** The built-in uses a different engine implementation and executes in the host context; this is not an isolated comparison of selection-sort syntax.

Comparing **nativeNumericSort** with **mySelectionSort4** using microsecondsPerOperation. Difference is (candidate / baseline − 1) × 100%; negative means the candidate is lower. Descriptive closeness threshold: 5%.

| Length | Candidate | Baseline | Difference | Observation |
| --- | --- | --- | --- | --- |
| 4 | 0.641 | 2.951 | -78.288% | Matches hypothesis |
| 16 | 1.283 | 5.580 | -77.008% | Matches hypothesis |
| 64 | 8.365 | 26.775 | -68.758% | Matches hypothesis |
| 256 | 60.987 | 246.679 | -75.277% | Matches hypothesis |
| 1024 | 482.370 | 1988.677 | -75.744% | Matches hypothesis |
| 2048 | 713.598 | 4254.228 | -83.226% | Matches hypothesis |

**Result:** 6 sizes match, 0 point in the opposite direction, 0 are close, and 0 have unreliable readings.

**Conclusion:** The reliable measurements support the direction of this hypothesis in this run. Use selection sort to study the algorithm; treat the built-in as a practical alternative, not proof about a specific engine algorithm.

## Overall interpretation

All four custom variants and the repository reference remain O(n²) time with O(n) extra space. The input-consuming variant and preserving variants have different contracts; the harness supplies a fresh slice for every call and counts internal copies. Prefer descriptive names (push/splice, preallocated/splice, Array.from/splice, Array.from/swap-pop) over assuming numbered variants are successive optimizations. An in-place swap-based selection sort would be a separate O(1)-extra-space implementation, not any of these four.

Retained output size and allocated bytes answer different questions: a method can keep a smaller result while allocating more temporary memory. Peak heap depends on GC timing and batch count. When retained samples vary by over 25% of their median or are nonpositive, this report excludes them from hypothesis conclusions. Runtime and allocation thresholds are conservative descriptive filters, not confidence intervals. Inspect raw samples and repeat runs before relying on small differences.
