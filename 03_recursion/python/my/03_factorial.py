def factorial(n):
    if n < 0:
        raise ValueError("Factorial requires a nonnegative integer")

    result = 1
    for number in range(1, n + 1):
        result *= number

    return result


def factorial_req(n):
    if n < 0:
        raise ValueError("Factorial requires a nonnegative integer")

    if n == 0:
        return 1

    return n * factorial_req(n - 1)


print(factorial_req(5))
