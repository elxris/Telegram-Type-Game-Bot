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

var sendMessageError = function(id) {
  api.request('sendMessage', {
    chat_id: id,
    text: '(501) Ocurrió un error. Inténtalo mas tarde.'
  });
};

userSchema.statics.findTelegramUser = function(req, res, next) {
  var User = mongoose.model('User');
  var user = req.body.message.chat.id;
  User.findOneAndUpdate({userid: user}, {$inc: {requests: 1}}, {upsert: true},
    function(err, doc) {
      if (err) {
        sendMessageError(req.body.message.chat.id);
        return console.error(err);
      }
      req.user = doc;
      next();
    }
  );
};

userSchema.statics.incrementClicks = function(user, cb) {
  user.update({$inc: {clicks: 1}}, function(err, doc) {
    if (err) {
      sendMessageError(user.userid);
      return console.error(err);
    }
    cb(doc);
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;
