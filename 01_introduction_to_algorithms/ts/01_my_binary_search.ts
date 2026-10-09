const numberList = (maxListNumber: number): number[] => {
  const list: number[] = []

  for (let number = 1; number <= maxListNumber; number++) {
    list.push(number)
  }

  return list
}

const numberListWithArrCon = (length: number): number[] =>
  Array.from({ length }, (_, index) => index + 1)

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
