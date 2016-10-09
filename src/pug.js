'use strict'

var pkg = require('../package.json')
var fs = require('fs')
var path = require('path')
var pug = require('pug')
var _ = require('lodash')
var util = require('util')
var rootPath = process.cwd()
var loadHelpers = require('./load-helpers')

function Pug (options) {
  var defaultOptions = {
    compileDebug: false,
    pretty: false
  }
  var globalNoCache = false
  var compilers = new Map()
  var defaultLocals = {}
  var viewPath
  var helpers = {}

  function compileFile (tpl, locals, compileOptions, skipCache) {
    var tplPath, compiler

    if (_.endsWith(tpl, '.pug')) {
      tplPath = path.resolve(viewPath, tpl)
    } else {
      // If view path doesn't end with `.pug`, add `.pug` and check if it exists
      var dirname = path.resolve(viewPath, tpl)
      tplPath = dirname + '.pug'

      // If doesn't exist and the dirname is a folder, then search `index.pug` file
      if (!fs.existsSync(tplPath)) {
        var stat = fs.statSync(dirname)
        if (stat.isDirectory()) {
          tplPath = path.resolve(dirname, 'index.pug')
        }
      }
    }

    compileOptions.filename = tplPath

    if (skipCache) {
      compiler = pug.compileFile(tplPath, compileOptions)
    } else {
      compiler = compilers.get(tplPath)

      if (!compiler) {
        compiler = pug.compileFile(tplPath, compileOptions)
        compilers.set(tplPath, compiler)
      }
    }

    return compiler(locals)
  }

  function compileString (tpl, locals, compileOptions) {
    return pug.compile(tpl, compileOptions)(locals)
  }

  /**
   * @param {String}  tpl     the template path, search start from viewPath
   * @param {Object}  locals  locals that pass to Pug compiler, merged with global locals
   * @param {Object}  options options that pass to Pug compiler, merged with global default options
   * @param {Boolean} noCache use cache or not
   */
  function renderer (tpl, locals, options, noCache) {
    var compileOptions = _.merge({}, defaultOptions)

    if (_.isPlainObject(options)) {
      _.merge(compileOptions, options)
    }

    var finalLocals = _.merge({}, helpers, defaultLocals, this.state, locals)

    if (compileOptions.fromString) {
      this.body = compileString(tpl, finalLocals, compileOptions)
    } else {
      var skipCache

      if (_.isBoolean(options)) {
        skipCache = options
      } else {
        skipCache = _.isBoolean(noCache) ? noCache : globalNoCache
      }

      this.body = compileFile(tpl, finalLocals, compileOptions, skipCache)
    }

    this.type = 'text/html'
    return this
  }

  Object.defineProperties(this, {
    use: {
      enumerable: true,
      value: function (app) {
        app.context.render = renderer
      }
    },

    middleware: {
      enumerable: true,
      get: util.deprecate(function () {
        return function* (next) {
          this.render = renderer
          yield next
        }
      }, 'koa-pug: Pug.middleware is deprecated, use Pug.use instead')
    },

    /* Configuration */
    options: {
      enumerable: true,
      get: function () {
        return defaultOptions
      },
      set: function (options) {
        if (!_.isPlainObject(options)) {
          return
        }

        if (_.isEmpty(options)) {
          defaultOptions = {}
          return
        }

        viewPath = _.isString(options.viewPath) ? options.viewPath : rootPath

        if (_.isPlainObject(options.locals)) {
          defaultLocals = options.locals
        }

        if (_.isBoolean(options.noCache)) {
          globalNoCache = options.noCache
        }

        if (_.isString(options.helperPath) || _.isArray(options.helperPath)) {
          _.merge(helpers, loadHelpers(options.helperPath))
        }

        if (_.isBoolean(options.debug)) {
          defaultOptions.pretty = options.debug
          defaultOptions.compileDebug = options.debug
        } else {
          _.forIn(defaultOptions, function (value, key) {
            if (key in options && _.isBoolean(options[key])) {
              defaultOptions[key] = options[key]
            }
          })
        }

        if (_.isString(options.basedir)) {
          defaultOptions.basedir = options.basedir
        }

        if (options.app && options.app.constructor.name === 'Application') {
          this.use(options.app)
        }
      }
    },

    locals: {
      enumerable: true,
      get: function () {
        return defaultLocals
      },

      set: function (val) {
        if (val == null) {
          defaultLocals = {}
        } else if (_.isPlainObject(val)) {
          defaultLocals = val
        }
      }
    }
  })

  this.options = _.assign({
    compileDebug: false,
    pretty: false
  }, options)
}

Object.defineProperties(Pug, {
  version: {
    enumerable: true,
    value: pkg.version
  }
})

module.exports = Pug
