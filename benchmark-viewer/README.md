# Benchmark viewer

A local HTML/CSS/JavaScript viewer using SVG, with no libraries or build step.

From the repository root, start a server:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000/benchmark-viewer/ in your browser. Stop the server with Ctrl+C.

The page fetches `../01_introduction_to_algorithms/ts/benchmark-results.json`. Serving from the repository root makes both the viewer and that file available. Rerun `node --expose-gc 01_introduction_to_algorithms/ts/benchmark.js` and refresh the page to see new results.

You can also open `index.html` directly and select `benchmark-results.json` with the file picker. Browsers usually block automatic fetching of files on `file://` pages.

Use the method checkboxes to show/hide lines, the measurement dropdown to switch between runtime and memory, and the axis controls to change scales. Hover or focus points for values. The table updates with the same selected methods. The logarithmic X-axis is the default because tested sizes are widely spaced; logarithmic Y-axis values must be positive.

Runtime is in microseconds per array. Memory is in bytes per array. Construction-end heap is an approximate snapshot, not peak usage or total allocation volume. Retained heap is measured after garbage collection. See the exported benchmark table for measurement methodology.

The file picker supports both array-creation and selection-sort benchmark JSON exports. Method checkboxes are generated from the loaded file; runtime units switch between microseconds per array and per sort. Select `02_selection_sort/ts/benchmark-results.json` to compare all four selection-sort functions.

Version 2 result files include their own metric definitions. The viewer presents runtime, retained heap, estimated peak heap increase per profiling batch, estimated allocations per operation, and a diagnostic heap snapshot. Legacy JSON files remain supported. Categories distinguish custom, reference, and built-in implementations. See `../benchmarks/README.md` for reusable suite configuration and metric limitations.
