/*global describe:false, it:false, beforeEach:false, afterEach:false*/

'use strict';

var kraken = require('kraken-js');
var express = require('express');
var path = require('path');
var request = require('supertest');

describe('index', function() {

  var app; var mock;

  beforeEach(function(done) {
    app = express();
    app.on('start', done);
    app.use(kraken({
      basedir: path.resolve(__dirname, '..')
    }));

    mock = app.listen(1337);
  });

  afterEach(function(done) {
    mock.close(done);
  });

  it('should say "hello"', function(done) {
    request(mock)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(/"name": "index"/)
      .end(function(err, res) {
        done(err);
      });
  });
});
