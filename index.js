/**
 * KONTER
 *
 * content repository plugin for mongoose
 *
 * written by TASTENWERK http://tastenwerk.com
 * plugin repository: http://github.com/tastenwerk/konter
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var logSchema = require( __dirname + '/lib/log_schema' )
  , commentSchema = require( __dirname + '/lib/comment_schema' );


var KonterPlugin = function KonterPlugin (schema, options) {

  schema.add({ createdAt: { type: Date, default: Date.now },
  						 _creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  						 updatedAt: { type: Date, default: Date.now },
  						 _updater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  						 _starred: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
  						 logs: [logSchema],
  						 acl: {type: mongoose.Schema.Types.Mixed, default: {}},
  						 name: String,
  						 comments: [commentSchema]

  });

  /**
   * holder of this content object
   * there should never be an access to the
   * database without filling this virtual property
   *
   * @returns {User} - the holder user object
   *
   */
  schema.virtual('holder').get( function(){
    return this._holder;
  });

  /**
   * set the holder of this content object.
   *
   * @param {User} - the user object to be holding this
   * content object
   */
  schema.virtual('holder').set( function( holder ){
    this._holder = holder;
  });

  /**
   * setup the creator and give full access to their 
   * newly created object.
   *
   * if the holder object has not been set up till here
   * an error will be thrown. It is illegal to create
   * objects without a user being set.
   *
   */
  schema.pre('save', function setupCreatorAndAccess( next ) {
    if( this.isNew ){
      if( !this.holder )
        throw "konter.securityleak: no holder object has been provided!";
      this._creator = this._updater = this.holder._id;
      this.acl[this._creator] = 'rwsd';
    }
    next();
  });

  if (options && options.index) {
    schema.path('updatedAt').index(options.index)
  }

}

module.exports = exports = {
	plugin: KonterPlugin,
	models: {
		User: require( __dirname + '/lib/models/user' )
	}
};