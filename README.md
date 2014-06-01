# Koa-jade

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
  locals: global_locals_for_all_pages
}))

app.use(function* () {
  yield this.render('index', locals_for_this_page)
})

app.listen(3000)
```

## Options

`viewPath`: where Jade templates be stored. Default is `process.cwd()`.

`pretty` and `compileDebug`: see Jade's [docs](http://jade-lang.com/api/). Default is `false`.

`debug`: shorthand for `pretty` and `compileDebug`. Default is `false`.

`locals`: variables that will be passed to Jade templates.

## Methods

`middleware(options)`: configure and create a middleware.

`render(tpl, locals, force)`: render `tpl` with `locals`. By default, `koa-jade` stores the results of `Jade.compile` as caches. `force` option forces to re-compile template instead of using cached one.

# Todo

- cache for generated HTML file
- tests

# Contributors

- [Chris Yip](http://github.com/chrisyip/qwery/commits/master?author=chrisyip)
