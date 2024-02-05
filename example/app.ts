import Koa from 'koa'
import Router from 'koa-router'
import path from 'path'
import camelcase from 'camelcase'

import Pug from '../source'

const app = new Koa()
const router = new Router()

const pug = new Pug({
  viewPath: path.resolve(__dirname, 'views'),
  helperPath: [
    path.resolve(__dirname, 'helpers'),
    { camelCase: camelcase }
  ],
  locals: {
    page_title: 'Koa-pug example',
    author: 'Chris Yip'
  },
  app: app
})

pug.locals.github = '//github.com/chrisyip'

app.use(async (ctx, next) => {
  ctx.state.repo = 'http://github.com/chrisyip/koa-pug'
  await next()
})

router
  .get('/', async ctx => {
    await ctx.render('index.pug', {
      title: 'Koa-pug: a Pug middleware for Koa'
    })
  })
  .get('/home', async ctx => {
    await ctx.render('home')
  })
  .get('/foo', async ctx => {
    await ctx.render('foo')
  })
  .get('/foo/index', async ctx => {
    await ctx.render('foo/index')
  })
  .get('/not-found', async ctx => {
    try {
      await ctx.render('not-found')
    } catch (e) {
      ctx.body = e.message
    }
  })
  .get('/to-camel', async ctx => {
    await ctx.render('to-camel', ctx.query)
  })

app.use(router.routes())
  .use(router.allowedMethods())

export default app
