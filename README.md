# Koa-pug

[![Node version][node-image]][npm-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Travis CI][travis-image]][travis-url]

A [Pug](https://github.com/pugjs) middleware for [Koa](http://koajs.com/).

Support Pug@3.

# How to use

```bash
npm install koa-pug --save
```

```js
const Koa = require('koa')
const path = require('path')
const Pug = require('koa-pug')

const app = new Koa()
const pug = new Pug({
  viewPath: path.resolve(__dirname, './views'),
  locals: { /* variables and helpers */ },
  basedir: 'path/for/pug/extends',
  helperPath: [
    'path/to/pug/helpers',
    { random: 'path/to/lib/random.js' },
    { _: require('lodash') }
  ],
  app: app // Binding `ctx.render()`, equals to pug.use(app)
})

pug.locals.someKey = 'some value'

app.use(async ctx => {
  await ctx.render('index', locals, true)
})
```

For `koa@1`:

```js
const koa = require('koa')
const Pug = require('koa-pug')

const app = koa()
const pug = new Pug({ app: app })

app.use(function * () {
  yield this.render('index', locals, true)
})
```

Use `koa-pug` as a standalone Pug renderer:

```js
const pug = new Pug({
  viewPath: path.resolve(__dirname, './views'),
  locals: { /* variables and helpers */ },
  basedir: 'path/for/pug/extends',
  helperPath: [
    'path/to/pug/helpers',
    { random: 'path/to/lib/random.js' },
    { _: require('lodash') }
  ],
  // Can work with / without Koa
  // app: app
})

async function sendEmail(recipients, tplFile, locals) {
  const body = await pug.render(tplFile, locals)
  await send(recipients, body)
}
```

## Options

`options` are extended from [Pug's options](https://pugjs.org/api/reference.html#options), all options will be passed to Pug compiler except the following:

`viewPath: string`: the location of Pug templates. Default is `process.cwd()`.

`locals: { [key: string]: any }`: variables and helpers that will be passed to Pug compiler.

`helperPath: string | string[] | { [key string]: string }`: location(s) of helper(s).

## Content-Type

`koa-pug` will set `content-type` to `text/html` for you, you can change it:

```js
await ctx.render('index')
ctx.type = 'text/plain'
```

## Global Helpers

By setting `helperPath`, koa-pug will load all the modules that under sepecified folxder, and make them available on all templates.

`helperPath` also could be an array including folders, files path, even `moduleName: 'path/to/lib.js` mapping object. Also support node module as a helper, just like: `'_': require('lodash')`

### Defining a Helper

```js
// format-date.js, `koa-pug` will convert filename to camel case and use it as module name
module.exports = function (input) {
  return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear()
}
```

Equals to:

```js
// Becasue of there is a `moduleName`, `koa-pug` will use it as module name instead of filename
module.exports = {
  moduleName: 'formatDate',
  moduleBody (input) {
    return (input.getMonth() + 1) + '/' + input.getDate() + '/' + input.getFullYear()
  }
}
```

Use help in Pug:

```pug
p= formatDate(new Date())
```

# How `koa-pug` resolves Pug template files

Let's say the project views structure like:

```
views
├── user.pug
├── user
│   └── index.pug
└── file
    └── index.pug
```

`koa-pug` will search file in the following order:

- `<tpl_name>.pug`
- `<tpl_name>/index.pug`

When `pug.render('user')` is called, `views/user.pug` will be rendered. If you want to render `views/user/index.pug`, you have to pass it to renderer explicitly: `pug.render('user/index)`.

When `pug.render('file')` is called, `views/file/index.pug` will be rendered.

# Contributors

Via [GitHub](https://github.com/chrisyip/koa-pug/graphs/contributors)

[node-image]: https://img.shields.io/node/v/koa-pug.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-pug
[npm-image]: https://img.shields.io/npm/v/koa-pug.svg?style=flat-square
[daviddm-url]: https://david-dm.org/chrisyip/koa-pug
[daviddm-image]: https://img.shields.io/david/chrisyip/koa-pug.svg?style=flat-square
[travis-url]: https://travis-ci.org/chrisyip/koa-pug
[travis-image]: https://img.shields.io/travis/chrisyip/koa-pug.svg?style=flat-square
