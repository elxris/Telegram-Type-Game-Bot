'use strict';

var express = require('express');
var kraken = require('kraken-js');
var Telegram = require('./lib/telegram');
var mongoose = require('mongoose');

var options;
var app;

/*
 * Create and configure application. Also exports application instance for use by tests.
 * See https://github.com/krakenjs/kraken-js#options for additional configuration options.
 */
options = {
  onconfig: function(config, next) {
    /*
     * Add any additional config setup or overrides here. `config` is an initialized
     * `confit` (https://github.com/krakenjs/confit/) configuration object.
     */
    var telegram = new Telegram(config.get('TELEGRAM_TOKEN'),
      config.get('PUBLIC_URL'));

    mongoose.connect(config.get('MONGO_URL'));
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'mongo connection error:'));
    db.once('open', function(callback) {
      console.log('mongo connection successful');
    });
    next(null, config);
  }
};

app = module.exports = express();
app.use(kraken(options));
app.on('start', function() {
  console.log('Application ready to serve requests.');
  console.log('Environment: %s', app.kraken.get('env:env'));
});
