'use strict'

var isObject = require('lodash.isobject')
var forIn = require('lodash.forin')
var camelCase = require('lodash.camelcase')
var fs = require('fs')
var path = require('path')

function loadHelpers (dirs) {
  var helpers = {}

  if (Array.isArray(dirs)) {
    dirs.forEach(function (item) {
      if (isObject(item)) {
        forIn(item, function (value, key) {
          if (typeof key === 'string') {
            if (typeof value === 'string') {
              load(value, key)
            } else {
              helpers[key] = value
            }
          }
        })
      } else if (typeof item === 'string') {
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
      fs.readdirSync(dir).forEach(function (file) {
        load(dir + '/' + file)
      })
    } else if (stat.isFile()) {
      var mod = require(fullPath)

      if (typeof moduleName === 'string') {
        helpers[moduleName] = mod
      } else if (typeof mod.moduleName === 'string') {
        helpers[mod.moduleName] = mod.moduleBody
      } else {
        helpers[camelCase(path.basename(fullPath, path.extname(fullPath)))] = mod
      }
    }
  }

  return helpers
}

module.exports = loadHelpers
