import test from 'ava'
import $ from 'cheerio'
import got from 'got'
import Koa from 'koa'
import { AddressInfo } from 'net'
import isplainobject from 'lodash.isplainobject'

import Pug from '../source'
import app from '../example/app'
import { moduleBody as formatDate } from '../example/helpers/format-date'

let serverUrl: string

test.before(async () => {
  serverUrl = await new Promise(resolve => {
    const server = app.listen(() => {
      resolve(`http://localhost:${(server.address() as AddressInfo).port}`)
    })
  })
})

test('new Pug()', async t => {
  const pug = new Pug()
  t.true(typeof pug === 'object')
  t.true(pug != null)
  t.true(isplainobject(pug.options))
  t.true(isplainobject(pug.locals))

  let html = await pug.render('h1 Hello, #{name}', { name: 'Pug' }, { fromString: true })
  t.is(html, '<h1>Hello, Pug</h1>')

  const pug2 = new Pug({ viewPath: __dirname, basedir: __dirname })
  const doc = $(await pug2.render('fixtures/hello', { name: 'Pug' }))
  t.true(doc.hasClass('content'))
  t.is(doc.find('h1').text(), 'Hello, Pug')
})

test('Render .pug file', async t => {
  const res = await got(serverUrl)
  const doc = $(res.body)
  const title = doc.find('h1')
  t.is(title.length, 1)
  t.is(title.text(), 'Koa-pug: a Pug middleware for Koa')
})

test('Auto add `.pug` extname', async t => {
  const res = await got(`${serverUrl}/foo`)
  t.is(res.statusCode, 200)
  t.is(res.body, 'foo.pug')
})

test('Try to render `index.pug` if no .pug file specificed', async t => {
  let res: any

  res = await got(`${serverUrl}/home`)
  t.is(res.statusCode, 200)
  t.is(res.body, 'home/index.pug')

  res = await got(`${serverUrl}/foo`)
  t.is(res.body, 'foo.pug')

  res = await got(`${serverUrl}/foo/index`)
  t.is(res.body, 'foo/index.pug')
})

test('Filters', async t => {
  const res = await got(serverUrl)
  const doc = $(res.body)
  const codes = doc.find('code.language-js')
  t.true(codes.eq(1).text().includes('new KoaPug'))
})

test('Skip non-`.pug` files', async t => {
  const res = await got(`${serverUrl}/not-found`)
  t.true(res.body.includes('"tpl" does not exist'))
})

test('Pug.use(app) attaches "render()" to Koa Context', async t => {
  let app: Koa
  const serverUrl: string = await new Promise(resolve => {
    app = new Koa()
    app.use(async ctx => {
      ctx.state.name = 'Pug'
      await ctx.render('fixtures/hello')
    })
    const server = app.listen(() => {
      resolve(`http://localhost:${(server.address() as AddressInfo).port}`)
    })
  })

  const pug = new Pug({ viewPath: __dirname, basedir: __dirname })
  pug.use(app!)

  const res = await got(serverUrl)
  t.is(res.body, '<div class="content"><h1>Hello, Pug</h1></div>')
})

test('Support helpers', async t => {
  let res = await got(`${serverUrl}/to-camel`, { query: { name: 'koa-pug' } })
  t.is(res.body, 'koaPug')

  res = await got(`${serverUrl}`)
  t.is($(res.body).find('.format-date').text().trim(), formatDate(new Date()))
})
