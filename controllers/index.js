'use strict';
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers

var IndexModel = require('../models/index');
var Telegram = require('../lib/telegram');
var numeral = require('numeral');
var api = new Telegram(); // Preconfigured lib
var User = require('../models/User');

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
      api.request('sendMessage', {
        chat_id: req.body.message.chat.id,
        text: 'En este momento no puedo manejar este tipo de mensajes.'
      });
      return;
    }
    if (req.body.message.chat.title) {
      api.request('sendMessage', {
        chat_id: req.body.message.chat.id,
        text: 'En este momento no soporto chat grupales.'
      });
    }
    next();
  }, User.findTelegramUser, function(req, res, next) {
    // Remove commands

    if (req.body.message.text[0] === '/') {
      req.body.message.text = req.body.message.text.substr(1);
    }

    var sendStatusMessage = function() {
      api.request('sendMessage', {
        chat_id: req.body.message.chat.id,
        text:
          'Haz hecho ' +
          numeral(req.user.clicks).format('0 a') +
          ' clicks!',
        reply_markup: JSON.stringify({
          keyboard: [['click']]
        })
      });
    };

    var command = req.body.message.text.split(' ');
    if (command[0].toLowerCase() === 'click') {
      var oldClicks = req.user.clicks;

      User.incrementClicks(req.user, function(user) {
        req.user = user;
        console.log(user);
        if (req.user.clicks < 10) {
          sendStatusMessage();
        } else if (req.users.clicks === 10) {
          api.request('sendMessage', {
            chat_id: req.body.message.chat.id,
            text: 'Ahora recibirás tu /status de vez en cuando.',
            reply_markup: JSON.stringify({
              keyboard: [['click']]
            })
          });
        } else if (
          Math.ceil(oldClicks / Math.E) < Math.ceil(req.user.clicks / Math.E)
        ) {
          sendStatusMessage();
        }
      });
    } else if (command[0].toLowerCase() === 'start') {
      api.request('sendMessage', {
        chat_id: req.body.message.chat.id,
        text: 'Bienvenido, escribe \'click\' para dar un click.',
        reply_markup: JSON.stringify({
          keyboard: [['click']]
        })
      });
    } else if (command[0].toLowerCase() === 'status') {
      sendStatusMessage();
    } else {
      api.request('sendMessage', {
        chat_id: req.body.message.chat.id,
        text: 'No reconozco ese comando, inténta de nuevo.'
      });
    }
  });
};
