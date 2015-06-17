var koa = require('koa')
var jade = require('..')
var router = require('koa-power-router/router')
var path = require('path')
var app = koa()

app.use(jade.middleware({
  viewPath: path.resolve(__dirname, 'views'),
  debug: true,
  helperPath: [
    path.resolve(__dirname, 'helpers'),
    { 'random': path.resolve(__dirname, './lib/random.js') },
    { '_': require('lodash') }
  ],
  locals: {
    page_title: 'Koa-jade example',
    author: 'Chris Yip',
    github: '//github.com/chrisyip'
  }
}))

app.use(function* (next) {
  console.info('-->', this.method, this.url, 'ip', this.ip, 'ips', this.ips)
  var start = Date.now()
  yield next
  console.info('<--', this.method, this.url, this.res.statusCode, (Date.now() - start) + 'ms')
})

app.use(function* (next) {
  this.state.repo = 'http://github.com/chrisyip/koa-jade'
  yield next
})

app.use(router())

router.get('/', function* () {
  this.render('index.jade', {
    title: 'Koa-jade: a Jade middleware for Koa'
  })
})

router.get('/home', function* () {
  this.render('home')
})

router.get('/foo', function* () {
  this.render('foo')
})

router.get('/foo/index', function* () {
  this.render('foo/index')
})

router.get('/bar', function* () {
  this.render('bar')
})

app.listen(3000)
