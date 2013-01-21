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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  content: String,
  deletedAt: Date
});

commentSchema.add({
	comments: [commentSchema]
});

module.exports = commentSchema;