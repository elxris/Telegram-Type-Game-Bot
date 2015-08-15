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

    req.sendMessage = function(message) {
      if (!this.body) {
        return console.error('sendMessage Error: No hay usuario');
      }
      if (!message) {
        return console.error('sendMessage Error: No hay mensaje que enviar');
      }
      api.sendMessage(
        this.body.message.chat.id,
        message,
        [['click']]
      );
    };

    req.sendStatusMessage = function() {
      this.sendMessage(
        'Haz hecho ' + numeral(this.user.clicks).format('0,0') + ' clicks!'
      );
    };

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
  }, function(req, res, next) {

    // Remove commands
    if (req.body.message.text[0] === '/') {
      req.body.message.text = req.body.message.text.substr(1);
    }
    // Remueve todos los espacios dobles
    req.body.message.text = req.body.message.text.replace(/( ){2}/g, ' ');

    req.commands = req.body.message.text.split(' ');
    req.command = (req.commands[0] || '').toLowerCase();
    req.isCommand = function(match) {
      return (new RegExp('^' + match + '$', 'i')).test(req.command);
    };

    if (req.isCommand('click')) {
      User.incrementClicks(req.body.message.chat.id, function(user) {
        req.user = user;
        if (req.user.clicks < 10) {
          req.sendStatusMessage();
        } else if (req.user.clicks === 10) {
          req.sendMessage(
            'Ahora recibirás tu /status de vez en cuando.'
          );
        } else if (
          Math.ceil(Math.sqrt(user.clicks - 1)) <
            Math.ceil(Math.sqrt(user.clicks))
        ) {
          req.sendStatusMessage();
        }
      });
    } else if (req.isCommand('start')) {
      req.sendMessage(
        'Bienvenido, escribe \'click\' para dar un click.'
      );
    } else if (req.isCommand('reset')) {
      req.sendMessage(
        'PELIGRO\nEsta acción borrará tu progreso, pero aumentará tu ' +
        'multiplicador.\nSi estás seguro usa /resetallmydata'
      );
    // Sólo pasa al siguiente middleware si necesita datos de la db.
    } else if (req.isCommand('status') || req.isCommand('resetallmydata')) {
      next();
    } else {
      req.sendMessage('No reconozco ese comando, inténta de nuevo.');
    }

  }, User.findTelegramUser, function(req, res, next) {
    if (req.isCommand('status')) {
      console.log(req.user);
      req.sendStatusMessage();
    } else if (req.isCommand('resetallmydata')) {
      User.resetUser(req.user, function(user) {
        req.sendMessage('Has sido reseteado');
      });
    }
  });
};
