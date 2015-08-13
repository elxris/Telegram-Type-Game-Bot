'use strict';
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers

var mongoose = require('mongoose');
var Telegram = require('../lib/telegram');
var api = new Telegram();

var userSchema = mongoose.Schema({
  userid: Number,
  requests: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
});

userSchema.statics.findTelegramUser = function(req, res, next) {
  var User = mongoose.model('User');
  var user = req.body.message.chat.id;
  User.findOneAndUpdate({userid: user}, {$inc: {requests: 1}}, {upsert: true},
    function(err, doc) {
      if (err) {
        api.request('sendMessage', {
          chat_id: req.body.message.chat.id,
          text: '(501) Ocurrió un error. Inténtalo mas tarde.'
        });
        return console.error(err);
      }
      req.user = doc;
      console.log(doc.toObject());
      next();
    }
  );
};

var User = mongoose.model('User', userSchema);

module.exports = User;
