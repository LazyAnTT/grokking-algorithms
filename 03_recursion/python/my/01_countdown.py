def count_down(number):
    while number > 0:
        print(number)
        number -= 1
    return print("end")


count_down(12)


def count_down_req(number):
    if number <= 0:
        print("end")
        return

    print(number)
    count_down_req(number - 1)


count_down_req(12)
