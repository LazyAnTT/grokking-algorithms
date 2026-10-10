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

function mySelectionSort(numberList: number[]): number[] {
  const sortedList: number[] = []

  while (numberList.length !== 0) {
    const smallest = smallestIndex(numberList)

    sortedList.push(numberList.splice(smallest, 1)[0])

  }

  return sortedList
}


console.log(mySelectionSort([4, 2, 12, 4, 5, 6, 2, 3]))