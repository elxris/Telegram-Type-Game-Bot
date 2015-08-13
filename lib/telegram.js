'use strict';

var request = require('superagent');
var _token;

var TelegramLib = function(token, url) {
  if (!(token || _token)) {
    throw new Error('Telegram Token No Establecido');
  }
  if (token) {
    _token = token;
    this.token = token;
  }
  this.url = 'https://api.telegram.org/bot' + token + '/';
  if (url) {
    this.setWebhook(url);
  }
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
  console.log('setWebhook:', this.url + 'setWebhook', {url: url + this.token});
  request
    .get(this.url + 'setWebhook')
    .query({url: url + this.token})
    .end(function(err, res) {
      if (res && res.ok) {
        console.log('Telegram Webhook establecido correctamente: ', res.text);
      } else if (res) {
        console.error('Telegram Webhook Error: ', res.text);
      } else {
        console.error('Request Error', err);
      }
    });
};

module.exports = TelegramLib;
