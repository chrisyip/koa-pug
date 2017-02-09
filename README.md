# Koa-pug

[![Node version][node-image]][npm-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Travis CI][travis-image]][travis-url] [![Codecov][codecov-image]][codecov-url]

A [Pug](https://github.com/pugjs) middleware for [Koa](http://koajs.com/).

# How to use

```bash
npm install koa-pug --save
```

```js
const koa = require('koa')
const app = koa()

const Pug = require('koa-pug')
const pug = new Pug({
  viewPath: './views',
  debug: false,
  pretty: false,
  compileDebug: false,
  locals: global_locals_for_all_pages,
  basedir: 'path/for/pug/extends',
  helperPath: [
    'path/to/pug/helpers',
    { random: 'path/to/lib/random.js' },
    { _: require('lodash') }
  ],
  app: app // equals to pug.use(app) and app.use(pug.middleware)
})

pug.locals.someKey = 'some value'

app.use(function* () {
  this.render('index', locals_for_this_page, true)
})
```

With `vhost`:

```js
const koa = require('koa')
const vhost = require('koa-vhost')
const Pug = require('koa-pug')
const _ = require('lodash')

const server = koa()
const server1 = koa()
const server2 = koa()

const config = {
  locals: {
    title: 'Koa Demo'
  }
}

var pug1 = new Pug(_.assign({}, config, {
  viewPath: './views1/'
}))

var pug2 = new Pug(_.assign({}, config, {
  viewPath: './views2/'
}))

pug1.use(server1)

server1.use(function* (next) {
  this.render('index')
})

pug2.use(server2)

server2.use(function* (next) {
  this.render('index')
})

server.use(vhost('test1.app.dev', server1))
server.use(vhost('test2.app.dev', server2))
```

### `koa@2`

- Use `pug.use(app)` or `new Pug({ app })`, DON'T use `app.use(pug.middleware)`
- Use `ctx.render()` instead of `this.render()`

```js
new Pug({ app: app })
// or
pug.use(app)

```

## Options

`viewPath`: where Pug templates be stored. Default is `process.cwd()`.

`pretty` and `compileDebug`: see Pug's [docs](http://pug-lang.com/api/). Default is `false`.

`debug`: shorthand for `pretty` and `compileDebug`. Default is `false`.

`locals`: variables that will be passed to Pug templates.

`noCache`: use cache or not. Cache could make template rendering 100x faster than without cache. It useful for production, but useless for development (pages would not be updated untill Koa restarted). In most case, `noCache: process.env === 'development'` should be enough. If wanna control it in production for specific page, use `render()`'s `noCache` instead.

`helperPath`: String or Array, where to load helpers, and make them available on all `.pug`. In Array, you can use object to assgin name for module, eg: `{ random: './path/to/random.js' }`.

`basedir`: help Pug to identify paths when using `extends` with `absolute` paths.

## Methods and Properties

### use

Binding `render` function to `app.context`. See [Koa's doc](https://github.com/koajs/koa/blob/master/docs/api/index.md#appcontext).

```js
const Pug = require('koa-pug')
const pug = new Pug()
// `new Pug({ app })` equals to
pug.use(app)

app.use(function* () {
  this.render('h1 Hello, #{name}', { name: 'Pug' }, { fromString: true })
})
```

### render

Render string or template file and return string directly.

```js
const pug = new Pug()
pug.render('h1 Hello, #{name}', { name: 'Pug' }, { fromString: true })
// outpus:
// <h1>Hello Pug</h1>

// rendering file
const pug = new Pug({ viewPath: 'path/to/view' })
// render path/to/view/hello.pug
pug.render('hello', { name: 'Pug' })
```

### middleware (deprecated)

The middleware for configuring Koa's [context](http://koajs.com/#context).

```js
const Pug = require('koa-pug')
const pug = new Pug()
app.use(pug.middleware)
```

### options

Options for rendering views.

```js
// Passing options in construction
const pug = new Pug({
  debug: process.env.NODE_ENV === 'development',
  ...
})

// Change options when needed
if (NO_CACHE) {
  pug.options.noCache = false
}

/**
 * Reset options to default:
 * {
 *   compileDebug: false,
 *   pretty: false
 * }
 */
pug.options = {}
```

### locals

An object of locals that will be passed to all views.

```js
// Setting some locals for different envs
if (process.env.NODE_ENV === 'development') {
  pug.locals.debug = DEBUG_DATA
}

// Mass assignment
_.assign(pug.locals, LOCALS_1, LOCALS_2, ...)

// You can override it by assigning an object ot it
pug.locals = {
  key: value,
  foo: 'bar'
}

// Remove all locals
pug.locals = {}
```

### ctx.render(tpl, locals, options, noCache)

Render template, and set rendered template to `this.body`.

`tpl`: the path of template that based on `viewPath`, `.pug` is optional.

`locals`: locals for this page. Optional. If `options` or `noCache` presented, please use `{}`, `undefined` or `null` for empty `locals`. `locals` will merge up with `ctx.state`(koa@2) or `this.state`(koa@1). Middlewares can assign locals to `ctx.state`.

`options`: override global default options for this page. Only assigning an `object` or a `boolean` to it will take effects.

`options.fromString`: `fromString` only available in `ctx.render`, by assigning a true value, Pug will **not** treat `tpl` as a path: `ctx.render('h1 Hello, #{name}')`. Templates rendered with `fromString: true` will **not** be stored in cache.

`noCache`: use cache or not. Notes: 1. overrides global `noCache`; 2. won't affect other pages.

If `options` is set to `true` or `false`, it will be treated as `noCache`, and `noCache` will be ignored. For example, `render(tpl, locals, true)` equals to `render(tpl, locals, {}, true)`, and `render(tpl, locals, true, false)` will skip cache and re-compile template.

`options` and `noCache` are optional.

## basedir

If you encounter this error, `Error: the "basedir" option is required to use "extends" with "absolute" paths`, try to set `basedir` like this:

```js
const pug = new Pug({
  viewPath: 'path/to/views',
  basedir: 'path/for/pug/extends'
})
```

or

```js
app.use(function* () {
  this.render('index', locals, { basedir: 'path/for/pug/extends' })
})
```

## Content-Type

koa-pug sets `content-type` to `text/html` automatically. if you wanna change it, do like this:

```js
this.render('index')
this.type = 'text/plain'
```

## Global Helpers

By setting `helperPath`, koa-pug will load all the modules that under sepecified folxder, and make them available on all templates.

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

In Pug:

```pug
p= formatDate(new Date())
```

# How `koa-pug` resolves views

For example, there's a folder structure like this:

```
- views
  |--- foo.pug
  |--- foo/
    |--- index.pug
  |--- bar/
    |--- index.pug
  |--- baz
```

For `this.render('foo')`, `koa-pug` will render `foo.pug`, not `foo/index.pug` (file has higher priority than directory). If you wanna render `foo/index.pug`, you have to use explicit path: `this.render('foo/index')`.

For `this.render('bar')`, because `bar.pug` doesn't exist and `bar` is a directory, `koa-pug` will search for `bar/index.pug` and try to render it.

For `this.render('baz')`, because `baz` is a file, and not end with `.pug`, `koa-pug` will throw an `ENOENT` error.

# Migration Notes

## 2.x

- `this.render` becomes a normal function, it does not require `yield` statement anymore. ([Issue #14](https://github.com/chrisyip/koa-pug/issues/14#issuecomment-164997785))

# Contributors

Via [GitHub](https://github.com/chrisyip/koa-pug/graphs/contributors)

[node-image]: http://img.shields.io/node/v/koa-pug.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-pug
[npm-image]: http://img.shields.io/npm/v/koa-pug.svg?style=flat-square
[daviddm-url]: https://david-dm.org/chrisyip/koa-pug
[daviddm-image]: http://img.shields.io/david/chrisyip/koa-pug.svg?style=flat-square
[travis-url]: https://travis-ci.org/chrisyip/koa-pug
[travis-image]: http://img.shields.io/travis/chrisyip/koa-pug.svg?style=flat-square
[codecov-url]: https://codecov.io/github/chrisyip/koa-pug
[codecov-image]: https://img.shields.io/codecov/c/github/chrisyip/koa-pug.svg?style=flat-square
