# Array creation benchmark

Measured: 2026-10-09T10:00:32.859Z. Node v21.6.2, linux x64. CPU: 13th Gen Intel(R) Core(TM) i7-13620H.

Sizes: powers of four through 1024, followed by the requested endpoint 2048.

Each method/size uses a fresh Node process. Runtime: median of 7 batches of 10000 arrays after warm-up. Memory: median of 5 batches retaining 2000 arrays.

Runtime includes allocation and automatic GC pauses; explicit GC is outside timing. Memory excludes the preallocated holder array. Heap at construction end is an approximate snapshot before explicit GC, not peak usage or total allocations. Retained heap is measured after GC. Memory readings include measurement overhead and can be noisy, particularly for small arrays. The two memory columns have independently computed medians.

Lower values are better. All methods remain O(n) time and O(n) space. Results depend on Node version, machine, and system load; rerun to compare.

| Length | Method | Runtime ms / 10000 arrays | Runtime us / array | Heap at construction end B / array | Retained heap B / array |
| --- | --- | --- | --- | --- | --- |
| 4 | push | 1.000 | 0.100 | 184.2 | 184.0 |
| 4 | preallocated | 1.011 | 0.101 | 80.1 | 80.0 |
| 4 | arrayFrom | 5.648 | 0.565 | 232.9 | 80.0 |
| 16 | push | 1.906 | 0.191 | 184.2 | 184.0 |
| 16 | preallocated | 0.943 | 0.094 | 296.9 | 176.0 |
| 16 | arrayFrom | 13.644 | 1.364 | 323.4 | 176.0 |
| 64 | push | 5.265 | 0.526 | 1217.6 | 704.0 |
| 64 | preallocated | 2.315 | 0.232 | 681.8 | 560.0 |
| 64 | arrayFrom | 43.545 | 4.354 | 785.3 | 560.0 |
| 256 | push | 21.766 | 2.177 | 7214.8 | 2912.0 |
| 256 | preallocated | 6.977 | 0.698 | 2112.3 | 2096.0 |
| 256 | arrayFrom | 157.913 | 15.791 | 2320.9 | 2096.0 |
| 1024 | push | 81.135 | 8.114 | 12693.7 | 10360.0 |
| 1024 | preallocated | 30.620 | 3.062 | 8360.9 | 8240.0 |
| 1024 | arrayFrom | 677.488 | 67.749 | 8395.4 | 8240.0 |
| 2048 | push | 184.997 | 18.500 | 24009.0 | 23600.0 |
| 2048 | preallocated | 43.849 | 4.385 | 16438.0 | 16432.0 |
| 2048 | arrayFrom | 1327.120 | 132.712 | 16451.8 | 16432.0 |
