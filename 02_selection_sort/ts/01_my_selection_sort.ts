function smallestIndex(numberList: number[]): number {
  let smallestValue = numberList[0];
  let smallestIndex = 0;

  for (let index = 0; index < numberList.length; index++) {
    if (numberList[index] < smallestValue) {
      smallestValue = numberList[index];
      smallestIndex = index;
    }
  }
  return smallestIndex;
}

/**
 * Variant 1: repeated minimum scan + push + splice (consumes the input).
 * Theory: simple, avoids an internal input copy; O(n²) time, O(n) output space.
 * Caveats: splice shifts later elements; push may retain spare capacity.
 * Benchmark calls provide a fresh copy, so that outer copy is still measured.
 * Measured hypotheses and conclusions: selection-sort-analysis.md (regenerated).
 */
function mySelectionSort(numberList: number[]): number[] {
  const sortedList: number[] = []

  while (numberList.length !== 0) {
    const smallest = smallestIndex(numberList)

    sortedList.push(numberList.splice(smallest, 1)[0])

  }

  return sortedList
}


console.log(mySelectionSort([4, 2, 12, 4, 5, 6, 2, 3]))


/**
 * Variant 2: preallocated output + splice (preserves the input).
 * Hypothesis: preallocation reduces output growth/spare capacity vs variant 1.
 * Caveats: internal input copy adds allocation; splice still shifts elements.
 * Same O(n²) time and O(n) extra space; lower retained output is not lower total allocation.
 * Actual evidence: selection-sort-analysis.md; speed gains are not guaranteed.
 */
function mySelectionSort2(numberList: number[]): number[] {
  const remaining = [...numberList]
  const length = remaining.length
  const sorted = new Array<number>(length)

  for (let i = 0; i < length; i++) {
    const smallest = smallestIndex(remaining)
    sorted[i] = remaining.splice(smallest, 1)[0]
  }

  return sorted
}

/**
 * Variant 3: Array.from callback + splice (preserves the input).
 * Hypothesis: concise mapping has similar output memory to variant 2, with callback overhead.
 * Caveats: creates an input copy and callback; splice shifting remains.
 * O(n²) time, O(n) extra space. map() on an unfilled new Array would skip holes.
 * Actual evidence: selection-sort-analysis.md; callback cost depends on engine optimization.
 */
function mySelectionSort3(numberList: number[]): number[] {
  const remaining = [...numberList]

  return Array.from({ length: remaining.length }, () => {
    const smallest = smallestIndex(remaining)
    return remaining.splice(smallest, 1)[0]
  })
}

/**
 * Variant 4: Array.from callback + swap/pop (preserves the input).
 * Hypothesis: O(1) removal avoids shifts and per-splice removed-element arrays.
 * Caveats: minimum scans remain O(n²); swapping changes the remaining order,
 * so comparison patterns also differ. Input copy, output and callback still allocate.
 * Overall O(n²) time, O(n) extra space. Lower allocations need not mean faster runtime.
 * Actual evidence: selection-sort-analysis.md (regenerated from benchmark JSON).
 */
function mySelectionSort4(numberList: number[]): number[] {
  const remaining = [...numberList]

  return Array.from({ length: remaining.length }, () => {
    const smallest = smallestIndex(remaining)
    const value = remaining[smallest]
    remaining[smallest] = remaining[remaining.length - 1]
    remaining.pop()
    return value
  })
}
