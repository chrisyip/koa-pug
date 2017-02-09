/* eslint-env mocha */

var Koa = require('koa')
var app = require('../example/app')
var request = require('supertest-koa-agent')
var $ = require('cheerio')
var Promise = require('bluebird')
var Pug = require('..')
require('chai').Should()
var expect = require('chai').expect

describe('koa-pug', function () {
  it('should render Pug file', function (done) {
    request(app).get('/')
      .expect(function (res) {
        var doc = $(res.text)
        var title = doc.find('h1')
        title.length.should.eql(1)
        title.text().should.eql('Koa-pug: a Pug middleware for Koa')
      })
      .expect(200, done)
  })

  it('should support filters', function (done) {
    request(app).get('/')
      .expect(function (res) {
        var doc = $(res.text)
        var codes = doc.find('code.language-js')
        codes.length.should.eql(2)
        codes.eq(1).text().should.includes('pug.middleware')
      })
      .expect(200, done)
  })

  it('should not render file without `.pug` ext name', function (done) {
    request(app).get('/not-pug').expect(404, done)
  })

  it('should auto add `.pug` ext name', function (done) {
    request(app).get('/foo')
      .expect(function (res) {
        res.text.should.eql('foo.pug')
      })
      .expect(200, done)
  })

  it('should auto search `index.pug` when passing a directory', function (done) {
    request(app).get('/home')
      .expect(function (res) {
        res.text.should.eql('home/index.pug')
      })
      .expect(200, done)
  })

  it('should try to load file first before searching `index.pug`', function (done) {
    Promise.all([
      new Promise(function (resolve) {
        request(app).get('/foo')
          .expect(function (res) {
            res.text.should.eql('foo.pug')
          })
          .expect(200, resolve)
      }),

      new Promise(function (resolve) {
        request(app).get('/foo/index')
          .expect(function (res) {
            res.text.should.eql('foo/index.pug')
          })
          .expect(200, resolve)
      })
    ]).then(function () {
      done()
    })
  })

  describe('Pug instance', function () {
    it('should be an object', function () {
      var pug = new Pug()
      pug.should.be.an('object')
    })

    describe('standalone render function', function () {
      it('should render Pug template string', function () {
        var pug = new Pug()
        pug.render(
          'h1 Hello, #{name}', { name: 'Pug' }, { fromString: true }
        ).should.eql('<h1>Hello, Pug</h1>')
      })

      it('should render Pug file', function () {
        var pug = new Pug({ viewPath: __dirname, basedir: __dirname })
        var doc = $(pug.render('textuals/hello', { name: 'Pug' }))
        doc.hasClass('content').should.be.true
        doc.find('h1').text().should.eql('Hello, Pug')
      })
    })

    describe('render w/ Koa context', function () {
      it('should render Pug template string', function (done) {
        var app = Koa()
        new Pug({ app: app })

        app.use(function* (next) {
          this.state.name = 'Pug'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Pug')
        })
        .expect(200, done)
      })

      it('should render Pug file', function (done) {
        var app = Koa()
        new Pug({ app: app, viewPath: __dirname, basedir: __dirname })

        app.use(function* (next) {
          this.state.name = 'Pug'
          this.render('textuals/hello')
          yield next
        })

        request(app).get('/').expect(function (res) {
          var doc = $(res.text)
          doc.hasClass('content').should.be.true
          doc.find('h1').text().should.eql('Hello, Pug')
        })
        .expect(200, done)
      })
    })

    describe('options', function () {
      it('should always be an object and only accept object value', function () {
        var pug = new Pug()
        pug.options.should.be.an.Object
        pug.options = true
        pug.options.should.be.an.Object
      })

      it('should have `pretty: false` and `compileDebug: false` by default', function () {
        var pug = new Pug()
        pug.options.pretty.should.eql(false)
        pug.options.compileDebug.should.eql(false)
      })
    })

    describe('locals', function () {
      it('should always be an object and only accpet object value', function () {
        var pug = new Pug()
        pug.locals.should.be.an.Object
        pug.locals = true
        pug.locals.should.be.an.Object
      })

      it('should override original value', function () {
        var pug = new Pug({ locals: { foo: 'bar' } })
        pug.locals = { baz: 'baz' }

        expect(pug.locals.foo).to.not.exist
        expect(pug.locals.baz).to.eql('baz')

        pug.locals = null
        expect(Object.keys(pug.locals).length).to.eql(0)
        expect(pug.locals.baz).to.not.exist
      })

      it('should be manipulatable', function (done) {
        request(app).get('/')
          .expect(function (res) {
            var doc = $(res.text)
            doc.find('.repo-url').attr('href').should.eql('//github.com/chrisyip')
          })
          .expect(200, done)
      })
    })

    describe('middleware', function () {
      it('should always be a generator function and immutable', function () {
        var pug = new Pug()
        pug.middleware.should.be.a.Function
        pug.middleware = true
        pug.middleware.should.be.a.Function
        pug.middleware.constructor.name.should.eql('GeneratorFunction')
      })

      it('should be manipulatable', function (done) {
        request(app).get('/')
          .expect(function (res) {
            var doc = $(res.text)
            doc.find('.repo-url').attr('href').should.eql('//github.com/chrisyip')
          })
          .expect(200, done)
      })

      it('should attach a redner function to Koa context', function (done) {
        var app = Koa()
        var pug = new Pug()
        app.use(pug.middleware)

        app.use(function* (next) {
          this.state.name = 'Pug'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Pug')
        })
        .expect(200, done)
      })
    })

    describe('use', function () {
      it('should always be a function and immutable', function () {
        var pug = new Pug()
        pug.use.should.be.a.Function
        pug.use = true
        pug.use.should.be.a.Function
        pug.use.constructor.name.should.eql('Function')
      })

      it('should attach a render function to Koa context', function (done) {
        var app = Koa()
        var pug = new Pug()
        pug.use(app)

        app.use(function* (next) {
          this.state.name = 'Pug'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Pug')
        })
        .expect(200, done)
      })

      it('can be configured through constructor', function (done) {
        var app = Koa()
        new Pug({
          app: app
        })

        app.use(function* (next) {
          this.state.name = 'Pug'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Pug')
        })
        .expect(200, done)
      })
    })

    describe('Helpers', function () {
      it('should support helper', function (done) {
        request(app).get('/lodash')
          .expect(function (res) {
            res.text.should.eql('fooBar')
          })
          .expect(200, done)
      })

      it('should support load helpers from a directory', function (done) {
        var formatDate = require('../example/helpers/format-date')

        request(app).get('/')
          .expect(function (res) {
            var doc = $(res.text)
            var date = doc.find('.format-date')
            date.text().trim().should.eql(formatDate.moduleBody(new Date()))
          })
          .expect(200, done)
      })
    })
  })
})
