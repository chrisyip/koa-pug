/* jshint noyield: true */

var pkg, fs, path, jade, _, rootPath

pkg = require('./package.json')
fs = require('fs-extra')
path = require('path')
jade = require('jade')
_ = require('lodash')
rootPath = process.cwd()

// http://stackoverflow.com/a/10425344
function toCamelCase (input) {
  return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
    return group1.toUpperCase()
  })
}

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
    });
  } else {
    load(dirs)
  }

  function load (dir, moduleName) {
    var fullPath, stat, module

    fullPath = path.resolve(dir)
    stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      _.forEach(fs.readdirSync(dir), function (file) {
        load(dir + '/' + file)
      })
    } else if (stat.isFile()) {
      module = require(fullPath)

      if (_.isString(moduleName)) {
        helpers[moduleName] = module
      } else if (_.isString(module.moduleName)) {
        helpers[module.moduleName] = module.moduleBody
      } else {
        helpers[toCamelCase(path.basename(fullPath, path.extname(fullPath)))] = module
      }
    }
  }

  return helpers
}

function Jade () {
  var defaultOptions = {
        compileDebug: false,
        pretty: false
      }
    , globalNoCache = false
    , compilers = new Map()
    , defaultLocals, viewPath

  this.version = pkg.version

  Object.defineProperties(this, {
    'version': {
      enumerable: true,
      get: function () {
        return pkg.version
      }
    },

    'renderer': {
      enumerable: true,
      value: function () {
        /**
         * @param {String}  tpl     the template path, search start from viewPath
         * @param {Object}  locals  locals that pass to Jade compiler, merged with global locals
         * @param {Object}  options options that pass to Jade compiler, merged with global default options
         * @param {Boolean} noCache use cache or not
         */
        return function* (tpl, locals, options, noCache) {
          var compileOptions, tplPath, rawJade, compiler, skipCache

          tplPath = path.join(viewPath, /\.jade$/.test(tpl) ? tpl : tpl + '.jade')

          rawJade = fs.readFileSync(tplPath)

          compileOptions = _.merge({}, defaultOptions)

          if (_.isPlainObject(options)) {
            _.merge(compileOptions, options)
          }

          compileOptions.filename = tplPath

          skipCache = _.isBoolean(options) ? options : _.isBoolean(noCache) ? noCache : globalNoCache

          if (skipCache) {
            compiler = jade.compile(rawJade, compileOptions)
          } else {
            compiler = compilers.get(tplPath)

            if (!compiler) {
              compiler = jade.compile(rawJade, compileOptions)
              compilers.set(tplPath, compiler)
            }
          }

          this.body = compiler(_.merge({}, defaultLocals, locals))
          this.type = 'text/html'
        }
      }
    },

    'configure': {
      enumerable: true,
      value: function (options) {
        if (!_.isPlainObject(options)) {
          options = {}
        }

        viewPath = _.isString(options.viewPath) ? options.viewPath : rootPath

        if (_.isPlainObject(options.locals)) {
          defaultLocals = options.locals
        }

        if (_.isBoolean(options.noCache)) {
          globalNoCache = options.noCache
        }

        if (_.isString(options.helperPath) || _.isArray(options.helperPath)) {
          _.merge(defaultLocals, loadHelpers(options.helperPath))
        }

        if (_.isBoolean(options.debug)) {
          defaultOptions.pretty = options.debug
          defaultOptions.compileDebug = options.debug
        } else {
          _.forIn(defaultOptions, function (key) {
            if (key in options && _.isBoolean(options[key])) {
              defaultOptions[key] = options[key]
            }
          })
        }

        if (_.isString(options.basedir)) {
          defaultOptions.basedir = options.basedir
        }
      }
    },

    'middleware': {
      enumerable: true,
      value: function (options) {
        this.configure(options)

        var renderer = this.renderer()

        return function* (next) {
          this.render = renderer
          yield next
        }
      }
    }
  })
}

module.exports = new Jade()
