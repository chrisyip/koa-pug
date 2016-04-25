var koa = require('koa')
var Pug = require('..')
var router = require('koa-route')
var path = require('path')
var app = koa()

var pug = new Pug({
  viewPath: path.resolve(__dirname, 'views'),
  debug: true,
  helperPath: [
    path.resolve(__dirname, 'helpers'),
    { _: require('lodash') }
  ],
  locals: {
    page_title: 'Koa-pug example',
    author: 'Chris Yip'
  },
  app: app
})

pug.locals.github = '//github.com/chrisyip'

app.use(function* (next) {
  this.state.repo = 'http://github.com/chrisyip/koa-pug'
  yield next
})

app.use(router.get('/', function* () {
  this.render('index.pug', {
    title: 'Koa-pug: a Pug middleware for Koa'
  })
}))

app.use(router.get('/home', function* () {
  this.render('home')
}))

app.use(router.get('/foo', function* () {
  this.render('foo')
}))

app.use(router.get('/foo/index', function* () {
  this.render('foo/index')
}))

app.use(router.get('/not-pug', function* () {
  this.render('bar')
}))

app.use(router.get('/lodash', function* () {
  this.render('lodash')
}))

module.exports = app
