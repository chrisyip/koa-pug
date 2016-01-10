# Koa-jade

[![Node version][node-image]][npm-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Travis CI][travis-image]][travis-url] [![Codecov][codecov-image]][codecov-url]

A [Jade](http://jade-lang.com/) middleware for [Koa](http://koajs.com/).

# How to use

```bash
npm install koa-jade --save
```

```js
const koa = require('koa')
const app = koa()

const Jade = require('koa-jade')
const jade = new Jade({
  viewPath: './views',
  debug: false,
  pretty: false,
  compileDebug: false,
  locals: global_locals_for_all_pages,
  basedir: 'path/for/jade/extends',
  helperPath: [
    'path/to/jade/helpers',
    { random: 'path/to/lib/random.js' },
    { _: require('lodash') }
  ],
  app: app // equals to jade.use(app) and app.use(jade.middleware)
})

jade.locals.someKey = 'some value'

app.use(function* () {
  this.render('index', locals_for_this_page, true)
})
```

With `vhost`:

```js
const koa = require('koa')
const vhost = require('koa-vhost')
const Jade = require('koa-jade')
const _ = require('lodash')

const server = koa()
const server1 = koa()
const server2 = koa()

const jadeConfig = {
  locals: {
    title: 'Koa Demo'
  }
}

var jade1 = new Jade(_.assign({}, jadeConfig, {
  viewPath: './views1/'
}))

var jade2 = new Jade(_.assign({}, jadeConfig, {
  viewPath: './views2/'
}))

jade1.use(server1)

server1.use(function* (next) {
  this.render('index')
})

jade2.use(server2)

server2.use(function* (next) {
  this.render('index')
})

server.use(vhost('test1.app.dev', server1))
server.use(vhost('test2.app.dev', server2))
```

## Options

`viewPath`: where Jade templates be stored. Default is `process.cwd()`.

`pretty` and `compileDebug`: see Jade's [docs](http://jade-lang.com/api/). Default is `false`.

`debug`: shorthand for `pretty` and `compileDebug`. Default is `false`.

`locals`: variables that will be passed to Jade templates.

`noCache`: use cache or not. Cache could make template rendering 100x faster than without cache. It useful for production, but useless for development (pages would not be updated untill Koa restarted). In most case, `noCache: process.env === 'development'` should be enough. If wanna control it in production for specific page, use `render()`'s `noCache` instead.

`helperPath`: String or Array, where to load helpers, and make them available on all `.jade`. In Array, you can use object to assgin name for module, eg: `{ random: './path/to/random.js' }`.

`basedir`: help Jade to identify paths when using `extends` with `absolute` paths.

## Methods and Properties

### use

```js
const Jade = require('koa-jade')
const jade = new Jade()
// `new Jade({ app })` equals to
jade.use(app)

app.use(function* () {
  this.render('h1 Hello, #{name}', { name: 'Jade' }, { fromString: true })
})
```

Binding `render` function to `app.context`. See [official doc](https://github.com/koajs/koa/blob/master/docs/api/index.md#appcontext).

### middleware (deprecated)

The middleware for configuring Koa's [context](http://koajs.com/#context).

```js
const Jade = require('koa-jade')
const jade = new Jade()
app.use(jade.middleware)
```

### options

Options for rendering views.

```js
// Passing options in construction
const jade = new Jade({
  debug: process.env.NODE_ENV === 'development',
  ...
})

// Change options when needed
if (NO_CACHE) {
  jade.options.noCache = false
}

/**
 * Reset options to default:
 * {
 *   compileDebug: false,
 *   pretty: false
 * }
 */
jade.options = {}
```

### locals

An object of locals that will be passed to all views.

```js
// Setting some locals for different envs
if (process.env.NODE_ENV === 'development') {
  jade.locals.debug = DEBUG_DATA
}

// Mass assignment
_.assign(jade.locals, LOCALS_1, LOCALS_2, ...)

// You can override it by assigning an object ot it
jade.locals = {
  key: value,
  foo: 'bar'
}

// Remove all locals
jade.locals = {}
```

### ctx.render(tpl, locals, options, noCache)

Render template, and set rendered template to `this.body`.

`tpl`: the path of template that based on `viewPath`, `.jade` is optional.

`locals`: locals for this page. Optional. If `options` or `noCache` presented, please use `{}`, `undefined` or `null` for empty `locals`.

`options`: override global default options for this page. Only assigning an `object` or a `boolean` to it will take effects.

`options.fromString`: `fromString` only available in `ctx.render`, by assigning a true value, Jade will **not** treat `tpl` as a path: `ctx.render('h1 Hello, #{name}')`. Templates rendered with `fromString: true` will **not** be stored in cache.

`noCache`: use cache or not. Notes: 1. overrides global `noCache`; 2. won't affect other pages.

If `options` is set to `true` or `false`, it will be treated as `noCache`, and `noCache` will be ignored. For example, `render(tpl, locals, true)` equals to `render(tpl, locals, {}, true)`, and `render(tpl, locals, true, false)` will skip cache and re-compile template.

`options` and `noCache` are optional.

## basedir

If you encounter this error, `Error: the "basedir" option is required to use "extends" with "absolute" paths`, try to set `basedir` like this:

```js
const jade = new Jade({
  viewPath: 'path/to/views',
  basedir: 'path/for/jade/extends'
})
```

or

```js
app.use(function* () {
  this.render('index', locals, { basedir: 'path/for/jade/extends' })
})
```

## Content-Type

Koa-jade sets `content-type` to `text/html` automatically. if you wanna change it, do like this:

```js
this.render('index')
this.type = 'text/plain'
```

## Global Helpers

By setting `helperPath`, koa-jade will load all the modules that under sepecified folxder, and make them available on all templates.

`helperPath` also could be an array including folders, files path, even `moduleName: 'path/to/lib.js` mapping object. Also support node module as a helper, just like: `'_': require('lodash')`

### Defining Helper

```js
// format-date.js
module.exports = function (input) {
  return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear()
}
```

It equals to:

```js
// whatever.js
module.exports = {
  moduleName: 'formatDate',
  moduleBody: function (input) {
    return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear()
  }
}
```

In Jade:

```jade
p= formatDate(new Date())
```

# How `koa-jade` resolves views

For example, there's a folder structure like this:

```
- views
  |--- foo.jade
  |--- foo/
    |--- index.jade
  |--- bar/
    |--- index.jade
  |--- baz
```

For `this.render('foo')`, `koa-jade` will render `foo.jade`, not `foo/index.jade` (file has higher priority than directory). If you wanna render `foo/index.jade`, you have to use explicit path: `this.render('foo/index')`.

For `this.render('bar')`, because `bar.jade` doesn't exist and `bar` is a directory, `koa-jade` will search for `bar/index.jade` and try to render it.

For `this.render('baz')`, because `baz` is a file, and not end with `.jade`, `koa-jade` will throw an `ENOENT` error.

# Migration Notes

## 2.x

- `this.render` becomes a normal function, it does not require `yield` statement anymore. ([Issue #14](https://github.com/chrisyip/koa-jade/issues/14#issuecomment-164997785))

# Contributors

Via [GitHub](https://github.com/chrisyip/koa-jade/graphs/contributors)

[node-image]: http://img.shields.io/node/v/koa-jade.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-jade
[npm-image]: http://img.shields.io/npm/v/koa-jade.svg?style=flat-square
[daviddm-url]: https://david-dm.org/chrisyip/koa-jade
[daviddm-image]: http://img.shields.io/david/chrisyip/koa-jade.svg?style=flat-square
[travis-url]: https://travis-ci.org/chrisyip/koa-jade
[travis-image]: http://img.shields.io/travis/chrisyip/koa-jade.svg?style=flat-square
[codecov-url]: https://codecov.io/github/chrisyip/koa-jade
[codecov-image]: https://img.shields.io/codecov/c/github/chrisyip/koa-jade.svg?style=flat-square
