'use strict';
//jscs:disable requireCamelCaseOrUpperCaseIdentifiers
//jshint maxcomplexity:10

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
var userSchema = new mongoose.Schema({
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

/**
 * Busca un usuario en la base de datos, o inserta un registro nuevo,
 * y lo asigna a req.user
 *
 * @param {request} req - Express Request Object
 * @param {response} res - Express Response Object
 * @param {next} next - Express Next Callback
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

/**
 * Realiza una operación de actualización de un usuario a la DB, pero
 * cubriendo el requerimento de que el query de la búsqueda sea específico
 * para que la operación de actualización no sea sobre un usuario ya modificado,
 * por lo que automáticamente se añade al query.requests === user.requests.
 *
 * @param {Object} opts - Objeto de opciones
 * @param {Object} opts.user - User document
 * @param {(Object|Function)} [opts.query] - Mongo find query
 * @param {(Object|Function)} opts.update - Mongo update query
 * @param {Object} [opts.limit=10] - Límite de reintentos
 * @param {Object} [opts.count=0] - Control interno del contador
 * @param {callback} cb - Cuando la operación termina satisfactoria o hay
 *  un error, llama al este callback.
 */
userSchema.statics.intent = function intent(opts, cb) {
  opts = opts || {};
  var user = opts.user;
  if (!user) {
    return cb(new Error('Undefined User'));
  }

  opts = _.defaultsDeep(opts, {
    count: 0,
    query: {
      userid: user.userid,
      requests: user.requests
    },
    limit: INTENTS
  });

  var query = opts.query;
  if (typeof opts.query === 'function') {query = opts.query(user);}
  if (query instanceof Error) {return cb(query);}

  var update = opts.update;
  if (typeof opts.update === 'function') {query = opts.update(user);}
  if (update instanceof Error) {return cb(update);}

  var User = mongoose.model('User');
  User.findOneAndUpdate(
    query || {},
    update || {},
    {new: true},
    function(err, doc) {
      if (err) {console.error(err); return cb(err, doc);}

      if (!doc) {
        if (opts.count >= opts.limit) {
          err = new (Errors.DBUpdateError)('Demasiados intentos.');
          console.error(err);
          return cb(err, doc);
        }

        delete query.requests;
        setTimeout(function() {
          User.findOne(
            query,
            function(err, doc) {
              if (err) {console.error(err); return cb(err, doc);}
              opts.user = doc;
              return intent(opts, cb);
            }
          );
        }, 250 * opts.count + Math.random() * 250);
        return;
      }
      cb(err, doc);
    }
  );
};

userSchema.methods.getTotalClicks = Clicks.getTotalClicks;

userSchema.methods.incrementClicks = function(cb) {
  var user = this;
  var User = mongoose.model('User');
  User.intent({
    user: user,
    update: {
      $inc: {clicks: 1},
      $set: {lastClick: Date.now()}
    }
  }, cb);
};

userSchema.methods.buyUpgrade = function buyUpgrade(upgrade, cb) {
  var User = mongoose.model('User');
  var user = this.
  User.intent({
    user: user,
    query: function(user) {
      var findQuery = {updgrades: {id: upgrade.id}};
      if (!_.filter(user.upgrades, _.matches({id: upgrade.id}))) {
        delete findQuery.upgrades;
      }
      return findQuery;
    },
    update: function(user) {
      if (user.getTotalClicks() < upgrade.getCost(user)) {
        return new UserStatusError('No tienes suficientes clicks para vender.');
      }
      var updateQuery =  {
        $push: {'upgrades.$.buyed': Date.now()},
        $set: {lastBuy: Date.now()}
      };
      if (!_.filter(user.upgrades, _.matches({id: upgrade.id}))) {
        delete updateQuery.$push;
        updateQuery.$addToSet = {
          upgrades: {id: upgrade.id, buyed: [Date.now()]}
        };
      }
      return updateQuery;
    }
  }, cb);
};

userSchema.statics.resetUser = function(user, cb) {
  var User = mongoose.model('User');
  // Todo, add score before reset.
  User.findOneAndUpdate({userid: user.userid}, {$set: {clicks: 0}}, {new: true},
    function(err, doc) {
      if (err) {console.error(err);}

      // If any error, better be controlled by router
      cb(err, doc);
    }
  );
};

var User = mongoose.model('User', userSchema);

module.exports = User;
