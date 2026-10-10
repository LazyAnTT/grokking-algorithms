// Push-based construction: O(n) time/output space. Simple, but growth may
// allocate spare capacity. Actual findings: array-creation-analysis.md.
const numberList = (maxListNumber: number): number[] => {
  const list: number[] = []

  for (let number = 1; number <= maxListNumber; number++) {
    list.push(number)
  }

  return list
}

// Array.from mapping: O(n) time/output space. Concise; callback overhead may
// increase runtime even when retained memory matches preallocation.
// Actual findings: array-creation-analysis.md.
const numberListWithArrCon = (length: number): number[] =>
  Array.from({ length }, (_, index) => index + 1)

// Preallocated loop: O(n) time/output space. Avoids push growth, but engine
// behavior and small-input overhead can reverse the expected runtime advantage.
// Actual findings: array-creation-analysis.md.
const numberPreallocatedList = (length: number): number[] => {
  const list = new Array<number>(length)

  for (let index = 0; index < length; index++) {
    list[index] = index + 1
  }

  return list
}

function binarySearch(list: number[], targetNumber: number): { searchedValue: number | undefined, guesses: number } {
  let low = 0
  let high = list.length - 1
  let guesses = 0

  while (low <= high) {
    guesses += 1
    const mid = Math.floor((high + low) / 2)
    const guess = list[mid]
    if (guess === targetNumber) {
      return { searchedValue: guess, guesses }
    }
    else if (guess > targetNumber) {
      high = mid - 1
    }
    else {
      low = mid + 1
    }
  }
  return { searchedValue: undefined, guesses }
}

console.log(binarySearch(numberPreallocatedList(8), 6))
