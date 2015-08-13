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
      return res.status(400).send('Bad Token');
    }
    res.sendStatus(200);
    next();
  }, function(req, res, next) {
    if (!req.body.message.text) {
      return;
    }
    api.request('sendMessage', {
      'chat_id': req.body.message.chat.id,
      'text': req.body.message.text,
      'reply_markup': {
        'keyboard': [['Holi', 'Holo'], [':)']]
      }
    }, function(err, response) {
      if (err) {
        console.error(err);
      }
    });
  });
};
