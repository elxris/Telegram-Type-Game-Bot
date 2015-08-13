'use strict';

var request = require('superagent');
var _token;

var TelegramLib = function(token) {
  if (!(token || _token)) {
    throw new Error('Telegram Token No Establecido');
  }
  if (token) {
    _token = token;
    this.setWebhook();
  }
  this.url = 'https://api.telegram.org/bot' + token + '/';
  return this;
};

TelegramLib.prototype.constructor = TelegramLib;

TelegramLib.prototype.request = function(method, query, callback) {
  request
    .get(this.url + method)
    .query(query)
    .end(callback);
};

TelegramLib.prototype.setWebhook = function(url) {
  request
    .get(this.url)
    .query({url: url + this.token})
    .end(function(err, res) {
      if (res.ok) {
        console.log('Telegram Webhook establecido correctamente: ', res.text);
      } else {
        console.error('Telegram Webhook Error: ', err);
      }
    });
};

module.exports = TelegramLib;
