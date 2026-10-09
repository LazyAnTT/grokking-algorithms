# condition: must be sorted array
# Steps:
# 1) Find the middle index of the current search range and check its value.
# 2) guess is higher or lower than the searched value
# 3) if the guess is too low, adjust the lower element and visa versa

numbers = list(range(1, 1049))


def binary_search(numbers, target_value):
    low = 0
    high = len(numbers) - 1
    loops = 0
    while low <= high:
        loops += 1
        mid = (low + high) // 2
        guess = numbers[mid]
        if guess == target_value:
            return {"target": guess, "loops": loops}
        if guess > target_value:
            high = mid - 1
        else:
            low = mid + 1

    return {"target": None, "loops": loops}


if __name__ == "__main__":
    print(binary_search(numbers, 1048))
