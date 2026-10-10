numbers = list(range(1, 1049))


def binary_search_req(numbers, target_value, low=0, high=None):
    if high is None:
        high = len(numbers) - 1

    if low > high:
        return None

    mid = (low + high) // 2
    guess = numbers[mid]

    if guess == target_value:
        return guess

    if guess > target_value:
        return binary_search_req(numbers, target_value, low, mid - 1)
    else:
        return binary_search_req(numbers, target_value, mid + 1, high)


print(binary_search_req(numbers, 1048))
