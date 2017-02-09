'use strict'

var pkg = require('../package.json')
var fs = require('fs')
var path = require('path')
var pug = require('pug')
var util = require('util')
var endsWith = require('lodash.endswith')
var assign = require('lodash.assign')
var merge = require('lodash.merge')
var isPlainObject = require('lodash.isplainobject')
var forIn = require('lodash.forin')
var loadHelpers = require('./load-helpers')

var rootPath = process.cwd()

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

    if (endsWith(tpl, '.pug')) {
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
   * @param {Object}  locals  locals that pass to Pug compiler
   * @param {Object}  options options that pass to Pug compiler, merged with global default options
   * @param {Boolean} noCache use cache or not
   */
  function renderer (tpl, locals, options, noCache) {
    var compileOptions = merge({}, defaultOptions)

    if (isPlainObject(options)) {
      merge(compileOptions, options)
    }

    if (compileOptions.fromString) {
      return compileString(tpl, locals, compileOptions)
    }

    var skipCache

    if (typeof options === 'boolean') {
      skipCache = options
    } else {
      skipCache = typeof noCache === 'boolean' ? noCache : globalNoCache
    }

    return compileFile(tpl, locals, compileOptions, skipCache)
  }

  /**
   * Render function that attached to app context
   *
   * @param {String}  tpl     the template path, search start from viewPath
   * @param {Object}  locals  locals, will merged with global locals and ctx.state
   * @param {Object}  options options that pass to Pug compiler, merged with global default options
   * @param {Boolean} noCache use cache or not
   */
  function contextRenderer (tpl, locals, options, noCache) {
    var finalLocals = merge({}, helpers, defaultLocals, this.state, locals)

    this.body = renderer(tpl, finalLocals, options, noCache)
    this.type = 'text/html'
    return this
  }

  Object.defineProperties(this, {
    use: {
      enumerable: true,
      value: function (app) {
        app.context.render = contextRenderer
      }
    },

    render: {
      enumerable: true,
      value: renderer
    },

    middleware: {
      enumerable: true,
      get: util.deprecate(function () {
        return function* (next) {
          this.render = contextRenderer
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
        if (!isPlainObject(options)) {
          return
        }

        if (!Object.keys(options).length) {
          defaultOptions = {}
          return
        }

        viewPath = typeof options.viewPath === 'string' ? options.viewPath : rootPath

        if (isPlainObject(options.locals)) {
          defaultLocals = options.locals
        }

        if (typeof options.noCache === 'boolean') {
          globalNoCache = options.noCache
        }

        if (typeof options.helperPath === 'string' || Array.isArray(options.helperPath)) {
          merge(helpers, loadHelpers(options.helperPath))
        }

        if (typeof options.debug === 'boolean') {
          defaultOptions.pretty = options.debug
          defaultOptions.compileDebug = options.debug
        } else {
          forIn(defaultOptions, function (value, key) {
            if (key in options && typeof options[key] === 'boolean') {
              defaultOptions[key] = options[key]
            }
          })
        }

        if (typeof options.basedir === 'string') {
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
        } else if (isPlainObject(val)) {
          defaultLocals = val
        }
      }
    }
  })

  this.options = assign({
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
