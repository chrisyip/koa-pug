# Koa-jade

[![Node version][node-image]][npm-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Travis CI][travis-image]][travis-url]

A [Jade](http://jade-lang.com/) middleware for [Koa](http://koajs.com/).

# How to use

```bash
npm install koa-jade --save
```

```js
var koa = require('koa')
  , jade = require('koa-jade')
  , app = koa()

app.use(jade.middleware({
  viewPath: __dirname + '/views',
  debug: false,
  pretty: false,
  compileDebug: false,
  locals: global_locals_for_all_pages,
  basedir: 'path/for/jade/extends',
  helperPath: [
    'path/to/jade/helpers',
    { random: 'path/to/lib.js' },
    { _: require('lodash') }
  ]
}))

app.use(function* () {
  yield this.render('index', locals_for_this_page, true)
})

app.listen(3000)
```

## Options

`viewPath`: where Jade templates be stored. Default is `process.cwd()`.

`pretty` and `compileDebug`: see Jade's [docs](http://jade-lang.com/api/). Default is `false`.

`debug`: shorthand for `pretty` and `compileDebug`. Default is `false`.

`locals`: variables that will be passed to Jade templates.

`noCache`: use cache or not. Cache could make template rendering 100x faster than without cache. It useful for production, but useless for development (pages would not be updated untill Koa restarted). In most case, `noCache: process.env === 'development'` should be enough. If wanna control it in production for specific page, use `render()`'s `noCache` instead.

`helperPath`: String or Array, where to load helpers, and make them available on all `.jade`. In Array, you can use object to assgin name for module, eg: `{ random: './path/to/random.js' }`.

`basedir`: help Jade to identify paths when using `extends` with `absolute` paths.

## Methods

### middleware(options)

Configure and create a middleware.

### render(tpl, locals, options, noCache)

Render template, and set rendered template to `this.body`.

`tpl`: the path of template that based on `viewPath`, `.jade` is optional.

`locals`: locals for this page. Optional. If `options` or `noCache` presented, please use `{}`, `undefined` or `null` for empty `locals`.

`options`: override global default options for this page. Only assigning an `object` or a `boolean` to it will take effects.

`noCache`: use cache or not. Notes: 1. overrides global `noCache`; 2. won't affect other pages.

If `options` is set to `true` or `false`, it will be treated as `noCache`, and `noCache` will be ignored. For example, `render(tpl, locals, true)` equals to `render(tpl, locals, {}, true)`, and `render(tpl, locals, true, false)` will skip cache and re-compile template.

`options` and `noCache` are optional.

## basedir

If you encounter this error, `Error: the "basedir" option is required to use "extends" with "absolute" paths`, try to set `basedir` like this:

```js
app.use(jade.middleware({
  viewPath: 'path/to/views',
  basedir: 'path/for/jade/extends'
}))
```

or

```js
app.use(function* () {
  yield this.render('index', locals, { basedir: 'path/for/jade/extends' })
})
```

## Content-Type

Koa-jade sets `content-type` to `text/html` automatically. if wanna change it, do like this:

```js
yield this.render('index')
this.type = 'text/plain'
```

## Global Helpers

By setting `helperPath`, koa-jade will load all the modules that under sepecified folxder, and make them available on all templates.

`helperPath` also could be an array including folders, files path, even `moduleName: 'path/to/lib.js` mapping object. Also support node module as a helper, just like: `'_': require('lodash')`

### Defining Helper

```js
// format-date.js
module.exports = function (input) {
    if (input instanceof Date) {
      return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear()
    }

    return input
}
```

It equals to:

```js
// whatever.js
module.exports = {
  moduleName: 'formatDate',
  moduleBody: function (input) {
    if (input instanceof Date) {
      return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear()
    }

    return input
  }
}
```

In Jade:

```jade
p= formatDate(new Date())
```

# Todo

- cache for generated HTML file
- tests

# Contributors

Via [GitHub](https://github.com/chrisyip/koa-jade/graphs/contributors)

[node-image]: http://img.shields.io/node/v/koa-jade.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-jade
[npm-image]: http://img.shields.io/npm/v/koa-jade.svg?style=flat-square
[daviddm-url]: https://david-dm.org/chrisyip/koa-jade
[daviddm-image]: http://img.shields.io/david/chrisyip/koa-jade.svg?style=flat-square
[travis-url]: https://travis-ci.org/chrisyip/koa-jade
[travis-image]: http://img.shields.io/travis/chrisyip/koa-jade.svg?style=flat-square
