# 4.0.0

## Breaking changes

- Requires node >= 8
- Switch to Koa@2 (you can use [koa-convert](https://github.com/koajs/convert) to work with Koa@1)
- If template does not exist, `ctx.render()` will throw an error
- `pug.middleware` removed
- `ctx.render()` no longer returns `ctx`
- `pug.render()` and `ctx.render()` now returns a promise
- Constructor options changed:
  - Extended from [`Pug.Options`](https://pugjs.org/api/reference.html#options), and will be passed to Pug compiler directly
  - `noCache` removed, please use Pug's built-in `cache` option
  - `pretty` deprecated
  - `debug` and `compileDebug` now work as same as Pug, setting `debug` will not apply to `pretty` and `compileDebug` any more

## Notable changes

- Rewrite in TypeScript
- Update [Pug](https://pugjs.org/) to @2
