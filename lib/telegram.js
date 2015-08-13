'use strict';

var request = require('superagent');
var _token;

var TelegramLib = function(token) {
  if (!(token || _token)) {
    return new Error('Telegram Token No Establecido');
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
      if (err) {
        console.error(err);
      } else {
        console.log('Webhook establecido correctamente: ', res);
      }
    });
};

module.exports = TelegramLib;
