/* eslint-env mocha */

var Koa = require('koa')
var app = require('../example/app')
var request = require('supertest-koa-agent')
var $ = require('cheerio')
var Promise = require('bluebird')
var Jade = require('..')
require('chai').Should()
var expect = require('chai').expect

describe('koa-jade', function () {
  it('should render Jade file', function (done) {
    request(app).get('/')
      .expect(function (res) {
        var doc = $(res.text)
        var title = doc.find('h1')
        title.length.should.eql(1)
        title.text().should.eql('Koa-jade: a Jade middleware for Koa')
      })
      .expect(200, done)
  })

  it('should support filters', function (done) {
    request(app).get('/')
      .expect(function (res) {
        var doc = $(res.text)
        var codes = doc.find('code.language-js')
        codes.length.should.eql(2)
        codes.eq(1).text().should.includes('jade.middleware')
      })
      .expect(200, done)
  })

  it('should not render file without `.jade` ext name', function (done) {
    request(app).get('/not-jade').expect(404, done)
  })

  it('should auto add `.jade` ext name', function (done) {
    request(app).get('/foo')
      .expect(function (res) {
        res.text.should.eql('foo.jade')
      })
      .expect(200, done)
  })

  it('should auto search `index.jade` when passing a directory', function (done) {
    request(app).get('/home')
      .expect(function (res) {
        res.text.should.eql('home/index.jade')
      })
      .expect(200, done)
  })

  it('should try to load file first before searching `index.jade`', function (done) {
    Promise.all([
      new Promise(function (resolve) {
        request(app).get('/foo')
          .expect(function (res) {
            res.text.should.eql('foo.jade')
          })
          .expect(200, resolve)
      }),

      new Promise(function (resolve) {
        request(app).get('/foo/index')
          .expect(function (res) {
            res.text.should.eql('foo/index.jade')
          })
          .expect(200, resolve)
      })
    ]).then(function () {
      done()
    })
  })

  describe('Jade instance', function () {
    it('should be an object', function () {
      var jade = new Jade()
      jade.should.be.an('object')
    })

    describe('render', function () {
      it('should render Jade template string', function (done) {
        var app = Koa()
        new Jade({ app: app })

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Jade')
        })
        .expect(200, done)
      })

      it('should render Jade file', function (done) {
        var app = Koa()
        new Jade({ app: app, viewPath: __dirname, basedir: __dirname })

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.render('textuals/hello')
          yield next
        })

        request(app).get('/').expect(function (res) {
          var doc = $(res.text)
          doc.hasClass('content').should.be.true
          doc.find('h1').text().should.eql('Hello, Jade')
        })
        .expect(200, done)
      })
    })

    describe('renderString', function () {
      it('should render Jade template string', function (done) {
        var app = Koa()
        new Jade({ app: app })

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.body = this.renderString('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Jade')
        })
        .expect(200, done)
      })

      it('should render Jade file', function (done) {
        var app = Koa()
        new Jade({ app: app, viewPath: __dirname, basedir: __dirname })

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.body = this.renderString('textuals/hello')
          yield next
        })

        request(app).get('/').expect(function (res) {
          var doc = $(res.text)
          doc.hasClass('content').should.be.true
          doc.find('h1').text().should.eql('Hello, Jade')
        })
        .expect(200, done)
      })
    })

    describe('options', function () {
      it('should always be an object and only accept object value', function () {
        var jade = new Jade()
        jade.options.should.be.an.Object
        jade.options = true
        jade.options.should.be.an.Object
      })

      it('should have `pretty: false` and `compileDebug: false` by default', function () {
        var jade = new Jade()
        jade.options.pretty.should.eql(false)
        jade.options.compileDebug.should.eql(false)
      })
    })

    describe('locals', function () {
      it('should always be an object and only accpet object value', function () {
        var jade = new Jade()
        jade.locals.should.be.an.Object
        jade.locals = true
        jade.locals.should.be.an.Object
      })

      it('should override original value', function () {
        var jade = new Jade({ locals: { foo: 'bar' } })
        jade.locals = { baz: 'baz' }

        expect(jade.locals.foo).to.not.exist
        expect(jade.locals.baz).to.eql('baz')

        jade.locals = null
        expect(Object.keys(jade.locals).length).to.eql(0)
        expect(jade.locals.baz).to.not.exist
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
        var jade = new Jade()
        jade.middleware.should.be.a.Function
        jade.middleware = true
        jade.middleware.should.be.a.Function
        jade.middleware.constructor.name.should.eql('GeneratorFunction')
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
        var jade = new Jade()
        app.use(jade.middleware)

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Jade')
        })
        .expect(200, done)
      })
    })

    describe('use', function () {
      it('should always be a function and immutable', function () {
        var jade = new Jade()
        jade.use.should.be.a.Function
        jade.use = true
        jade.use.should.be.a.Function
        jade.use.constructor.name.should.eql('Function')
      })

      it('should attach a render function to Koa context', function (done) {
        var app = Koa()
        var jade = new Jade()
        jade.use(app)

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Jade')
        })
        .expect(200, done)
      })

      it('can be configured through constructor', function (done) {
        var app = Koa()
        new Jade({
          app: app
        })

        app.use(function* (next) {
          this.state.name = 'Jade'
          this.render('h1 Hello, #{name}', {}, { fromString: true })
          yield next
        })

        request(app).get('/').expect(function (res) {
          $(res.text).text().should.eql('Hello, Jade')
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
