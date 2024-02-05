import path from 'path'
import fs from 'fs'
import forIn from './for-in'
import camelCase from 'camelcase'
import assert from 'assert'

function loadHelpers (dirs: any | any[]) {
  const helpers: { [key: string]: (...args: any[]) => any } = {}

  if (Array.isArray(dirs)) {
    dirs.forEach(function (item) {
      if (typeof item === 'object' && item != null && !Array.isArray(item)) {
        forIn(item, function (value: any, key: string) {
          if (typeof value === 'string') {
            load(value, key)
          } else {
            assert(typeof value === 'function', `Cannot load helper: ${key}, requires a function:${value}`)
            helpers[key] = value as (...args: any[]) => any
          }
        })
      } else {
        load(item)
      }
    })
  } else {
    load(dirs)
  }

  function load (dir: string, moduleName?: string) {
    let fullPath = path.resolve(dir)
    let stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      fs.readdirSync(dir).forEach(function (file) {
        load(dir + '/' + file)
      })
    } else if (stat.isFile()) {
      let mod = require(fullPath)

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

export default loadHelpers
