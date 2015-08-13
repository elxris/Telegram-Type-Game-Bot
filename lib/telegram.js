'use strict';

var request = require('superagent');
var _token;

var TelegramLib = function(token, url) {
  if (!(token || _token)) {
    throw new Error('Telegram Token No Establecido');
  }
  if (token) {
    _token = token;
  }
  this.token = _token;
  this.url = 'https://api.telegram.org/bot' + this.token + '/';
  if (url) {
    this.setWebhook(url);
  }
  return this;
};

TelegramLib.prototype.constructor = TelegramLib;

TelegramLib.prototype.request = function(method, query, callback) {
  if (!callback) {
    callback = function(err, response) {
      if (err) {
        return console.error(err);
      }
      console.log(response.text);
    };
  }
  request
    .post(this.url + method)
    .type('form')
    .send(query)
    .end(callback);
};

TelegramLib.prototype.setWebhook = function(url) {
  console.log('setWebhook:', this.url + 'setWebhook', {url: url + this.token});
  request
    .post(this.url + 'setWebhook')
    .type('form')
    .send({url: url + this.token})
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
