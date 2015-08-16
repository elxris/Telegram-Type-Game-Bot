'use strict';

var Errors = {};

Errors.DBUpdateError = function(message) {
  this.name = 'DBUpdateError';
  this.message = message || 'Error al actualizar los datos.';
};

Errors.DBUpdateError.prototype = Object.create(Error.prototype);
Errors.DBUpdateError.constructor = Errors.DBUpdateError;

Errors.UserStatusError = function(message) {
  this.name = 'UserStatusError';
  this.message = message ||
    'No cumples las condiciones necesarias para esta acción.';
};

Errors.UserStatusError.prototype = Object.create(Error.prototype);
Errors.UserStatusError.constructor = Errors.UserStatusError;

module.exports = Errors;
