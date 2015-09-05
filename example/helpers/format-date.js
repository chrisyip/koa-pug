module.exports = {
  moduleName: 'format',
  moduleBody: function (input) {
    return input.getMonth() + 1 + '/' + input.getDate() + '/' + input.getFullYear()
  }
}
