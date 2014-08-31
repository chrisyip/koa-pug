# Koa-jade [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

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

`noCache`: if `true`, re-compile templates when page refreshed; if `false`, use cached compiler first. Can be overrided by `render`'s `force`.

`helperPath`: String or Array, where to load helpers, and make them available on all `.jade`. In Array, you can use object to assgin name for module, eg: `{ random: './path/to/random.js' }`

## Methods

`middleware(options)`: configure and create a middleware.

`render(tpl, locals, force)`: render `tpl` with `locals`.

By default, `koa-jade` stores the results of `Jade.compile` as caches. If want to control it manually, use the third argument - `force`:

`true`: force to re-compile template instead of use cached compiler.

`false`: force to use cached compiler first.

`force` can be ommited.

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

[npm-url]: https://npmjs.org/package/koa-jade
[npm-image]: https://badge.fury.io/js/koa-jade.svg
[daviddm-url]: https://david-dm.org/chrisyip/koa-jade
[daviddm-image]: https://david-dm.org/chrisyip/koa-jade.svg
