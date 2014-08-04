var koa = require('koa')
  , jade = require('..')
  , app = koa()

app.use(jade.middleware({
  viewPath: __dirname + '/views',
  debug: true,
  helperPath: [
    __dirname + '/helpers',
    { 'random': './lib/random.js' },
    { '_': require('lodash') }
  ],
  locals: {
    page_title: 'Koa-jade example',
    author: 'Chris Yip',
    github: '//github.com/chrisyip',
    repo: 'http://github.com/chrisyip/koa-jade'
  }
}))

app.use(function* () {
  yield this.render('index.jade', {
    title: 'Koa-jade: a Jade middleware for Koa'
  })
})

app.listen(3000)
