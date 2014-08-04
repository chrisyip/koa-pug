module.exports = function (max, min) {
  if (!isNaN(max)) {
    if (!isNaN(min)) {
      return Math.round(Math.random() * (max - min) + min)
    } else {
      return Math.round(Math.random() * max)
    }
  }

  return max
}
