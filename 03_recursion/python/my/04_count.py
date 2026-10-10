def sum(numbers):
    sum = 0
    for number in numbers:
        sum += number

    return sum


def count(numbers):
    total = 0

    for _ in numbers:
        total += 1

    return total


def count_req(numbers):
    if not numbers:
        return 0
    return 1 + count_req(numbers[1:])


def sum_array_rec(numbers):
    if len(numbers) == 0:
        return 0

    return numbers[0] + sum_array_rec(numbers[1:])


print(count([3, 2, 5, 1, 32, 3]))
