'use strict';
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers

var request = require('superagent');
var _token;
var interval;

var TelegramLib = function(token, url) {
  if (!(token || _token)) {
    throw new Error('Telegram Token No Establecido');
  }
  if (token) {
    _token = token;
  }
  var self = this;
  this.token = _token;
  this.url = 'https://api.telegram.org/bot' + this.token + '/';
  if (url) {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    this.setWebhook(url);
    setInterval(function() {
      self.setWebhook(url);
    }, 5 * 60 * 1000);
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
      // console.log(response.text);
    };
  }
  request
    .post(this.url + method)
    .type('form')
    .send(query)
    .end(callback);
};

TelegramLib.prototype.sendMessage = function(chatID, text, keyboard, cb) {
  var query = {
    chat_id: chatID,
    text: text
  };
  if (keyboard) {
    if (keyboard.keyboard) {
      keyboard = JSON.stringify(keyboard);
      query.reply_markup = keyboard;
    } else {
      query.reply_markup = JSON.stringify({keyboard: keyboard});
    }
  }
  this.request('sendMessage', query, cb);
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
