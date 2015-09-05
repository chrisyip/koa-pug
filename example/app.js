var koa = require('koa')
var Jade = require('..')
var router = require('koa-route')
var path = require('path')
var app = koa()

var jade = new Jade({
  viewPath: path.resolve(__dirname, 'views'),
  debug: true,
  helperPath: [
    path.resolve(__dirname, 'helpers'),
    { _: require('lodash') }
  ],
  locals: {
    page_title: 'Koa-jade example',
    author: 'Chris Yip'
  }
})

jade.locals.github = '//github.com/chrisyip'

app.use(function* (next) {
  try {
    yield next
  } catch (e) {}
})

app.use(jade.middleware)

app.use(function* (next) {
  this.state.repo = 'http://github.com/chrisyip/koa-jade'
  yield next
})

app.use(router.get('/', function* () {
  this.render('index.jade', {
    title: 'Koa-jade: a Jade middleware for Koa'
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

app.use(router.get('/not-jade', function* () {
  this.render('bar')
}))

app.use(router.get('/lodash', function* () {
  this.render('lodash')
}))

module.exports = app
