/**
 * comment_schema (nested)
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/iomapper
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
/**
 *
 * defines fields in a comment schema
 *
 * fields:
 * user: reference to user object
 * body: String
 * followUps: Array of commentSchemas
 *
 */
var commentSchema = new Schema({
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  content: String
});

commentSchema.add({
	followUps: [commentSchema]
});

module.exports = commentSchema;