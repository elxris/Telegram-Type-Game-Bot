'use strict';
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers

var IndexModel = require('../models/index');
var Telegram = require('../lib/telegram');
var api = new Telegram(); // Preconfigured lib

module.exports = function(router) {
  var model = new IndexModel();

  router.get('/', function(req, res) {
    res.send('ok');
  });

  router.post('/:token', function(req, res, next) {
    if (req.params.token !== req.app.kraken.get('TELEGRAM_TOKEN')) {
      res.status(400).send('Bad Token');
    }
    api.request('sendMessage', {
      'chat_id': req.body.message.chat.id,
      'text': 'Holo :)',
      'reply_to_message_id': req.body.message.message_id
    });
  });
};
