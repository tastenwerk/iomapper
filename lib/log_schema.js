/**
 * log_schema (nested)
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
/**
 *
 * defines fields in a log schema
 *
 * fields:
 * user: reference to user object
 * created_at: Date
 * fields: Mixed - containing the fields that have changed
 *
 */
var logSchema = new Schema({
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  fields: Schema.Types.Mixed
});

module.exports = logSchema;