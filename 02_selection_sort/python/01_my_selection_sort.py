def findSmallestIndex(arr):
    smallest_value = arr[0]
    smallest_index = 0

    for i in range(1, len(arr)):
        if arr[i] < smallest_value:
            smallest_value = arr[i]
            smallest_index = i
    return smallest_index


def selection_sort(arr):
    sorted_list = []

    for _ in range(len(arr)):
        smallest = findSmallestIndex(arr)
        sorted_list.append(arr[smallest])
        arr.pop(smallest)
    return sorted_list


print(selection_sort([3, 9, 1, 3, 5, 2]))
