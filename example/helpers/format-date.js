module.exports = {
  moduleName: 'format',
  moduleBody: function (input) {
    if (input instanceof Date) {
      return input.getMonth() + 1 + '/' + input.getDate() + '/' + input.getFullYear()
    }

    return input
  }
}
