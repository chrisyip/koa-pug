import fs from 'fs-extra'
import pug from 'pug'
import Koa from 'koa'
import merge from 'lodash.merge'
import isPlainObject from 'lodash.isplainobject'
import forIn from 'lodash.forin'
import path from 'path'
import assert from 'assert'

import loadHelpers from './load-helpers'

export class KoaPug {
  viewPath!: string
  noCache!: boolean
  helpers!: { [key: string]: (...args: any[]) => any }
  private defaultOptions: PugOptions
  private defaultLocals: { [key: string]: any }

  constructor (options?: PugOptions) {
    this.defaultOptions = {
      compileDebug: false,
      debug: false
    } as PugOptions
    this.defaultLocals = {}
    this.options = options
  }

  get locals () {
    return this.defaultLocals
  }

  set locals (value: { [key: string]: any }) {
    assert(isPlainObject(value), `"locals" requires a plain object`)
    this.defaultLocals = value
  }

  get options () {
    return this.defaultOptions
  }

  set options (options: PugOptions | undefined) {
    if (!options || !isPlainObject(options)) {
      return
    }

    if (!Object.keys(options).length) {
      this.defaultOptions = {} as PugOptions
      return
    }

    this.viewPath = typeof options.viewPath === 'string' ? options.viewPath : process.cwd()

    if (isPlainObject(options.locals)) {
      this.defaultLocals = options.locals!
    }

    // tslint:disable-next-line
    if (typeof options.helperPath === 'string' || Array.isArray(options.helperPath)) {
      this.helpers = merge({}, this.helpers, loadHelpers(options.helperPath))
    }

    const nonPugKeys = ['viewPath', 'locals', 'helperPath', 'app']
    forIn(options, (value, key) => {
      if (!nonPugKeys.includes(key)) {
        this.defaultOptions[key] = value
      }
    })

    if (options.app && options.app.context) {
      this.use(options.app)
    }
  }

  /**
   * Compile .pug file
   * @param tpl The path of template file
   * @param locals Variables and helpers that passed to Pug compiler
   * @param compileOptions
   */
  private async compileFile (tpl: string, locals: any, compileOptions: PugOptions) {
    let tplPath: string | undefined
    const dests = []

    if (tpl.endsWith('.pug')) {
      dests.push(path.resolve(this.viewPath, tpl))
    } else {
      // Search .pug files
      const base = path.resolve(this.viewPath, tpl)
      dests.push(base + '.pug', path.join(base, 'index.pug'))
    }

    for (const dest of dests) {
      try {
        const stat = await fs.stat(dest)
        if (stat.isFile()) {
          tplPath = dest
          break
        }
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e
        }
      }
    }

    assert(typeof tplPath === 'string', `"tpl" does not exist: ${tpl}`)
    compileOptions.filename = tplPath!

    return pug.compileFile(tplPath!, compileOptions)(locals)
  }

  /**
   * Compile a Pug template string
   * @param tpl Template string or the path of template file
   */
  private async compileString (tpl: string, locals: any, compileOptions: PugOptions) {
    return pug.compile(tpl, compileOptions)(locals)
  }

  /**
   * Render Pug tamplate
   * @param tpl Template string or the path of template file
   * @param locals Variables and helpers that passed to Pug compiler
   * @param options
   */
  async render (tpl: string, locals?: any, options?: RenderOptions) {
    const compileOptions: RenderOptions = merge({}, this.defaultOptions) as RenderOptions

    if (isPlainObject(options)) {
      merge(compileOptions, options)
    }

    if (compileOptions.fromString) {
      return this.compileString(tpl, locals, compileOptions)
    }

    return this.compileFile(tpl, locals, compileOptions)
  }

  /**
   * Bind render function to Koa context
   * @param app Koa instance
   */
  use (app: Koa) {
    const self = this
    app.context.render = async function (tpl: string, locals?: any, options?: any) {
      const ctx = this
      const finalLocals = merge({}, self.helpers, self.defaultLocals, ctx.state, locals)
      console.log('compile', await self.render(tpl, finalLocals, options))
      ctx.body = await self.render(tpl, finalLocals, options)
      ctx.type = 'text/html'
    }
  }
}

export default KoaPug
export { PugOptions, RenderOptions }

module.exports = KoaPug
module.exports.default = KoaPug

declare module 'koa' {
  export interface BaseContext {
    render: (tpl: string, locals?: any, options?: RenderOptions, noCache?: boolean) => void
  }
}

interface PugOptions extends pug.Options {
  [key: string]: any

  /**
   * Koa instance
   */
  app?: Koa

  /**
   * Paths of helpers.
   */
  helperPath?: any[]

  /**
   * Add a list of variables to make accessible in templates
   */
  locals?: { [key: string]: any }

  /**
   * The root directory of all Pug templates
   */
  viewPath?: string
}

interface RenderOptions extends PugOptions {
  /**
   * Render template string instead template file
   */
  fromString?: boolean
}
