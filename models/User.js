'use strict';
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers

// Requires
var mongoose          = require('mongoose');
var Telegram          = require('../lib/telegram');
var Clicks            = require('../lib/clicks');
var Errors            = require('../lib/errors');
var DBUpdateError     = Errors.DBUpdateError;
var UserStatusError   = Errors.UserStatusError;
var _                 = require('lodash');

// Constants
var INTENTS           = 10;

// User schema
var userSchema = mongoose.Schema({
  userid: {
    type: Number,
    required: true,
    index: true,
    unique: true
  },
  requests: {
    type: Number,
    default: 0
  },
  lastRequest: {
    type: Number,
    default: Date.now
  },
  clicks: {
    type: Number,
    default: 0,
  },
  lastClick: {
    type: Number,
    default: Date.now
  },
  upgrades: [{
    id: {
      type: String,
      required: true
    },
    buyed: [{
      type: Number
    }]
  }]
});

userSchema.methods.getTotalClicks = Clicks.getTotalClicks;

/*
++ express middleware
**  Busca un usuario en la base de datos, o inserta un registro nuevo,
**  y lo asigna a req.user
*/
userSchema.statics.findTelegramUser = function(req, res, next) {
  var User = mongoose.model('User');
  var user = req.body.message.chat.id;
  User.findOneAndUpdate(
    {userid: user},
    {$inc: {requests: 1}, $set: {lastRequest: Date.now()}},
    {upsert: true, new: true},
    function(err, doc) {
      req.user = doc;
      next(err); // If any error, handled on router.
    }
  );
};

userSchema.statics.incrementClicks = function incrementClicks(user, cb, count) {
  if (!count) {
    count = 0;
  }
  var User = mongoose.model('User');
  User.findOneAndUpdate(
    {userid: user.userid, requests: user.requests},
    {
      $inc: {clicks: 1, requests: 1},
      $set: {lastClick: Date.now(), lastRequest: Date.now()}
    },
    {new: true},
    function(err, doc) {
      if (err) {
        console.error(err);
        return cb(err, doc);
      }
      if (!doc) {
        if (count >= INTENTS) {
          err = new (Errors.DBUpdateError)('Demasiados intentos.');
          console.error(err);
          return cb(err, doc);
        }
        setTimeout(function() {
          User.findOne(
            {userid: user.userid},
            function(err, doc) {
              if (err) {
                console.error(err);
                return cb(err, doc);
              }
              return incrementClicks(doc, cb, ++count);
            }
          );
        }, 250 * count + Math.random() * 250);
      }
      cb(err, doc);
    }
  );
};

userSchema.statics.buyUpgrade = function buyUpgrade(user, upgrade, cb, count) {
  if (!count) {
    count = 0;
  }

  var User = mongoose.model('User');
  if (user.getTotalClicks() < upgrade.getCost(user)) {
    cb(new UserStatusError('No tienes suficientes clicks para vender.'), user);
  }

  var findQuery = {
    userid: user.userid,
    requests: user.requests,
    upgrades: {id: upgrade.id}
  };
  var updateQuery = {
    $push: {'upgrades.$.buyed': Date.now()},
    $set: {lastBuy: Date.now()}
  };

  // First buy
  if (!_.filter(user.upgrades, _.matches({id: upgrade.id}))) {
    delete findQuery.upgrades;
    delete updateQuery.$push;
    updateQuery.$addToSet = {upgrades: {id: upgrade.id, buyed: [Date.now()]}};
  }

  User.findOneAndUpdate(findQuery, updateQuery, {new: true},
    function(err, doc) {
      if (err) {
        console.error(err);
        return cb(err, doc);
      }
      if (!doc) {
        if (count >= INTENTS) {
          return cb(new (Errors.DBUpdateError)('Demasiados intentos.'));
        }
        setTimeout(function() {
          User.findOne(
            {userid: user.userid},
            function(err, doc) {
              if (err) {
                console.error(err);
                return cb(err, doc);
              }
              buyUpgrade(user, upgrade, cb, ++count);
            }
          );
        }, 250 * count + Math.random() * 250);
      }
      cb(doc);
    }
  );
};

userSchema.statics.resetUser = function(user, cb) {
  var User = mongoose.model('User');
  // Todo, add score before reset.
  User.findOneAndUpdate({userid: user.userid}, {$set: {clicks: 0}}, {new: true},
    function(err, doc) {
      if (err) {
        console.error(err);
      }
      cb(err, doc);
    }
  );
};

var User = mongoose.model('User', userSchema);

module.exports = User;
