const sizes = [4, 16, 64, 256, 1024, 2048]
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
function shuffled(length) {
  const numbers = Array.from({ length }, (_, i) => i + 1)
  let state = 123456789
  for (let i = length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }
  return numbers
}
module.exports = { sizes, median, shuffled }
