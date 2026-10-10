# Array creation benchmark

Measured 2026-10-10T06:45:08.029Z. Node v21.6.2; linux x64; 13th Gen Intel(R) Core(TM) i7-13620H.

Every implementation creates [1..n]. Calls the three existing custom TypeScript functions, plus an independent Array.from reference.

Each method, size, and measurement phase runs in a fresh process. Runtime is measured without memory profiling. Samples use warmed-up functions; explicit GC is outside runtime timing. All exports contain per-phase sample counts and raw measurements.

Peak is a batch metric, not a per-call measurement: batch sizes differ by input size and are shown in the table. Small peak differences across differently sized batches should not be interpreted as algorithmic space scaling. Heap metrics exclude external buffers/native allocations and process RSS.

Sampling interval: 512 bytes. Peak/allocation profiling has overhead. All figures are estimates; no metric is an exact total-memory bill. Existing TS functions execute in VM contexts; the reference built-in executes in the host context. Compare implementations as executed here, not language-level guarantees.

**Runtime (µs / operation):** Median unprofiled runtime, including the suite input-copy policy and result consumption.

**Retained heap (B / result):** Heap increase after GC with results retained; holder storage excluded. Approximate, includes measurement noise.

**Estimated peak heap increase (B / batch):** Median observed high-water heap increase over a non-retaining profiling batch. Includes heap samples after calls and pre/post-GC readings. Not exact peak, not divided by operations, and includes profiling overhead.

**Estimated total allocations (B / operation):** V8 sampling estimate attributed to runOperation and descendants, including collected objects. Not exact bytes; zero can mean no sampled allocation.

**Heap snapshot after construction (B / result):** End-of-retaining-batch heap reading before explicit GC. Noisy snapshot, not peak memory or total allocations.

| Length | Method | Category | Runtime operations per batch | Retained results per batch | Peak/allocation operations per batch | Runtime (µs / operation) | Retained heap (B / result) | Estimated peak heap increase (B / batch) | Estimated total allocations (B / operation) | Heap snapshot after construction (B / result) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | push | custom | 10000 | 2000 | 1000 | 0.131 | 237.748 | 491368.000 | 183.904 | 304.896 |
| 4 | preallocated | custom | 10000 | 2000 | 1000 | 0.816 | 80.528 | 419048.000 | 91.488 | 129.264 |
| 4 | arrayFrom | custom | 10000 | 2000 | 1000 | 1.627 | 80.504 | 522064.000 | 183.496 | 216.632 |
| 4 | referenceArrayFrom | reference | 10000 | 2000 | 1000 | 1.025 | 80.496 | 505544.000 | 181.872 | 209.552 |
| 16 | push | custom | 10000 | 2000 | 1000 | 0.202 | 184.452 | 441368.000 | 181.968 | 226.764 |
| 16 | preallocated | custom | 10000 | 2000 | 1000 | 0.843 | 176.504 | 515144.000 | 189.696 | 307.200 |
| 16 | arrayFrom | custom | 10000 | 2000 | 1000 | 2.013 | 176.504 | 585952.000 | 274.488 | 361.500 |
| 16 | referenceArrayFrom | reference | 10000 | 2000 | 1000 | 1.983 | 176.472 | 583256.000 | 290.560 | 307.912 |
| 64 | push | custom | 10000 | 2000 | 1000 | 0.831 | 704.452 | 1031856.000 | 1210.960 | 1017.524 |
| 64 | preallocated | custom | 10000 | 2000 | 1000 | 0.787 | 560.504 | 840224.000 | 577.320 | 721.644 |
| 64 | arrayFrom | custom | 10000 | 2000 | 1000 | 6.577 | 560.480 | 967200.000 | 661.120 | 793.688 |
| 64 | referenceArrayFrom | reference | 10000 | 2000 | 1000 | 5.353 | 560.472 | 969856.000 | 664.368 | 794.120 |
| 256 | push | custom | 10000 | 2000 | 1000 | 2.709 | 2912.452 | 1031488.000 | 7085.008 | 3708.996 |
| 256 | preallocated | custom | 10000 | 2000 | 1000 | 1.009 | 2096.504 | 1028960.000 | 2103.552 | 2239.892 |
| 256 | arrayFrom | custom | 10000 | 2000 | 1000 | 19.192 | 2096.480 | 1078112.000 | 2197.616 | 2244.180 |
| 256 | referenceArrayFrom | reference | 10000 | 2000 | 1000 | 18.262 | 2096.472 | 1072608.000 | 2203.232 | 2245.508 |
| 1024 | push | custom | 10000 | 976 | 1000 | 10.632 | 10359.951 | 2061992.000 | 28609.824 | 11772.623 |
| 1024 | preallocated | custom | 10000 | 976 | 1000 | 3.047 | 8239.951 | 1028632.000 | 8256.000 | 8569.352 |
| 1024 | arrayFrom | custom | 10000 | 976 | 1000 | 76.555 | 8239.951 | 1076424.000 | 8339.416 | 8657.066 |
| 1024 | referenceArrayFrom | reference | 10000 | 976 | 1000 | 78.920 | 8239.951 | 1096392.000 | 8338.856 | 8686.270 |
| 2048 | push | custom | 10000 | 512 | 1000 | 24.053 | 23599.906 | 4118936.000 | 67842.928 | 36563.625 |
| 2048 | preallocated | custom | 10000 | 512 | 1000 | 5.992 | 16431.906 | 2054840.000 | 16448.000 | 16972.625 |
| 2048 | arrayFrom | custom | 10000 | 512 | 1000 | 181.526 | 16431.906 | 2100832.000 | 16514.152 | 17065.016 |
| 2048 | referenceArrayFrom | reference | 10000 | 512 | 1000 | 172.435 | 16431.906 | 2101712.000 | 16515.768 | 17065.016 |
