'use strict'

var _ = require('lodash')
var fs = require('fs')
var path = require('path')

function loadHelpers (dirs) {
  var helpers = {}

  if (_.isArray(dirs)) {
    _.forEach(dirs, function (item) {
      if (_.isObject(item)) {
        _.forIn(item, function (value, key) {
          if (_.isString(key)) {
            if (_.isString(value)) {
              load(value, key)
            } else {
              helpers[key] = value
            }
          }
        })
      } else if (_.isString(item)) {
        load(item)
      }
    })
  } else {
    load(dirs)
  }

  function load (dir, moduleName) {
    var fullPath = path.resolve(dir)
    var stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      _.forEach(fs.readdirSync(dir), function (file) {
        load(dir + '/' + file)
      })
    } else if (stat.isFile()) {
      var mod = require(fullPath)

      if (_.isString(moduleName)) {
        helpers[moduleName] = mod
      } else if (_.isString(mod.moduleName)) {
        helpers[mod.moduleName] = mod.moduleBody
      } else {
        helpers[_.camelCase(path.basename(fullPath, path.extname(fullPath)))] = mod
      }
    }
  }

  return helpers
}

module.exports = loadHelpers
